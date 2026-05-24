export type PosThemeId = 'blue' | 'dark' | 'emerald' | 'sunset';

export const POS_THEME_STORAGE_KEY = 'pos-theme';

export const POS_THEMES: {
  id: PosThemeId;
  label: string;
  swatch: string;
}[] = [
  { id: 'blue', label: 'أزرق', swatch: '#2563eb' },
  { id: 'dark', label: 'داكن', swatch: '#374151' },
  { id: 'emerald', label: 'أخضر', swatch: '#059669' },
  { id: 'sunset', label: 'غروب', swatch: '#ea580c' },
];

export function loadPosTheme(): PosThemeId {
  try {
    const saved = localStorage.getItem(POS_THEME_STORAGE_KEY) as PosThemeId | null;
    if (saved && POS_THEMES.some((t) => t.id === saved)) return saved;
  } catch {
    /* ignore */
  }
  return 'blue';
}

export function savePosTheme(id: PosThemeId): void {
  try {
    localStorage.setItem(POS_THEME_STORAGE_KEY, id);
  } catch {
    /* ignore */
  }
}
