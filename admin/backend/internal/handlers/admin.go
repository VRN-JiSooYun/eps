package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"
)

type AdminHandler struct {
	db *pgxpool.Pool
}

type tableMeta struct {
	Name        string       `json:"name"`
	Label       string       `json:"label"`
	PrimaryKey  []string     `json:"primaryKey"`
	Columns     []columnMeta `json:"columns"`
	SoftDelete  string       `json:"softDelete,omitempty"`
	DefaultSort string       `json:"defaultSort,omitempty"`
}

type columnMeta struct {
	Name       string `json:"name"`
	Label      string `json:"label"`
	Type       string `json:"type"`
	Required   bool   `json:"required,omitempty"`
	ReadOnly   bool   `json:"readOnly,omitempty"`
	References string `json:"references,omitempty"`
}

func NewAdminHandler(db *pgxpool.Pool) AdminHandler {
	return AdminHandler{db: db}
}

var adminTables = []tableMeta{
	{Name: "bank", Label: "Banks", PrimaryKey: []string{"id"}, DefaultSort: "id", Columns: []columnMeta{
		col("id", "ID", "integer", true, true, ""),
		col("bank_name", "Bank Name", "text", true, false, ""),
	}},
	{Name: "eps_vendor_info", Label: "Vendors", PrimaryKey: []string{"id"}, SoftDelete: "check_discard", DefaultSort: "id", Columns: []columnMeta{
		col("id", "ID", "integer", true, true, ""),
		col("biz_reg_no", "Business Reg No", "text", true, false, ""),
		col("vendor_name", "Vendor Name", "text", true, false, ""),
		col("contact", "Contact", "text", false, false, ""),
		col("password", "Password", "text", true, false, ""),
		col("bank_id", "Bank", "integer", false, false, "bank"),
		col("account_no", "Account No", "text", false, false, ""),
		col("account_holder", "Account Holder", "text", false, false, ""),
		col("biz_reg_cert", "Biz Reg Cert", "text", false, false, ""),
		col("bank_account_copy", "Bank Account Copy", "text", false, false, ""),
		col("check_discard", "Discarded", "boolean", false, false, ""),
		col("date_created", "Created", "timestamp", false, true, ""),
	}},
	{Name: "eps_vendor_manager_info", Label: "Vendor Managers", PrimaryKey: []string{"id"}, SoftDelete: "check_discard", DefaultSort: "id", Columns: []columnMeta{
		col("id", "ID", "integer", true, true, ""),
		col("vendor_id", "Vendor", "integer", true, false, "eps_vendor_info"),
		col("is_main", "Main", "boolean", false, false, ""),
		col("manager_name", "Manager Name", "text", true, false, ""),
		col("position", "Position", "text", false, false, ""),
		col("department", "Department", "text", false, false, ""),
		col("contact_mobile", "Mobile", "text", false, false, ""),
		col("contact_direct", "Direct", "text", false, false, ""),
		col("email", "Email", "text", false, false, ""),
		col("notification", "Notification", "text", false, false, ""),
		col("check_discard", "Discarded", "boolean", false, false, ""),
		col("date_created", "Created", "timestamp", false, true, ""),
		col("date_updated", "Updated", "timestamp", false, true, ""),
	}},
	{Name: "unit", Label: "Units", PrimaryKey: []string{"id"}, DefaultSort: "id", Columns: []columnMeta{
		col("id", "ID", "integer", true, true, ""),
		col("unit", "Unit", "text", true, false, ""),
	}},
	{Name: "supplier", Label: "Suppliers", PrimaryKey: []string{"id"}, DefaultSort: "id", Columns: []columnMeta{
		col("id", "ID", "integer", true, true, ""),
		col("vendor_id", "Vendor", "integer", false, false, "eps_vendor_info"),
		col("supplier_name", "Supplier Name", "text", true, false, ""),
	}},
	{Name: "eps_estimate_request", Label: "Estimate Requests", PrimaryKey: []string{"id"}, SoftDelete: "discard", DefaultSort: "id", Columns: []columnMeta{
		col("id", "ID", "integer", true, true, ""),
		col("bid", "Bid", "boolean", false, false, ""),
		col("date_created", "Created", "timestamp", false, true, ""),
		col("date_discard", "Discard Date", "timestamp", false, false, ""),
		col("product_name", "Product Name", "text", true, false, ""),
		col("cas_no", "CAS No", "text", false, false, ""),
		col("supplier_id", "Supplier", "integer", false, false, "supplier"),
		col("catalog_no", "Catalog No", "text", false, false, ""),
		col("unit_value", "Unit Value", "number", false, false, ""),
		col("unit", "Unit", "integer", false, false, "unit"),
		col("count", "Count", "integer", false, false, ""),
		col("status", "Status", "text", false, false, ""),
		col("sub_status", "Sub Status", "text", false, false, ""),
		col("purchase_request", "Purchase Request", "integer", false, false, ""),
		col("note", "Note", "text", false, false, ""),
		col("discard", "Discarded", "boolean", false, false, ""),
	}},
	{Name: "eps_estimate_response", Label: "Estimate Responses", PrimaryKey: []string{"id"}, SoftDelete: "discard", DefaultSort: "id", Columns: []columnMeta{
		col("id", "ID", "integer", true, true, ""),
		col("request_id", "Request", "integer", true, false, "eps_estimate_request"),
		col("vendor_id", "Vendor", "integer", true, false, "eps_vendor_info"),
		col("vendor_name", "Vendor Name", "text", false, false, ""),
		col("vendor_contact_name", "Contact Name", "text", false, false, ""),
		col("vendor_mobile_phone", "Mobile Phone", "text", false, false, ""),
		col("vendor_email", "Email", "text", false, false, ""),
		col("product_name", "Product Name", "text", true, false, ""),
		col("cas_no", "CAS No", "text", false, false, ""),
		col("supplier_id", "Supplier", "integer", false, false, "supplier"),
		col("catalog_no", "Catalog No", "text", false, false, ""),
		col("unit_cost", "Unit Cost", "number", false, false, ""),
		col("unit_value", "Unit Value", "number", false, false, ""),
		col("unit", "Unit", "integer", false, false, "unit"),
		col("count", "Count", "integer", false, false, ""),
		col("delivery_period", "Delivery Period", "text", false, false, ""),
		col("total_cost", "Total Cost", "number", false, false, ""),
		col("document_path", "Document Path", "text", false, false, ""),
		col("purity", "Purity", "text", false, false, ""),
		col("grade", "Grade", "text", false, false, ""),
		col("note", "Note", "text", false, false, ""),
		col("discard", "Discarded", "boolean", false, false, ""),
		col("date_updated", "Updated", "timestamp", false, true, ""),
		col("date_created", "Created", "timestamp", false, true, ""),
	}},
	{Name: "eps_order", Label: "Orders", PrimaryKey: []string{"id"}, SoftDelete: "discard", DefaultSort: "id", Columns: []columnMeta{
		col("id", "ID", "integer", true, true, ""),
		col("response_id", "Response", "integer", false, false, "eps_estimate_response"),
		col("shipment", "Shipment", "timestamp", false, false, ""),
		col("received", "Received", "timestamp", false, false, ""),
		col("is_paid", "Paid", "boolean", false, false, ""),
		col("date_created", "Created", "timestamp", false, true, ""),
		col("discard", "Discarded", "boolean", false, false, ""),
	}},
	{Name: "require_list", Label: "Require Lists", PrimaryKey: []string{"id"}, DefaultSort: "id", Columns: []columnMeta{
		col("id", "ID", "integer", true, true, ""),
		col("plot", "Plot", "text", true, false, ""),
	}},
	{Name: "require", Label: "Requires", PrimaryKey: []string{"id"}, DefaultSort: "id", Columns: []columnMeta{
		col("id", "ID", "integer", true, true, ""),
		col("require_list_id", "Require List", "integer", true, false, "require_list"),
		col("vendor_id", "Vendor", "integer", true, false, "eps_vendor_info"),
		col("estimate_request_id", "Estimate Request", "integer", true, false, "eps_estimate_request"),
		col("comment", "Comment", "text", false, false, ""),
		col("date_created", "Created", "timestamp", false, true, ""),
	}},
	{Name: "ips2eps_request", Label: "IPS Request Links", PrimaryKey: []string{"eps_id", "ips_id"}, Columns: []columnMeta{
		col("eps_id", "EPS Request", "integer", true, false, "eps_estimate_request"),
		col("ips_id", "IPS ID", "integer", true, false, ""),
	}},
	{Name: "ips2eps_response", Label: "IPS Response Links", PrimaryKey: []string{"eps_id", "ips_id"}, Columns: []columnMeta{
		col("eps_id", "EPS Response", "integer", true, false, "eps_estimate_response"),
		col("ips_id", "IPS ID", "integer", true, false, ""),
	}},
	{Name: "ips2eps_order", Label: "IPS Order Links", PrimaryKey: []string{"eps_id", "ips_id"}, Columns: []columnMeta{
		col("eps_id", "EPS Order", "integer", true, false, "eps_order"),
		col("ips_id", "IPS ID", "integer", true, false, ""),
	}},
}

