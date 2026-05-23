import {
  PERMISSION_GROUPS,
  PERMISSION_KEYS,
  PERMISSION_LABELS,
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

  const toggle = (key: PermissionKey, checked: boolean) => {
    onChange({ ...value, [key]: checked });
  };

  const isChecked = (key: PermissionKey) => value[key] === true;

  const selectedCount = PERMISSION_KEYS.filter((k) => isChecked(k)).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-gray-600">
          {selectedCount} من {PERMISSION_KEYS.length} صلاحية مفعّلة
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={disabled}
            onClick={() => setAll(true)}
            className="text-sm px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50"
          >
            تحديد الكل
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => setAll(false)}
            className="text-sm px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            إلغاء الكل
          </button>
        </div>
      </div>

      {PERMISSION_GROUPS.map((group) => (
        <div key={group.title} className="border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">{group.title}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {group.keys.map((key) => (
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
      ))}
    </div>
  );
}
