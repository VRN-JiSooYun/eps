package handlers

import (
	"context"
	"errors"
	"net/http"
	"strings"
	"time"

	"eps/backend/internal/models"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"
)

type EstimateResponseHandler struct {
	db *pgxpool.Pool
}

func NewEstimateResponseHandler(db *pgxpool.Pool) EstimateResponseHandler {
	return EstimateResponseHandler{db: db}
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

func (h EstimateResponseHandler) Create(c echo.Context) error {
	var req models.EstimateResponsePayload
	if err := c.Bind(&req); err != nil {
		logHandlerError(c, "estimate_responses.create.bind", err)
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}

	req.ProductName = strings.TrimSpace(req.ProductName)
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

	var body []byte
	err = h.db.QueryRow(ctx, `
		INSERT INTO eps_estimate_response (
			request_id,
			vendor_id,
			vendor_name,
			product_name,
			supplier_id,
			catalog_no,
			unit_cost,
			unit_value,
			unit,
			count,
			delivery_period,
			total_cost,
			document_path,
			discard
		)
		SELECT
			request.id,
			vendor.id,
			vendor.vendor_name,
			$3::text,
			$4::integer,
			COALESCE($5::text, ''),
			COALESCE($6::double precision, 0),
			COALESCE($7::double precision, 0),
			$8::integer,
			COALESCE($9::integer, 1),
			COALESCE($10::text, ''),
			COALESCE($11::double precision, COALESCE($6::double precision, 0) * COALESCE($7::double precision, 0) * COALESCE($9::integer, 1)),
			COALESCE($12::text, ''),
			COALESCE($13::boolean, false)
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
		req.ProductName,
		req.SupplierID,
		req.CatalogNo,
		req.UnitCost,
		req.UnitValue,
		req.Unit,
		req.Count,
		req.DeliveryPeriod,
		req.TotalCost,
		req.DocumentPath,
		req.Discard,
	).Scan(&body)
	if err != nil {
		logHandlerError(c, "estimate_responses.create.insert", err)
		if err == pgx.ErrNoRows {
			return echo.NewHTTPError(http.StatusNotFound, "estimate request not found")
		}
		return estimateResponseDBError(err, "failed to create estimate response")
	}

	return c.JSONBlob(http.StatusCreated, wrapJSON("estimateResponse", body))
}

func (h EstimateResponseHandler) Update(c echo.Context) error {
	id, err := pathID(c)
	if err != nil {
		logHandlerError(c, "estimate_responses.update.parse_id", err)
		return echo.NewHTTPError(http.StatusBadRequest, "id must be an integer")
	}

	var req models.EstimateResponsePayload
	if err := c.Bind(&req); err != nil {
		logHandlerError(c, "estimate_responses.update.bind", err)
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}

	req.ProductName = strings.TrimSpace(req.ProductName)
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

	var body []byte
	err = h.db.QueryRow(ctx, `
		UPDATE eps_estimate_response
		SET
			product_name = COALESCE(NULLIF($3::text, ''), product_name),
			supplier_id = COALESCE($4::integer, supplier_id),
			catalog_no = COALESCE($5::text, catalog_no),
			unit_cost = COALESCE($6::double precision, unit_cost),
			unit_value = COALESCE($7::double precision, unit_value),
			unit = COALESCE($8::integer, unit),
			count = COALESCE($9::integer, count),
			delivery_period = COALESCE($10::text, delivery_period),
			total_cost = COALESCE($11::double precision, COALESCE($6::double precision, unit_cost) * COALESCE($7::double precision, unit_value) * COALESCE($9::integer, count)),
			document_path = COALESCE($12::text, document_path),
			discard = COALESCE($13::boolean, discard),
			date_updated = now()
		WHERE id = $1
			AND vendor_id = $2
		RETURNING estimate_response_json(eps_estimate_response)
	`,
		id,
		vendorID,
		req.ProductName,
		req.SupplierID,
		req.CatalogNo,
		req.UnitCost,
		req.UnitValue,
		req.Unit,
		req.Count,
		req.DeliveryPeriod,
		req.TotalCost,
		req.DocumentPath,
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
