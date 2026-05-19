package models

import "time"

type EstimateRequest struct {
	ID              int        `json:"id"`
	Bid             bool       `json:"bid"`
	DateCreated     time.Time  `json:"dateCreated"`
	DateDiscard     *time.Time `json:"dateDiscard,omitempty"`
	ProductName     string     `json:"productName"`
	CasNo           *string    `json:"casNo,omitempty"`
	SupplierID      *int       `json:"supplierId,omitempty"`
	CatalogNo       *string    `json:"catalogNo,omitempty"`
	UnitValue       *float64   `json:"unitValue,omitempty"`
	Unit            *int       `json:"unit,omitempty"`
	Count           *int       `json:"count,omitempty"`
	Status          string     `json:"status"`
	PurchaseRequest *int       `json:"purchaseRequest,omitempty"`
	Note            *string    `json:"note,omitempty"`
	Discard         bool       `json:"discard"`
}

type EstimateRequestPayload struct {
	Bid             *bool      `json:"bid"`
	DateDiscard     *time.Time `json:"dateDiscard"`
	ProductName     string     `json:"productName"`
	CasNo           *string    `json:"casNo"`
	SupplierID      *int       `json:"supplierId"`
	CatalogNo       *string    `json:"catalogNo"`
	UnitValue       *float64   `json:"unitValue"`
	Unit            *int       `json:"unit"`
	Count           *int       `json:"count"`
	Status          *string    `json:"status"`
	PurchaseRequest *int       `json:"purchaseRequest"`
	Note            *string    `json:"note"`
	Discard         *bool      `json:"discard"`
}

type EstimateResponsePayload struct {
	RequestID         *int     `json:"requestId"`
	ProductName       string   `json:"productName"`
	CasNo             *string  `json:"casNo"`
	SupplierID        *int     `json:"supplierId"`
	CatalogNo         *string  `json:"catalogNo"`
	UnitCost          *float64 `json:"unitCost"`
	UnitValue         *float64 `json:"unitValue"`
	Unit              *int     `json:"unit"`
	Count             *int     `json:"count"`
	DeliveryPeriod    *string  `json:"deliveryPeriod"`
	TotalCost         *float64 `json:"totalCost"`
	DocumentPath      *string  `json:"documentPath"`
	Purity            *string  `json:"purity"`
	Grade             *string  `json:"grade"`
	Note              *string  `json:"note"`
	VendorContactName *string  `json:"vendorContactName"`
	VendorMobilePhone *string  `json:"vendorMobilePhone"`
	VendorEmail       *string  `json:"vendorEmail"`
	Discard           *bool    `json:"discard"`
}
