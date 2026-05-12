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
	privacy_agreed_at TIMESTAMPTZ NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
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
