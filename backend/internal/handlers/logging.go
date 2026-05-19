package handlers

import (
	"log"

	"github.com/labstack/echo/v4"
)

func logHandlerError(c echo.Context, operation string, err error) {
	if err == nil {
		return
	}

	req := c.Request()
	log.Printf("api error: operation=%s method=%s path=%s remote=%s error=%v", operation, req.Method, req.URL.Path, c.RealIP(), err)
}
