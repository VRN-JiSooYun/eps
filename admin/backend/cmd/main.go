package main

import (
	"context"
	"log"
	"time"

	"eps-admin/backend/internal/config"
	"eps-admin/backend/internal/db"
	"eps-admin/backend/internal/handlers"
	appmiddleware "eps-admin/backend/internal/middleware"
	"eps-admin/backend/internal/web"

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
		AllowMethods: []string{echo.GET, echo.POST, echo.PUT, echo.DELETE, echo.OPTIONS},
		AllowHeaders: []string{echo.HeaderOrigin, echo.HeaderContentType, echo.HeaderAccept, echo.HeaderAuthorization},
	}))

	auth := handlers.NewAuthHandler(cfg)
	admin := handlers.NewAdminHandler(pool)
	jwtMiddleware := appmiddleware.JWT(cfg.JWTSecret)

	e.GET("/health", handlers.Health)

	api := e.Group("/api")
	api.POST("/auth/login", auth.Login)

	adminAPI := api.Group("/admin", jwtMiddleware)
	adminAPI.GET("/tables", admin.Tables)
	adminAPI.GET("/:table", admin.List)
	adminAPI.POST("/:table", admin.Create)
	adminAPI.GET("/:table/:id", admin.Get)
	adminAPI.PUT("/:table/:id", admin.Update)
	adminAPI.DELETE("/:table/:id", admin.Delete)

	if cfg.DevFrontendProxy {
		proxy, err := handlers.NewDevWebProxy(cfg.FrontendOrigin)
		if err != nil {
			log.Fatalf("create frontend proxy: %v", err)
		}
		e.Any("/*", proxy.Serve)
	} else {
		webHandler, err := handlers.NewWebHandler(web.Dist)
		if err != nil {
			log.Fatalf("load web bundle: %v", err)
		}
		e.GET("/*", webHandler.Serve)
	}

	log.Printf("eps admin listening on %s", cfg.Port)
	if err := e.Start(":" + cfg.Port); err != nil {
		log.Fatal(err)
	}
}
