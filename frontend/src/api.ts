import type { AuthResponse, LoginPayload, QuoteRequest, RegisterPayload } from "./types";

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
