import React, { useEffect, useState } from 'react';
import { supabase, type AppSettings } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  APP_THEMES,
  getThemePrimaryColor,
  normalizeAppThemeId,
} from '../lib/appThemes';
import { Moon, Sun } from 'lucide-react';
import BackupSection from '../components/BackupSection';
import {
  Settings,
  Building2,
  Phone,
  MapPin,
  FileText,
  Palette,
  Save,
  Loader2,
  CheckCircle,
} from 'lucide-react';

export default function SettingsPage() {
  const { can } = useAuth();
  const { theme, setTheme } = useTheme();
  const [settings, setSettings] = useState<AppSettings>({
    company_name: '',
    company_logo: '',
    company_address: '',
    company_phone: '',
    invoice_prefix: 'INV',
    currency_name: 'دينار عراقي',
    app_theme: 'light',
    primary_color: '#2563eb',
    thermal_printer_width: '80',
    n8n_webhook_url: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*');

      if (error) throw error;

      if (data) {
        const settingsMap: { [key: string]: string } = {};
        data.forEach((item) => {
          settingsMap[item.key] = item.value;
        });

        const loadedTheme = normalizeAppThemeId(settingsMap.app_theme);

        setSettings({
          company_name: settingsMap.company_name || '',
          company_logo: settingsMap.company_logo || '',
          company_address: settingsMap.company_address || '',
          company_phone: settingsMap.company_phone || '',
          invoice_prefix: settingsMap.invoice_prefix || 'INV',
          currency_name: settingsMap.currency_name || 'دينار عراقي',
          app_theme: loadedTheme,
          primary_color: settingsMap.primary_color || getThemePrimaryColor(loadedTheme),
          thermal_printer_width: settingsMap.thermal_printer_width || '80',
          n8n_webhook_url: settingsMap.n8n_webhook_url || '',
        });
        setTheme(loadedTheme);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const updates = Object.entries(settings).map(([key, value]) => ({
        key,
        value,
        updated_at: new Date().toISOString(),
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('settings')
          .upsert(update, { onConflict: 'key' });

        if (error) throw error;
      }

      setTheme(normalizeAppThemeId(settings.app_theme));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="page-shell max-w-4xl mx-auto animate-fade-in">
      <div className="page-header">
        <div className="min-w-0">
          <h1 className="page-title">الإعدادات</h1>
          <p className="page-subtitle">إعدادات الشركة والفواتير</p>
        </div>
        {saved && (
          <div className="flex items-center gap-2 text-green-600 text-sm sm:text-base">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <span>تم الحفظ بنجاح</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-4 sm:space-y-6">
        {/* Company Info */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">معلومات الشركة</h2>
              <p className="text-sm text-gray-500">المعلومات الأساسية للشركة</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اسم الشركة
              </label>
              <input
                type="text"
                value={settings.company_name}
                onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                className="input-field"
                placeholder="اسم الشركة"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                رقم الهاتف
              </label>
              <div className="relative">
                <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={settings.company_phone}
                  onChange={(e) => setSettings({ ...settings, company_phone: e.target.value })}
                  className="input-field pr-11"
                  placeholder="07701234567"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                العنوان
              </label>
              <div className="relative">
                <MapPin className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
                <textarea
                  value={settings.company_address}
                  onChange={(e) => setSettings({ ...settings, company_address: e.target.value })}
                  className="input-field pr-11"
                  rows={2}
                  placeholder="العنوان الكامل"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                رابط الشعار
              </label>
              <input
                type="url"
                value={settings.company_logo}
                onChange={(e) => setSettings({ ...settings, company_logo: e.target.value })}
                className="input-field"
                placeholder="https://..."
                dir="ltr"
              />
              {settings.company_logo && (
                <div className="mt-2">
                  <img
                    src={settings.company_logo}
                    alt="شعار الشركة"
                    className="w-24 h-24 object-contain border border-gray-200 rounded-lg"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Invoice Settings */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">إعدادات الفواتير</h2>
              <p className="text-sm text-gray-500">تخصيص الفواتير والطباعة</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                بادئة رقم الفاتورة
              </label>
              <input
                type="text"
                value={settings.invoice_prefix}
                onChange={(e) => setSettings({ ...settings, invoice_prefix: e.target.value })}
                className="input-field"
                placeholder="INV"
                dir="ltr"
              />
              <p className="text-xs text-gray-500 mt-1">
                مثال: INV-20250522-0001
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اسم العملة
              </label>
              <input
                type="text"
                value={settings.currency_name}
                onChange={(e) => setSettings({ ...settings, currency_name: e.target.value })}
                className="input-field"
                placeholder="دينار عراقي"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                عرض الطابعة الحرارية (مم)
              </label>
              <select
                value={settings.thermal_printer_width}
                onChange={(e) => setSettings({ ...settings, thermal_printer_width: e.target.value })}
                className="input-field"
              >
                <option value="58">58 مم</option>
                <option value="80">80 مم</option>
                <option value="110">110 مم</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                رابط n8n Webhook (لإرسال الوصل عبر واتساب)
              </label>
              <input
                type="url"
                value={settings.n8n_webhook_url}
                onChange={(e) => setSettings({ ...settings, n8n_webhook_url: e.target.value })}
                className="input-field"
                placeholder="https://n8n.yourdomain.com/webhook/..."
                dir="ltr"
              />
              <p className="text-xs text-gray-500 mt-1">
                سيتم إرسال بيانات الفاتورة إلى هذا الرابط لإرسال الوصل عبر واتساب تلقائياً
              </p>
            </div>
          </div>
        </div>

        {/* نهاري / ليلي — كامل الموقع */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <Palette className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">المظهر</h2>
              <p className="text-sm text-gray-500">نهاري أو ليلي لكل النظام</p>
            </div>
          </div>

          <div className="theme-mode-toggle" role="group" aria-label="وضع العرض">
            {APP_THEMES.map((t) => {
              const active = normalizeAppThemeId(settings.app_theme || theme) === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setSettings({
                      ...settings,
                      app_theme: t.id,
                      primary_color: getThemePrimaryColor(t.id),
                    });
                    setTheme(t.id);
                  }}
                  className={`theme-mode-btn flex items-center justify-center gap-2 ${active ? 'active' : ''}`}
                >
                  {t.id === 'light' ? (
                    <Sun className="w-5 h-5 shrink-0" />
                  ) : (
                    <Moon className="w-5 h-5 shrink-0" />
                  )}
                  {t.label}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-gray-500 mt-3">
            الوضع الحالي: <strong>{theme === 'dark' ? 'ليلي' : 'نهاري'}</strong> — احفظ الإعدادات لتثبيته.
          </p>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary px-8 py-3 flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                حفظ الإعدادات
              </>
            )}
          </button>
        </div>
      </form>

      {can('backup_manage') && <BackupSection />}
    </div>
  );
}
