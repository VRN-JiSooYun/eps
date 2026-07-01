package handlers

import (
	"bytes"
	"embed"
	"encoding/json"
	"io"
	"io/fs"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"

	"github.com/labstack/echo/v4"
)

type WebHandler struct {
	apiBaseURL string
	assets     http.FileSystem
	basePath   string
}

func NewWebHandler(dist embed.FS, basePath string, apiBaseURL string) (WebHandler, error) {
	assets, err := fs.Sub(dist, "dist")
	if err != nil {
		return WebHandler{}, err
	}
	normalizedBasePath := normalizeWebBasePath(basePath)
	return WebHandler{
		apiBaseURL: normalizeWebAPIBaseURL(apiBaseURL, normalizedBasePath),
		assets:     http.FS(assets),
		basePath:   normalizedBasePath,
	}, nil
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
			if path == "index.html" {
				return h.serveIndex(c, file, stat)
			}
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
	return h.serveIndex(c, index, stat)
}

func (h WebHandler) serveIndex(c echo.Context, index fs.File, stat fs.FileInfo) error {
	content, err := io.ReadAll(index)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to read frontend index.html")
	}

	configJSON, err := json.Marshal(map[string]string{
		"apiBaseUrl": h.apiBaseURL,
		"basePath":   h.basePath,
	})
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to serialize frontend config")
	}

	runtimeConfig := `<script>window.__EPS_CONFIG__ = ` + string(configJSON) + `;</script>`
	content = bytes.Replace(content, []byte("<!-- EPS_RUNTIME_CONFIG -->"), []byte(runtimeConfig), 1)

	c.Response().Header().Set(echo.HeaderContentType, echo.MIMETextHTMLCharsetUTF8)
	http.ServeContent(c.Response(), c.Request(), "index.html", stat.ModTime(), bytes.NewReader(content))
	return nil
}

func normalizeWebBasePath(value string) string {
	if value == "" || value == "." {
		return "/"
	}
	if !strings.HasPrefix(value, "/") {
		value = "/" + value
	}
	if !strings.HasSuffix(value, "/") {
		value += "/"
	}
	return value
}

func normalizeWebAPIBaseURL(value string, basePath string) string {
	if value != "" {
		return value
	}
	basePath = strings.TrimSuffix(basePath, "/")
	if basePath == "" {
		return "/api"
	}
	return basePath + "/api"
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
