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

	rows, err := h.db.Query(ctx, `
		SELECT id, request_number, title, description, status, due_date, buyer_name, created_at
		FROM quote_requests
		WHERE status = 'pending'
		ORDER BY due_date ASC, created_at DESC
	`)
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
