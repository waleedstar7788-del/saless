export const PERMISSION_KEYS = [
  'dashboard',
  'products',
  'categories',
  'customers',
  'pos',
  'invoices',
  'inventory',
  'debts',
  'reports',
  'settings',
  'users',
  'backup',
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];

export type UserPermissions = Partial<Record<PermissionKey, boolean>>;

export const PERMISSION_LABELS: Record<PermissionKey, string> = {
  dashboard: 'لوحة التحكم',
  products: 'المنتجات (عرض وإضافة وتعديل)',
  categories: 'الفئات',
  customers: 'العملاء',
  pos: 'نقطة البيع',
  invoices: 'الفواتير',
  inventory: 'المخزون',
  debts: 'الديون والمدفوعات',
  reports: 'التقارير',
  settings: 'الإعدادات',
  users: 'إدارة المستخدمين',
  backup: 'النسخ الاحتياطي والاستعادة',
};

export const PERMISSION_GROUPS: { title: string; keys: PermissionKey[] }[] = [
  { title: 'عام', keys: ['dashboard', 'reports', 'settings'] },
  { title: 'المبيعات', keys: ['pos', 'invoices', 'customers', 'debts'] },
  { title: 'المخزون', keys: ['products', 'categories', 'inventory'] },
  { title: 'الإدارة', keys: ['users', 'backup'] },
];

export const ROUTE_PERMISSIONS: Record<string, PermissionKey> = {
  '/': 'dashboard',
  '/products': 'products',
  '/categories': 'categories',
  '/customers': 'customers',
  '/pos': 'pos',
  '/invoices': 'invoices',
  '/inventory': 'inventory',
  '/debts': 'debts',
  '/reports': 'reports',
  '/settings': 'settings',
  '/users': 'users',
};

/** Default permissions for new employees until manager configures them */
export const DEFAULT_EMPLOYEE_PERMISSIONS: UserPermissions = {
  dashboard: true,
  pos: true,
};

export function getAllPermissionsTrue(): Record<PermissionKey, boolean> {
  return Object.fromEntries(PERMISSION_KEYS.map((k) => [k, true])) as Record<PermissionKey, boolean>;
}

export function getEffectivePermissions(
  role: string | undefined,
  stored: UserPermissions | null | undefined
): Record<PermissionKey, boolean> {
  if (role === 'manager') {
    return getAllPermissionsTrue();
  }

  const result = {} as Record<PermissionKey, boolean>;
  for (const key of PERMISSION_KEYS) {
    if (typeof stored?.[key] === 'boolean') {
      result[key] = stored[key]!;
    } else {
      result[key] = DEFAULT_EMPLOYEE_PERMISSIONS[key] ?? false;
    }
  }
  return result;
}

export function hasPermission(
  role: string | undefined,
  stored: UserPermissions | null | undefined,
  key: PermissionKey
): boolean {
  return getEffectivePermissions(role, stored)[key];
}

export function getFirstAllowedPath(
  role: string | undefined,
  stored: UserPermissions | null | undefined
): string {
  for (const [path, key] of Object.entries(ROUTE_PERMISSIONS)) {
    if (hasPermission(role, stored, key)) {
      return path;
    }
  }
  return '/';
}
