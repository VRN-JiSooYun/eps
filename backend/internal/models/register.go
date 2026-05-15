package models

type SupplierRegistrationRequest struct {
	ID                string `json:"id"`
	CompanyName       string `json:"companyName"`
	BusinessNumber    string `json:"businessNumber"`
	CompanyNumber     string `json:"companyNumber"`
	MainBank          string `json:"mainBank"`
	BankAccountNumber string `json:"bankAccountNumber"`
	BankAccountHolder string `json:"bankAccountHolder"`
	Password          string `json:"password"`
}

type SupplierRegistrationResponse struct {
	ID          string `json:"id"`
	CompanyName string `json:"companyName"`
}
