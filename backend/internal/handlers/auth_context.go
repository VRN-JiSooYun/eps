package handlers

import (
	"errors"
	"strconv"

	appmiddleware "eps/backend/internal/middleware"

	"github.com/labstack/echo/v4"
)

func authenticatedVendorID(c echo.Context) (int, error) {
	value, ok := c.Get(appmiddleware.SupplierIDKey).(string)
	if !ok || value == "" {
		return 0, errors.New("missing authenticated vendor id")
	}

	id, err := strconv.Atoi(value)
	if err != nil {
		return 0, err
	}
	return id, nil
}
