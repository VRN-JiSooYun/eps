package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"eps/backend/internal/models"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"
)

type EstimateRequestHandler struct {
	db *pgxpool.Pool
}

func NewEstimateRequestHandler(db *pgxpool.Pool) EstimateRequestHandler {
	return EstimateRequestHandler{db: db}
}

func (h EstimateRequestHandler) List(c echo.Context) error {
	ctx, cancel := context.WithTimeout(c.Request().Context(), 5*time.Second)
	defer cancel()

	status := strings.TrimSpace(c.QueryParam("status"))
	includeDiscard := parseBool(c.QueryParam("includeDiscard"))
	supplierID, err := optionalIntQueryParam(c, "supplierId")
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "supplierId must be an integer")
	}

	var body []byte
	err = h.db.QueryRow(ctx, `
		SELECT COALESCE(json_agg(estimate_request_json(r) ORDER BY r.date_created DESC), '[]'::json)
		FROM eps_estimate_request r
		WHERE ($1::text = '' OR r.status = $1)
			AND ($2::integer IS NULL OR r.supplier_id = $2)
			AND ($3::boolean OR r.discard = false)
	`, status, supplierID, includeDiscard).Scan(&body)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to list estimate requests")
	}

	return c.JSONBlob(http.StatusOK, wrapJSON("estimateRequests", body))
}

func (h EstimateRequestHandler) Get(c echo.Context) error {
	id, err := pathID(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "id must be an integer")
	}

	ctx, cancel := context.WithTimeout(c.Request().Context(), 5*time.Second)
	defer cancel()

	body, err := h.getByID(ctx, id)
	if err != nil {
		if err == pgx.ErrNoRows {
			return echo.NewHTTPError(http.StatusNotFound, "estimate request not found")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to get estimate request")
	}

	return c.JSONBlob(http.StatusOK, wrapJSON("estimateRequest", body))
}

func (h EstimateRequestHandler) Create(c echo.Context) error {
	var req models.EstimateRequestPayload
	if err := c.Bind(&req); err != nil {
		log.Println("failed to bind request body:", err)
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}
	req.ProductName = strings.TrimSpace(req.ProductName)
	if err := validateEstimateRequestPayload(req, true); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	ctx, cancel := context.WithTimeout(c.Request().Context(), 5*time.Second)
	defer cancel()

	var body []byte
	err := h.db.QueryRow(ctx, `
		INSERT INTO eps_estimate_request (
			bid,
			date_discard,
			product_name,
			cas_no,
			supplier_id,
			catalog_no,
			unit_value,
			unit,
			count,
			status,
			purchase_request,
			note,
			discard
		)
		VALUES (
			COALESCE($1::boolean, false),
			$2::timestamptz,
			$3::text,
			COALESCE($4::text, ''),
			$5::integer,
			COALESCE($6::text, ''),
			COALESCE($7::double precision, 0),
			$8::integer,
			COALESCE($9::integer, 1),
			$10::text,
			$11::integer,
			COALESCE($12::text, ''),
			COALESCE($13::boolean, false)
		)
		RETURNING estimate_request_json(eps_estimate_request)
	`,
		req.Bid,
		req.DateDiscard,
		req.ProductName,
		req.CasNo,
		req.SupplierID,
		req.CatalogNo,
		req.UnitValue,
		req.Unit,
		req.Count,
		req.Status,
		req.PurchaseRequest,
		req.Note,
		req.Discard,
	).Scan(&body)
	if err != nil {
		log.Println("failed to create estimate request:", err)
		return estimateRequestDBError(err, "failed to create estimate request")
	}

	return c.JSONBlob(http.StatusCreated, wrapJSON("estimateRequest", body))
}