func col(name, label, typ string, required, readOnly bool, references string) columnMeta {
	return columnMeta{Name: name, Label: label, Type: typ, Required: required, ReadOnly: readOnly, References: references}
}

func (h AdminHandler) Tables(c echo.Context) error {
	return c.JSON(http.StatusOK, map[string]any{"tables": adminTables})
}

func (h AdminHandler) List(c echo.Context) error {
	table, ok := findTable(c.Param("table"))
	if !ok {
		return echo.NewHTTPError(http.StatusNotFound, "table not found")
	}

	limit := clampInt(queryInt(c, "limit", 100), 1, 500)
	offset := maxInt(queryInt(c, "offset", 0), 0)
	includeDeleted := parseBool(c.QueryParam("includeDeleted"))
	search := strings.TrimSpace(c.QueryParam("q"))

	ctx, cancel := context.WithTimeout(c.Request().Context(), 5*time.Second)
	defer cancel()

	args := []any{}
	where := []string{}
	if table.SoftDelete != "" && !includeDeleted {
		where = append(where, fmt.Sprintf("%s = false", quoteIdent(table.SoftDelete)))
	}
	if search != "" {
		args = append(args, "%"+strings.ToLower(search)+"%")
		parts := []string{}
		for _, column := range table.Columns {
			if column.Type == "text" {
				parts = append(parts, fmt.Sprintf("lower(%s) LIKE $%d", quoteIdent(column.Name), len(args)))
			}
		}
		if len(parts) > 0 {
			where = append(where, "("+strings.Join(parts, " OR ")+")")
		}
	}

	whereSQL := ""
	if len(where) > 0 {
		whereSQL = "WHERE " + strings.Join(where, " AND ")
	}

	args = append(args, limit, offset)
	limitPlaceholder := len(args) - 1
	offsetPlaceholder := len(args)
	order := table.DefaultSort
	if order == "" {
		order = table.PrimaryKey[0]
	}

	sql := fmt.Sprintf(`
		WITH filtered AS (
			SELECT * FROM %s %s
		)
		SELECT
			(SELECT count(*) FROM filtered),
			COALESCE((SELECT jsonb_agg(to_jsonb(t) ORDER BY %s DESC) FROM (SELECT * FROM filtered ORDER BY %s DESC LIMIT $%d OFFSET $%d) t), '[]'::jsonb)
	`, quoteIdent(table.Name), whereSQL, quoteIdent(order), quoteIdent(order), limitPlaceholder, offsetPlaceholder)

	var total int64
	var rows []byte
	if err := h.db.QueryRow(ctx, sql, args...).Scan(&total, &rows); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to list rows")
	}
	return c.JSONBlob(http.StatusOK, mustJSON(map[string]any{"rows": json.RawMessage(rows), "total": total}))
}

