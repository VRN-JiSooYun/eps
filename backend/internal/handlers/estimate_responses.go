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
	"strconv"
	"strings"
	"time"

	"eps/backend/internal/models"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"
)

type EstimateResponseHandler struct {
	db        *pgxpool.Pool
	uploadDir string
}

// Maximum allowed file size for estimate response documents (10MB)
const maxEstimateResponseDocumentSize = 10 << 20

func NewEstimateResponseHandler(db *pgxpool.Pool, uploadDir string) EstimateResponseHandler {
	return EstimateResponseHandler{db: db, uploadDir: uploadDir}
}

func (h EstimateResponseHandler) List(c echo.Context) error {
	ctx, cancel := context.WithTimeout(c.Request().Context(), 5*time.Second)
	defer cancel()

	vendorID, err := authenticatedVendorID(c)
	if err != nil {
		logHandlerError(c, "estimate_responses.list.auth_vendor", err)
		return echo.NewHTTPError(http.StatusUnauthorized, "invalid authenticated vendor")
	}

	includeDiscard := parseBool(c.QueryParam("includeDiscard"))
	requestID, err := optionalIntQueryParam(c, "requestId")
	if err != nil {
		logHandlerError(c, "estimate_responses.list.parse_request_id", err)
		return echo.NewHTTPError(http.StatusBadRequest, "requestId must be an integer")
	}

	var body []byte
	err = h.db.QueryRow(ctx, `
		SELECT COALESCE(json_agg(estimate_response_json(r) ORDER BY r.date_created DESC), '[]'::json)
		FROM eps_estimate_response r
		WHERE r.vendor_id = $1
			AND ($2::boolean OR r.discard = false)
			AND ($3::integer IS NULL OR r.request_id = $3)
	`, vendorID, includeDiscard, requestID).Scan(&body)
	if err != nil {
		logHandlerError(c, "estimate_responses.list.query", err)
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to list estimate responses")
	}

	return c.JSONBlob(http.StatusOK, wrapJSON("estimateResponses", body))
}

