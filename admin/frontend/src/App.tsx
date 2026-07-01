import {
  DeleteOutlined,
  EditOutlined,
  LogoutOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined
} from "@ant-design/icons";
import {
  App as AntApp,
  Button,
  Checkbox,
  DatePicker,
  Drawer,
  Form,
  Input,
  InputNumber,
  Layout,
  Menu,
  Modal,
  Space,
  Switch,
  Table,
  Tag,
  Typography
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useState } from "react";

const { Header, Sider, Content } = Layout;

type ColumnType = "text" | "integer" | "number" | "boolean" | "timestamp";

interface ColumnMeta {
  name: string;
  label: string;
  type: ColumnType;
  required?: boolean;
  readOnly?: boolean;
  references?: string;
}

interface TableMeta {
  name: string;
  label: string;
  primaryKey: string[];
  columns: ColumnMeta[];
  softDelete?: string;
}

type RowData = Record<string, unknown>;

interface LoginResponse {
  token: string;
  username: string;
}

function tokenStore() {
  return localStorage.getItem("eps-admin-token") ?? "";
}

function setTokenStore(token: string) {
  if (token) {
    localStorage.setItem("eps-admin-token", token);
  } else {
    localStorage.removeItem("eps-admin-token");
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = tokenStore();
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers
    }
  });

  if (!response.ok) {
    let detail = response.statusText;
    try {
      const body = await response.json();
      detail = body.message || body.error || detail;
    } catch {
      detail = response.statusText;
    }
    throw new Error(detail);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

function rowKey(table: TableMeta, row: RowData) {
  return table.primaryKey.map((key) => String(row[key] ?? "")).join(",");
}

function formatValue(column: ColumnMeta, value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "";
  }
  if (column.type === "boolean") {
    return value ? <Tag color="green">true</Tag> : <Tag>false</Tag>;
  }
  if (column.type === "timestamp") {
    return dayjs(String(value)).isValid() ? dayjs(String(value)).format("YYYY-MM-DD HH:mm") : String(value);
  }
  return String(value);
}

function normalizePayload(table: TableMeta, values: RowData) {
  const payload: RowData = {};
  for (const column of table.columns) {
    if (column.readOnly) {
      continue;
    }
    const value = values[column.name];
    if (value === undefined) {
      continue;
    }
    if (column.type === "timestamp") {
      payload[column.name] = value && dayjs.isDayjs(value) ? value.toISOString() : null;
    } else if (value === "") {
      payload[column.name] = column.required ? "" : null;
    } else {
      payload[column.name] = value;
    }
  }
  return payload;
}

function toInitialValues(table: TableMeta, row: RowData | null) {
  if (!row) {
    const defaults: RowData = {};
    for (const column of table.columns) {
      if (column.type === "boolean" && !column.readOnly) {
        defaults[column.name] = false;
      }
    }
    return defaults;
  }
  const values: RowData = {};
  for (const column of table.columns) {
    const value = row[column.name];
    values[column.name] = column.type === "timestamp" && value ? dayjs(String(value)) : value;
  }
  return values;
}

function FieldInput({ column }: { column: ColumnMeta }) {
  if (column.type === "boolean") {
    return <Switch />;
  }
  if (column.type === "integer") {
    return <InputNumber className="w-full" precision={0} placeholder={column.references ? `${column.references} id` : undefined} />;
  }
  if (column.type === "number") {
    return <InputNumber className="w-full" />;
  }
  if (column.type === "timestamp") {
    return <DatePicker className="w-full" showTime />;
  }
  return column.name.includes("note") || column.name.includes("comment") ? <Input.TextArea rows={4} /> : <Input />;
}

function Login({ onLogin }: { onLogin: (response: LoginResponse) => void }) {
  const { message } = AntApp.useApp();
  const [loading, setLoading] = useState(false);

  const submit = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const response = await request<LoginResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(values)
      });
      setTokenStore(response.token);
      onLogin(response);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-panel px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-80px)] max-w-md items-center">
        <div className="w-full rounded-lg border border-line bg-white p-6 shadow-sm">
          <div className="mb-6">
            <Typography.Title level={2} className="!mb-1">
              EPS Admin
            </Typography.Title>
            <Typography.Text type="secondary">Database management console</Typography.Text>
          </div>
          <Form layout="vertical" onFinish={submit} initialValues={{ username: "admin" }}>
            <Form.Item name="username" label="ID" rules={[{ required: true }]}>
              <Input autoComplete="username" />
            </Form.Item>
            <Form.Item name="password" label="Password" rules={[{ required: true }]}>
              <Input.Password autoComplete="current-password" />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Login
            </Button>
          </Form>
        </div>
      </div>
    </div>
  );
}

