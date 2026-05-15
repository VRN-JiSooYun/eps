package handlers

import (
	"context"
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"eps/backend/internal/models"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"
	"golang.org/x/crypto/bcrypt"
)

const maxSupplierDocumentSize = 10 << 20

type SupplierHandler struct {
	db        *pgxpool.Pool
	jwtSecret string
	uploadDir string
}

type supplierRegisterForm struct {
	Email                      string
	Password                   string
	PasswordConfirm            string
	CompanyName                string
	BusinessRegistrationNumber string
	HeadOfficePhone            string
	BankName                   string
	AccountHolder              string
	AccountNumber              string
	ContactName                string
	Position                   string
	Department                 string
	MobilePhone                string
	DirectPhone                string
	EmailNotificationEnabled   bool
	PrivacyAgreed              bool
}

func NewSupplierHandler(db *pgxpool.Pool, jwtSecret string, uploadDir string) SupplierHandler {
	return SupplierHandler{db: db, jwtSecret: jwtSecret, uploadDir: uploadDir}
}

func (h SupplierHandler) Register(c echo.Context) error {
	if err := c.Request().ParseMultipartForm(32 << 20); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid multipart form")
	}

	req := supplierRegisterForm{
		Email:                      strings.ToLower(strings.TrimSpace(c.FormValue("email"))),
		Password:                   c.FormValue("password"),
		PasswordConfirm:            c.FormValue("passwordConfirm"),
		CompanyName:                strings.TrimSpace(c.FormValue("companyName")),
		BusinessRegistrationNumber: strings.TrimSpace(c.FormValue("businessRegistrationNumber")),
		HeadOfficePhone:            strings.TrimSpace(c.FormValue("headOfficePhone")),
		BankName:                   strings.TrimSpace(c.FormValue("bankName")),
		AccountHolder:              strings.TrimSpace(c.FormValue("accountHolder")),
		AccountNumber:              strings.TrimSpace(c.FormValue("accountNumber")),
		ContactName:                strings.TrimSpace(c.FormValue("contactName")),
		Position:                   strings.TrimSpace(c.FormValue("position")),
		Department:                 strings.TrimSpace(c.FormValue("department")),
		MobilePhone:                strings.TrimSpace(c.FormValue("mobilePhone")),
		DirectPhone:                strings.TrimSpace(c.FormValue("directPhone")),
		EmailNotificationEnabled:   parseBool(c.FormValue("emailNotificationEnabled")),
		PrivacyAgreed:              parseBool(c.FormValue("privacyAgreed")),
	}

	if err := validateSupplierRegisterForm(req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	businessRegistrationFile, err := requiredFile(c, "businessRegistrationFile")
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	bankbookFile, err := requiredFile(c, "bankbookFile")
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to hash password")
	}

	ctx, cancel := context.WithTimeout(c.Request().Context(), 10*time.Second)
	defer cancel()

	tx, err := h.db.Begin(ctx)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to start supplier registration")
	}
	defer tx.Rollback(ctx)

	supplier, err := insertFullSupplier(ctx, tx, req, string(hash))
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return echo.NewHTTPError(http.StatusConflict, "email already registered")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to register supplier")
	}

	uploadBase := filepath.Join(h.uploadDir, "suppliers", supplier.ID)
	documents := make([]models.SupplierDocument, 0, 2)

	businessRegistrationDocument, err := h.saveAndInsertDocument(ctx, tx, supplier.ID, "business_registration", businessRegistrationFile, uploadBase)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	documents = append(documents, businessRegistrationDocument)

	bankbookDocument, err := h.saveAndInsertDocument(ctx, tx, supplier.ID, "bankbook_copy", bankbookFile, uploadBase)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	documents = append(documents, bankbookDocument)

	if err := tx.Commit(ctx); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to complete supplier registration")
	}

	token, err := signSupplierToken(supplier.ID, h.jwtSecret)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to create token")
	}

	return c.JSON(http.StatusCreated, models.SupplierRegisterResponse{
		Token:     token,
		Supplier:  supplier,
		Documents: documents,
	})
}

func validateSupplierRegisterForm(req supplierRegisterForm) error {
	if req.Email == "" || req.CompanyName == "" || req.BusinessRegistrationNumber == "" || req.HeadOfficePhone == "" {
		return errors.New("email, companyName, businessRegistrationNumber, headOfficePhone are required")
	}
	if req.BankName == "" || req.AccountHolder == "" || req.AccountNumber == "" {
		return errors.New("bankName, accountHolder, accountNumber are required")
	}
	if req.ContactName == "" || req.Position == "" || req.Department == "" || req.MobilePhone == "" {
		return errors.New("contactName, position, department, mobilePhone are required")
	}
	if len(req.Password) < 8 {
		return errors.New("password must be at least 8 characters")
	}
	if req.Password != req.PasswordConfirm {
		return errors.New("passwordConfirm does not match password")
	}
	if !req.PrivacyAgreed {
		return errors.New("privacy agreement is required")
	}
	return nil
}

