/*
  # WhatsApp number for customers (separate from phone)
*/

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS whatsapp text;

COMMENT ON COLUMN customers.whatsapp IS 'WhatsApp number for messaging; can differ from phone';
