package config

import (
	"os"
	"strconv"
)

type Config struct {
	Port             string
	DatabaseURL      string
	JWTSecret        string
	FrontendOrigin   string
	DevFrontendProxy bool
	UploadDir        string
}

func Load() Config {
	return Config{
		Port:             env("PORT", "8080"),
		DatabaseURL:      env("DATABASE_URL", "postgres://eps:eps@localhost:5432/eps?sslmode=disable"),
		JWTSecret:        env("JWT_SECRET", "dev-only-change-me"),
		FrontendOrigin:   env("FRONTEND_ORIGIN", "http://localhost:5173"),
		DevFrontendProxy: envBool("DEV_FRONTEND_PROXY", false),
		UploadDir:        env("UPLOAD_DIR", "uploads"),
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