func requiredFile(c echo.Context, field string) (*multipart.FileHeader, error) {
	file, err := c.FormFile(field)
	if err != nil {
		return nil, fmt.Errorf("%s is required", field)
	}
	if file.Size <= 0 {
		return nil, fmt.Errorf("%s is empty", field)
	}
	if file.Size > maxSupplierDocumentSize {
		return nil, fmt.Errorf("%s must be 10MB or less", field)
	}
	if !isAllowedDocumentType(file.Filename, file.Header.Get("Content-Type")) {
		return nil, fmt.Errorf("%s must be pdf, jpg, jpeg, or png", field)
	}
	return file, nil
}

func isAllowedDocumentType(filename string, contentType string) bool {
	ext := strings.ToLower(filepath.Ext(filename))
	switch ext {
	case ".pdf", ".jpg", ".jpeg", ".png":
	default:
		return false
	}
	switch contentType {
	case "application/pdf", "image/jpeg", "image/png", "":
		return true
	default:
		return false
	}
}

func (h SupplierHandler) saveAndInsertDocument(ctx context.Context, tx pgx.Tx, supplierID string, documentType string, fileHeader *multipart.FileHeader, uploadBase string) (models.SupplierDocument, error) {
	if err := os.MkdirAll(uploadBase, 0755); err != nil {
		return models.SupplierDocument{}, fmt.Errorf("failed to prepare upload directory")
	}

	src, err := fileHeader.Open()
	if err != nil {
		return models.SupplierDocument{}, fmt.Errorf("failed to open uploaded file")
	}
	defer src.Close()

	filename := fmt.Sprintf("%s%s", documentType, strings.ToLower(filepath.Ext(fileHeader.Filename)))
	storedPath := filepath.Join(uploadBase, filename)
	dst, err := os.Create(storedPath)
	if err != nil {
		return models.SupplierDocument{}, fmt.Errorf("failed to save uploaded file")
	}
	defer dst.Close()

	if _, err := io.Copy(dst, src); err != nil {
		return models.SupplierDocument{}, fmt.Errorf("failed to write uploaded file")
	}

	var document models.SupplierDocument
	err = tx.QueryRow(ctx, `
		INSERT INTO supplier_documents (supplier_id, document_type, original_filename, stored_path, content_type, size_bytes)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, supplier_id, document_type, original_filename, stored_path, content_type, size_bytes, created_at
	`, supplierID, documentType, fileHeader.Filename, storedPath, fileHeader.Header.Get("Content-Type"), fileHeader.Size).Scan(
		&document.ID,
		&document.SupplierID,
		&document.DocumentType,
		&document.OriginalFilename,
		&document.StoredPath,
		&document.ContentType,
		&document.SizeBytes,
		&document.CreatedAt,
	)
	if err != nil {
		return models.SupplierDocument{}, fmt.Errorf("failed to save uploaded file metadata")
	}
	return document, nil
}

func insertFullSupplier(ctx context.Context, tx pgx.Tx, req supplierRegisterForm, passwordHash string) (models.Supplier, error) {
	var supplier models.Supplier
	err := tx.QueryRow(ctx, `
		INSERT INTO suppliers (
			email,
			password_hash,
			company_name,
			business_registration_number,
			head_office_phone,
			bank_name,
			account_holder,
			account_number,
			contact_name,
			position,
			department,
			mobile_phone,
			direct_phone,
			email_notification_enabled,
			privacy_agreed_at
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, now())
		RETURNING
			id,
			email,
			password_hash,
			company_name,
			business_registration_number,
			head_office_phone,
			bank_name,
			account_holder,
			account_number,
			contact_name,
			position,
			department,
			mobile_phone,
			direct_phone,
			email_notification_enabled,
			privacy_agreed_at,
			created_at
	`, req.Email, passwordHash, req.CompanyName, req.BusinessRegistrationNumber, req.HeadOfficePhone, req.BankName, req.AccountHolder, req.AccountNumber, req.ContactName, req.Position, req.Department, req.MobilePhone, req.DirectPhone, req.EmailNotificationEnabled).Scan(
		&supplier.ID,
		&supplier.Email,
		&supplier.PasswordHash,
		&supplier.CompanyName,
		&supplier.BusinessRegistrationNumber,
		&supplier.HeadOfficePhone,
		&supplier.BankName,
		&supplier.AccountHolder,
		&supplier.AccountNumber,
		&supplier.ContactName,
		&supplier.Position,
		&supplier.Department,
		&supplier.MobilePhone,
		&supplier.DirectPhone,
		&supplier.EmailNotificationEnabled,
		&supplier.PrivacyAgreedAt,
		&supplier.CreatedAt,
	)
	return supplier, err
}

func parseBool(value string) bool {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "1", "true", "t", "yes", "y", "on":
		return true
	default:
		return false
	}
}