func (h EstimateResponseHandler) Get(c echo.Context) error {
	id, err := pathID(c)
	if err != nil {
		logHandlerError(c, "estimate_responses.get.parse_id", err)
		return echo.NewHTTPError(http.StatusBadRequest, "id must be an integer")
	}

	vendorID, err := authenticatedVendorID(c)
	if err != nil {
		logHandlerError(c, "estimate_responses.get.auth_vendor", err)
		return echo.NewHTTPError(http.StatusUnauthorized, "invalid authenticated vendor")
	}

	ctx, cancel := context.WithTimeout(c.Request().Context(), 5*time.Second)
	defer cancel()

	body, err := h.getByID(ctx, id, vendorID)
	if err != nil {
		logHandlerError(c, "estimate_responses.get.query", err)
		if err == pgx.ErrNoRows {
			return echo.NewHTTPError(http.StatusNotFound, "estimate response not found")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to get estimate response")
	}

	return c.JSONBlob(http.StatusOK, wrapJSON("estimateResponse", body))
}

// Estimate accpted.
// - Update estimate request status to 'accepted'.
func (h EstimateResponseHandler) Create(c echo.Context) error {
	req, quoteFile, err := h.bindCreatePayload(c)
	if err != nil {
		logHandlerError(c, "estimate_responses.create.bind", err)
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	if err := validateEstimateResponsePayload(req, true); err != nil {
		logHandlerError(c, "estimate_responses.create.validate", err)
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	vendorID, err := authenticatedVendorID(c)
	if err != nil {
		logHandlerError(c, "estimate_responses.create.auth_vendor", err)
		return echo.NewHTTPError(http.StatusUnauthorized, "invalid authenticated vendor")
	}

	ctx, cancel := context.WithTimeout(c.Request().Context(), 5*time.Second)
	defer cancel()

	if quoteFile != nil {
		documentPath, err := h.saveEstimateDocument(vendorID, *req.RequestID, quoteFile)
		if err != nil {
			logHandlerError(c, "estimate_responses.create.save_document", err)
			return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
		}
		req.DocumentPath = &documentPath
	}

	tx, err := h.db.Begin(ctx)
	if err != nil {
		logHandlerError(c, "estimate_responses.create.begin_tx", err)
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to start transaction")
	}
	defer tx.Rollback(ctx)

	// update estimate request status to 'completed'
	_, err = tx.Exec(ctx, `
		UPDATE eps_estimate_request
		SET status = 'completed'
		WHERE id = $1
			AND discard = false
	`, req.RequestID)
	if err != nil {
		logHandlerError(c, "estimate_responses.create.update_request_status", err)
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to update estimate request status")
	}

	var body []byte
	err = tx.QueryRow(ctx, `
		INSERT INTO eps_estimate_response (
			request_id,
			vendor_id,
			vendor_name,
			vendor_contact_name,
			vendor_mobile_phone,
			vendor_email,
			product_name,
			cas_no,
			supplier_id,
			catalog_no,
			unit_cost,
			unit_value,
			unit,
			count,
			delivery_period,
			total_cost,
			document_path,
			purity,
			grade,
			note,
			discard
		)
		SELECT
			request.id,
			vendor.id,
			vendor.vendor_name,
			COALESCE($3::text, ''),
			COALESCE($4::text, ''),
			COALESCE($5::text, ''),
			$6::text,
			COALESCE($7::text, ''),
			$8::integer,
			COALESCE($9::text, ''),
			COALESCE($10::double precision, 0),
			COALESCE($11::double precision, 0),
			$12::integer,
			COALESCE($13::integer, 1),
			COALESCE($14::text, ''),
			COALESCE($15::double precision, COALESCE($10::double precision, 0) * COALESCE($13::integer, 1)),
			COALESCE($16::text, ''),
			COALESCE($17::text, ''),
			COALESCE($18::text, ''),
			COALESCE($19::text, ''),
			COALESCE($20::boolean, false)
		FROM eps_estimate_request request
		JOIN eps_vendor_info vendor ON vendor.id = $2
		LEFT JOIN supplier request_supplier ON request_supplier.id = request.supplier_id
		WHERE request.id = $1
			AND request.discard = false
			AND vendor.check_discard = false
			AND (request.bid = true OR request_supplier.vendor_id = $2)
		RETURNING estimate_response_json(eps_estimate_response)
	`,
		req.RequestID,
		vendorID,
		req.VendorContactName,
		req.VendorMobilePhone,
		req.VendorEmail,
		req.ProductName,
		req.CasNo,
		req.SupplierID,
		req.CatalogNo,
		req.UnitCost,
		req.UnitValue,
		req.Unit,
		req.Count,
		req.DeliveryPeriod,
		req.TotalCost,
		req.DocumentPath,
		req.Purity,
		req.Grade,
		req.Note,
		req.Discard,
	).Scan(&body)
	if err != nil {
		logHandlerError(c, "estimate_responses.create.insert", err)
		if err == pgx.ErrNoRows {
			return echo.NewHTTPError(http.StatusNotFound, "estimate request not found")
		}
		return estimateResponseDBError(err, "failed to create estimate response")
	}

	if err := tx.Commit(ctx); err != nil {
		logHandlerError(c, "estimate_responses.create.commit_tx", err)
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to commit transaction")
	}

	return c.JSONBlob(http.StatusCreated, wrapJSON("estimateResponse", body))
}

func (h EstimateResponseHandler) Update(c echo.Context) error {
	id, err := pathID(c)
	if err != nil {
		logHandlerError(c, "estimate_responses.update.parse_id", err)
		return echo.NewHTTPError(http.StatusBadRequest, "id must be an integer")
	}

	req, quoteFile, err := h.bindUpdatePayload(c)
	if err != nil {
		logHandlerError(c, "estimate_responses.update.bind", err)
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	if err := validateEstimateResponsePayload(req, false); err != nil {
		logHandlerError(c, "estimate_responses.update.validate", err)
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	vendorID, err := authenticatedVendorID(c)
	if err != nil {
		logHandlerError(c, "estimate_responses.update.auth_vendor", err)
		return echo.NewHTTPError(http.StatusUnauthorized, "invalid authenticated vendor")
	}

	ctx, cancel := context.WithTimeout(c.Request().Context(), 5*time.Second)
	defer cancel()

	if quoteFile != nil {
		var requestID int
		if err := h.db.QueryRow(ctx, `
			SELECT request_id
			FROM eps_estimate_response
			WHERE id = $1
				AND vendor_id = $2
		`, id, vendorID).Scan(&requestID); err != nil {
			logHandlerError(c, "estimate_responses.update.fetch_request_id", err)
			if err == pgx.ErrNoRows {
				return echo.NewHTTPError(http.StatusNotFound, "estimate response not found")
			}
			return echo.NewHTTPError(http.StatusInternalServerError, "failed to update estimate response")
		}

		documentPath, err := h.saveEstimateDocument(vendorID, requestID, quoteFile)
		if err != nil {
			logHandlerError(c, "estimate_responses.update.save_document", err)
			return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
		}
		req.DocumentPath = &documentPath
	}

	var body []byte
	err = h.db.QueryRow(ctx, `
		UPDATE eps_estimate_response
		SET
			product_name = COALESCE(NULLIF($3::text, ''), product_name),
			cas_no = COALESCE($4::text, cas_no),
			supplier_id = COALESCE($5::integer, supplier_id),
			catalog_no = COALESCE($6::text, catalog_no),
			unit_cost = COALESCE($7::double precision, unit_cost),
			unit_value = COALESCE($8::double precision, unit_value),
			unit = COALESCE($9::integer, unit),
			count = COALESCE($10::integer, count),
			delivery_period = COALESCE($11::text, delivery_period),
			total_cost = COALESCE($12::double precision, COALESCE($7::double precision, unit_cost) * COALESCE($10::integer, count)),
			document_path = COALESCE($13::text, document_path),
			purity = COALESCE($14::text, purity),
			grade = COALESCE($15::text, grade),
			note = COALESCE($16::text, note),
			vendor_contact_name = COALESCE($17::text, vendor_contact_name),
			vendor_mobile_phone = COALESCE($18::text, vendor_mobile_phone),
			vendor_email = COALESCE($19::text, vendor_email),
			discard = COALESCE($20::boolean, discard),
			date_updated = now()
		WHERE id = $1
			AND vendor_id = $2
		RETURNING estimate_response_json(eps_estimate_response)
	`,
		id,
		vendorID,
		req.ProductName,
		req.CasNo,
		req.SupplierID,
		req.CatalogNo,
		req.UnitCost,
		req.UnitValue,
		req.Unit,
		req.Count,
		req.DeliveryPeriod,
		req.TotalCost,
		req.DocumentPath,
		req.Purity,
		req.Grade,
		req.Note,
		req.VendorContactName,
		req.VendorMobilePhone,
		req.VendorEmail,
		req.Discard,
	).Scan(&body)
	if err != nil {
		logHandlerError(c, "estimate_responses.update.query", err)
		if err == pgx.ErrNoRows {
			return echo.NewHTTPError(http.StatusNotFound, "estimate response not found")
		}
		return estimateResponseDBError(err, "failed to update estimate response")
	}

	return c.JSONBlob(http.StatusOK, wrapJSON("estimateResponse", body))
}

func (h EstimateResponseHandler) Delete(c echo.Context) error {
	id, err := pathID(c)
	if err != nil {
		logHandlerError(c, "estimate_responses.delete.parse_id", err)
		return echo.NewHTTPError(http.StatusBadRequest, "id must be an integer")
	}

	vendorID, err := authenticatedVendorID(c)
	if err != nil {
		logHandlerError(c, "estimate_responses.delete.auth_vendor", err)
		return echo.NewHTTPError(http.StatusUnauthorized, "invalid authenticated vendor")
	}

	ctx, cancel := context.WithTimeout(c.Request().Context(), 5*time.Second)
	defer cancel()

	tag, err := h.db.Exec(ctx, `
		UPDATE eps_estimate_response
		SET discard = true, date_updated = now()
		WHERE id = $1
			AND vendor_id = $2
			AND discard = false
	`, id, vendorID)
	if err != nil {
		logHandlerError(c, "estimate_responses.delete.query", err)
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to delete estimate response")
	}
	if tag.RowsAffected() == 0 {
		return echo.NewHTTPError(http.StatusNotFound, "estimate response not found")
	}

	return c.NoContent(http.StatusNoContent)
}

func (h EstimateResponseHandler) getByID(ctx context.Context, id int, vendorID int) ([]byte, error) {
	var body []byte
	err := h.db.QueryRow(ctx, `
		SELECT estimate_response_json(r)
		FROM eps_estimate_response r
		WHERE r.id = $1
			AND r.vendor_id = $2
	`, id, vendorID).Scan(&body)
	return body, err
}

func (h EstimateResponseHandler) bindCreatePayload(c echo.Context) (models.EstimateResponsePayload, *multipart.FileHeader, error) {
	contentType := c.Request().Header.Get(echo.HeaderContentType)
	if !strings.HasPrefix(contentType, "multipart/form-data") {
		var req models.EstimateResponsePayload
		if err := c.Bind(&req); err != nil {
			return req, nil, errors.New("invalid request body")
		}
		normalizeEstimateResponsePayload(&req)
		return req, nil, nil
	}

	if err := c.Request().ParseMultipartForm(32 << 20); err != nil {
		return models.EstimateResponsePayload{}, nil, errors.New("invalid multipart form")
	}

	req := models.EstimateResponsePayload{
		RequestID:         optionalIntFormValue(c, "requestId"),
		ProductName:       strings.TrimSpace(c.FormValue("productName")),
		CasNo:             optionalStringFormValue(c, "casNo"),
		SupplierID:        optionalIntFormValue(c, "supplierId"),
		CatalogNo:         optionalStringFormValue(c, "catalogNo"),
		UnitCost:          optionalFloatFormValue(c, "unitCost"),
		UnitValue:         optionalFloatFormValue(c, "unitValue"),
		Unit:              optionalIntFormValue(c, "unit"),
		Count:             optionalIntFormValue(c, "count"),
		DeliveryPeriod:    optionalStringFormValue(c, "deliveryPeriod"),
		TotalCost:         optionalFloatFormValue(c, "totalCost"),
		DocumentPath:      optionalStringFormValue(c, "documentPath"),
		Purity:            optionalStringFormValue(c, "purity"),
		Grade:             optionalStringFormValue(c, "grade"),
		Note:              optionalStringFormValue(c, "note"),
		VendorContactName: optionalStringFormValue(c, "vendorContactName"),
		VendorMobilePhone: optionalStringFormValue(c, "vendorMobilePhone"),
		VendorEmail:       optionalStringFormValue(c, "vendorEmail"),
		Discard:           optionalBoolFormValue(c, "discard"),
	}
	normalizeEstimateResponsePayload(&req)

	file, err := optionalEstimateResponseFile(c, "quoteFile")
	if err != nil {
		return req, nil, err
	}
	return req, file, nil
}

func (h EstimateResponseHandler) bindUpdatePayload(c echo.Context) (models.EstimateResponsePayload, *multipart.FileHeader, error) {
	contentType := c.Request().Header.Get(echo.HeaderContentType)
	if !strings.HasPrefix(contentType, "multipart/form-data") {
		var req models.EstimateResponsePayload
		if err := c.Bind(&req); err != nil {
			return req, nil, errors.New("invalid request body")
		}
		normalizeEstimateResponsePayload(&req)
		return req, nil, nil
	}

	if err := c.Request().ParseMultipartForm(32 << 20); err != nil {
		return models.EstimateResponsePayload{}, nil, errors.New("invalid multipart form")
	}

	req := models.EstimateResponsePayload{
		ProductName:       strings.TrimSpace(c.FormValue("productName")),
		CasNo:             optionalStringFormValue(c, "casNo"),
		SupplierID:        optionalIntFormValue(c, "supplierId"),
		CatalogNo:         optionalStringFormValue(c, "catalogNo"),
		UnitCost:          optionalFloatFormValue(c, "unitCost"),
		UnitValue:         optionalFloatFormValue(c, "unitValue"),
		Unit:              optionalIntFormValue(c, "unit"),
		Count:             optionalIntFormValue(c, "count"),
		DeliveryPeriod:    optionalStringFormValue(c, "deliveryPeriod"),
		TotalCost:         optionalFloatFormValue(c, "totalCost"),
		DocumentPath:      optionalStringFormValue(c, "documentPath"),
		Purity:            optionalStringFormValue(c, "purity"),
		Grade:             optionalStringFormValue(c, "grade"),
		Note:              optionalStringFormValue(c, "note"),
		VendorContactName: optionalStringFormValue(c, "vendorContactName"),
		VendorMobilePhone: optionalStringFormValue(c, "vendorMobilePhone"),
		VendorEmail:       optionalStringFormValue(c, "vendorEmail"),
		Discard:           optionalBoolFormValue(c, "discard"),
	}
	normalizeEstimateResponsePayload(&req)

	file, err := optionalEstimateResponseFile(c, "quoteFile")
	if err != nil {
		return req, nil, err
	}
	return req, file, nil
}

func normalizeEstimateResponsePayload(req *models.EstimateResponsePayload) {
	req.ProductName = strings.TrimSpace(req.ProductName)
	req.CasNo = trimOptionalString(req.CasNo)
	req.CatalogNo = trimOptionalString(req.CatalogNo)
	req.DeliveryPeriod = trimOptionalString(req.DeliveryPeriod)
	req.DocumentPath = trimOptionalString(req.DocumentPath)
	req.Purity = trimOptionalString(req.Purity)
	req.Grade = trimOptionalString(req.Grade)
	req.Note = trimOptionalString(req.Note)
	req.VendorContactName = trimOptionalString(req.VendorContactName)
	req.VendorMobilePhone = trimOptionalString(req.VendorMobilePhone)
	req.VendorEmail = trimOptionalString(req.VendorEmail)
}

func trimOptionalString(value *string) *string {
	if value == nil {
		return nil
	}
	trimmed := strings.TrimSpace(*value)
	return &trimmed
}

func optionalStringFormValue(c echo.Context, name string) *string {
	value := strings.TrimSpace(c.FormValue(name))
	if value == "" {
		return nil
	}
	return &value
}

func optionalIntFormValue(c echo.Context, name string) *int {
	value := strings.TrimSpace(c.FormValue(name))
	if value == "" {
		return nil
	}
	parsed, err := strconv.Atoi(value)
	if err != nil {
		return nil
	}
	return &parsed
}

func optionalFloatFormValue(c echo.Context, name string) *float64 {
	value := strings.TrimSpace(c.FormValue(name))
	if value == "" {
		return nil
	}
	parsed, err := strconv.ParseFloat(value, 64)
	if err != nil {
		return nil
	}
	return &parsed
}

func optionalBoolFormValue(c echo.Context, name string) *bool {
	value := strings.TrimSpace(c.FormValue(name))
	if value == "" {
		return nil
	}
	parsed := parseBool(value)
	return &parsed
}

func optionalEstimateResponseFile(c echo.Context, field string) (*multipart.FileHeader, error) {
	file, err := c.FormFile(field)
	if err != nil {
		return nil, nil
	}
	if file.Size <= 0 {
		return nil, fmt.Errorf("%s is empty", field)
	}
	if file.Size > maxEstimateResponseDocumentSize {
		return nil, fmt.Errorf("%s must be 10MB or less", field)
	}
	if !isAllowedDocumentType(file.Filename, file.Header.Get("Content-Type")) {
		return nil, fmt.Errorf("%s must be pdf, jpg, jpeg, or png", field)
	}
	return file, nil
}

func (h EstimateResponseHandler) saveEstimateDocument(vendorID int, requestID int, fileHeader *multipart.FileHeader) (string, error) {
	uploadBase := filepath.Join(h.uploadDir, "estimate-responses", strconv.Itoa(vendorID), strconv.Itoa(requestID))
	if err := os.MkdirAll(uploadBase, 0755); err != nil {
		return "", fmt.Errorf("failed to prepare upload directory")
	}

	src, err := fileHeader.Open()
	if err != nil {
		return "", fmt.Errorf("failed to open uploaded file")
	}
	defer src.Close()

	filename := fmt.Sprintf("quote_%d%s", time.Now().UnixNano(), strings.ToLower(filepath.Ext(fileHeader.Filename)))
	storedPath := filepath.Join(uploadBase, filename)
	dst, err := os.Create(storedPath)
	if err != nil {
		return "", fmt.Errorf("failed to save uploaded file")
	}
	defer dst.Close()

	if _, err := io.Copy(dst, src); err != nil {
		return "", fmt.Errorf("failed to write uploaded file")
	}
	return storedPath, nil
}

func validateEstimateResponsePayload(req models.EstimateResponsePayload, requireProductName bool) error {
	if req.RequestID == nil && requireProductName {
		return errors.New("requestId is required")
	}
	if requireProductName && req.ProductName == "" {
		return errors.New("productName is required")
	}
	if req.Count != nil && *req.Count <= 0 {
		return errors.New("count must be greater than 0")
	}
	if req.UnitCost != nil && *req.UnitCost < 0 {
		return errors.New("unitCost must be greater than or equal to 0")
	}
	if req.UnitValue != nil && *req.UnitValue < 0 {
		return errors.New("unitValue must be greater than or equal to 0")
	}
	if req.TotalCost != nil && *req.TotalCost < 0 {
		return errors.New("totalCost must be greater than or equal to 0")
	}
	return nil
}

func estimateResponseDBError(err error, fallback string) error {
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		switch pgErr.Code {
		case "23503":
			return echo.NewHTTPError(http.StatusBadRequest, "requestId, supplierId, or unit does not exist")
		case "23514":
			return echo.NewHTTPError(http.StatusBadRequest, "request violates estimate response constraints")
		}
	}
	return echo.NewHTTPError(http.StatusInternalServerError, fallback)
}
