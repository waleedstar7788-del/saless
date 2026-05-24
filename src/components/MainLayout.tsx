import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useViewport } from '../hooks/useViewport';
import { supabase } from '../lib/supabase';
import MobileBottomNav from './MobileBottomNav';
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
  const { isMobile, isTablet } = useViewport();
  const navigate = useNavigate();

  useEffect(() => {
    if (isManager) {
      fetchPendingCount();
      const interval = setInterval(fetchPendingCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isManager]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [sidebarOpen]);

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

  const headerTitle = isMobile
    ? 'الفاتح'
    : isTablet
      ? 'نظام الفاتح'
      : 'نظام الفاتح للمبيعات والمخزون';

  return (
    <div className="min-h-screen min-h-[100dvh] bg-gray-50 flex">
      {/* Sidebar — tablet & desktop */}
      <aside
        className={`app-sidebar fixed inset-y-0 right-0 z-50 bg-white border-l border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : 'translate-x-full'
        } lg:static lg:transform-none w-[min(85vw,16rem)] md:w-56 lg:w-64`}
      >
        <div className="flex flex-col h-full max-h-[100dvh]">
          <div className="flex items-center justify-between h-14 sm:h-16 px-3 sm:px-4 border-b border-gray-200 shrink-0">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-600 rounded-xl flex items-center justify-center shrink-0">
                <Store className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="sidebar-brand-title font-bold text-gray-900 text-sm sm:text-base truncate">
                  نظام الفاتح
                </h1>
                <p className="text-[10px] sm:text-xs text-gray-500 hidden xs:block">إدارة متكاملة</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg touch-manipulation"
              aria-label="إغلاق القائمة"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 p-2 sm:p-4 space-y-0.5 overflow-y-auto overscroll-contain">
            {navItems
              .filter((item) => can(item.permission))
              .map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `sidebar-link text-sm sm:text-base ${isActive ? 'active' : ''}`
                  }
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              ))}
            {can('users') && (
              <NavLink
                to="/users"
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `sidebar-link text-sm sm:text-base ${isActive ? 'active' : ''} relative`
                }
              >
                <UserCheck className="w-5 h-5 shrink-0" />
                <span className="truncate">إدارة المستخدمين</span>
                {isManager && pendingUsersCount > 0 && (
                  <span className="mr-auto bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[1.25rem] h-5 px-1 flex items-center justify-center">
                    {pendingUsersCount}
                  </span>
                )}
              </NavLink>
            )}
          </nav>

          <div className="p-3 sm:p-4 border-t border-gray-200 shrink-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-200 rounded-full flex items-center justify-center shrink-0">
                <span className="text-gray-600 font-medium text-sm">
                  {profile?.full_name?.charAt(0) || 'م'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate text-sm sm:text-base">
                  {profile?.full_name || 'مستخدم'}
                </p>
                <p className="text-[10px] sm:text-xs text-gray-500">
                  {profile?.role === 'manager' ? 'مدير' : 'موظف'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      <div className="flex-1 flex flex-col min-w-0 w-full">
        <header className="h-14 sm:h-16 bg-white border-b border-gray-200 flex items-center px-3 sm:px-4 gap-2 sm:gap-4 sticky top-0 z-30 shrink-0">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg touch-manipulation"
            aria-label="فتح القائمة"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex-1 min-w-0">
            <h2 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 truncate">
              {headerTitle}
            </h2>
          </div>

          <button
            type="button"
            className="p-2 hover:bg-gray-100 rounded-lg relative touch-manipulation"
            onClick={() => {
              if (can('users') && pendingUsersCount > 0) navigate('/users');
            }}
            aria-label="الإشعارات"
          >
            <Bell className="w-5 h-5 text-gray-600" />
            {pendingUsersCount > 0 && (
              <span className="absolute top-0.5 left-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[1.1rem] h-[1.1rem] flex items-center justify-center px-0.5">
                {pendingUsersCount > 9 ? '9+' : pendingUsersCount}
              </span>
            )}
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-1 sm:gap-2 p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg touch-manipulation"
            >
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-700 font-medium text-sm">
                  {profile?.full_name?.charAt(0) || 'م'}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-600 hidden sm:block" />
            </button>

            {userMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setUserMenuOpen(false)}
                  aria-hidden
                />
                <div className="absolute left-0 mt-2 w-52 sm:w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 animate-fade-in max-w-[calc(100vw-1rem)]">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="font-medium text-gray-900 truncate">{profile?.full_name}</p>
                    <p className="text-xs sm:text-sm text-gray-500 truncate" dir="ltr">
                      {profile?.email}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 text-sm sm:text-base"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>تسجيل الخروج</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        <main className="flex-1 p-3 sm:p-4 md:p-5 lg:p-6 overflow-y-auto overflow-x-hidden main-with-bottom-nav">
          <div className="max-w-app mx-auto w-full min-h-0">
            <Outlet />
          </div>
        </main>
      </div>

      <MobileBottomNav onOpenMenu={() => setSidebarOpen(true)} />
    </div>
  );
}
