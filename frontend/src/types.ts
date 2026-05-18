export type Supplier = {
  id: string;
  email: string;
  companyName: string;
  businessRegistrationNumber: string;
  headOfficePhone?: string;
  bankName?: string;
  accountHolder?: string;
  accountNumber?: string;
  contactName?: string;
  position?: string;
  department?: string;
  mobilePhone?: string;
  directPhone?: string;
  emailNotificationEnabled?: boolean;
  privacyAgreedAt: string;
  createdAt: string;
};

export type AuthResponse = {
  token: string;
  supplier: Supplier;
};

export type EstimateRequest = {
  id: number;
  bid: boolean;
  dateCreated: string;
  dateDiscard: string | null;
  productName: string;
  casNo: string;
  supplierId: number | null;
  catalogNo: string;
  unitValue: number;
  unitId: number | null;
  unit: string | number | null;
  count: number;
  status: string | null;
  purchaseRequest: number | null;
  note: string;
  discard: boolean;
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

export type SupplierInfoValues = {
  companyName: string;
  businessRegistrationNumber: string;
  headOfficePhone: string;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  password: string;
  passwordConfirm: string;
};

export type ContactInfoValues = {
  contactName: string;
  position: string;
  department: string;
  mobilePhone: string;
  directPhone: string;
  email: string;
  emailNotificationEnabled: boolean;
};

export type SupplierRegisterFiles = {
  businessRegistrationFile: File | null;
  bankbookFile: File | null;
};

export type SupplierRegisterPayload = {
  supplier: SupplierInfoValues;
  contact: ContactInfoValues;
  files: SupplierRegisterFiles;
  privacyAgreed: boolean;
};

export type SupplierDocument = {
  id: string;
  supplierId: string;
  documentType: string;
  originalFilename: string;
  storedPath: string;
  contentType: string;
  sizeBytes: number;
  createdAt: string;
};

export type SupplierRegisterResponse = {
  token: string;
  supplier: Supplier;
  documents: SupplierDocument[];
};
