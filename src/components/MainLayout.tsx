import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
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
  MoreHorizontal,
} from 'lucide-react';

const navItems: {
  icon: typeof LayoutDashboard;
  label: string;
  path: string;
  permission: PermissionKey;
}[] = [
  { icon: LayoutDashboard, label: 'لوحة التحكم', path: '/', permission: 'dashboard' },
  { icon: Package, label: 'المنتجات', path: '/products', permission: 'products_view' },
  { icon: FolderTree, label: 'الفئات', path: '/categories', permission: 'categories_view' },
  { icon: Users, label: 'العملاء', path: '/customers', permission: 'customers_view' },
  { icon: ShoppingCart, label: 'نقطة البيع', path: '/pos', permission: 'pos_use' },
  { icon: FileText, label: 'الفواتير', path: '/invoices', permission: 'invoices_view' },
  { icon: Warehouse, label: 'المخزون', path: '/inventory', permission: 'inventory_view' },
  { icon: CreditCard, label: 'الديون والمدفوعات', path: '/debts', permission: 'debts_view' },
  { icon: BarChart3, label: 'التقارير', path: '/reports', permission: 'reports_view' },
  { icon: Settings, label: 'الإعدادات', path: '/settings', permission: 'settings_view' },
];

const mobileQuickNav: {
  icon: typeof LayoutDashboard;
  label: string;
  path: string;
  permission: PermissionKey;
}[] = [
  { icon: LayoutDashboard, label: 'الرئيسية', path: '/', permission: 'dashboard' },
  { icon: ShoppingCart, label: 'البيع', path: '/pos', permission: 'pos_use' },
  { icon: Package, label: 'منتجات', path: '/products', permission: 'products_view' },
  { icon: Users, label: 'عملاء', path: '/customers', permission: 'customers_view' },
];

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [pendingUsersCount, setPendingUsersCount] = useState(0);
  const { profile, signOut, isManager, can } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setSidebarOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

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

  const visibleMobileNav = mobileQuickNav.filter((item) => can(item.permission));
  const isPosRoute = location.pathname === '/pos';

  return (
    <div className="min-h-[100dvh] flex overflow-x-hidden" style={{ background: 'var(--app-bg)' }}>
      {/* Sidebar — desktop & drawer on mobile */}
      <aside
        className={`app-sidebar fixed inset-y-0 right-0 z-50 border-l border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
          sidebarOpen ? 'translate-x-0' : 'translate-x-full'
        } w-[min(88vw,18rem)] sm:w-64`}
      >
        <div className="flex flex-col h-full safe-top">
          <div className="flex items-center justify-between h-14 sm:h-16 px-3 sm:px-4 border-b border-gray-200 shrink-0">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-600 rounded-xl flex items-center justify-center shrink-0">
                <Store className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="sidebar-brand-title font-bold text-gray-900 text-sm sm:text-base truncate">
                  نظام الفاتح
                </h1>
                <p className="text-[10px] sm:text-xs text-gray-500 truncate">إدارة المبيعات</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg shrink-0"
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
                  className={({ isActive }) =>
                    `sidebar-link text-sm sm:text-base ${isActive ? 'active' : ''}`
                  }
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              ))}
            {can('users_view') && (
              <NavLink
                to="/users"
                className={({ isActive }) =>
                  `sidebar-link text-sm sm:text-base ${isActive ? 'active' : ''}`
                }
              >
                <UserCheck className="w-5 h-5 shrink-0" />
                <span className="truncate">إدارة المستخدمين</span>
                {isManager && pendingUsersCount > 0 && (
                  <span className="mr-auto bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[1.25rem] h-5 px-1 flex items-center justify-center">
                    {pendingUsersCount > 9 ? '9+' : pendingUsersCount}
                  </span>
                )}
              </NavLink>
            )}
          </nav>

          <div className="p-3 sm:p-4 border-t border-gray-200 shrink-0 safe-bottom">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-200 rounded-full flex items-center justify-center shrink-0">
                <span className="text-gray-600 font-medium text-sm">
                  {profile?.full_name?.charAt(0) || 'م'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate text-sm">
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
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          aria-label="إغلاق"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0 w-full">
        <header
          className="app-header sticky top-0 z-30 border-b border-gray-200 safe-top"
        >
          <div
            className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 min-h-[3.5rem] ${
              isPosRoute ? 'h-12 sm:h-14' : 'h-14 sm:h-16'
            }`}
          >
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -mr-1 hover:bg-gray-100 rounded-lg shrink-0"
              aria-label="فتح القائمة"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex-1 min-w-0">
              <h2 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 truncate">
                {isPosRoute ? (
                  'نقطة البيع'
                ) : (
                  <>
                    <span className="lg:hidden">نظام الفاتح</span>
                    <span className="hidden lg:inline">نظام الفاتح للمبيعات والمخزون</span>
                  </>
                )}
              </h2>
            </div>

            <button
              type="button"
              className="p-2 hover:bg-gray-100 rounded-lg relative shrink-0"
              onClick={() => {
                if (can('users_view') && pendingUsersCount > 0) navigate('/users');
              }}
              aria-label="التنبيهات"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              {pendingUsersCount > 0 && (
                <span className="absolute top-1 left-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[1rem] h-4 px-0.5 flex items-center justify-center">
                  {pendingUsersCount > 9 ? '9+' : pendingUsersCount}
                </span>
              )}
            </button>

            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-1 p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg"
                aria-label="حساب المستخدم"
              >
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-700 font-medium text-sm">
                    {profile?.full_name?.charAt(0) || 'م'}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-600 hidden xs:block" />
              </button>

              {userMenuOpen && (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-40"
                    aria-label="إغلاق"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute left-0 mt-1 w-52 max-w-[calc(100vw-1.5rem)] bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 animate-fade-in">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="font-medium text-gray-900 truncate">{profile?.full_name}</p>
                      <p className="text-xs text-gray-500 truncate">{profile?.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 min-h-[44px]"
                    >
                      <LogOut className="w-5 h-5 shrink-0" />
                      <span>تسجيل الخروج</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main
          className={`flex-1 overflow-y-auto overflow-x-hidden min-w-0 ${
            isPosRoute
              ? 'p-2 sm:p-3 lg:p-4 main-pos-route'
              : 'p-3 sm:p-4 lg:p-6 main-with-bottom-nav'
          }`}
        >
          <Outlet />
        </main>

        {/* Bottom navigation — phones & small tablets */}
        <nav
          className={`mobile-bottom-nav lg:hidden no-print ${isPosRoute ? 'hidden' : ''}`}
          aria-label="التنقل السريع"
        >
          {visibleMobileNav.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `mobile-nav-item ${isActive ? 'active' : ''}`
              }
            >
              <item.icon className="w-5 h-5 shrink-0" strokeWidth={2} />
              <span className="truncate max-w-full px-0.5">{item.label}</span>
            </NavLink>
          ))}
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className={`mobile-nav-item ${sidebarOpen ? 'active' : ''}`}
          >
            <MoreHorizontal className="w-5 h-5 shrink-0" />
            <span>المزيد</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