func (h AdminHandler) Get(c echo.Context) error {
	table, ok := findTable(c.Param("table"))
	if !ok {
		return echo.NewHTTPError(http.StatusNotFound, "table not found")
	}
	where, args, err := primaryKeyWhere(table, c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	ctx, cancel := context.WithTimeout(c.Request().Context(), 5*time.Second)
	defer cancel()

	var body []byte
	sql := fmt.Sprintf("SELECT to_jsonb(t) FROM %s t WHERE %s", quoteIdent(table.Name), where)
	if err := h.db.QueryRow(ctx, sql, args...).Scan(&body); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return echo.NewHTTPError(http.StatusNotFound, "row not found")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to get row")
	}
	return c.JSONBlob(http.StatusOK, mustJSON(map[string]any{"row": json.RawMessage(body)}))
}

func (h AdminHandler) Create(c echo.Context) error {
	table, ok := findTable(c.Param("table"))
	if !ok {
		return echo.NewHTTPError(http.StatusNotFound, "table not found")
	}
	payload, err := decodeJSONMap(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}

	columns := []string{}
	placeholders := []string{}
	args := []any{}
	for _, column := range table.Columns {
		if column.ReadOnly {
			continue
		}
		value, exists := payload[column.Name]
		if !exists {
			continue
		}
		normalized, err := normalizeValue(column, value)
		if err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, err.Error())
		}
		columns = append(columns, quoteIdent(column.Name))
		args = append(args, normalized)
		placeholders = append(placeholders, fmt.Sprintf("$%d", len(args)))
	}
	if len(columns) == 0 {
		return echo.NewHTTPError(http.StatusBadRequest, "no writable columns supplied")
	}

	ctx, cancel := context.WithTimeout(c.Request().Context(), 5*time.Second)
	defer cancel()

	var body []byte
	sql := fmt.Sprintf("INSERT INTO %s (%s) VALUES (%s) RETURNING to_jsonb(%s)", quoteIdent(table.Name), strings.Join(columns, ", "), strings.Join(placeholders, ", "), quoteIdent(table.Name))
	if err := h.db.QueryRow(ctx, sql, args...).Scan(&body); err != nil {
		return dbHTTPError(err, "failed to create row")
	}
	return c.JSONBlob(http.StatusCreated, mustJSON(map[string]any{"row": json.RawMessage(body)}))
}

