package handlers

import (
	"encoding/json"
	"fmt"
	"strconv"
	"strings"

	"github.com/labstack/echo/v4"
)

func pathID(c echo.Context) (int, error) {
	return strconv.Atoi(c.Param("id"))
}

func optionalIntQueryParam(c echo.Context, name string) (*int, error) {
	value := strings.TrimSpace(c.QueryParam(name))
	if value == "" {
		return nil, nil
	}
	parsed, err := strconv.Atoi(value)
	if err != nil {
		return nil, err
	}
	return &parsed, nil
}

func wrapJSON(key string, body []byte) []byte {
	wrapped, err := json.Marshal(map[string]json.RawMessage{
		key: body,
	})
	if err != nil {
		return []byte(fmt.Sprintf(`{"%s":null}`, key))
	}
	return wrapped
}
