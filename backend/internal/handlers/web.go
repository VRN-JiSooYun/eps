package handlers

import (
	"embed"
	"io/fs"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"

	"github.com/labstack/echo/v4"
)

type WebHandler struct {
	assets http.FileSystem
}

func NewWebHandler(dist embed.FS) (WebHandler, error) {
	assets, err := fs.Sub(dist, "dist")
	if err != nil {
		return WebHandler{}, err
	}
	return WebHandler{assets: http.FS(assets)}, nil
}

func (h WebHandler) Serve(c echo.Context) error {
	path := strings.TrimPrefix(c.Request().URL.Path, "/")
	if path == "api" || strings.HasPrefix(path, "api/") {
		return echo.NewHTTPError(http.StatusNotFound, "api endpoint not found")
	}
	if path == "" {
		path = "index.html"
	}

	file, err := h.assets.Open(path)
	if err == nil {
		defer file.Close()
		stat, statErr := file.Stat()
		if statErr == nil && !stat.IsDir() {
			http.ServeContent(c.Response(), c.Request(), path, stat.ModTime(), file)
			return nil
		}
	}

	index, err := h.assets.Open("index.html")
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "frontend bundle is missing index.html")
	}
	defer index.Close()

	stat, err := index.Stat()
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to read frontend index.html")
	}
	http.ServeContent(c.Response(), c.Request(), "index.html", stat.ModTime(), index)
	return nil
}

type DevWebProxy struct {
	proxy *httputil.ReverseProxy
}

func NewDevWebProxy(target string) (DevWebProxy, error) {
	targetURL, err := url.Parse(target)
	if err != nil {
		return DevWebProxy{}, err
	}
	return DevWebProxy{proxy: httputil.NewSingleHostReverseProxy(targetURL)}, nil
}

func (p DevWebProxy) Serve(c echo.Context) error {
	path := strings.TrimPrefix(c.Request().URL.Path, "/")
	if path == "api" || strings.HasPrefix(path, "api/") {
		return echo.NewHTTPError(http.StatusNotFound, "api endpoint not found")
	}

	p.proxy.ServeHTTP(c.Response(), c.Request())
	return nil
}