func (h AdminHandler) Update(c echo.Context) error {
	table, ok := findTable(c.Param("table"))
	if !ok {
		return echo.NewHTTPError(http.StatusNotFound, "table not found")
	}
	where, args, err := primaryKeyWhere(table, c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	payload, err := decodeJSONMap(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}

	sets := []string{}
	for _, column := range table.Columns {
		if column.ReadOnly || contains(table.PrimaryKey, column.Name) {
			continue
		}
		value, exists := payload[column.Name]
		if !exists {
			continue
		}
		normalized, err := normalizeValue(column, value)
		if err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, err.Error())
		}
		args = append(args, normalized)
		sets = append(sets, fmt.Sprintf("%s = $%d", quoteIdent(column.Name), len(args)))
	}
	if len(sets) == 0 {
		return echo.NewHTTPError(http.StatusBadRequest, "no writable columns supplied")
	}

	ctx, cancel := context.WithTimeout(c.Request().Context(), 5*time.Second)
	defer cancel()

	var body []byte
	sql := fmt.Sprintf("UPDATE %s SET %s WHERE %s RETURNING to_jsonb(%s)", quoteIdent(table.Name), strings.Join(sets, ", "), where, quoteIdent(table.Name))
	if err := h.db.QueryRow(ctx, sql, args...).Scan(&body); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return echo.NewHTTPError(http.StatusNotFound, "row not found")
		}
		return dbHTTPError(err, "failed to update row")
	}
	return c.JSONBlob(http.StatusOK, mustJSON(map[string]any{"row": json.RawMessage(body)}))
}

