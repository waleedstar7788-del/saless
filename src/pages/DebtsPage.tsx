import React, { useEffect, useState } from 'react';
import { supabase, formatCurrency, formatDate, type Customer, type Payment, type Invoice } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import WhatsAppButton from '../components/WhatsAppButton';
import {
  Search,
  CreditCard,
  X,
  Banknote,
  CheckCircle,
  Download,
  User,
  DollarSign,
  Loader2,
} from 'lucide-react';

interface CustomerWithDebt extends Customer {
  total_debt?: number;
}

export default function DebtsPage() {
  const [customers, setCustomers] = useState<CustomerWithDebt[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithDebt | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchCustomers();
    fetchPayments();
  }, []);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('is_active', true)
        .gt('debt_balance', 0)
        .order('name');

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*, customer:customers(id, name), invoice:invoices(invoice_number)')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    setSaving(true);

    try {
      const amount = parseInt(paymentAmount);
      if (amount <= 0) {
        alert('المبلغ يجب أن يكون أكبر من صفر');
        setSaving(false);
        return;
      }

      if (amount > selectedCustomer.debt_balance) {
        alert('المبلغ أكبر من الدين المستحق');
        setSaving(false);
        return;
      }

      // Create receipt number
      const receiptNumber = `REC-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${String(payments.length + 1).padStart(4, '0')}`;

      // Create payment record
      const { error: paymentError } = await supabase.from('payments').insert([
        {
          customer_id: selectedCustomer.id,
          amount,
          payment_method: 'cash',
          payment_type: 'debt_payment',
          notes: paymentNotes,
          receipt_number: receiptNumber,
          created_by: user?.id,
        },
      ]);

      if (paymentError) throw paymentError;

      // Update customer debt balance
      const { error: updateError } = await supabase
        .from('customers')
        .update({
          debt_balance: selectedCustomer.debt_balance - amount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedCustomer.id);

      if (updateError) throw updateError;

      // Print receipt
      printReceipt(selectedCustomer, amount, receiptNumber);

      setShowPaymentModal(false);
      resetForm();
      fetchCustomers();
      fetchPayments();
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('حدث خطأ أثناء معالجة الدفع');
    } finally {
      setSaving(false);
    }
  };

  const printReceipt = (customer: Customer, amount: number, receiptNumber: string) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>إيصال ${receiptNumber}</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          * { font-family: 'Cairo', sans-serif; margin: 0; padding: 0; box-sizing: border-box; }
          body { padding: 10px; background: white; }
          .receipt { max-width: 80mm; margin: 0 auto; text-align: center; }
          .header { border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
          .header h1 { font-size: 16px; font-weight: bold; }
          .header p { font-size: 11px; color: #666; }
          .content { font-size: 12px; }
          .row { display: flex; justify-content: space-between; margin: 8px 0; }
          .amount { font-size: 18px; font-weight: bold; color: #1e40af; margin: 15px 0; }
          .footer { border-top: 2px dashed #000; padding-top: 10px; margin-top: 10px; font-size: 10px; }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <h1>نظام الفاتح للمبيعات</h1>
            <p>إيصال قبض</p>
          </div>
          <div class="content">
            <p class="amount">${formatCurrency(amount)}</p>
            <div class="row">
              <span>رقم الإيصال:</span>
              <span>${receiptNumber}</span>
            </div>
            <div class="row">
              <span>العميل:</span>
              <span>${customer.name}</span>
            </div>
            <div class="row">
              <span>التاريخ:</span>
              <span>${formatDate(new Date().toISOString())}</span>
            </div>
            <div class="row">
              <span>المتبقي:</span>
              <span>${formatCurrency(customer.debt_balance - amount)}</span>
            </div>
          </div>
          <div class="footer">
            <p>شكراً لتسديدكم</p>
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

  const resetForm = () => {
    setSelectedCustomer(null);
    setPaymentAmount('');
    setPaymentNotes('');
  };

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm)
  );

  const totalDebts = customers.reduce((sum, c) => sum + c.debt_balance, 0);

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
          <h1 className="text-2xl font-bold text-gray-900">الديون والمدفوعات</h1>
          <p className="text-gray-500 mt-1">{customers.length} عميل بديون</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-6 bg-red-50 border-red-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-red-600 font-medium">إجمالي الديون</p>
              <p className="text-2xl font-bold text-red-700">{formatCurrency(totalDebts)}</p>
            </div>
          </div>
        </div>

        <div className="card p-6 bg-blue-50 border-blue-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-blue-600 font-medium">عملاء بديون</p>
              <p className="text-2xl font-bold text-blue-700">{customers.length}</p>
            </div>
          </div>
        </div>

        <div className="card p-6 bg-green-50 border-green-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Download className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-green-600 font-medium">آخر المدفوعات</p>
              <p className="text-2xl font-bold text-green-700">
                {payments.length > 0 ? formatCurrency(payments[0].amount) : '0 د.ع'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="card p-4">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="بحث عن عميل..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pr-11"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customers with Debts */}
        <div className="card">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">العملاء المدينين</h2>
          </div>
          <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map((customer) => (
                <div
                  key={customer.id}
                  className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{customer.name}</p>
                      <p className="text-sm text-gray-500">{customer.phone || 'بدون رقم'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
                    <div className="text-left w-full sm:w-auto mb-1 sm:mb-0">
                      <p className="font-bold text-red-600">{formatCurrency(customer.debt_balance)}</p>
                    </div>
                    <WhatsAppButton
                      phone={customer.phone}
                      customerName={customer.name}
                      debtAmount={customer.debt_balance}
                    />
                    <button
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setShowPaymentModal(true);
                      }}
                      className="btn-success py-2 px-3 flex items-center gap-1 min-h-[40px]"
                    >
                      <DollarSign className="w-4 h-4" />
                      قبض
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                <p>لا يوجد عملاء بديون</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="card">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">سجل المدفوعات</h2>
          </div>
          <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
            {payments.filter(p => p.payment_type === 'debt_payment').length > 0 ? (
              payments
                .filter(p => p.payment_type === 'debt_payment')
                .map((payment) => (
                  <div key={payment.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{payment.customer?.name}</p>
                        <p className="text-sm text-gray-500">
                          {payment.receipt_number}
                        </p>
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-green-600">{formatCurrency(payment.amount)}</p>
                        <p className="text-xs text-gray-500">{formatDate(payment.created_at)}</p>
                      </div>
                    </div>
                  </div>
                ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                <Banknote className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p>لا توجد مدفوعات</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedCustomer && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">تسديد دين</h2>
              <button onClick={() => setShowPaymentModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="bg-red-50 p-4 rounded-lg mb-6">
                <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-red-600" />
                    <p className="font-medium">{selectedCustomer.name}</p>
                  </div>
                  <WhatsAppButton
                    phone={selectedCustomer.phone}
                    customerName={selectedCustomer.name}
                    debtAmount={selectedCustomer.debt_balance}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">الدين المستحق:</span>
                  <span className="text-2xl font-bold text-red-600">
                    {formatCurrency(selectedCustomer.debt_balance)}
                  </span>
                </div>
              </div>

              <form onSubmit={handlePayment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    المبلغ المدفوع *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="input-field pr-11"
                      required
                      min="1"
                      max={selectedCustomer.debt_balance}
                      placeholder="0"
                      dir="ltr"
                    />
                  </div>
                  <div className="flex gap-2 mt-2">
                    {[10000, 25000, 50000, 100000].map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => setPaymentAmount(amount.toString())}
                        className="flex-1 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        {amount >= 1000 ? (amount / 1000) + ' ألف' : amount}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ملاحظات
                  </label>
                  <textarea
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    className="input-field"
                    rows={2}
                    placeholder="ملاحظات..."
                  />
                </div>

                {paymentAmount && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">المتبقي بعد الدفع:</span>
                      <span className="font-bold text-green-600">
                        {formatCurrency(selectedCustomer.debt_balance - parseInt(paymentAmount || '0'))}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-success flex-1 flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        جاري المعالجة...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        تسديد الدفع
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="btn-secondary"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
