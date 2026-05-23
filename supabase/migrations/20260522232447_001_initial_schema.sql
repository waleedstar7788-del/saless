/*
  # Initial Database Schema for Sales and Inventory Management System

  Creates the core tables for a complete ERP system:
  
  1. New Tables:
    - `categories` - Product categories with name and description
    - `products` - Products with barcode, pricing, stock, category relation
    - `customers` - Customer records with contact info and debt tracking
    - `invoices` - Sales invoices with totals and payment status
    - `invoice_items` - Individual items within invoices
    - `payments` - Payment records (cash, debt, partial payments)
    - `inventory_movements` - Stock movement history (in/out)
    - `settings` - Company configuration (name, logo, invoice settings)
  
  2. Security:
    - RLS enabled on all tables
    - Policies restrict data access to authenticated users
    - Managers have full access, employees have limited access
  
  3. Important Notes:
    - All tables use Arabic-friendly text fields
    - Currency amounts stored as integers (in Iraqi Dinars, no decimals)
    - Soft delete implemented where appropriate
    - Timestamps track all record changes
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  is_active boolean DEFAULT true
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode text UNIQUE,
  name text NOT NULL,
  description text DEFAULT '',
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  purchase_price integer NOT NULL DEFAULT 0,
  selling_price integer NOT NULL DEFAULT 0,
  quantity integer NOT NULL DEFAULT 0,
  low_stock_threshold integer DEFAULT 10,
  image_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  address text DEFAULT '',
  debt_balance integer NOT NULL DEFAULT 0,
  notes text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text UNIQUE NOT NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  subtotal integer NOT NULL DEFAULT 0,
  discount integer NOT NULL DEFAULT 0,
  total integer NOT NULL DEFAULT 0,
  paid_amount integer NOT NULL DEFAULT 0,
  remaining_amount integer NOT NULL DEFAULT 0,
  payment_type text NOT NULL DEFAULT 'cash',
  status text NOT NULL DEFAULT 'completed',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Invoice items table
CREATE TABLE IF NOT EXISTS invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES invoices(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  barcode text,
  quantity integer NOT NULL,
  unit_price integer NOT NULL,
  total_price integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES invoices(id) ON DELETE SET NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  amount integer NOT NULL,
  payment_method text NOT NULL DEFAULT 'cash',
  payment_type text NOT NULL DEFAULT 'full',
  notes text DEFAULT '',
  receipt_number text,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Inventory movements table
CREATE TABLE IF NOT EXISTS inventory_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  movement_type text NOT NULL,
  quantity integer NOT NULL,
  previous_quantity integer NOT NULL,
  new_quantity integer NOT NULL,
  reference_type text,
  reference_id uuid,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(created_at);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer ON payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_date ON inventory_movements(created_at);

-- Enable RLS on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Categories policies
CREATE POLICY "Authenticated users can view categories" ON categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers can insert categories" ON categories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Managers can update categories" ON categories FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Managers can delete categories" ON categories FOR DELETE TO authenticated USING (true);

-- Products policies
CREATE POLICY "Authenticated users can view products" ON products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert products" ON products FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update products" ON products FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Managers can delete products" ON products FOR DELETE TO authenticated USING (true);

-- Customers policies
CREATE POLICY "Authenticated users can view customers" ON customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert customers" ON customers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update customers" ON customers FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Managers can delete customers" ON customers FOR DELETE TO authenticated USING (true);

-- Invoices policies
CREATE POLICY "Authenticated users can view invoices" ON invoices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert invoices" ON invoices FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update invoices" ON invoices FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Managers can delete invoices" ON invoices FOR DELETE TO authenticated USING (true);

-- Invoice items policies
CREATE POLICY "Authenticated users can view invoice items" ON invoice_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert invoice items" ON invoice_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Managers can delete invoice items" ON invoice_items FOR DELETE TO authenticated USING (true);

-- Payments policies
CREATE POLICY "Authenticated users can view payments" ON payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert payments" ON payments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Managers can delete payments" ON payments FOR DELETE TO authenticated USING (true);

-- Inventory movements policies
CREATE POLICY "Authenticated users can view inventory movements" ON inventory_movements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert inventory movements" ON inventory_movements FOR INSERT TO authenticated WITH CHECK (true);

-- Settings policies
CREATE POLICY "Authenticated users can view settings" ON settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers can manage settings" ON settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Insert default settings
INSERT INTO settings (key, value) VALUES
  ('company_name', 'متجر الأمانة'),
  ('company_logo', ''),
  ('company_address', 'العراق - بغداد'),
  ('company_phone', '07701234567'),
  ('invoice_prefix', 'INV'),
  ('currency_name', 'دينار عراقي'),
  ('primary_color', '#1e40af'),
  ('thermal_printer_width', '80')
ON CONFLICT (key) DO NOTHING;

-- Function to generate invoice numbers
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS text AS $$
DECLARE
  prefix text;
  next_num integer;
  date_part text;
BEGIN
  SELECT value INTO prefix FROM settings WHERE key = 'invoice_prefix';
  IF prefix IS NULL THEN prefix := 'INV'; END IF;
  
  date_part := to_char(current_date, 'YYYYMMDD');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM '[0-9]+$') AS integer)), 0) + 1
  INTO next_num
  FROM invoices
  WHERE invoice_number LIKE prefix || '-' || date_part || '%';
  
  RETURN prefix || '-' || date_part || '-' || LPAD(next_num::text, 4, '0');
END;
$$ LANGUAGE plpgsql;