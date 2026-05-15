package db

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

const schema = `
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS suppliers (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	email TEXT NOT NULL UNIQUE,
	password_hash TEXT NOT NULL,
	company_name TEXT NOT NULL,
	business_registration_number TEXT NOT NULL,
	head_office_phone TEXT NOT NULL DEFAULT '',
	bank_name TEXT NOT NULL DEFAULT '',
	account_holder TEXT NOT NULL DEFAULT '',
	account_number TEXT NOT NULL DEFAULT '',
	contact_name TEXT NOT NULL DEFAULT '',
	position TEXT NOT NULL DEFAULT '',
	department TEXT NOT NULL DEFAULT '',
	mobile_phone TEXT NOT NULL DEFAULT '',
	direct_phone TEXT NOT NULL DEFAULT '',
	email_notification_enabled BOOLEAN NOT NULL DEFAULT false,
	privacy_agreed_at TIMESTAMPTZ NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS head_office_phone TEXT NOT NULL DEFAULT '';
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS bank_name TEXT NOT NULL DEFAULT '';
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS account_holder TEXT NOT NULL DEFAULT '';
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS account_number TEXT NOT NULL DEFAULT '';
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS contact_name TEXT NOT NULL DEFAULT '';
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS position TEXT NOT NULL DEFAULT '';
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS department TEXT NOT NULL DEFAULT '';
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS mobile_phone TEXT NOT NULL DEFAULT '';
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS direct_phone TEXT NOT NULL DEFAULT '';
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS email_notification_enabled BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS supplier_documents (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
	document_type TEXT NOT NULL CHECK (document_type IN ('business_registration', 'bankbook_copy')),
	original_filename TEXT NOT NULL,
	stored_path TEXT NOT NULL,
	content_type TEXT NOT NULL,
	size_bytes BIGINT NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quote_requests (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	request_number TEXT NOT NULL UNIQUE,
	title TEXT NOT NULL,
	description TEXT NOT NULL,
	status TEXT NOT NULL CHECK (status IN ('pending', 'received', 'completed')),
	due_date DATE NOT NULL,
	buyer_name TEXT NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO quote_requests (request_number, title, description, status, due_date, buyer_name)
VALUES
	('QR-2026-0001', '연구용 시약 구매 견적 요청', '세포 배양용 시약 및 소모품 견적을 요청합니다.', 'pending', CURRENT_DATE + INTERVAL '7 days', 'Voronoi Procurement'),
	('QR-2026-0002', '실험 장비 유지보수 견적 요청', 'HPLC 장비 정기 유지보수 및 소모품 교체 견적을 요청합니다.', 'pending', CURRENT_DATE + INTERVAL '10 days', 'Voronoi Lab Ops')
ON CONFLICT (request_number) DO NOTHING;
`

func Migrate(ctx context.Context, pool *pgxpool.Pool) error {
	_, err := pool.Exec(ctx, schema)
	return err
}
