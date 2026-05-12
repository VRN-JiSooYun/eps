export type Supplier = {
  id: string;
  email: string;
  companyName: string;
  businessRegistrationNumber: string;
  privacyAgreedAt: string;
  createdAt: string;
};

export type AuthResponse = {
  token: string;
  supplier: Supplier;
};

export type QuoteRequest = {
  id: string;
  requestNumber: string;
  title: string;
  description: string;
  status: "pending" | "received" | "completed";
  dueDate: string;
  buyerName: string;
  createdAt: string;
};

export type RegisterPayload = {
  email: string;
  password: string;
  companyName: string;
  businessRegistrationNumber: string;
  privacyAgreed: boolean;
};

export type LoginPayload = {
  email: string;
  password: string;
};
