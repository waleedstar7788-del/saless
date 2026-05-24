import React, { useEffect, useState } from 'react';
import { supabase, formatCurrency, formatDate, type Customer } from '../lib/supabase';
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
      const data = {
        name: formData.name,
        phone: formData.phone || null,
        address: formData.address,
        notes: formData.notes,
        debt_balance: parseInt(formData.debt_balance) || 0,
        updated_at: new Date().toISOString(),
      };

      let error;
      if (editingCustomer) {
        ({ error } = await supabase
          .from('customers')
          .update(data)
          .eq('id', editingCustomer.id));
      } else {
        ({ error } = await supabase
          .from('customers')
          .insert([{ ...data, created_by: user?.id }]));
      }

      if (error) throw error;

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
    customer.phone?.includes(searchTerm)
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">العملاء</h1>
          <p className="text-gray-500 mt-1">{customers.length} عميل</p>
        </div>
        <button onClick={openAddModal} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          إضافة عميل
        </button>
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

      {/* Customers Table */}
      <div className="card overflow-hidden">
        <div className="table-scroll">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="table-cell text-right">الاسم</th>
                <th className="table-cell text-right">الهاتف</th>
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
                        phone={customer.phone}
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
                    <p className="text-gray-500" dir="ltr">{showDetails.phone}</p>
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
                  phone={showDetails.phone}
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
