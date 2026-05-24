export type AppThemeId = 'blue' | 'dark' | 'emerald' | 'sunset';

export const APP_THEME_STORAGE_KEY = 'app-theme';
const LEGACY_POS_KEY = 'pos-theme';

export const APP_THEMES: {
  id: AppThemeId;
  label: string;
  description: string;
  swatch: string;
  primaryColor: string;
}[] = [
  {
    id: 'blue',
    label: 'أزرق كلاسيكي',
    description: 'المظهر الافتراضي للنظام',
    swatch: '#2563eb',
    primaryColor: '#2563eb',
  },
  {
    id: 'dark',
    label: 'داكن',
    description: 'مريح للعين في الإضاءة المنخفضة',
    swatch: '#374151',
    primaryColor: '#60a5fa',
  },
  {
    id: 'emerald',
    label: 'أخضر',
    description: 'ألوان هادئة ومنعشة',
    swatch: '#059669',
    primaryColor: '#059669',
  },
  {
    id: 'sunset',
    label: 'غروب',
    description: 'دافئ برتقالي وبرتقالي محمر',
    swatch: '#ea580c',
    primaryColor: '#ea580c',
  },
];

export function isAppThemeId(value: string | null | undefined): value is AppThemeId {
  return !!value && APP_THEMES.some((t) => t.id === value);
}

export function loadAppTheme(): AppThemeId {
  try {
    const saved = localStorage.getItem(APP_THEME_STORAGE_KEY) as AppThemeId | null;
    if (isAppThemeId(saved)) return saved;
    const legacy = localStorage.getItem(LEGACY_POS_KEY) as AppThemeId | null;
    if (isAppThemeId(legacy)) return legacy;
  } catch {
    /* ignore */
  }
  return 'blue';
}

export function saveAppTheme(id: AppThemeId): void {
  try {
    localStorage.setItem(APP_THEME_STORAGE_KEY, id);
  } catch {
    /* ignore */
  }
}

export function applyAppTheme(id: AppThemeId): void {
  document.documentElement.dataset.appTheme = id;
  saveAppTheme(id);
}

export function getThemePrimaryColor(id: AppThemeId): string {
  return APP_THEMES.find((t) => t.id === id)?.primaryColor ?? '#2563eb';
}