function Console({ onLogout }: { onLogout: () => void }) {
  const { message } = AntApp.useApp();
  const [tables, setTables] = useState<TableMeta[]>([]);
  const [activeName, setActiveName] = useState("");
  const [rows, setRows] = useState<RowData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<RowData | null>(null);
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [form] = Form.useForm();

  const activeTable = useMemo(() => tables.find((table) => table.name === activeName), [tables, activeName]);

  const loadTables = useCallback(async () => {
    const response = await request<{ tables: TableMeta[] }>("/api/admin/tables");
    setTables(response.tables);
    setActiveName((current) => current || response.tables[0]?.name || "");
  }, []);

  const loadRows = useCallback(async () => {
    if (!activeTable) {
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: "100",
        offset: String((page - 1) * 100),
        includeDeleted: String(includeDeleted),
        q: query
      });
      const response = await request<{ rows: RowData[]; total: number }>(`/api/admin/${activeTable.name}?${params}`);
      setRows(response.rows);
      setTotal(response.total);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Failed to load rows");
    } finally {
      setLoading(false);
    }
  }, [activeTable, includeDeleted, message, page, query]);

  useEffect(() => {
    loadTables().catch((error) => message.error(error instanceof Error ? error.message : "Failed to load tables"));
  }, [loadTables, message]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  const columns = useMemo<ColumnsType<RowData>>(() => {
    if (!activeTable) {
      return [];
    }
    const visibleColumns = activeTable.columns.slice(0, 9).map((column) => ({
      title: column.label,
      dataIndex: column.name,
      key: column.name,
      ellipsis: true,
      render: (value: unknown) => formatValue(column, value)
    }));
    return [
      ...visibleColumns,
      {
        title: "",
        key: "actions",
        fixed: "right",
        width: 96,
        render: (_, row) => (
          <Space size={4}>
            <Button
              aria-label="Edit"
              icon={<EditOutlined />}
              size="small"
              onClick={() => {
                setEditingRow(row);
                form.setFieldsValue(toInitialValues(activeTable, row));
                setDrawerOpen(true);
              }}
            />
            <Button aria-label="Delete" danger icon={<DeleteOutlined />} size="small" onClick={() => confirmDelete(row)} />
          </Space>
        )
      }
    ];
  }, [activeTable, form]);

  const openCreate = () => {
    if (!activeTable) {
      return;
    }
    setEditingRow(null);
    form.resetFields();
    form.setFieldsValue(toInitialValues(activeTable, null));
    setDrawerOpen(true);
  };

  const save = async () => {
    if (!activeTable) {
      return;
    }
    const values = await form.validateFields();
    setSaving(true);
    try {
      const payload = normalizePayload(activeTable, values);
      const path = editingRow ? `/api/admin/${activeTable.name}/${rowKey(activeTable, editingRow)}` : `/api/admin/${activeTable.name}`;
      await request(path, {
        method: editingRow ? "PUT" : "POST",
        body: JSON.stringify(payload)
      });
      message.success(editingRow ? "Updated" : "Created");
      setDrawerOpen(false);
      await loadRows();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (row: RowData) => {
    if (!activeTable) {
      return;
    }
    Modal.confirm({
      title: `Delete ${activeTable.label} row`,
      content: activeTable.softDelete ? "This row will be marked as discarded." : "This row will be permanently deleted.",
      okButtonProps: { danger: true },
      onOk: async () => {
        await request(`/api/admin/${activeTable.name}/${rowKey(activeTable, row)}`, { method: "DELETE" });
        message.success("Deleted");
        await loadRows();
      }
    });
  };

  return (
    <Layout className="min-h-screen">
      <Sider theme="light" width={260} className="border-r border-line">
        <div className="flex h-16 items-center border-b border-line px-5">
          <Typography.Title level={4} className="!m-0">
            EPS Admin
          </Typography.Title>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[activeName]}
          items={tables.map((table) => ({ key: table.name, label: table.label }))}
          onClick={({ key }) => {
            setPage(1);
            setActiveName(String(key));
          }}
        />
      </Sider>
      <Layout>
        <Header className="flex !h-auto min-h-20 items-center justify-between border-b border-line bg-white px-5 py-3 !leading-normal">
          <div>
            <Typography.Title level={4} className="!m-0 !leading-snug">
              {activeTable?.label ?? "Tables"}
            </Typography.Title>
            <Typography.Text className="block !leading-snug" type="secondary">
              {activeTable?.name}
            </Typography.Text>
          </div>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadRows} />
            <Button icon={<LogoutOutlined />} onClick={onLogout} />
          </Space>
        </Header>
        <Content className="p-5">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <Input
              className="max-w-sm"
              allowClear
              prefix={<SearchOutlined />}
              placeholder="Search text fields"
              value={query}
              onChange={(event) => {
                setPage(1);
                setQuery(event.target.value);
              }}
            />
            <Checkbox checked={includeDeleted} onChange={(event) => setIncludeDeleted(event.target.checked)}>
              Include discarded
            </Checkbox>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              New
            </Button>
          </div>
          <Table
            className="admin-table rounded-lg border border-line bg-white"
            columns={columns}
            dataSource={rows}
            loading={loading}
            rowKey={(row) => (activeTable ? rowKey(activeTable, row) : "")}
            scroll={{ x: true }}
            pagination={{
              current: page,
              pageSize: 100,
              total,
              showSizeChanger: false,
              onChange: setPage
            }}
            size="middle"
          />
        </Content>
      </Layout>
      <Drawer
        title={editingRow ? `Edit ${activeTable?.label}` : `New ${activeTable?.label}`}
        width={520}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        extra={
          <Button type="primary" loading={saving} onClick={save}>
            Save
          </Button>
        }
      >
        {activeTable ? (
          <Form form={form} layout="vertical">
            {activeTable.columns
              .filter((column) => !column.readOnly)
              .map((column) => (
                <Form.Item
                  key={column.name}
                  name={column.name}
                  label={column.references ? `${column.label} (${column.references}.id)` : column.label}
                  valuePropName={column.type === "boolean" ? "checked" : "value"}
                  rules={[{ required: column.required, message: `${column.label} is required` }]}
                >
                  <FieldInput column={column} />
                </Form.Item>
              ))}
          </Form>
        ) : null}
      </Drawer>
    </Layout>
  );
}

function App() {
  const [token, setToken] = useState(tokenStore());

  const logout = () => {
    setTokenStore("");
    setToken("");
  };

  return (
    <AntApp>
      {token ? (
        <Console onLogout={logout} />
      ) : (
        <Login
          onLogin={(response) => {
            setToken(response.token);
          }}
        />
      )}
    </AntApp>
  );
}

export default App;
