import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import {
  applyAppTheme,
  isAppThemeId,
  loadAppTheme,
  type AppThemeId,
} from '../lib/appThemes';

type ThemeContextValue = {
  theme: AppThemeId;
  setTheme: (id: AppThemeId) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<AppThemeId>(() => loadAppTheme());

  const setTheme = useCallback((id: AppThemeId) => {
    setThemeState(id);
    applyAppTheme(id);
  }, []);

  useEffect(() => {
    applyAppTheme(theme);
  }, [theme]);

  useEffect(() => {
    const loadFromSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'app_theme')
          .maybeSingle();

        if (!error && data?.value && isAppThemeId(data.value)) {
          setThemeState(data.value);
          applyAppTheme(data.value);
        }
      } catch {
        /* ignore */
      }
    };

    loadFromSettings();
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}
