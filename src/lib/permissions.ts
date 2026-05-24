export const PERMISSION_KEYS = [
  'dashboard',

  'products_view',
  'products_create',
  'products_edit',
  'products_delete',

  'categories_view',
  'categories_create',
  'categories_edit',
  'categories_delete',

  'customers_view',
  'customers_create',
  'customers_edit',
  'customers_delete',

  'pos_use',
  'pos_discount',

  'invoices_view',
  'invoices_print',
  'invoices_cancel',

  'inventory_view',
  'inventory_in',
  'inventory_out',
  'inventory_adjust',

  'debts_view',
  'debts_collect',

  'reports_view',

  'settings_view',
  'settings_edit',

  'users_view',
  'users_approve',
  'users_roles',
  'users_permissions',

  'backup_manage',
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];

export type UserPermissions = Partial<Record<PermissionKey, boolean>>;

/** Old keys from previous version — mapped to new granular keys */
const LEGACY_PERMISSION_MAP: Record<string, PermissionKey[]> = {
  products: ['products_view', 'products_create', 'products_edit', 'products_delete'],
  categories: ['categories_view', 'categories_create', 'categories_edit', 'categories_delete'],
  customers: ['customers_view', 'customers_create', 'customers_edit', 'customers_delete'],
  pos: ['pos_use', 'pos_discount'],
  invoices: ['invoices_view', 'invoices_print', 'invoices_cancel'],
  inventory: ['inventory_view', 'inventory_in', 'inventory_out', 'inventory_adjust'],
  debts: ['debts_view', 'debts_collect'],
  reports: ['reports_view'],
  settings: ['settings_view', 'settings_edit'],
  users: ['users_view', 'users_approve', 'users_roles', 'users_permissions'],
  backup: ['backup_manage'],
};

export const PERMISSION_LABELS: Record<PermissionKey, string> = {
  dashboard: 'لوحة التحكم — عرض',

  products_view: 'المنتجات — عرض',
  products_create: 'المنتجات — إضافة',
  products_edit: 'المنتجات — تعديل',
  products_delete: 'المنتجات — حذف',

  categories_view: 'الفئات — عرض',
  categories_create: 'الفئات — إضافة',
  categories_edit: 'الفئات — تعديل',
  categories_delete: 'الفئات — حذف',

  customers_view: 'العملاء — عرض',
  customers_create: 'العملاء — إضافة',
  customers_edit: 'العملاء — تعديل',
  customers_delete: 'العملاء — حذف',

  pos_use: 'نقطة البيع — البيع',
  pos_discount: 'نقطة البيع — خصم',

  invoices_view: 'الفواتير — عرض',
  invoices_print: 'الفواتير — طباعة',
  invoices_cancel: 'الفواتير — إلغاء',

  inventory_view: 'المخزون — عرض',
  inventory_in: 'المخزون — إدخال',
  inventory_out: 'المخزون — صرف',
  inventory_adjust: 'المخزون — تعديل كمية',

  debts_view: 'الديون — عرض',
  debts_collect: 'الديون — تحصيل',

  reports_view: 'التقارير — عرض',

  settings_view: 'الإعدادات — عرض',
  settings_edit: 'الإعدادات — تعديل',

  users_view: 'المستخدمين — عرض',
  users_approve: 'المستخدمين — قبول/رفض',
  users_roles: 'المستخدمين — تغيير الدور',
  users_permissions: 'المستخدمين — تعديل الصلاحيات',

  backup_manage: 'النسخ الاحتياطي — إدارة',
};

export const PERMISSION_GROUPS: { title: string; keys: PermissionKey[] }[] = [
  { title: 'عام', keys: ['dashboard', 'reports_view'] },
  {
    title: 'المنتجات',
    keys: ['products_view', 'products_create', 'products_edit', 'products_delete'],
  },
  {
    title: 'الفئات',
    keys: ['categories_view', 'categories_create', 'categories_edit', 'categories_delete'],
  },
  {
    title: 'العملاء',
    keys: ['customers_view', 'customers_create', 'customers_edit', 'customers_delete'],
  },
  { title: 'نقطة البيع', keys: ['pos_use', 'pos_discount'] },
  { title: 'الفواتير', keys: ['invoices_view', 'invoices_print', 'invoices_cancel'] },
  {
    title: 'المخزون',
    keys: ['inventory_view', 'inventory_in', 'inventory_out', 'inventory_adjust'],
  },
  { title: 'الديون', keys: ['debts_view', 'debts_collect'] },
  { title: 'الإعدادات', keys: ['settings_view', 'settings_edit'] },
  {
    title: 'إدارة النظام',
    keys: ['users_view', 'users_approve', 'users_roles', 'users_permissions', 'backup_manage'],
  },
];

export const ROUTE_PERMISSIONS: Record<string, PermissionKey> = {
  '/': 'dashboard',
  '/products': 'products_view',
  '/categories': 'categories_view',
  '/customers': 'customers_view',
  '/pos': 'pos_use',
  '/invoices': 'invoices_view',
  '/inventory': 'inventory_view',
  '/debts': 'debts_view',
  '/reports': 'reports_view',
  '/settings': 'settings_view',
  '/users': 'users_view',
};

export const DEFAULT_EMPLOYEE_PERMISSIONS: UserPermissions = {
  dashboard: true,
  pos_use: true,
};

export function getAllPermissionsTrue(): Record<PermissionKey, boolean> {
  return Object.fromEntries(PERMISSION_KEYS.map((k) => [k, true])) as Record<PermissionKey, boolean>;
}

function applyLegacyPermissions(
  stored: UserPermissions | null | undefined,
  result: Record<PermissionKey, boolean>
) {
  if (!stored) return;
  for (const [legacyKey, newKeys] of Object.entries(LEGACY_PERMISSION_MAP)) {
    if (stored[legacyKey as keyof UserPermissions] === true) {
      newKeys.forEach((k) => {
        result[k] = true;
      });
    }
  }
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
  applyLegacyPermissions(stored, result);
  return result;
}

export function hasPermission(
  role: string | undefined,
  stored: UserPermissions | null | undefined,
  key: PermissionKey
): boolean {
  return getEffectivePermissions(role, stored)[key];
}

/** Any of the listed permissions */
export function hasAnyPermission(
  role: string | undefined,
  stored: UserPermissions | null | undefined,
  keys: PermissionKey[]
): boolean {
  return keys.some((k) => hasPermission(role, stored, k));
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
