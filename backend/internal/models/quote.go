package models

import "time"

type QuoteRequest struct {
	ID            string    `json:"id"`
	RequestNumber string    `json:"requestNumber"`
	Title         string    `json:"title"`
	Description   string    `json:"description"`
	Status        string    `json:"status"`
	DueDate       time.Time `json:"dueDate"`
	BuyerName     string    `json:"buyerName"`
	CreatedAt     time.Time `json:"createdAt"`
}