func (h AdminHandler) Delete(c echo.Context) error {
	table, ok := findTable(c.Param("table"))
	if !ok {
		return echo.NewHTTPError(http.StatusNotFound, "table not found")
	}
	where, args, err := primaryKeyWhere(table, c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	ctx, cancel := context.WithTimeout(c.Request().Context(), 5*time.Second)
	defer cancel()

	var sql string
	if table.SoftDelete != "" {
		sql = fmt.Sprintf("UPDATE %s SET %s = true WHERE %s", quoteIdent(table.Name), quoteIdent(table.SoftDelete), where)
	} else {
		sql = fmt.Sprintf("DELETE FROM %s WHERE %s", quoteIdent(table.Name), where)
	}
	tag, err := h.db.Exec(ctx, sql, args...)
	if err != nil {
		return dbHTTPError(err, "failed to delete row")
	}
	if tag.RowsAffected() == 0 {
		return echo.NewHTTPError(http.StatusNotFound, "row not found")
	}
	return c.NoContent(http.StatusNoContent)
}

func findTable(name string) (tableMeta, bool) {
	for _, table := range adminTables {
		if table.Name == name {
			return table, true
		}
	}
	return tableMeta{}, false
}

func primaryKeyWhere(table tableMeta, encoded string) (string, []any, error) {
	parts := strings.Split(encoded, ",")
	if len(parts) != len(table.PrimaryKey) {
		return "", nil, fmt.Errorf("primary key must contain %d value(s)", len(table.PrimaryKey))
	}
	where := make([]string, 0, len(parts))
	args := make([]any, 0, len(parts))
	for i, key := range table.PrimaryKey {
		column, ok := findColumn(table, key)
		if !ok {
			return "", nil, fmt.Errorf("primary key column %s is not configured", key)
		}
		value, err := normalizeValue(column, strings.TrimSpace(parts[i]))
		if err != nil {
			return "", nil, err
		}
		args = append(args, value)
		where = append(where, fmt.Sprintf("%s = $%d", quoteIdent(key), i+1))
	}
	return strings.Join(where, " AND "), args, nil
}

func findColumn(table tableMeta, name string) (columnMeta, bool) {
	for _, column := range table.Columns {
		if column.Name == name {
			return column, true
		}
	}
	return columnMeta{}, false
}

func quoteIdent(identifier string) string {
	return `"` + strings.ReplaceAll(identifier, `"`, `""`) + `"`
}

func decodeJSONMap(c echo.Context) (map[string]any, error) {
	var payload map[string]any
	decoder := json.NewDecoder(c.Request().Body)
	decoder.UseNumber()
	if err := decoder.Decode(&payload); err != nil {
		return nil, err
	}
	return payload, nil
}

func normalizeValue(column columnMeta, value any) (any, error) {
	if value == nil {
		if column.Required {
			return nil, fmt.Errorf("%s is required", column.Name)
		}
		return nil, nil
	}

	switch column.Type {
	case "integer":
		return normalizeInt(column.Name, value)
	case "number":
		return normalizeFloat(column.Name, value)
	case "boolean":
		return normalizeBool(column.Name, value)
	case "timestamp":
		if value == "" {
			return nil, nil
		}
		return value, nil
	default:
		return fmt.Sprint(value), nil
	}
}

func normalizeInt(name string, value any) (int64, error) {
	switch v := value.(type) {
	case json.Number:
		return v.Int64()
	case float64:
		if math.Trunc(v) != v {
			return 0, fmt.Errorf("%s must be an integer", name)
		}
		return int64(v), nil
	case string:
		return strconv.ParseInt(strings.TrimSpace(v), 10, 64)
	default:
		return 0, fmt.Errorf("%s must be an integer", name)
	}
}

func normalizeFloat(name string, value any) (float64, error) {
	switch v := value.(type) {
	case json.Number:
		return v.Float64()
	case float64:
		return v, nil
	case string:
		return strconv.ParseFloat(strings.TrimSpace(v), 64)
	default:
		return 0, fmt.Errorf("%s must be a number", name)
	}
}

func normalizeBool(name string, value any) (bool, error) {
	switch v := value.(type) {
	case bool:
		return v, nil
	case string:
		return strconv.ParseBool(strings.TrimSpace(v))
	default:
		return false, fmt.Errorf("%s must be a boolean", name)
	}
}

func dbHTTPError(err error, fallback string) error {
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		switch pgErr.Code {
		case "23503":
			return echo.NewHTTPError(http.StatusBadRequest, "referenced row does not exist")
		case "23505":
			return echo.NewHTTPError(http.StatusConflict, "row violates a unique constraint")
		case "23514", "23502":
			return echo.NewHTTPError(http.StatusBadRequest, pgErr.Message)
		}
	}
	return echo.NewHTTPError(http.StatusInternalServerError, fallback)
}

func parseBool(value string) bool {
	parsed, _ := strconv.ParseBool(value)
	return parsed
}

func queryInt(c echo.Context, key string, fallback int) int {
	value := strings.TrimSpace(c.QueryParam(key))
	if value == "" {
		return fallback
	}
	parsed, err := strconv.Atoi(value)
	if err != nil {
		return fallback
	}
	return parsed
}

func clampInt(value, minValue, maxValue int) int {
	return minInt(maxInt(value, minValue), maxValue)
}

func minInt(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func maxInt(a, b int) int {
	if a > b {
		return a
	}
	return b
}

func contains(values []string, target string) bool {
	for _, value := range values {
		if value == target {
			return true
		}
	}
	return false
}

func mustJSON(value any) []byte {
	var buffer bytes.Buffer
	if err := json.NewEncoder(&buffer).Encode(value); err != nil {
		panic(err)
	}
	return buffer.Bytes()
}
