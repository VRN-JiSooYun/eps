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
