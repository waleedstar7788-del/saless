import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { PermissionKey } from '../lib/permissions';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Users,
  ShoppingCart,
  FileText,
  Warehouse,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Store,
  Bell,
  ChevronDown,
  UserCheck,
} from 'lucide-react';

const navItems: {
  icon: typeof LayoutDashboard;
  label: string;
  path: string;
  permission: PermissionKey;
}[] = [
  { icon: LayoutDashboard, label: 'لوحة التحكم', path: '/', permission: 'dashboard' },
  { icon: Package, label: 'المنتجات', path: '/products', permission: 'products' },
  { icon: FolderTree, label: 'الفئات', path: '/categories', permission: 'categories' },
  { icon: Users, label: 'العملاء', path: '/customers', permission: 'customers' },
  { icon: ShoppingCart, label: 'نقطة البيع', path: '/pos', permission: 'pos' },
  { icon: FileText, label: 'الفواتير', path: '/invoices', permission: 'invoices' },
  { icon: Warehouse, label: 'المخزون', path: '/inventory', permission: 'inventory' },
  { icon: CreditCard, label: 'الديون والمدفوعات', path: '/debts', permission: 'debts' },
  { icon: BarChart3, label: 'التقارير', path: '/reports', permission: 'reports' },
  { icon: Settings, label: 'الإعدادات', path: '/settings', permission: 'settings' },
];

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [pendingUsersCount, setPendingUsersCount] = useState(0);
  const { profile, signOut, isManager, can } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isManager) {
      fetchPendingCount();
      const interval = setInterval(fetchPendingCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isManager]);

  const fetchPendingCount = async () => {
    try {
      const { count, error } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');
      if (!error) setPendingUsersCount(count || 0);
    } catch (err) {
      console.error('Error fetching pending users:', err);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 right-0 z-50 w-64 bg-white border-l border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : 'translate-x-full'
        } lg:static lg:transform-none`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <Store className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900">نظام الفاتح للمبيعات</h1>
                <p className="text-xs text-gray-500">إدارة متكاملة</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems
              .filter((item) => can(item.permission))
              .map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `sidebar-link ${isActive ? 'active' : ''}`
                  }
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            {can('users') && (
              <NavLink
                to="/users"
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'active' : ''} relative`
                }
              >
                <UserCheck className="w-5 h-5" />
                <span>إدارة المستخدمين</span>
                {isManager && pendingUsersCount > 0 && (
                  <span className="mr-auto bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {pendingUsersCount}
                  </span>
                )}
              </NavLink>
            )}
          </nav>

          {/* User info */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-gray-600 font-medium">
                  {profile?.full_name?.charAt(0) || 'م'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {profile?.full_name || 'مستخدم'}
                </p>
                <p className="text-xs text-gray-500">
                  {profile?.role === 'manager' ? 'مدير' : 'موظف'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 gap-4 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900">نظام الفاتح للمبيعات والمخزون</h2>
          </div>

          <button className="p-2 hover:bg-gray-100 rounded-lg relative" onClick={() => { if (can('users') && pendingUsersCount > 0) navigate('/users'); }}>
            <Bell className="w-5 h-5 text-gray-600" />
            {pendingUsersCount > 0 && (
              <span className="absolute -top-0 -left-0 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {pendingUsersCount}
              </span>
            )}
          </button>

          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg"
            >
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-700 font-medium text-sm">
                  {profile?.full_name?.charAt(0) || 'م'}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-600" />
            </button>

            {userMenuOpen && (
              <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 animate-fade-in">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="font-medium text-gray-900">{profile?.full_name}</p>
                  <p className="text-sm text-gray-500">{profile?.email}</p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-5 h-5" />
                  <span>تسجيل الخروج</span>
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
