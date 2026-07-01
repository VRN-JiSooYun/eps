import type { AuthResponse, EstimateRequest, EstimateResponse, EstimateResponsePayload, EstimateResponseUpdatePayload, LoginPayload, RegisterPayload, SupplierOption, SupplierRegisterPayload, SupplierRegisterResponse } from "./types";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  `${import.meta.env.BASE_URL.replace(/\/$/, "")}/api`;

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers
    }
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: "요청 처리에 실패했습니다." }));
    throw new Error(body.message ?? body.error ?? "요청 처리에 실패했습니다.");
  }

  return response.json() as Promise<T>;
}

async function multipartRequest<T>(
  path: string,
  body: FormData,
  headers: HeadersInit = {},
  method: "POST" | "PUT" = "POST"
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    body,
    headers
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ message: "요청 처리에 실패했습니다." }));
    throw new Error(errorBody.message ?? errorBody.error ?? "요청 처리에 실패했습니다.");
  }

  return response.json() as Promise<T>;
}

export function register(payload: RegisterPayload) {
  return request<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function login(payload: LoginPayload) {
  return request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function listEstimateRequests(token: string) {
  return request<{ estimateRequests: EstimateRequest[] }>("/estimate-requests", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function listSuppliers(token: string) {
  return request<{ suppliers: SupplierOption[] }>("/suppliers", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function listEstimateResponses(token: string, requestId: number) {
  return request<{ estimateResponses: EstimateResponse[] }>(`/estimate-responses?requestId=${requestId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function respondToEstimateRequest(token: string, payload: EstimateResponsePayload) {
  const formData = new FormData();
  appendFormValue(formData, "requestId", payload.requestId);
  appendFormValue(formData, "productName", payload.productName);
  appendFormValue(formData, "casNo", payload.casNo);
  appendFormValue(formData, "supplierId", payload.supplierId);
  appendFormValue(formData, "catalogNo", payload.catalogNo);
  appendFormValue(formData, "unitCost", payload.unitCost);
  appendFormValue(formData, "unitValue", payload.unitValue);
  appendFormValue(formData, "unit", payload.unit);
  appendFormValue(formData, "count", payload.count);
  appendFormValue(formData, "deliveryPeriod", payload.deliveryPeriod);
  appendFormValue(formData, "totalCost", payload.totalCost);
  appendFormValue(formData, "purity", payload.purity);
  appendFormValue(formData, "grade", payload.grade);
  appendFormValue(formData, "note", payload.note);
  appendFormValue(formData, "vendorContactName", payload.vendorContactName);
  appendFormValue(formData, "vendorMobilePhone", payload.vendorMobilePhone);
  appendFormValue(formData, "vendorEmail", payload.vendorEmail);

  if (payload.quoteFile) {
    formData.append("quoteFile", payload.quoteFile);
  }

  return multipartRequest<{ estimateResponse: EstimateResponse }>("/estimate-responses", formData, {
    Authorization: `Bearer ${token}`
  });
}

export function updateEstimateResponse(token: string, id: number, payload: EstimateResponseUpdatePayload) {
  if (payload.quoteFile) {
    const formData = new FormData();
    appendFormValue(formData, "productName", payload.productName);
    appendFormValue(formData, "casNo", payload.casNo);
    appendFormValue(formData, "supplierId", payload.supplierId);
    appendFormValue(formData, "catalogNo", payload.catalogNo);
    appendFormValue(formData, "unitCost", payload.unitCost);
    appendFormValue(formData, "unitValue", payload.unitValue);
    appendFormValue(formData, "unit", payload.unit);
    appendFormValue(formData, "count", payload.count);
    appendFormValue(formData, "deliveryPeriod", payload.deliveryPeriod);
    appendFormValue(formData, "totalCost", payload.totalCost);
    appendFormValue(formData, "purity", payload.purity);
    appendFormValue(formData, "grade", payload.grade);
    appendFormValue(formData, "note", payload.note);
    appendFormValue(formData, "vendorContactName", payload.vendorContactName);
    appendFormValue(formData, "vendorMobilePhone", payload.vendorMobilePhone);
    appendFormValue(formData, "vendorEmail", payload.vendorEmail);
    appendFormValue(formData, "discard", payload.discard);
    appendFormValue(formData, "documentPath", payload.documentPath);
    formData.append("quoteFile", payload.quoteFile);

    return multipartRequest<{ estimateResponse: EstimateResponse }>(
      `/estimate-responses/${id}`,
      formData,
      {
        Authorization: `Bearer ${token}`
      },
      "PUT"
    );
  }

  return request<{ estimateResponse: EstimateResponse }>(`/estimate-responses/${id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
}

function appendFormValue(formData: FormData, key: string, value: string | number | boolean | null | undefined) {
  if (value === undefined || value === null || value === "") {
    return;
  }
  formData.append(key, String(value));
}

export function supplierRegister(payload: SupplierRegisterPayload) {
  const formData = new FormData();

  formData.append("email", payload.contact.email);
  formData.append("password", payload.supplier.password);
  formData.append("passwordConfirm", payload.supplier.passwordConfirm);
  formData.append("companyName", payload.supplier.companyName);
  formData.append("businessRegistrationNumber", payload.supplier.businessRegistrationNumber);
  formData.append("headOfficePhone", payload.supplier.headOfficePhone);
  formData.append("bankName", payload.supplier.bankName);
  formData.append("accountHolder", payload.supplier.accountHolder);
  formData.append("accountNumber", payload.supplier.accountNumber);
  formData.append("contactName", payload.contact.contactName);
  formData.append("position", payload.contact.position);
  formData.append("department", payload.contact.department);
  formData.append("mobilePhone", payload.contact.mobilePhone);
  formData.append("directPhone", payload.contact.directPhone);
  formData.append("emailNotificationEnabled", String(payload.contact.emailNotificationEnabled));
  formData.append("privacyAgreed", String(payload.privacyAgreed));

  if (payload.files.businessRegistrationFile) {
    formData.append("businessRegistrationFile", payload.files.businessRegistrationFile);
  }
  if (payload.files.bankbookFile) {
    formData.append("bankbookFile", payload.files.bankbookFile);
  }

  return multipartRequest<SupplierRegisterResponse>("/suppliers/register", formData);
}
