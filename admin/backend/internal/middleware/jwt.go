package middleware

import (
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
)

func JWT(secret string) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			header := c.Request().Header.Get(echo.HeaderAuthorization)
			tokenValue := strings.TrimPrefix(header, "Bearer ")
			if tokenValue == "" || tokenValue == header {
				return echo.NewHTTPError(http.StatusUnauthorized, "missing bearer token")
			}

			token, err := jwt.Parse(tokenValue, func(token *jwt.Token) (interface{}, error) {
				return []byte(secret), nil
			})
			if err != nil || !token.Valid {
				return echo.NewHTTPError(http.StatusUnauthorized, "invalid token")
			}
			return next(c)
		}
	}
}
