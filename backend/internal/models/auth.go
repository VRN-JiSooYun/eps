package models

import "time"

type Supplier struct {
	ID                         string    `json:"id"`
	Email                      string    `json:"email"`
	PasswordHash               string    `json:"-"`
	CompanyName                string    `json:"companyName"`
	BusinessRegistrationNumber string    `json:"businessRegistrationNumber"`
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
