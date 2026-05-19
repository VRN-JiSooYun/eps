package handlers

import (
	"context"
	"net/http"
	"time"

	"eps/backend/internal/models"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"
)

type QuoteHandler struct {
	db *pgxpool.Pool
}

func NewQuoteHandler(db *pgxpool.Pool) QuoteHandler {
	return QuoteHandler{db: db}
}

func (h QuoteHandler) ListPending(c echo.Context) error {
	ctx, cancel := context.WithTimeout(c.Request().Context(), 5*time.Second)
	defer cancel()

	vendorID, err := authenticatedVendorID(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "invalid authenticated vendor")
	}

	rows, err := h.db.Query(ctx, `
		SELECT
			r.id::text,
			'ER-' || lpad(r.id::text, 6, '0') AS request_number,
			r.product_name AS title,
			COALESCE(NULLIF(r.note, ''), concat_ws(' / ', NULLIF(r.cas_no, ''), NULLIF(r.catalog_no, ''))) AS description,
			COALESCE(NULLIF(r.status, ''), 'pending') AS status,
			COALESCE(r.date_discard, r.date_created) AS due_date,
			COALESCE(s.supplier_name, 'Voronoi Procurement') AS buyer_name,
			r.date_created
		FROM eps_estimate_request r
		LEFT JOIN supplier s ON s.id = r.supplier_id
		WHERE r.discard = false
			AND (r.status IS NULL OR r.status = '' OR r.status = 'pending')
			AND (r.bid = true OR s.vendor_id = $1)
		ORDER BY COALESCE(r.date_discard, r.date_created) ASC, r.date_created DESC
	`, vendorID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to list quote requests")
	}
	defer rows.Close()

	quoteRequests := make([]models.QuoteRequest, 0)
	for rows.Next() {
		var item models.QuoteRequest
		if err := rows.Scan(
			&item.ID,
			&item.RequestNumber,
			&item.Title,
			&item.Description,
			&item.Status,
			&item.DueDate,
			&item.BuyerName,
			&item.CreatedAt,
		); err != nil {
			return echo.NewHTTPError(http.StatusInternalServerError, "failed to read quote request")
		}
		quoteRequests = append(quoteRequests, item)
	}
	if err := rows.Err(); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to read quote requests")
	}

	return c.JSON(http.StatusOK, map[string][]models.QuoteRequest{
		"quoteRequests": quoteRequests,
	})
}
