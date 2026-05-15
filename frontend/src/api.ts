import type { AuthResponse, LoginPayload, QuoteRequest, RegisterPayload, SupplierRegisterPayload, SupplierRegisterResponse } from "./types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

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

async function multipartRequest<T>(path: string, body: FormData): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    body
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

export function listPendingQuoteRequests(token: string) {
  return request<{ quoteRequests: QuoteRequest[] }>("/quote-requests/pending", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
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