func (h EstimateRequestHandler) Update(c echo.Context) error {
	id, err := pathID(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "id must be an integer")
	}

	var req models.EstimateRequestPayload
	if err := c.Bind(&req); err != nil {
		log.Println("failed to bind request body:", err)
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}
	req.ProductName = strings.TrimSpace(req.ProductName)
	if err := validateEstimateRequestPayload(req, false); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	ctx, cancel := context.WithTimeout(c.Request().Context(), 5*time.Second)
	defer cancel()

	var body []byte
	err = h.db.QueryRow(ctx, `
		UPDATE eps_estimate_request
		SET
			bid = COALESCE($2::boolean, bid),
			date_discard = COALESCE($3::timestamptz, date_discard),
			product_name = COALESCE(NULLIF($4::text, ''), product_name),
			cas_no = COALESCE($5::text, cas_no),
			supplier_id = COALESCE($6::integer, supplier_id),
			catalog_no = COALESCE($7::text, catalog_no),
			unit_value = COALESCE($8::double precision, unit_value),
			unit = COALESCE($9::integer, unit),
			count = COALESCE($10::integer, count),
			status = COALESCE($11::text, status),
			purchase_request = COALESCE($12::integer, purchase_request),
			note = COALESCE($13::text, note),
			discard = COALESCE($14::boolean, discard)
		WHERE id = $1
		RETURNING estimate_request_json(eps_estimate_request)
	`,
		id,
		req.Bid,
		req.DateDiscard,
		req.ProductName,
		req.CasNo,
		req.SupplierID,
		req.CatalogNo,
		req.UnitValue,
		req.Unit,
		req.Count,
		req.Status,
		req.PurchaseRequest,
		req.Note,
		req.Discard,
	).Scan(&body)
	if err != nil {
		if err == pgx.ErrNoRows {
			return echo.NewHTTPError(http.StatusNotFound, "estimate request not found")
		}
		return estimateRequestDBError(err, "failed to update estimate request")
	}

	return c.JSONBlob(http.StatusOK, wrapJSON("estimateRequest", body))
}

func (h EstimateRequestHandler) Delete(c echo.Context) error {
	id, err := pathID(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "id must be an integer")
	}

	ctx, cancel := context.WithTimeout(c.Request().Context(), 5*time.Second)
	defer cancel()

	tag, err := h.db.Exec(ctx, `
		UPDATE eps_estimate_request
		SET discard = true
		WHERE id = $1 AND discard = false
	`, id)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to delete estimate request")
	}
	if tag.RowsAffected() == 0 {
		return echo.NewHTTPError(http.StatusNotFound, "estimate request not found")
	}

	return c.NoContent(http.StatusNoContent)
}

func (h EstimateRequestHandler) getByID(ctx context.Context, id int) ([]byte, error) {
	var body []byte
	err := h.db.QueryRow(ctx, `
		SELECT estimate_request_json(r)
		FROM eps_estimate_request r
		WHERE r.id = $1
	`, id).Scan(&body)
	return body, err
}

func validateEstimateRequestPayload(req models.EstimateRequestPayload, requireProductName bool) error {
	if requireProductName && req.ProductName == "" {
		return errors.New("productName is required")
	}
	if req.Count != nil && *req.Count <= 0 {
		return errors.New("count must be greater than 0")
	}
	if req.UnitValue != nil && *req.UnitValue < 0 {
		return errors.New("unitValue must be greater than or equal to 0")
	}
	return nil
}

func estimateRequestDBError(err error, fallback string) error {
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		switch pgErr.Code {
		case "23503":
			return echo.NewHTTPError(http.StatusBadRequest, "supplierId or unit does not exist")
		case "23514":
			return echo.NewHTTPError(http.StatusBadRequest, "request violates estimate request constraints")
		}
	}
	return echo.NewHTTPError(http.StatusInternalServerError, fallback)
}

func pathID(c echo.Context) (int, error) {
	return strconv.Atoi(c.Param("id"))
}

func optionalIntQueryParam(c echo.Context, name string) (*int, error) {
	value := strings.TrimSpace(c.QueryParam(name))
	if value == "" {
		return nil, nil
	}
	parsed, err := strconv.Atoi(value)
	if err != nil {
		return nil, err
	}
	return &parsed, nil
}

func wrapJSON(key string, body []byte) []byte {
	wrapped, err := json.Marshal(map[string]json.RawMessage{
		key: body,
	})
	if err != nil {
		return []byte(fmt.Sprintf(`{"%s":null}`, key))
	}
	return wrapped
}
