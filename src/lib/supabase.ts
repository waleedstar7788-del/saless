import { createClient } from '@supabase/supabase-js';
import type { UserPermissions } from './permissions';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role: 'manager' | 'employee';
  status: 'pending' | 'approved' | 'rejected';
  permissions?: UserPermissions | null;
  created_at: string;
  updated_at: string;
};

export type Category = {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  is_active: boolean;
};

export const PRODUCT_UNITS = [
  { value: 'قطعة', label: 'قطعة' },
  { value: 'كغ', label: 'كيلوغرام (كغ)' },
  { value: 'غ', label: 'غرام (غ)' },
  { value: 'لتر', label: 'لتر' },
  { value: 'مل', label: 'ملليلتر (مل)' },
  { value: 'علبة', label: 'علبة' },
  { value: 'كرتون', label: 'كرتون' },
  { value: 'باكت', label: 'باكت' },
  { value: 'متر', label: 'متر' },
  { value: 'دزينة', label: 'دزينة' },
] as const;

export type ProductUnit = (typeof PRODUCT_UNITS)[number]['value'];

/** Storage units that are stocked in bulk but sold by piece (قطعة) */
export const BULK_STORAGE_UNITS = ['كرتون', 'باكت', 'علبة', 'دزينة'] as const;

export const SELL_UNIT = 'قطعة';

export function usesPiecesPerUnit(unit: string): boolean {
  return (BULK_STORAGE_UNITS as readonly string[]).includes(unit);
}

export function getPiecesPerUnit(product: Pick<Product, 'unit' | 'pieces_per_unit'>): number {
  if (!usesPiecesPerUnit(product.unit)) return 1;
  return Math.max(1, product.pieces_per_unit ?? 1);
}

/** quantity in DB is always in sellable pieces */
export function unitsToPieces(units: number, piecesPerUnit: number): number {
  return Math.round(units * piecesPerUnit);
}

export function piecesToUnits(pieces: number, piecesPerUnit: number): number {
  const ppu = Math.max(1, piecesPerUnit);
  return Math.floor(pieces / ppu);
}

export function formatStockDisplay(product: Pick<Product, 'quantity' | 'unit' | 'pieces_per_unit'>): string {
  const pieces = product.quantity;
  const ppu = getPiecesPerUnit(product);

  if (!usesPiecesPerUnit(product.unit)) {
    return formatQuantityWithUnit(pieces, product.unit);
  }

  const wholeUnits = piecesToUnits(pieces, ppu);
  const remainder = pieces % ppu;
  let text = `${wholeUnits} ${product.unit}`;
  if (remainder > 0) {
    text += ` و ${remainder} ${SELL_UNIT}`;
  }
  return `${text} (${pieces} ${SELL_UNIT})`;
}

/**
 * Total money spent on current stock for one product.
 * purchase_price = what you paid per unit (piece, carton, kg, …)
 * quantity = amount in stock (pieces in DB for cartons)
 */
export function getProductInventoryCost(
  product: Pick<Product, 'purchase_price' | 'quantity' | 'unit' | 'pieces_per_unit'>
): number {
  if (usesPiecesPerUnit(product.unit)) {
    const ppu = getPiecesPerUnit(product);
    return Math.round((product.purchase_price / ppu) * product.quantity);
  }
  return product.purchase_price * product.quantity;
}

export function getTotalInventoryCost(
  products: Pick<Product, 'purchase_price' | 'quantity' | 'unit' | 'pieces_per_unit'>[]
): number {
  return products.reduce((sum, p) => sum + getProductInventoryCost(p), 0);
}

/** Revenue if all stock sold at selling_price (per piece) */
export function getProductInventorySaleValue(
  product: Pick<Product, 'selling_price' | 'quantity'>
): number {
  return product.selling_price * product.quantity;
}

export function getTotalInventorySaleValue(
  products: Pick<Product, 'selling_price' | 'quantity'>[]
): number {
  return products.reduce((sum, p) => sum + getProductInventorySaleValue(p), 0);
}

export type Product = {
  id: string;
  barcode: string;
  name: string;
  description: string;
  category_id: string | null;
  unit: string;
  pieces_per_unit: number;
  purchase_price: number;
  selling_price: number;
  quantity: number;
  low_stock_threshold: number;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  category?: Category;
};

export type Customer = {
  id: string;
  name: string;
  phone: string | null;
  whatsapp: string | null;
  address: string;
  debt_balance: number;
  notes: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
};

export type Invoice = {
  id: string;
  invoice_number: string;
  customer_id: string | null;
  subtotal: number;
  discount: number;
  total: number;
  paid_amount: number;
  remaining_amount: number;
  payment_type: 'cash' | 'debt' | 'partial';
  status: 'completed' | 'cancelled' | 'pending';
  notes: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  customer?: Customer;
  items?: InvoiceItem[];
};

export type InvoiceItem = {
  id: string;
  invoice_id: string;
  product_id: string | null;
  product_name: string;
  barcode: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
};

export type Payment = {
  id: string;
  invoice_id: string | null;
  customer_id: string | null;
  amount: number;
  payment_method: 'cash' | 'card' | 'transfer';
  payment_type: 'full' | 'partial' | 'debt_payment';
  notes: string;
  receipt_number: string | null;
  created_at: string;
  created_by: string;
  customer?: Customer;
  invoice?: Invoice;
};

export type InventoryMovement = {
  id: string;
  product_id: string | null;
  movement_type: 'in' | 'out' | 'adjustment' | 'sale' | 'return';
  quantity: number;
  previous_quantity: number;
  new_quantity: number;
  reference_type: string | null;
  reference_id: string | null;
  notes: string;
  created_at: string;
  created_by: string;
  product?: Product;
};

export type Settings = {
  id: string;
  key: string;
  value: string;
  created_at: string;
  updated_at: string;
};

export type AppSettings = {
  company_name: string;
  company_logo: string;
  company_address: string;
  company_phone: string;
  invoice_prefix: string;
  currency_name: string;
  primary_color: string;
  thermal_printer_width: string;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ar-IQ').format(amount) + ' د.ع';
};

export const formatQuantityWithUnit = (quantity: number, unit: string = SELL_UNIT): string => {
  return `${quantity} ${unit}`;
};

/** Prefer dedicated WhatsApp number, fall back to phone */
export function getCustomerWhatsApp(customer: {
  whatsapp?: string | null;
  phone?: string | null;
}): string | null {
  const wa = customer.whatsapp?.trim();
  if (wa) return wa;
  const phone = customer.phone?.trim();
  return phone || null;
}

export function getSupabaseErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: string }).message);
  }
  return 'حدث خطأ غير متوقع';
}

export function isMissingColumnError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('column') ||
    lower.includes('schema cache') ||
    lower.includes('pieces_per_unit') ||
    lower.includes('unit')
  );
}

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('ar-IQ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const formatDateShort = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('ar-IQ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
};
