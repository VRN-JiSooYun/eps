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
	LogFile          string
	EchoLogFile      string
	LogMaxSizeMB     int
	LogMaxBackups    int
	LogMaxAgeDays    int
	LogCompress      bool
}

func Load() Config {
	return Config{
		Port:             env("PORT", "8080"),
		DatabaseURL:      env("DATABASE_URL", "postgres://eps:eps@localhost:5432/eps?sslmode=disable"),
		JWTSecret:        env("JWT_SECRET", "dev-only-change-me"),
		FrontendOrigin:   env("FRONTEND_ORIGIN", "http://localhost:5173"),
		DevFrontendProxy: envBool("DEV_FRONTEND_PROXY", false),
		UploadDir:        env("UPLOAD_DIR", "uploads"),
		LogFile:          env("LOG_FILE", "logs/eps-backend.log"),
		EchoLogFile:      env("ECHO_LOG_FILE", "logs/eps-echo.log"),
		LogMaxSizeMB:     envInt("LOG_MAX_SIZE_MB", 100),
		LogMaxBackups:    envInt("LOG_MAX_BACKUPS", 7),
		LogMaxAgeDays:    envInt("LOG_MAX_AGE_DAYS", 30),
		LogCompress:      envBool("LOG_COMPRESS", true),
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

func envInt(key string, fallback int) int {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	parsed, err := strconv.Atoi(value)
	if err != nil {
		return fallback
	}
	return parsed
}
