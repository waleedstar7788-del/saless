import React, { useRef, useState } from 'react';
import {
  createBackup,
  downloadBackupFile,
  parseBackupFile,
  restoreBackup,
  formatBackupSummary,
  type BackupFile,
  type RestoreMode,
} from '../lib/backup';
import { getSupabaseErrorMessage } from '../lib/supabase';
import {
  Database,
  Download,
  Upload,
  Loader2,
  AlertTriangle,
  FileJson,
} from 'lucide-react';

export default function BackupSection() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [exporting, setExporting] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [pendingFile, setPendingFile] = useState<BackupFile | null>(null);
  const [restoreMode, setRestoreMode] = useState<RestoreMode>('merge');

  const handleExport = async () => {
    setExporting(true);
    try {
      const backup = await createBackup();
      downloadBackupFile(backup);
      alert(
        `تم إنشاء النسخة الاحتياطية بنجاح.\n\n${formatBackupSummary(backup.counts)}`
      );
    } catch (error) {
      console.error(error);
      alert(`تعذر إنشاء النسخة: ${getSupabaseErrorMessage(error)}`);
    } finally {
      setExporting(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const backup = parseBackupFile(text);
      setPendingFile(backup);
      setRestoreMode('merge');
    } catch (error) {
      alert(getSupabaseErrorMessage(error));
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRestore = async () => {
    if (!pendingFile) return;

    const modeLabel =
      restoreMode === 'replace'
        ? 'استبدال كامل (يحذف البيانات الحالية ثم يستورد الملف)'
        : 'دمج (تحديث الموجود وإضافة الجديد)';

    const confirmed = window.confirm(
      `هل أنت متأكد من استعادة النسخة الاحتياطية؟\n\nالوضع: ${modeLabel}\n\n${formatBackupSummary(
        Object.fromEntries(
          Object.entries(pendingFile.data).map(([k, v]) => [k, (v as unknown[]).length])
        )
      )}\n\nتاريخ النسخة: ${new Date(pendingFile.exported_at).toLocaleString('ar-IQ')}`
    );

    if (!confirmed) return;

    setRestoring(true);
    try {
      const counts = await restoreBackup(pendingFile, restoreMode);
      setPendingFile(null);
      alert(`تمت الاستعادة بنجاح.\n\n${formatBackupSummary(counts)}\n\nيُفضّل تحديث الصفحة.`);
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert(`تعذر الاستعادة: ${getSupabaseErrorMessage(error)}`);
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="card p-6 border-2 border-dashed border-gray-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
          <Database className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h2 className="font-semibold text-gray-900">النسخ الاحتياطي والاستعادة</h2>
          <p className="text-sm text-gray-500">
            حفظ واسترجاع المنتجات، العملاء، الفواتير، والمخزون
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="btn-primary flex items-center justify-center gap-2 py-4"
        >
          {exporting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              جاري التصدير...
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              تحميل نسخة احتياطية
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={restoring}
          className="btn-secondary flex items-center justify-center gap-2 py-4 border-2"
        >
          <Upload className="w-5 h-5" />
          رفع ملف النسخة الاحتياطية
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3 text-sm text-amber-900">
        <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600" />
        <div>
          <p className="font-medium">ملاحظات مهمة</p>
          <ul className="mt-2 space-y-1 list-disc list-inside text-amber-800">
            <li>النسخة تشمل: الإعدادات، الفئات، المنتجات، العملاء، الفواتير، المدفوعات، والمخزون</li>
            <li>حسابات المستخدمين (تسجيل الدخول) لا تُضمَّن في النسخة</li>
            <li>احفظ الملف في مكان آمن (فلاشة، سحابة، أو جهاز آخر)</li>
          </ul>
        </div>
      </div>

      {pendingFile && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-4">
          <div className="flex items-start gap-3">
            <FileJson className="w-8 h-8 text-blue-600 shrink-0" />
            <div>
              <p className="font-semibold text-gray-900">ملف جاهز للاستعادة</p>
              <p className="text-sm text-gray-600 mt-1">
                تاريخ النسخة: {new Date(pendingFile.exported_at).toLocaleString('ar-IQ')}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {formatBackupSummary(pendingFile.counts)}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">طريقة الاستعادة:</p>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="restoreMode"
                checked={restoreMode === 'merge'}
                onChange={() => setRestoreMode('merge')}
                className="text-blue-600"
              />
              <span className="text-sm">دمج — تحديث السجلات الموجودة وإضافة الجديدة (أآمن)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="restoreMode"
                checked={restoreMode === 'replace'}
                onChange={() => setRestoreMode('replace')}
                className="text-blue-600"
              />
              <span className="text-sm text-red-700 font-medium">
                استبدال كامل — حذف كل البيانات الحالية ثم استيراد الملف
              </span>
            </label>
          </div>

          <div className="flex gap-3 flex-wrap">
            <button
              type="button"
              onClick={handleRestore}
              disabled={restoring}
              className="btn-primary flex items-center gap-2"
            >
              {restoring ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  جاري الاستعادة...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  استعادة النسخة
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setPendingFile(null)}
              disabled={restoring}
              className="btn-secondary"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
