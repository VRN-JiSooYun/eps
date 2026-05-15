package main

import (
	"context"
	"log"
	"time"

	"eps/backend/internal/config"
	"eps/backend/internal/db"
	"eps/backend/internal/handlers"
	appmiddleware "eps/backend/internal/middleware"
	"eps/backend/internal/web"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

func main() {
	cfg := config.Load()

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
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: []string{cfg.FrontendOrigin},
		AllowMethods: []string{echo.GET, echo.POST, echo.OPTIONS},
		AllowHeaders: []string{echo.HeaderOrigin, echo.HeaderContentType, echo.HeaderAccept, echo.HeaderAuthorization},
	}))

	authHandler := handlers.NewAuthHandler(pool, cfg.JWTSecret)
	supplierHandler := handlers.NewSupplierHandler(pool, cfg.JWTSecret, cfg.UploadDir)
	quoteHandler := handlers.NewQuoteHandler(pool)
	authMiddleware := appmiddleware.JWT(cfg.JWTSecret)

	e.GET("/health", handlers.Health)

	e.Static("/public", "public")

	api := e.Group("/api")
	api.POST("/auth/register", authHandler.Register)
	api.POST("/auth/login", authHandler.Login)
	api.POST("/suppliers/register", supplierHandler.Register)
	api.GET("/quote-requests/pending", quoteHandler.ListPending, authMiddleware)

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
