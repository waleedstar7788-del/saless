import React, { useEffect, useState } from 'react';
import {
  supabase,
  formatCurrency,
  formatDate,
  getCustomerWhatsApp,
  getSupabaseErrorMessage,
  isMissingColumnError,
  type Customer,
} from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import WhatsAppButton from '../components/WhatsAppButton';
import {
  Search,
  Plus,
  Edit3,
  Trash2,
  X,
  Users,
  Phone,
  MapPin,
  FileText,
  CreditCard,
  Save,
  Loader2,
  Eye,
} from 'lucide-react';

interface CustomerWithStats extends Customer {
  total_purchases?: number;
  invoice_count?: number;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetails, setShowDetails] = useState<CustomerWithStats | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    whatsapp: '',
    address: '',
    notes: '',
    debt_balance: '0',
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select(`
          *,
          invoices(total, status)
        `)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      const customersWithStats = data?.map((cust: any) => {
        const completedInvoices = cust.invoices?.filter((inv: any) => inv.status === 'completed') || [];
        return {
          ...cust,
          total_purchases: completedInvoices.reduce((sum: number, inv: any) => sum + inv.total, 0),
          invoice_count: completedInvoices.length,
        };
      }) || [];

      setCustomers(customersWithStats);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      whatsapp: '',
      address: '',
      notes: '',
      debt_balance: '0',
    });
    setEditingCustomer(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone || '',
      whatsapp: customer.whatsapp || '',
      address: customer.address,
      notes: customer.notes,
      debt_balance: customer.debt_balance.toString(),
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const baseData = {
        name: formData.name,
        phone: formData.phone || null,
        address: formData.address,
        notes: formData.notes,
        debt_balance: parseInt(formData.debt_balance) || 0,
        updated_at: new Date().toISOString(),
      };

      const dataWithWhatsapp = {
        ...baseData,
        whatsapp: formData.whatsapp.trim() || null,
      };

      const saveCustomer = async (payload: typeof dataWithWhatsapp | typeof baseData) => {
        if (editingCustomer) {
          return supabase.from('customers').update(payload).eq('id', editingCustomer.id);
        }
        return supabase.from('customers').insert([{ ...payload, created_by: user?.id }]);
      };

      let result = await saveCustomer(dataWithWhatsapp);
      if (result.error && isMissingColumnError(getSupabaseErrorMessage(result.error))) {
        result = await saveCustomer(baseData);
        if (!result.error) {
          alert('تم الحفظ. نفّذ في Supabase: ALTER TABLE customers ADD COLUMN IF NOT EXISTS whatsapp text;');
        }
      }

      if (result.error) throw result.error;

      setShowModal(false);
      resetForm();
      fetchCustomers();
    } catch (error) {
      console.error('Error saving customer:', error);
      alert('حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from('customers')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', deleteId);

      if (error) throw error;
      setDeleteId(null);
      fetchCustomers();
    } catch (error) {
      console.error('Error deleting customer:', error);
      alert('حدث خطأ أثناء الحذف');
    }
  };

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm) ||
    customer.whatsapp?.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="page-shell animate-fade-in">
      <div className="page-header">
        <div className="min-w-0">
          <h1 className="page-title">العملاء</h1>
          <p className="page-subtitle">{customers.length} عميل</p>
        </div>
        <div className="page-actions">
          <button onClick={openAddModal} className="btn-primary flex items-center justify-center gap-2">
            <Plus className="w-5 h-5 shrink-0" />
            <span>إضافة عميل</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="card p-4">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="بحث بالاسم أو رقم الهاتف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pr-11"
          />
        </div>
      </div>

      {/* Mobile cards */}
      <div className="mobile-data-list">
        {filteredCustomers.map((customer) => (
          <div key={customer.id} className="mobile-data-card">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                <span className="text-blue-700 font-bold">{customer.name.charAt(0)}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900 truncate">{customer.name}</p>
                <p className="text-xs text-gray-500">{customer.invoice_count} فاتورة</p>
              </div>
              {customer.debt_balance > 0 && (
                <span className="text-red-600 font-bold text-sm shrink-0">
                  {formatCurrency(customer.debt_balance)}
                </span>
              )}
            </div>
            <div className="mobile-data-card-row">
              <span className="text-gray-500">هاتف</span>
              <span dir="ltr" className="text-gray-800">{customer.phone || '—'}</span>
            </div>
            <div className="mobile-data-card-row">
              <span className="text-gray-500">واتساب</span>
              <span dir="ltr" className="text-green-700">{customer.whatsapp || '—'}</span>
            </div>
            <div className="mobile-data-card-row">
              <span className="text-gray-500">مشتريات</span>
              <span className="font-medium">{formatCurrency(customer.total_purchases || 0)}</span>
            </div>
            <div className="mobile-data-card-actions">
              <WhatsAppButton
                phone={getCustomerWhatsApp(customer)}
                customerName={customer.name}
                debtAmount={customer.debt_balance}
                compact
              />
              <button onClick={() => setShowDetails(customer)} className="btn-secondary flex-1 min-h-[44px] text-sm">
                تفاصيل
              </button>
              <button onClick={() => openEditModal(customer)} className="btn-secondary flex-1 min-h-[44px] text-sm">
                تعديل
              </button>
            </div>
          </div>
        ))}
        {filteredCustomers.length === 0 && (
          <div className="card p-8 text-center text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            لا يوجد عملاء
          </div>
        )}
      </div>

      {/* Desktop table */}
      <div className="card overflow-hidden desktop-data-table">
        <div className="table-scroll">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="table-cell text-right">الاسم</th>
                <th className="table-cell text-right">الهاتف</th>
                <th className="table-cell text-right">واتساب</th>
                <th className="table-cell text-right">العنوان</th>
                <th className="table-cell text-right">المشتريات</th>
                <th className="table-cell text-right">الديون</th>
                <th className="table-cell text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-700 font-medium">
                          {customer.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{customer.name}</p>
                        <p className="text-sm text-gray-500">{customer.invoice_count} فاتورة</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    {customer.phone ? (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span dir="ltr">{customer.phone}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="table-cell">
                    {customer.whatsapp ? (
                      <span className="text-green-700 font-medium" dir="ltr">
                        {customer.whatsapp}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="table-cell text-gray-600">{customer.address || '-'}</td>
                  <td className="table-cell font-medium">{formatCurrency(customer.total_purchases || 0)}</td>
                  <td className="table-cell">
                    {customer.debt_balance > 0 ? (
                      <span className="text-red-600 font-medium">
                        {formatCurrency(customer.debt_balance)}
                      </span>
                    ) : (
                      <span className="text-gray-400">لا يوجد</span>
                    )}
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center justify-center gap-1 sm:gap-2 flex-wrap">
                      <WhatsAppButton
                        phone={getCustomerWhatsApp(customer)}
                        customerName={customer.name}
                        debtAmount={customer.debt_balance}
                        compact
                      />
                      <button
                        onClick={() => setShowDetails(customer)}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                        title="التفاصيل"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(customer)}
                        className="p-2 hover:bg-blue-100 rounded-lg text-blue-600"
                        title="تعديل"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteId(customer.id)}
                        className="p-2 hover:bg-red-100 rounded-lg text-red-600"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCustomers.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">لا يوجد عملاء</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingCustomer ? 'تعديل العميل' : 'إضافة عميل جديد'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اسم العميل *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  required
                  placeholder="اسم العميل"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    رقم الهاتف
                  </label>
                  <div className="relative">
                    <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="input-field pr-11"
                      placeholder="07701234567"
                      dir="ltr"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    رقم الواتساب
                  </label>
                  <div className="relative">
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600 text-sm font-bold">
                      WA
                    </span>
                    <input
                      type="tel"
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                      className="input-field pr-11"
                      placeholder="07701234567"
                      dir="ltr"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    للتواصل عبر واتساب — يمكن أن يختلف عن الهاتف
                  </p>
                  {formData.phone && !formData.whatsapp && (
                    <button
                      type="button"
                      className="text-xs text-blue-600 mt-1 hover:underline"
                      onClick={() =>
                        setFormData({ ...formData, whatsapp: formData.phone })
                      }
                    >
                      نسخ رقم الهاتف إلى واتساب
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  العنوان
                </label>
                <div className="relative">
                  <MapPin className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="input-field pr-11"
                    rows={2}
                    placeholder="العنوان..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ملاحظات
                </label>
                <div className="relative">
                  <FileText className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="input-field pr-11"
                    rows={2}
                    placeholder="ملاحظات..."
                  />
                </div>
              </div>

              {editingCustomer && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    رصيد الدين
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      value={formData.debt_balance}
                      onChange={(e) => setFormData({ ...formData, debt_balance: e.target.value })}
                      className="input-field pr-11"
                      min="0"
                      dir="ltr"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      حفظ العميل
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Details Modal */}
      {showDetails && (
        <div className="modal-overlay" onClick={() => setShowDetails(null)}>
          <div className="modal-content max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">تفاصيل العميل</h2>
              <button
                onClick={() => setShowDetails(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-700 text-2xl font-bold">
                    {showDetails.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{showDetails.name}</h3>
                  {showDetails.phone && (
                    <p className="text-gray-500" dir="ltr">هاتف: {showDetails.phone}</p>
                  )}
                  {showDetails.whatsapp && (
                    <p className="text-green-700" dir="ltr">واتساب: {showDetails.whatsapp}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="card p-4 bg-gray-50">
                  <p className="text-sm text-gray-500">العنوان</p>
                  <p className="font-medium">{showDetails.address || 'غير محدد'}</p>
                </div>
                <div className="card p-4 bg-gray-50">
                  <p className="text-sm text-gray-500">إجمالي المشتريات</p>
                  <p className="font-bold text-blue-600">{formatCurrency(showDetails.total_purchases || 0)}</p>
                </div>
                <div className="card p-4 bg-gray-50">
                  <p className="text-sm text-gray-500">عدد الفواتير</p>
                  <p className="font-medium">{showDetails.invoice_count} فاتورة</p>
                </div>
                <div className={`card p-4 ${showDetails.debt_balance > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                  <p className="text-sm text-gray-500">الديون</p>
                  <p className={`font-bold ${showDetails.debt_balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(showDetails.debt_balance)}
                  </p>
                </div>
              </div>

              {showDetails.notes && (
                <div className="card p-4 bg-gray-50">
                  <p className="text-sm text-gray-500 mb-1">ملاحظات</p>
                  <p className="text-gray-700">{showDetails.notes}</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                <WhatsAppButton
                  phone={getCustomerWhatsApp(showDetails)}
                  customerName={showDetails.name}
                  debtAmount={showDetails.debt_balance}
                  className="w-full sm:w-auto flex-1"
                />
                <button
                  onClick={() => {
                    setShowDetails(null);
                    openEditModal(showDetails);
                  }}
                  className="btn-primary flex-1"
                >
                  تعديل البيانات
                </button>
                <button
                  onClick={() => setShowDetails(null)}
                  className="btn-secondary flex-1 sm:flex-none"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">حذف العميل</h3>
              <p className="text-gray-500 mb-6">هل أنت متأكد من حذف هذا العميل؟</p>
              <div className="flex gap-3 justify-center">
                <button onClick={handleDelete} className="btn-danger">
                  نعم، احذف
                </button>
                <button onClick={() => setDeleteId(null)} className="btn-secondary">
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
