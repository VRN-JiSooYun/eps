package handlers

import (
	"embed"
	"io/fs"
	"net/http"
	"net/http/httputil"
	"net/url"
	"path"
	"strings"

	"github.com/labstack/echo/v4"
)

type WebHandler struct {
	files http.FileSystem
}

func NewWebHandler(dist embed.FS) (WebHandler, error) {
	sub, err := fs.Sub(dist, "dist")
	if err != nil {
		return WebHandler{}, err
	}
	return WebHandler{files: http.FS(sub)}, nil
}

func (h WebHandler) Serve(c echo.Context) error {
	requestPath := strings.TrimPrefix(c.Request().URL.Path, "/")
	if requestPath == "" {
		requestPath = "index.html"
	}
	if _, err := h.files.Open(path.Clean(requestPath)); err == nil {
		return echo.WrapHandler(http.FileServer(h.files))(c)
	}
	c.Request().URL.Path = "/index.html"
	return echo.WrapHandler(http.FileServer(h.files))(c)
}

type DevWebProxy struct {
	proxy *httputil.ReverseProxy
}

func NewDevWebProxy(origin string) (DevWebProxy, error) {
	target, err := url.Parse(origin)
	if err != nil {
		return DevWebProxy{}, err
	}
	return DevWebProxy{proxy: httputil.NewSingleHostReverseProxy(target)}, nil
}

func (p DevWebProxy) Serve(c echo.Context) error {
	p.proxy.ServeHTTP(c.Response(), c.Request())
	return nil
}
