import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { supabase } from './lib/supabase';
import { Shield, Loader2 } from 'lucide-react';
import MainLayout from './components/MainLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import CategoriesPage from './pages/CategoriesPage';
import CustomersPage from './pages/CustomersPage';
import POSPage from './pages/POSPage';
import InvoicesPage from './pages/InvoicesPage';
import InventoryPage from './pages/InventoryPage';
import DebtsPage from './pages/DebtsPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import UsersPage from './pages/UsersPage';
import PermissionRoute from './components/PermissionRoute';

function PendingApprovalPage() {
  const { profile, signOut, user } = useAuth();
  const navigate = useNavigate();
  const [hasManager, setHasManager] = useState<boolean | null>(null);
  const [promoting, setPromoting] = useState(false);

  useEffect(() => {
    const checkManagers = async () => {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'manager')
        .eq('status', 'approved');

      if (error) {
        console.error(error);
        setHasManager(true);
        return;
      }
      setHasManager((count ?? 0) > 0);
    };
    checkManagers();
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handlePromoteToManager = async () => {
    if (!user?.id) return;
    setPromoting(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          role: 'manager',
          status: 'approved',
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert(
        'تعذر التفعيل من التطبيق. افتح Supabase → SQL Editor ونفّذ:\n\n' +
        `UPDATE profiles SET role = 'manager', status = 'approved' WHERE email = '${profile?.email}';`
      );
    } finally {
      setPromoting(false);
    }
  };

  const statusText = profile?.status === 'rejected' ? 'تم رفض طلبك' : 'في انتظار الموافقة';
  const statusDesc =
    profile?.status === 'rejected'
      ? 'تم رفض طلب تسجيلك من قبل المدير. يمكنك التواصل مع الإدارة.'
      : 'تم تسجيلك بنجاح! يرجى الانتظار حتى يوافق المدير على حسابك.';

  const canSelfPromote = hasManager === false && profile?.status !== 'rejected';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md text-center">
        <div
          className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
            profile?.status === 'rejected' ? 'bg-red-100' : 'bg-amber-100'
          }`}
        >
          {profile?.status === 'rejected' ? (
            <svg className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-10 h-10 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{statusText}</h2>
        <p className="text-gray-600 mb-2">{statusDesc}</p>
        <p className="text-sm text-gray-400 mb-6">الحساب: {profile?.email}</p>

        {canSelfPromote && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl text-right">
            <p className="text-sm text-blue-900 mb-3">
              لا يوجد مدير في النظام. يمكنك تفعيل هذا الحساب كمدير رئيسي.
            </p>
            <button
              onClick={handlePromoteToManager}
              disabled={promoting}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {promoting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  جاري التفعيل...
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  تفعيل حسابي كمدير
                </>
              )}
            </button>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => window.location.reload()}
            className="btn-primary flex-1"
          >
            تحديث الصفحة
          </button>
          <button
            onClick={handleSignOut}
            className="btn-secondary flex-1"
          >
            تسجيل الخروج
          </button>
        </div>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isApproved, profileLoaded, profile } = useAuth();

  if (loading || !profileLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (profile && !isApproved) {
    return <PendingApprovalPage />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<PermissionRoute permission="dashboard"><DashboardPage /></PermissionRoute>} />
        <Route path="products" element={<PermissionRoute permission="products_view"><ProductsPage /></PermissionRoute>} />
        <Route path="categories" element={<PermissionRoute permission="categories_view"><CategoriesPage /></PermissionRoute>} />
        <Route path="customers" element={<PermissionRoute permission="customers_view"><CustomersPage /></PermissionRoute>} />
        <Route path="pos" element={<PermissionRoute permission="pos_use"><POSPage /></PermissionRoute>} />
        <Route path="invoices" element={<PermissionRoute permission="invoices_view"><InvoicesPage /></PermissionRoute>} />
        <Route path="inventory" element={<PermissionRoute permission="inventory_view"><InventoryPage /></PermissionRoute>} />
        <Route path="debts" element={<PermissionRoute permission="debts_view"><DebtsPage /></PermissionRoute>} />
        <Route path="reports" element={<PermissionRoute permission="reports_view"><ReportsPage /></PermissionRoute>} />
        <Route path="settings" element={<PermissionRoute permission="settings_view"><SettingsPage /></PermissionRoute>} />
        <Route path="users" element={<PermissionRoute permission="users_view"><UsersPage /></PermissionRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
