import React, { useEffect, useState } from 'react';
import { supabase, formatCurrency, formatDateShort } from '../lib/supabase';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  ShoppingCart,
  Calendar,
  Download,
  FileText,
  Users,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { format, subDays, startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear } from 'date-fns';
import { ar } from 'date-fns/locale';

type ReportPeriod = 'today' | 'week' | 'month' | 'year' | 'custom';

export default function ReportsPage() {
  const [period, setPeriod] = useState<ReportPeriod>('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState<{ date: string; sales: number; profit: number }[]>([]);
  const [categorySales, setCategorySales] = useState<{ name: string; value: number }[]>([]);
  const [topProducts, setTopProducts] = useState<{ name: string; count: number; total: number }[]>([]);
  const [topCustomers, setTopCustomers] = useState<{ name: string; total: number; invoices: number }[]>([]);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalCost: 0,
    totalProfit: 0,
    totalInvoices: 0,
    averageInvoice: 0,
    totalProductsSold: 0,
  });

  useEffect(() => {
    fetchReportData();
  }, [period, customStart, customEnd]);

  const getDateRange = () => {
    const now = new Date();
    let start: Date, end: Date = endOfDay(now);

    switch (period) {
      case 'today':
        start = startOfDay(now);
        break;
      case 'week':
        start = startOfDay(subDays(now, 6));
        break;
      case 'month':
        start = startOfMonth(now);
        break;
      case 'year':
        start = startOfYear(now);
        break;
      case 'custom':
        start = customStart ? startOfDay(new Date(customStart)) : startOfMonth(now);
        end = customEnd ? endOfDay(new Date(customEnd)) : endOfDay(now);
        break;
      default:
        start = startOfMonth(now);
    }

    return { start, end };
  };

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const { start, end } = getDateRange();

      // Fetch invoices in date range
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select('*, customer:customers(name), items:invoice_items(*, product:products(name, purchase_price))')
        .eq('status', 'completed')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .order('created_at', { ascending: true });

      if (invoicesError) throw invoicesError;

      // Calculate stats
      const totalSales = invoicesData?.reduce((sum, inv) => sum + inv.total, 0) || 0;
      const totalCost = invoicesData?.reduce((sum, inv) => {
        return sum + (inv.items?.reduce((itemSum: number, item: any) => {
          return itemSum + (item.product?.purchase_price || 0) * item.quantity;
        }, 0) || 0);
      }, 0) || 0;
      const totalProfit = totalSales - totalCost;
      const totalInvoices = invoicesData?.length || 0;
      const averageInvoice = totalInvoices > 0 ? Math.round(totalSales / totalInvoices) : 0;
      const totalProductsSold = invoicesData?.reduce((sum, inv) => {
        return sum + (inv.items?.reduce((itemSum: number, item: any) => itemSum + item.quantity, 0) || 0);
      }, 0) || 0;

      setStats({
        totalSales,
        totalCost,
        totalProfit,
        totalInvoices,
        averageInvoice,
        totalProductsSold,
      });

      // Sales by date for chart
      const salesByDate: { [key: string]: { sales: number; profit: number } } = {};
      invoicesData?.forEach((inv) => {
        const dateKey = format(new Date(inv.created_at), 'MM/dd', { locale: ar });
        if (!salesByDate[dateKey]) {
          salesByDate[dateKey] = { sales: 0, profit: 0 };
        }
        salesByDate[dateKey].sales += inv.total;
        const cost = inv.items?.reduce((sum: number, item: any) => {
          return sum + (item.product?.purchase_price || 0) * item.quantity;
        }, 0) || 0;
        salesByDate[dateKey].profit += inv.total - cost;
      });

      const chartData = Object.entries(salesByDate).map(([date, data]) => ({
        date,
        sales: data.sales,
        profit: data.profit,
      }));

      setSalesData(chartData);

      // Category sales
      const categoryTotals: { [key: string]: number } = {};
      invoicesData?.forEach((inv) => {
        inv.items?.forEach((item: any) => {
          const cat = item.product?.category?.name || 'غير مصنف';
          categoryTotals[cat] = (categoryTotals[cat] || 0) + item.total_price;
        });
      });

      const categoryData = Object.entries(categoryTotals).map(([name, value]) => ({
        name,
        value,
      }));

      setCategorySales(categoryData);

      // Top products
      const productTotals: { [key: string]: { count: number; total: number } } = {};
      invoicesData?.forEach((inv) => {
        inv.items?.forEach((item: any) => {
          const name = item.product_name;
          if (!productTotals[name]) {
            productTotals[name] = { count: 0, total: 0 };
          }
          productTotals[name].count += item.quantity;
          productTotals[name].total += item.total_price;
        });
      });

      const topProductsData = Object.entries(productTotals)
        .map(([name, data]) => ({
          name,
          count: data.count,
          total: data.total,
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

      setTopProducts(topProductsData);

      // Top customers
      const customerTotals: { [key: string]: { total: number; invoices: number } } = {};
      invoicesData?.forEach((inv) => {
        const name = inv.customer?.name || 'عميل نقدي';
        if (!customerTotals[name]) {
          customerTotals[name] = { total: 0, invoices: 0 };
        }
        customerTotals[name].total += inv.total;
        customerTotals[name].invoices += 1;
      });

      const topCustomersData = Object.entries(customerTotals)
        .map(([name, data]) => ({
          name,
          total: data.total,
          invoices: data.invoices,
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

      setTopCustomers(topCustomersData);
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    const { start, end } = getDateRange();
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>تقرير المبيعات</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          * { font-family: 'Cairo', sans-serif; margin: 0; padding: 0; box-sizing: border-box; }
          body { padding: 40px; background: white; }
          .report { max-width: 800px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 30px; }
          .header h1 { font-size: 28px; color: #1e40af; }
          .header p { color: #666; margin-top: 5px; }
          .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
          .stat-box { background: #f8fafc; padding: 15px; border-radius: 8px; text-align: center; }
          .stat-value { font-size: 24px; font-weight: bold; color: #1e40af; }
          .stat-label { color: #64748b; font-size: 14px; margin-top: 5px; }
          .section { margin-bottom: 30px; }
          .section h2 { font-size: 18px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 15px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 10px; text-align: right; border-bottom: 1px solid #e2e8f0; }
          th { background: #f8fafc; }
          .profit { color: #059669; }
          .footer { text-align: center; padding-top: 30px; color: #666; font-size: 12px; }
          @media print { body { print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <div class="report">
          <div class="header">
            <h1>تقرير المبيعات</h1>
            <p>الفترة: من ${formatDateShort(start.toISOString())} إلى ${formatDateShort(end.toISOString())}</p>
            <p>تاريخ التقرير: ${formatDateShort(new Date().toISOString())}</p>
          </div>

          <div class="stats">
            <div class="stat-box">
              <div class="stat-value">${formatCurrency(stats.totalSales)}</div>
              <div class="stat-label">إجمالي المبيعات</div>
            </div>
            <div class="stat-box">
              <div class="stat-value profit">${formatCurrency(stats.totalProfit)}</div>
              <div class="stat-label">صافي الربح</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">${stats.totalInvoices}</div>
              <div class="stat-label">عدد الفواتير</div>
            </div>
          </div>

          <div class="section">
            <h2>المنتجات الأكثر مبيعاً</h2>
            <table>
              <thead>
                <tr>
                  <th>المنتج</th>
                  <th>الكمية</th>
                  <th>الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                ${topProducts.map(p => `
                  <tr>
                    <td>${p.name}</td>
                    <td>${p.count}</td>
                    <td>${formatCurrency(p.total)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="section">
            <h2>أفضل العملاء</h2>
            <table>
              <thead>
                <tr>
                  <th>العميل</th>
                  <th>الفواتير</th>
                  <th>الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                ${topCustomers.map(c => `
                  <tr>
                    <td>${c.name}</td>
                    <td>${c.invoices}</td>
                    <td>${formatCurrency(c.total)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="footer">
            <p>نظام الفاتح للمبيعات والمخزون</p>
          </div>
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="page-shell animate-fade-in">
      <div className="page-header">
        <div className="min-w-0">
          <h1 className="page-title">التقارير</h1>
          <p className="page-subtitle">تحليل أداء المبيعات والمخزون</p>
        </div>
        <div className="page-actions">
          <button onClick={exportReport} className="btn-primary flex items-center justify-center gap-2">
            <Download className="w-5 h-5 shrink-0" />
            <span>تصدير التقرير</span>
          </button>
        </div>
      </div>

      <div className="card p-4">
        <div className="filter-chip-row items-center">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <span className="text-gray-600 font-medium">الفترة:</span>
          </div>
          {(['today', 'week', 'month', 'year', 'custom'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                period === p
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {p === 'today' ? 'اليوم' :
               p === 'week' ? 'الأسبوع' :
               p === 'month' ? 'الشهر' :
               p === 'year' ? 'السنة' : 'مخصص'}
            </button>
          ))}
          {period === 'custom' && (
            <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 w-full sm:w-auto">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="input-field w-full xs:w-36"
                dir="ltr"
              />
              <span className="text-gray-400 text-center">إلى</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="input-field w-full xs:w-36"
                dir="ltr"
              />
            </div>
          )}
        </div>
      </div>

      <div className="report-stat-grid">
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-gray-500">المبيعات</span>
          </div>
          <p className="stat-value text-gray-900">{formatCurrency(stats.totalSales)}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <span className="text-sm text-gray-500">الربح</span>
          </div>
          <p className="stat-value text-green-600">{formatCurrency(stats.totalProfit)}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-5 h-5 text-red-600" />
            <span className="text-sm text-gray-500">التكلفة</span>
          </div>
          <p className="stat-value text-red-600">{formatCurrency(stats.totalCost)}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-purple-600" />
            <span className="text-sm text-gray-500">الفواتير</span>
          </div>
          <p className="stat-value text-gray-900">{stats.totalInvoices}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingCart className="w-5 h-5 text-amber-600" />
            <span className="text-sm text-gray-500">متوسط الفاتورة</span>
          </div>
          <p className="stat-value text-gray-900">{formatCurrency(stats.averageInvoice)}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-5 h-5 text-cyan-600" />
            <span className="text-sm text-gray-500">المنتجات المباعة</span>
          </div>
          <p className="stat-value text-gray-900">{stats.totalProductsSold}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-4">مخطط المبيعات والأرباح</h3>
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
            </div>
          ) : (
            <div className="h-64">
              {salesData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesData}>
                    <defs>
                      <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
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
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="sales"
                      name="المبيعات"
                      stroke="#3b82f6"
                      fill="url(#salesGradient)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="profit"
                      name="الربح"
                      stroke="#10b981"
                      fill="url(#profitGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  لا توجد بيانات
                </div>
              )}
            </div>
          )}
        </div>

        {/* Category Sales Pie */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-4">توزيع المبيعات حسب الفئة</h3>
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
            </div>
          ) : (
            <div className="h-64">
              {categorySales.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categorySales}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#3b82f6"
                      dataKey="value"
                      label={({ name }) => name}
                    >
                      {categorySales.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  لا توجد بيانات
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Top Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="card">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">أكثر المنتجات مبيعاً</h3>
          </div>
          <div className="p-4">
            {topProducts.length > 0 ? (
              <div className="space-y-3">
                {topProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </span>
                      <span className="font-medium">{product.name}</span>
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-gray-900">{formatCurrency(product.total)}</p>
                      <p className="text-sm text-gray-500">{product.count} مبيعة</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">لا توجد بيانات</div>
            )}
          </div>
        </div>

        {/* Top Customers */}
        <div className="card">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">أفضل العملاء</h3>
          </div>
          <div className="p-4">
            {topCustomers.length > 0 ? (
              <div className="space-y-3">
                {topCustomers.map((customer, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium">{customer.name}</p>
                        <p className="text-sm text-gray-500">{customer.invoices} فاتورة</p>
                      </div>
                    </div>
                    <p className="font-bold text-gray-900">{formatCurrency(customer.total)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">لا توجد بيانات</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
