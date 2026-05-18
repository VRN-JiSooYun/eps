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
