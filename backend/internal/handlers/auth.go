package handlers

import (
	"context"
	"errors"
	"net/http"
	"strings"
	"time"

	"eps/backend/internal/models"

	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"
	"golang.org/x/crypto/bcrypt"
)

type AuthHandler struct {
	db        *pgxpool.Pool
	jwtSecret string
}

func NewAuthHandler(db *pgxpool.Pool, jwtSecret string) AuthHandler {
	return AuthHandler{db: db, jwtSecret: jwtSecret}
}

func (h AuthHandler) Register(c echo.Context) error {
	var req models.RegisterRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}

	req.Email = strings.ToLower(strings.TrimSpace(req.Email))
	req.CompanyName = strings.TrimSpace(req.CompanyName)
	req.BusinessRegistrationNumber = strings.TrimSpace(req.BusinessRegistrationNumber)

	if req.Email == "" || len(req.Password) < 8 || req.CompanyName == "" || req.BusinessRegistrationNumber == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "email, password(8+), companyName, businessRegistrationNumber are required")
	}
	if !req.PrivacyAgreed {
		return echo.NewHTTPError(http.StatusBadRequest, "privacy agreement is required")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to hash password")
	}

	ctx, cancel := context.WithTimeout(c.Request().Context(), 5*time.Second)
	defer cancel()

	supplier, err := insertSupplier(ctx, h.db, req, string(hash))
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return echo.NewHTTPError(http.StatusConflict, "email already registered")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to register supplier")
	}

	token, err := h.signToken(supplier.ID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to create token")
	}

	return c.JSON(http.StatusCreated, models.AuthResponse{Token: token, Supplier: supplier})
}

func (h AuthHandler) Login(c echo.Context) error {
	var req models.LoginRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}

	email := strings.ToLower(strings.TrimSpace(req.Email))
	if email == "" || req.Password == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "email and password are required")
	}

	ctx, cancel := context.WithTimeout(c.Request().Context(), 5*time.Second)
	defer cancel()

	supplier, err := getSupplierByEmail(ctx, h.db, email)
	if err != nil {
		if err == pgx.ErrNoRows {
			return echo.NewHTTPError(http.StatusUnauthorized, "invalid email or password")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to login")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(supplier.PasswordHash), []byte(req.Password)); err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "invalid email or password")
	}

	token, err := h.signToken(supplier.ID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to create token")
	}

	return c.JSON(http.StatusOK, models.AuthResponse{Token: token, Supplier: supplier})
}

func insertSupplier(ctx context.Context, db *pgxpool.Pool, req models.RegisterRequest, passwordHash string) (models.Supplier, error) {
	var supplier models.Supplier
	err := db.QueryRow(ctx, `
		INSERT INTO suppliers (email, password_hash, company_name, business_registration_number, privacy_agreed_at)
		VALUES ($1, $2, $3, $4, now())
		RETURNING id, email, password_hash, company_name, business_registration_number, privacy_agreed_at, created_at
	`, req.Email, passwordHash, req.CompanyName, req.BusinessRegistrationNumber).Scan(
		&supplier.ID,
		&supplier.Email,
		&supplier.PasswordHash,
		&supplier.CompanyName,
		&supplier.BusinessRegistrationNumber,
		&supplier.PrivacyAgreedAt,
		&supplier.CreatedAt,
	)
	return supplier, err
}

func getSupplierByEmail(ctx context.Context, db *pgxpool.Pool, email string) (models.Supplier, error) {
	var supplier models.Supplier
	err := db.QueryRow(ctx, `
		SELECT id, email, password_hash, company_name, business_registration_number, privacy_agreed_at, created_at
		FROM suppliers
		WHERE email = $1
	`, email).Scan(
		&supplier.ID,
		&supplier.Email,
		&supplier.PasswordHash,
		&supplier.CompanyName,
		&supplier.BusinessRegistrationNumber,
		&supplier.PrivacyAgreedAt,
		&supplier.CreatedAt,
	)
	return supplier, err
}

func (h AuthHandler) signToken(supplierID string) (string, error) {
	return signSupplierToken(supplierID, h.jwtSecret)
}

func signSupplierToken(supplierID string, jwtSecret string) (string, error) {
	now := time.Now()
	claims := jwt.RegisteredClaims{
		Subject:   supplierID,
		IssuedAt:  jwt.NewNumericDate(now),
		ExpiresAt: jwt.NewNumericDate(now.Add(24 * time.Hour)),
	}
	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(jwtSecret))
}
