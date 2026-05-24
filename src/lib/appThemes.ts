export type AppThemeId = 'light' | 'dark';

export const APP_THEME_STORAGE_KEY = 'app-theme';

export const APP_THEMES: {
  id: AppThemeId;
  label: string;
}[] = [
  { id: 'light', label: 'نهاري' },
  { id: 'dark', label: 'ليلي' },
];

/** يحوّل القيم القديمة (blue, emerald, …) إلى light أو dark */
export function normalizeAppThemeId(value: string | null | undefined): AppThemeId {
  if (value === 'dark') return 'dark';
  if (value === 'light') return 'light';
  if (value === 'blue' || value === 'emerald' || value === 'sunset') return 'light';
  return 'light';
}

export function isAppThemeId(value: string | null | undefined): value is AppThemeId {
  return value === 'light' || value === 'dark';
}

export function loadAppTheme(): AppThemeId {
  try {
    const saved = localStorage.getItem(APP_THEME_STORAGE_KEY);
    if (saved) return normalizeAppThemeId(saved);
    const legacy = localStorage.getItem('pos-theme');
    if (legacy) return normalizeAppThemeId(legacy);
  } catch {
    /* ignore */
  }
  return 'light';
}

export function saveAppTheme(id: AppThemeId): void {
  try {
    localStorage.setItem(APP_THEME_STORAGE_KEY, id);
  } catch {
    /* ignore */
  }
}

export function applyAppTheme(id: AppThemeId): void {
  const theme = normalizeAppThemeId(id);
  document.documentElement.dataset.appTheme = theme;
  document.documentElement.style.colorScheme = theme === 'dark' ? 'dark' : 'light';
  saveAppTheme(theme);
}

export function getThemePrimaryColor(id: AppThemeId): string {
  return id === 'dark' ? '#60a5fa' : '#2563eb';
}
