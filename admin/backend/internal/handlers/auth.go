package handlers

import (
	"net/http"
	"time"

	"eps-admin/backend/internal/config"

	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
)

type AuthHandler struct {
	cfg config.Config
}

type loginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

func NewAuthHandler(cfg config.Config) AuthHandler {
	return AuthHandler{cfg: cfg}
}

func (h AuthHandler) Login(c echo.Context) error {
	var req loginRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}
	if req.Username != h.cfg.AdminUsername || req.Password != h.cfg.AdminPassword {
		return echo.NewHTTPError(http.StatusUnauthorized, "invalid credentials")
	}

	expiresAt := time.Now().Add(12 * time.Hour)
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": h.cfg.AdminUsername,
		"exp": expiresAt.Unix(),
		"iat": time.Now().Unix(),
	})
	signed, err := token.SignedString([]byte(h.cfg.JWTSecret))
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to sign token")
	}

	return c.JSON(http.StatusOK, map[string]any{
		"token":     signed,
		"expiresAt": expiresAt,
		"username":  h.cfg.AdminUsername,
	})
}
