import React, { useEffect, useState } from 'react';
import { supabase, formatDate, type Profile } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import PermissionsEditor from '../components/PermissionsEditor';
import {
  DEFAULT_EMPLOYEE_PERMISSIONS,
  getEffectivePermissions,
  PERMISSION_KEYS,
  type UserPermissions,
} from '../lib/permissions';
import {
  Users,
  Check,
  X,
  Mail,
  UserCheck,
  Shield,
  KeyRound,
  Save,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

function permissionsToPayload(perms: UserPermissions): UserPermissions {
  const payload: UserPermissions = {};
  PERMISSION_KEYS.forEach((key) => {
    if (perms[key] === true) payload[key] = true;
  });
  return payload;
}

export default function UsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [permissionsUserId, setPermissionsUserId] = useState<string | null>(null);
  const [permissionsDraft, setPermissionsDraft] = useState<UserPermissions>({});
  const [savingPermissions, setSavingPermissions] = useState(false);
  const { isManager, can, user: currentUser } = useAuth();

  useEffect(() => {
    if (can('users')) {
      fetchUsers();
    } else {
      setLoading(false);
    }
  }, [can]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (userId: string, status: 'approved' | 'rejected') => {
    try {
      const updates: Partial<Profile> = { status, updated_at: new Date().toISOString() };
      if (status === 'approved') {
        const user = users.find((u) => u.id === userId);
        if (user?.role === 'employee' && !user.permissions) {
          updates.permissions = DEFAULT_EMPLOYEE_PERMISSIONS;
        }
      }

      const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
      if (error) throw error;

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, ...updates } : u))
      );
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('حدث خطأ أثناء التحديث');
    }
  };

  const updateRole = async (userId: string, role: 'manager' | 'employee') => {
    try {
      const updates: Partial<Profile> = {
        role,
        updated_at: new Date().toISOString(),
      };
      if (role === 'employee') {
        const user = users.find((u) => u.id === userId);
        updates.permissions = user?.permissions || DEFAULT_EMPLOYEE_PERMISSIONS;
      }

      const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
      if (error) throw error;

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, ...updates } : u))
      );
      if (role === 'manager' && permissionsUserId === userId) {
        setPermissionsUserId(null);
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('حدث خطأ أثناء التحديث');
    }
  };

  const openPermissions = (user: Profile) => {
    const effective = getEffectivePermissions(user.role, user.permissions);
    const draft: UserPermissions = {};
    PERMISSION_KEYS.forEach((key) => {
      draft[key] = effective[key];
    });
    setPermissionsDraft(draft);
    setPermissionsUserId(user.id);
  };

  const savePermissions = async (userId: string) => {
    setSavingPermissions(true);
    try {
      const payload = permissionsToPayload(permissionsDraft);
      const { error } = await supabase
        .from('profiles')
        .update({ permissions: payload, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) throw error;

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, permissions: payload } : u))
      );
      setPermissionsUserId(null);
      alert('تم حفظ الصلاحيات بنجاح');
    } catch (error) {
      console.error('Error saving permissions:', error);
      alert('حدث خطأ أثناء حفظ الصلاحيات. تأكد من تشغيل ترحيل permissions في Supabase.');
    } finally {
      setSavingPermissions(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="badge badge-success">مقبول</span>;
      case 'rejected':
        return <span className="badge badge-danger">مرفوض</span>;
      case 'pending':
        return <span className="badge badge-warning">معلق</span>;
      default:
        return null;
    }
  };

  const filteredUsers = users.filter((user) => {
    if (filter === 'all') return true;
    return user.status === filter;
  });

  const pendingCount = users.filter((u) => u.status === 'pending').length;

  if (!can('users')) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Shield className="w-16 h-16 text-gray-300" />
        <p className="text-gray-500">لا تملك صلاحية الوصول لهذه الصفحة</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="page-shell animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إدارة المستخدمين والصلاحيات</h1>
          <p className="text-gray-500 mt-1">{users.length} مستخدم — المدير يحدد صلاحيات كل موظف</p>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 bg-amber-100 px-4 py-2 rounded-lg">
            <Users className="w-5 h-5 text-amber-600" />
            <span className="text-amber-800 font-medium">{pendingCount} طلب معلق</span>
          </div>
        )}
      </div>

      {isManager && (
        <div className="card p-4 bg-blue-50 border border-blue-200">
          <p className="text-sm text-blue-900">
            <strong>المدير</strong> لديه كل الصلاحيات تلقائياً. للموظفين: اضغط «الصلاحيات» واختر ما يظهر له في القائمة.
          </p>
        </div>
      )}

      {pendingCount > 0 && (
        <div className="card border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-3 mb-3">
            <UserCheck className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-gray-900">طلبات تسجيل جديدة</h3>
          </div>
          <button onClick={() => setFilter('pending')} className="btn-warning">
            عرض الطلبات المعلقة
          </button>
        </div>
      )}

      <div className="flex gap-2 border-b border-gray-200 pb-2 flex-wrap">
        {[
          { key: 'all', label: 'الكل' },
          { key: 'pending', label: 'معلق' },
          { key: 'approved', label: 'مقبول' },
          { key: 'rejected', label: 'مرفوض' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as typeof filter)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === tab.key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredUsers.map((user) => (
          <div key={user.id} className="card overflow-hidden">
            <div className="p-4 flex flex-wrap items-center gap-4 justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-blue-700 font-medium">
                    {user.full_name?.charAt(0) || 'م'}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-gray-900">{user.full_name || 'بدون اسم'}</p>
                  <p className="text-sm text-gray-500 flex items-center gap-1" dir="ltr">
                    <Mail className="w-3 h-3" />
                    {user.email}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {getStatusBadge(user.status)}
                {isManager ? (
                  <select
                    value={user.role}
                    onChange={(e) =>
                      updateRole(user.id, e.target.value as 'manager' | 'employee')
                    }
                    className="input-field w-28"
                    disabled={user.id === currentUser?.id}
                  >
                    <option value="employee">موظف</option>
                    <option value="manager">مدير</option>
                  </select>
                ) : (
                  <span className="badge bg-gray-100">
                    {user.role === 'manager' ? 'مدير' : 'موظف'}
                  </span>
                )}

                {user.role === 'employee' && user.status === 'approved' && isManager && (
                  <button
                    type="button"
                    onClick={() =>
                      permissionsUserId === user.id
                        ? setPermissionsUserId(null)
                        : openPermissions(user)
                    }
                    className="btn-secondary flex items-center gap-2 text-sm"
                  >
                    <KeyRound className="w-4 h-4" />
                    الصلاحيات
                    {permissionsUserId === user.id ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                )}

                {user.role === 'manager' && (
                  <span className="text-xs text-blue-600 font-medium">كل الصلاحيات</span>
                )}

                {user.id !== currentUser?.id && user.status === 'pending' && isManager && (
                  <>
                    <button
                      onClick={() => updateStatus(user.id, 'approved')}
                      className="p-2 hover:bg-green-100 rounded-lg text-green-600"
                      title="قبول"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => updateStatus(user.id, 'rejected')}
                      className="p-2 hover:bg-red-100 rounded-lg text-red-600"
                      title="رفض"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {permissionsUserId === user.id && user.role === 'employee' && (
              <div className="px-4 pb-4 border-t border-gray-100 pt-4 bg-gray-50">
                <PermissionsEditor
                  value={permissionsDraft}
                  onChange={setPermissionsDraft}
                  disabled={!isManager}
                />
                <div className="flex gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => savePermissions(user.id)}
                    disabled={savingPermissions}
                    className="btn-primary flex items-center gap-2"
                  >
                    {savingPermissions ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Save className="w-5 h-5" />
                    )}
                    حفظ الصلاحيات
                  </button>
                  <button
                    type="button"
                    onClick={() => setPermissionsUserId(null)}
                    className="btn-secondary"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {filteredUsers.length === 0 && (
          <div className="card text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">لا يوجد مستخدمين</p>
          </div>
        )}
      </div>
    </div>
  );
}
