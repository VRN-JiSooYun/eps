package middleware

import (
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
)

const SupplierIDKey = "supplierID"

func JWT(secret string) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			authHeader := c.Request().Header.Get(echo.HeaderAuthorization)
			tokenString := strings.TrimPrefix(authHeader, "Bearer ")
			if tokenString == "" || tokenString == authHeader {
				return echo.NewHTTPError(http.StatusUnauthorized, "missing bearer token")
			}

			token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
				return []byte(secret), nil
			}, jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}))
			if err != nil || !token.Valid {
				return echo.NewHTTPError(http.StatusUnauthorized, "invalid token")
			}

			subject, err := token.Claims.GetSubject()
			if err != nil || subject == "" {
				return echo.NewHTTPError(http.StatusUnauthorized, "invalid token subject")
			}

			c.Set(SupplierIDKey, subject)
			return next(c)
		}
	}
}
