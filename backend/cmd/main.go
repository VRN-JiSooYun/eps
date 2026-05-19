package main

import (
	"context"
	"io"
	"log"
	"os"
	"path/filepath"
	"time"

	"eps/backend/internal/config"
	"eps/backend/internal/db"
	"eps/backend/internal/handlers"
	appmiddleware "eps/backend/internal/middleware"
	"eps/backend/internal/web"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"gopkg.in/natefinch/lumberjack.v2"
)

func main() {
	cfg := config.Load()
	appLogOutput := configureLogging(cfg, cfg.LogFile, true)
	echoLogOutput := configureLogging(cfg, cfg.EchoLogFile, false)
	log.SetOutput(appLogOutput)
	log.SetFlags(log.LstdFlags | log.Lshortfile)

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	pool, err := db.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("connect database: %v", err)
	}
	defer pool.Close()

	if err := db.Migrate(ctx, pool); err != nil {
		log.Fatalf("migrate database: %v", err)
	}

	e := echo.New()
	e.Logger.SetOutput(echoLogOutput)
	e.Use(middleware.LoggerWithConfig(middleware.LoggerConfig{
		Output: echoLogOutput,
	}))
	e.Use(middleware.Recover())
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: []string{cfg.FrontendOrigin},
		AllowMethods: []string{echo.GET, echo.POST, echo.PUT, echo.DELETE, echo.OPTIONS},
		AllowHeaders: []string{echo.HeaderOrigin, echo.HeaderContentType, echo.HeaderAccept, echo.HeaderAuthorization},
	}))

	authHandler := handlers.NewAuthHandler(pool, cfg.JWTSecret)
	supplierHandler := handlers.NewSupplierHandler(pool, cfg.JWTSecret, cfg.UploadDir)
	quoteHandler := handlers.NewQuoteHandler(pool)
	estimateRequestHandler := handlers.NewEstimateRequestHandler(pool)
	estimateResponseHandler := handlers.NewEstimateResponseHandler(pool)
	authMiddleware := appmiddleware.JWT(cfg.JWTSecret)

	e.GET("/health", handlers.Health)

	e.Static("/public", "public")

	api := e.Group("/api")
	api.POST("/auth/register", authHandler.Register)
	api.POST("/auth/login", authHandler.Login)
	api.POST("/suppliers/register", supplierHandler.Register)
	api.GET("/quote-requests/pending", quoteHandler.ListPending, authMiddleware)
	api.GET("/estimate-requests", estimateRequestHandler.List, authMiddleware)
	api.POST("/estimate-requests", estimateRequestHandler.Create, authMiddleware)
	api.GET("/estimate-requests/:id", estimateRequestHandler.Get, authMiddleware)
	api.PUT("/estimate-requests/:id", estimateRequestHandler.Update, authMiddleware)
	api.DELETE("/estimate-requests/:id", estimateRequestHandler.Delete, authMiddleware)
	api.GET("/estimate-responses", estimateResponseHandler.List, authMiddleware)
	api.POST("/estimate-responses", estimateResponseHandler.Create, authMiddleware)
	api.GET("/estimate-responses/:id", estimateResponseHandler.Get, authMiddleware)
	api.PUT("/estimate-responses/:id", estimateResponseHandler.Update, authMiddleware)
	api.DELETE("/estimate-responses/:id", estimateResponseHandler.Delete, authMiddleware)

	if cfg.DevFrontendProxy {
		webProxy, err := handlers.NewDevWebProxy(cfg.FrontendOrigin)
		if err != nil {
			log.Fatalf("create frontend dev proxy: %v", err)
		}
		e.Any("/*", webProxy.Serve)
		log.Printf("frontend dev proxy enabled: %s", cfg.FrontendOrigin)
	} else {
		webHandler, err := handlers.NewWebHandler(web.Dist)
		if err != nil {
			log.Fatalf("load frontend bundle: %v", err)
		}
		e.GET("/*", webHandler.Serve)
	}

	log.Printf("eps backend listening on %s", cfg.Port)
	if err := e.Start(":" + cfg.Port); err != nil {
		log.Fatal(err)
	}
}

func configureLogging(cfg config.Config, filename string, includeStdout bool) io.Writer {
	if err := os.MkdirAll(filepath.Dir(filename), 0755); err != nil {
		log.Printf("create log directory: %v", err)
		return os.Stdout
	}

	fileLogger := &lumberjack.Logger{
		Filename:   filename,
		MaxSize:    cfg.LogMaxSizeMB,
		MaxBackups: cfg.LogMaxBackups,
		MaxAge:     cfg.LogMaxAgeDays,
		Compress:   cfg.LogCompress,
	}

	if !includeStdout {
		return fileLogger
	}

	return io.MultiWriter(os.Stdout, fileLogger)
}
