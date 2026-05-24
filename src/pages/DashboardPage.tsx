import React, { useEffect, useState } from 'react';
import { supabase, formatCurrency, formatDate, formatStockDisplay, type Product, type Invoice, type Customer } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  TrendingUp,
  TrendingDown,
  Package,
  Users,
  CreditCard,
  AlertTriangle,
  DollarSign,
  ShoppingCart,
  ArrowLeft,
  UserCheck,
  Clock,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { Link } from 'react-router-dom';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { ar } from 'date-fns/locale';

interface DashboardStats {
  todaySales: number;
  monthSales: number;
  totalProducts: number;
  totalCustomers: number;
  totalDebts: number;
  lowStockCount: number;
  todayInvoices: number;
  monthInvoices: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    todaySales: 0,
    monthSales: 0,
    totalProducts: 0,
    totalCustomers: 0,
    totalDebts: 0,
    lowStockCount: 0,
    todayInvoices: 0,
    monthInvoices: 0,
  });
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [salesChartData, setSalesChartData] = useState<{ date: string; sales: number }[]>([]);
  const [categoryData, setCategoryData] = useState<{ name: string; count: number }[]>([]);
  const [pendingUsersCount, setPendingUsersCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { can } = useAuth();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const today = new Date();
      const startOfToday = startOfDay(today);
      const endOfToday = endOfDay(today);
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      // Fetch today's sales
      const { data: todayData } = await supabase
        .from('invoices')
        .select('total, status')
        .eq('status', 'completed')
        .gte('created_at', startOfToday.toISOString())
        .lte('created_at', endOfToday.toISOString());

      const todaySales = todayData?.reduce((sum, inv) => sum + inv.total, 0) || 0;

      // Fetch month's sales
      const { data: monthData } = await supabase
        .from('invoices')
        .select('total, status')
        .eq('status', 'completed')
        .gte('created_at', startOfMonth.toISOString());

      const monthSales = monthData?.reduce((sum, inv) => sum + inv.total, 0) || 0;

      // Fetch counts
      const { count: totalProducts } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true);

      const { count: totalCustomers } = await supabase
        .from('customers')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true);

      // Fetch total debts
      const { data: debtsData } = await supabase
        .from('customers')
        .select('debt_balance')
        .eq('is_active', true);

      const totalDebts = debtsData?.reduce((sum, c) => sum + c.debt_balance, 0) || 0;

      // Fetch low stock products
      const { data: lowStock } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .lte('quantity', 10)
        .limit(5);

      setLowStockProducts(lowStock || []);

      const { count: lowStockCount } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true)
        .lte('quantity', 10);

      // Recent invoices
      const { data: recentInv } = await supabase
        .from('invoices')
        .select('*, customer:customers(name)')
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentInvoices(recentInv || []);

      // Today's invoice count
      const { count: todayInvoices } = await supabase
        .from('invoices')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'completed')
        .gte('created_at', startOfToday.toISOString())
        .lte('created_at', endOfToday.toISOString());

      // Month's invoice count
      const { count: monthInvoices } = await supabase
        .from('invoices')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'completed')
        .gte('created_at', startOfMonth.toISOString());

      setStats({
        todaySales,
        monthSales,
        totalProducts: totalProducts || 0,
        totalCustomers: totalCustomers || 0,
        totalDebts,
        lowStockCount: lowStockCount || 0,
        todayInvoices: todayInvoices || 0,
        monthInvoices: monthInvoices || 0,
      });

      // Fetch last 7 days sales data
      const last7Days = Array.from({ length: 7 }, (_, i) => subDays(new Date(), 6 - i));
      const salesPromises = last7Days.map(async (date) => {
        const dayStart = startOfDay(date);
        const dayEnd = endOfDay(date);
        const { data } = await supabase
          .from('invoices')
          .select('total')
          .eq('status', 'completed')
          .gte('created_at', dayStart.toISOString())
          .lte('created_at', dayEnd.toISOString());

        return {
          date: format(date, 'EEEE', { locale: ar }),
          sales: data?.reduce((sum, inv) => sum + inv.total, 0) || 0,
        };
      });

      const chartData = await Promise.all(salesPromises);
      setSalesChartData(chartData);

      // Fetch category distribution
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('name, products(count)');

      const catData = categoriesData?.map((cat: any) => ({
        name: cat.name,
        count: cat.products?.[0]?.count || 0,
      })).filter((c: any) => c.count > 0) || [];

      setCategoryData(catData);

      // Fetch pending users count (for managers)
      if (can('users_view')) {
        const { count: pendingCount } = await supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending');
        setPendingUsersCount(pendingCount || 0);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
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
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">لوحة التحكم</h1>
        <p className="text-gray-500">{format(new Date(), 'EEEE، d MMMM yyyy', { locale: ar })}</p>
      </div>

      {/* Pending Users Alert */}
      {can('users_view') && pendingUsersCount > 0 && (
        <Link
          to="/users"
          className="block card border-amber-200 bg-amber-50 p-4 hover:bg-amber-100 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">طلبات تسجيل جديدة</h3>
                <p className="text-amber-700">
                  {pendingUsersCount} {pendingUsersCount === 1 ? 'مستخدم ينتظر' : 'مستخدمين ينتظرون'} الموافقة
                </p>
              </div>
            </div>
            <span className="btn-warning flex items-center gap-2">
              <Clock className="w-4 h-4" />
              مراجعة الطلبات
            </span>
          </div>
        </Link>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="مبيعات اليوم"
          value={formatCurrency(stats.todaySales)}
          icon={<DollarSign className="w-6 h-6" />}
          trend={`${stats.todayInvoices} فاتورة`}
          color="blue"
        />
        <StatCard
          title="مبيعات الشهر"
          value={formatCurrency(stats.monthSales)}
          icon={<TrendingUp className="w-6 h-6" />}
          trend={`${stats.monthInvoices} فاتورة`}
          color="green"
        />
        <StatCard
          title="إجمالي المنتجات"
          value={stats.totalProducts.toString()}
          icon={<Package className="w-6 h-6" />}
          subtitle="منتج نشط"
          color="purple"
        />
        <StatCard
          title="إجمالي العملاء"
          value={stats.totalCustomers.toString()}
          icon={<Users className="w-6 h-6" />}
          subtitle="عميل مسجل"
          color="cyan"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="إجمالي الديون"
          value={formatCurrency(stats.totalDebts)}
          icon={<CreditCard className="w-6 h-6" />}
          color="red"
        />
        <StatCard
          title="تنبيهات المخزون"
          value={stats.lowStockCount.toString()}
          icon={<AlertTriangle className="w-6 h-6" />}
          subtitle="منتج بكمية منخفضة"
          color="amber"
          warning
        />
        <StatCard
          title="معدل المبيعات"
          value={Math.round(stats.monthSales / (stats.monthInvoices || 1)).toLocaleString('ar-IQ')}
          icon={<ShoppingCart className="w-6 h-6" />}
          subtitle="دينار لكل فاتورة"
          color="teal"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">مبيعات الأسبوع الأخير</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesChartData}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    direction: 'rtl',
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'المبيعات']}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#3b82f6"
                  fill="url(#salesGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">توزيع المنتجات حسب الفئة</h3>
          <div className="h-64">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={10} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      direction: 'rtl',
                    }}
                    formatter={(value: number) => [value, 'عدد المنتجات']}
                  />
                  <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                لا توجد فئات بعد
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <div className="card">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">الفواتير الأخيرة</h3>
            <Link
              to="/pos"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
            >
              فاتورة جديدة
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recentInvoices.length > 0 ? (
              recentInvoices.map((invoice) => (
                <div key={invoice.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{invoice.invoice_number}</p>
                      <p className="text-sm text-gray-500">
                        {invoice.customer?.name || 'عميل نقدي'}
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">{formatCurrency(invoice.total)}</p>
                      <p className="text-xs text-gray-500">{formatDate(invoice.created_at)}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">لا توجد فواتير بعد</div>
            )}
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="card border-amber-200 bg-amber-50/50">
          <div className="p-4 border-b border-amber-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <h3 className="font-semibold text-gray-900">تنبيهات المخزون</h3>
            </div>
            <Link
              to="/products"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
            >
              عرض الكل
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-amber-100">
            {lowStockProducts.length > 0 ? (
              lowStockProducts.map((product) => (
                <div key={product.id} className="p-4 hover:bg-amber-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-500">{product.barcode || 'بدون باركود'}</p>
                    </div>
                    <div className="text-left">
                      <span
                        className={`badge ${
                          product.quantity === 0
                            ? 'badge-danger'
                            : product.quantity <= 5
                            ? 'badge-warning'
                            : 'badge-info'
                        }`}
                      >
                        {formatStockDisplay(product)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">لا توجد تنبيهات</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  subtitle,
  trend,
  color,
  warning,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  subtitle?: string;
  trend?: string;
  color: string;
  warning?: boolean;
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    cyan: 'bg-cyan-50 text-cyan-600',
    red: 'bg-red-50 text-red-600',
    amber: 'bg-amber-50 text-amber-600',
    teal: 'bg-teal-50 text-teal-600',
  };

  return (
    <div className={`card p-5 ${warning ? 'bg-amber-50 border-amber-200' : ''}`}>
      <div className="flex items-start justify-between">
        <div className={`p-3 rounded-xl ${colorClasses[color as keyof typeof colorClasses]}`}>
          {icon}
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-green-600 text-sm">
            <TrendingUp className="w-4 h-4" />
          </div>
        )}
      </div>
      <div className="mt-4">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        {trend && <p className="text-xs text-gray-500 mt-1">{trend}</p>}
      </div>
    </div>
  );
}
