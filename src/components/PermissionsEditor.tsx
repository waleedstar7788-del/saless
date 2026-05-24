import {
  PERMISSION_GROUPS,
  PERMISSION_KEYS,
  PERMISSION_LABELS,
  getAllPermissionsTrue,
  type PermissionKey,
  type UserPermissions,
} from '../lib/permissions';

type Props = {
  value: UserPermissions;
  onChange: (permissions: UserPermissions) => void;
  disabled?: boolean;
};

export default function PermissionsEditor({ value, onChange, disabled }: Props) {
  const setAll = (checked: boolean) => {
    const next: UserPermissions = {};
    PERMISSION_KEYS.forEach((key) => {
      next[key] = checked;
    });
    onChange(next);
  };

  const setFullAccess = () => {
    onChange(getAllPermissionsTrue());
  };

  const toggleGroup = (keys: PermissionKey[], checked: boolean) => {
    const next = { ...value };
    keys.forEach((key) => {
      next[key] = checked;
    });
    onChange(next);
  };

  const toggle = (key: PermissionKey, checked: boolean) => {
    onChange({ ...value, [key]: checked });
  };

  const isChecked = (key: PermissionKey) => value[key] === true;

  const selectedCount = PERMISSION_KEYS.filter((k) => isChecked(k)).length;
  const allSelected = selectedCount === PERMISSION_KEYS.length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-sm font-medium text-gray-800">
          {selectedCount} من {PERMISSION_KEYS.length} صلاحية
          {allSelected && (
            <span className="mr-2 text-green-600">— صلاحيات كاملة ✓</span>
          )}
        </p>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button
            type="button"
            disabled={disabled}
            onClick={setFullAccess}
            className="text-sm px-3 py-2.5 sm:py-1.5 flex-1 sm:flex-none min-h-[44px] sm:min-h-0 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
          >
            صلاحيات كاملة
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => setAll(true)}
            className="text-sm px-3 py-2.5 sm:py-1.5 flex-1 sm:flex-none min-h-[44px] sm:min-h-0 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50"
          >
            تحديد الكل
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => setAll(false)}
            className="text-sm px-3 py-2.5 sm:py-1.5 flex-1 sm:flex-none min-h-[44px] sm:min-h-0 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            إلغاء الكل
          </button>
        </div>
      </div>

      {PERMISSION_GROUPS.map((group) => {
        const groupKeys = group.keys;
        const groupAllOn = groupKeys.every((k) => isChecked(k));

        return (
          <div key={group.title} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3 gap-2">
              <h4 className="font-medium text-gray-900">{group.title}</h4>
              <button
                type="button"
                disabled={disabled}
                onClick={() => toggleGroup(groupKeys, !groupAllOn)}
                className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
              >
                {groupAllOn ? 'إلغاء المجموعة' : 'تحديد المجموعة'}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {groupKeys.map((key) => (
                <label
                  key={key}
                  className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-50 ${
                    disabled ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked(key)}
                    disabled={disabled}
                    onChange={(e) => toggle(key, e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-800">{PERMISSION_LABELS[key]}</span>
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
