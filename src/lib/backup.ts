import { supabase } from './supabase';

export const BACKUP_APP_ID = 'fateh-sales';
export const BACKUP_VERSION = 1;

export type BackupData = {
  settings: Record<string, unknown>[];
  categories: Record<string, unknown>[];
  products: Record<string, unknown>[];
  customers: Record<string, unknown>[];
  invoices: Record<string, unknown>[];
  invoice_items: Record<string, unknown>[];
  payments: Record<string, unknown>[];
  inventory_movements: Record<string, unknown>[];
};

export type BackupFile = {
  version: number;
  exported_at: string;
  app: string;
  counts: Record<string, number>;
  data: BackupData;
};

const TABLES = [
  'settings',
  'categories',
  'products',
  'customers',
  'invoices',
  'invoice_items',
  'payments',
  'inventory_movements',
] as const;

async function fetchAllRows(table: (typeof TABLES)[number]): Promise<Record<string, unknown>[]> {
  const { data, error } = await supabase.from(table).select('*');
  if (error) throw error;
  return (data ?? []) as Record<string, unknown>[];
}

export async function createBackup(): Promise<BackupFile> {
  const [
    settings,
    categories,
    products,
    customers,
    invoices,
    invoice_items,
    payments,
    inventory_movements,
  ] = await Promise.all(TABLES.map((t) => fetchAllRows(t)));

  const data: BackupData = {
    settings,
    categories,
    products,
    customers,
    invoices,
    invoice_items,
    payments,
    inventory_movements,
  };

  const counts = Object.fromEntries(
    TABLES.map((t) => [t, data[t].length])
  ) as Record<string, number>;

  return {
    version: BACKUP_VERSION,
    exported_at: new Date().toISOString(),
    app: BACKUP_APP_ID,
    counts,
    data,
  };
}

export function downloadBackupFile(backup: BackupFile): void {
  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const stamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
  const link = document.createElement('a');
  link.href = url;
  link.download = `نسخة-احتياطية-${stamp}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function parseBackupFile(text: string): BackupFile {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('الملف ليس بصيغة JSON صالحة');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('ملف النسخة الاحتياطية غير صالح');
  }

  const file = parsed as BackupFile;

  if (file.app !== BACKUP_APP_ID) {
    throw new Error('هذا الملف ليس نسخة احتياطية من نظام الفاتح للمبيعات');
  }

  if (file.version !== BACKUP_VERSION) {
    throw new Error(`إصدار النسخة (${file.version}) غير مدعوم`);
  }

  if (!file.data || typeof file.data !== 'object') {
    throw new Error('بيانات النسخة الاحتياطية ناقصة');
  }

  for (const table of TABLES) {
    if (!Array.isArray(file.data[table])) {
      throw new Error(`بيانات الجدول ${table} غير صالحة`);
    }
  }

  return file;
}

const ZERO_UUID = '00000000-0000-0000-0000-000000000000';

async function deleteAllRows(table: Exclude<(typeof TABLES)[number], 'settings'>): Promise<void> {
  const { error } = await supabase.from(table).delete().neq('id', ZERO_UUID);
  if (error) throw error;
}

async function upsertRows(
  table: (typeof TABLES)[number],
  rows: Record<string, unknown>[]
): Promise<void> {
  if (rows.length === 0) return;

  const onConflict = table === 'settings' ? 'key' : 'id';
  const chunkSize = 150;

  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabase.from(table).upsert(chunk, { onConflict });
    if (error) throw error;
  }
}

export type RestoreMode = 'merge' | 'replace';

export async function restoreBackup(
  file: BackupFile,
  mode: RestoreMode
): Promise<Record<string, number>> {
  if (mode === 'replace') {
    await deleteAllRows('invoice_items');
    await deleteAllRows('payments');
    await deleteAllRows('inventory_movements');
    await deleteAllRows('invoices');
    await deleteAllRows('products');
    await deleteAllRows('customers');
    await deleteAllRows('categories');
  }

  await upsertRows('settings', file.data.settings);
  await upsertRows('categories', file.data.categories);
  await upsertRows('products', file.data.products);
  await upsertRows('customers', file.data.customers);
  await upsertRows('invoices', file.data.invoices);
  await upsertRows('invoice_items', file.data.invoice_items);
  await upsertRows('payments', file.data.payments);
  await upsertRows('inventory_movements', file.data.inventory_movements);

  return Object.fromEntries(
    TABLES.map((t) => [t, file.data[t].length])
  ) as Record<string, number>;
}

export function formatBackupSummary(counts: Record<string, number>): string {
  const labels: Record<string, string> = {
    settings: 'إعدادات',
    categories: 'فئات',
    products: 'منتجات',
    customers: 'عملاء',
    invoices: 'فواتير',
    invoice_items: 'بنود فواتير',
    payments: 'مدفوعات',
    inventory_movements: 'حركات مخزون',
  };

  return TABLES.map((t) => `${labels[t] ?? t}: ${counts[t] ?? 0}`).join(' · ');
}
