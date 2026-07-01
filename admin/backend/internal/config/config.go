package config

import (
	"os"
	"strconv"
)

type Config struct {
	Port             string
	DatabaseURL      string
	JWTSecret        string
	AdminUsername    string
	AdminPassword    string
	FrontendOrigin   string
	DevFrontendProxy bool
	BasePath         string
}

func Load() Config {
	return Config{
		Port:             env("PORT", "8080"),
		DatabaseURL:      env("DATABASE_URL", "postgres://eps:eps@localhost:5432/eps?sslmode=disable"),
		JWTSecret:        env("JWT_SECRET", "dev-only-change-me"),
		AdminUsername:    env("ADMIN_USERNAME", "admin"),
		AdminPassword:    env("ADMIN_PASSWORD", "admin1234"),
		FrontendOrigin:   env("FRONTEND_ORIGIN", "http://localhost:5173"),
		DevFrontendProxy: envBool("DEV_FRONTEND_PROXY", false),
		BasePath:         normalizeBasePath(env("BASE_PATH", env("VITE_BASE_PATH", "/"))),
	}
}

func env(key, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}

func envBool(key string, fallback bool) bool {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	parsed, err := strconv.ParseBool(value)
	if err != nil {
		return fallback
	}
	return parsed
}

func normalizeBasePath(value string) string {
	if value == "" || value == "/" {
		return ""
	}
	trimmed := value
	for len(trimmed) > 0 && trimmed[0] == '/' {
		trimmed = trimmed[1:]
	}
	for len(trimmed) > 0 && trimmed[len(trimmed)-1] == '/' {
		trimmed = trimmed[:len(trimmed)-1]
	}
	if trimmed == "" {
		return ""
	}
	return "/" + trimmed
}
