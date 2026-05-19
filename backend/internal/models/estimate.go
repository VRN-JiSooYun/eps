package models

import "time"

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
	RequestID      *int     `json:"requestId"`
	ProductName    string   `json:"productName"`
	SupplierID     *int     `json:"supplierId"`
	CatalogNo      *string  `json:"catalogNo"`
	UnitCost       *float64 `json:"unitCost"`
	UnitValue      *float64 `json:"unitValue"`
	Unit           *int     `json:"unit"`
	Count          *int     `json:"count"`
	DeliveryPeriod *string  `json:"deliveryPeriod"`
	TotalCost      *float64 `json:"totalCost"`
	DocumentPath   *string  `json:"documentPath"`
	Discard        *bool    `json:"discard"`
}
