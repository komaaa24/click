-- Core payments table
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  amount NUMERIC(14,2) NOT NULL,
  click_merchant_trans_id VARCHAR(128) NOT NULL,
  click_payment_id BIGINT,
  status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS payments_click_merchant_trans_id_uq
  ON payments (click_merchant_trans_id);

CREATE INDEX IF NOT EXISTS payments_user_id_idx
  ON payments (user_id);

CREATE INDEX IF NOT EXISTS payments_status_idx
  ON payments (status);

-- updated_at maintenance trigger
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS payments_set_updated_at ON payments;
CREATE TRIGGER payments_set_updated_at
BEFORE UPDATE ON payments
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

