package models

import "time"

type Supplier struct {
	ID                         string    `json:"id"`
	Email                      string    `json:"email"`
	PasswordHash               string    `json:"-"`
	CompanyName                string    `json:"companyName"`
	BusinessRegistrationNumber string    `json:"businessRegistrationNumber"`
	HeadOfficePhone            string    `json:"headOfficePhone"`
	BankName                   string    `json:"bankName"`
	AccountHolder              string    `json:"accountHolder"`
	AccountNumber              string    `json:"accountNumber"`
	ContactName                string    `json:"contactName"`
	Position                   string    `json:"position"`
	Department                 string    `json:"department"`
	MobilePhone                string    `json:"mobilePhone"`
	DirectPhone                string    `json:"directPhone"`
	EmailNotificationEnabled   bool      `json:"emailNotificationEnabled"`
	PrivacyAgreedAt            time.Time `json:"privacyAgreedAt"`
	CreatedAt                  time.Time `json:"createdAt"`
}

type RegisterRequest struct {
	Email                      string `json:"email"`
	Password                   string `json:"password"`
	CompanyName                string `json:"companyName"`
	BusinessRegistrationNumber string `json:"businessRegistrationNumber"`
	PrivacyAgreed              bool   `json:"privacyAgreed"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type AuthResponse struct {
	Token    string   `json:"token"`
	Supplier Supplier `json:"supplier"`
}

type SupplierDocument struct {
	ID               string    `json:"id"`
	SupplierID       string    `json:"supplierId"`
	DocumentType     string    `json:"documentType"`
	OriginalFilename string    `json:"originalFilename"`
	StoredPath       string    `json:"storedPath"`
	ContentType      string    `json:"contentType"`
	SizeBytes        int64     `json:"sizeBytes"`
	CreatedAt        time.Time `json:"createdAt"`
}

type SupplierRegisterResponse struct {
	Token     string             `json:"token"`
	Supplier  Supplier           `json:"supplier"`
	Documents []SupplierDocument `json:"documents"`
}
