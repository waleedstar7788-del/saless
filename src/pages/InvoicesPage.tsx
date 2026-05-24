import React, { useEffect, useState } from 'react';
import { supabase, formatCurrency, formatDate, type Invoice, type InvoiceItem, type Customer } from '../lib/supabase';
import { jsPDF } from 'jspdf';
import {
  Search,
  FileText,
  Eye,
  Printer,
  Download,
  X,
  Calendar,
  Filter,
} from 'lucide-react';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, customer:customers(id, name, phone)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoiceDetails = async (invoice: Invoice) => {
    try {
      const { data, error } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', invoice.id);

      if (error) throw error;
      setInvoiceItems(data || []);
      setSelectedInvoice(invoice);
    } catch (error) {
      console.error('Error fetching invoice details:', error);
    }
  };

  const printInvoice = (invoice: Invoice, items: InvoiceItem[]) => {
    const printContent = document.getElementById('invoice-print');
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>${invoice.invoice_number}</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          * { font-family: 'Cairo', sans-serif; margin: 0; padding: 0; box-sizing: border-box; }
          body { padding: 20px; background: white; }
          .invoice { max-width: 80mm; margin: 0 auto; }
          .header { text-align: center; padding-bottom: 15px; border-bottom: 2px dashed #000; }
          .header h1 { font-size: 18px; font-weight: bold; }
          .header p { font-size: 12px; color: #666; }
          .info { padding: 15px 0; border-bottom: 1px dashed #ccc; }
          .info-row { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 5px; }
          .items { padding: 15px 0; }
          .item { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px dotted #ddd; }
          .item-name { flex: 1; }
          .item-qty { width: 40px; text-align: center; }
          .item-price { width: 80px; text-align: left; }
          .totals { padding-top: 10px; border-top: 2px solid #000; }
          .total-row { display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 8px; }
          .total-row.bold { font-weight: bold; font-size: 16px; }
          .footer { text-align: center; padding-top: 15px; font-size: 11px; color: #666; }
          @media print { body { print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <div class="invoice">
          <div class="header">
            <h1>نظام الفاتح للمبيعات</h1>
            <p>العراق - بغداد</p>
            <p>07701234567</p>
          </div>

          <div class="info">
            <div class="info-row">
              <span>رقم الفاتورة:</span>
              <span>${invoice.invoice_number}</span>
            </div>
            <div class="info-row">
              <span>التاريخ:</span>
              <span>${formatDate(invoice.created_at)}</span>
            </div>
            <div class="info-row">
              <span>العميل:</span>
              <span>${invoice.customer?.name || 'عميل نقدي'}</span>
            </div>
          </div>

          <div class="items">
            ${items.map(item => `
              <div class="item">
                <div class="item-name">${item.product_name}</div>
                <div class="item-qty">×${item.quantity}</div>
                <div class="item-price">${formatCurrency(item.total_price)}</div>
              </div>
            `).join('')}
          </div>

          <div class="totals">
            <div class="total-row">
              <span>المجموع الفرعي:</span>
              <span>${formatCurrency(invoice.subtotal)}</span>
            </div>
            ${invoice.discount > 0 ? `
              <div class="total-row">
                <span>الخصم:</span>
                <span>- ${formatCurrency(invoice.discount)}</span>
              </div>
            ` : ''}
            <div class="total-row bold">
              <span>الإجمالي:</span>
              <span>${formatCurrency(invoice.total)}</span>
            </div>
            <div class="total-row">
              <span>المدفوع:</span>
              <span>${formatCurrency(invoice.paid_amount)}</span>
            </div>
            ${invoice.remaining_amount > 0 ? `
              <div class="total-row">
                <span>المتبقي:</span>
                <span>${formatCurrency(invoice.remaining_amount)}</span>
              </div>
            ` : ''}
          </div>

          <div class="footer">
            <p>شكراً لزيارتكم</p>
            <p>نتمنى لكم التوفيق</p>
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

  const downloadPDF = async (invoice: Invoice, items: InvoiceItem[]) => {
    // Create PDF using the print window approach for now
    // A4 format
    const printContent = document.getElementById('invoice-print');
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>${invoice.invoice_number}</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          * { font-family: 'Cairo', sans-serif; margin: 0; padding: 0; box-sizing: border-box; }
          body { padding: 40px; background: white; }
          .invoice { max-width: 800px; margin: 0 auto; }
          .header { text-align: center; padding-bottom: 30px; border-bottom: 3px solid #1e40af; margin-bottom: 30px; }
          .header h1 { font-size: 32px; font-weight: bold; color: #1e40af; }
          .header p { font-size: 14px; color: #666; margin-top: 10px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding: 20px 0; }
          .info-box { background: #f8fafc; padding: 15px; border-radius: 8px; }
          .info-box h3 { font-size: 12px; color: #64748b; margin-bottom: 5px; }
          .info-box p { font-size: 16px; font-weight: 600; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { padding: 12px; text-align: right; border-bottom: 1px solid #e2e8f0; }
          th { background: #f1f5f9; font-weight: 600; }
          .totals { margin-top: 20px; padding-top: 20px; border-top: 2px solid #e2e8f0; }
          .total-row { display: flex; justify-content: space-between; padding: 10px 0; font-size: 16px; }
          .total-row.bold { font-size: 20px; font-weight: 700; color: #1e40af; }
          .footer { text-align: center; padding-top: 40px; font-size: 12px; color: #666; }
          @media print { body { print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <div class="invoice">
          <div class="header">
            <h1>نظام الفاتح للمبيعات</h1>
            <p>العراق - بغداد | هاتف: 07701234567</p>
          </div>

          <div class="info-grid">
            <div class="info-box">
              <h3>رقم الفاتورة</h3>
              <p>${invoice.invoice_number}</p>
            </div>
            <div class="info-box">
              <h3>التاريخ</h3>
              <p>${formatDate(invoice.created_at)}</p>
            </div>
            <div class="info-box">
              <h3>العميل</h3>
              <p>${invoice.customer?.name || 'عميل نقدي'}</p>
            </div>
            <div class="info-box">
              <h3>طريقة الدفع</h3>
              <p>${invoice.payment_type === 'cash' ? 'نقدي' : invoice.payment_type === 'debt' ? 'دين' : 'دفع جزئي'}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>المنتج</th>
                <th style="width: 80px;">الكمية</th>
                <th style="width: 120px;">السعر</th>
                <th style="width: 120px;">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(item => `
                <tr>
                  <td>${item.product_name}</td>
                  <td>${item.quantity}</td>
                  <td>${formatCurrency(item.unit_price)}</td>
                  <td>${formatCurrency(item.total_price)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals">
            <div class="total-row">
              <span>المجموع الفرعي:</span>
              <span>${formatCurrency(invoice.subtotal)}</span>
            </div>
            ${invoice.discount > 0 ? `
              <div class="total-row" style="color: #059669;">
                <span>الخصم:</span>
                <span>- ${formatCurrency(invoice.discount)}</span>
              </div>
            ` : ''}
            <div class="total-row bold">
              <span>الإجمالي:</span>
              <span>${formatCurrency(invoice.total)}</span>
            </div>
            <div class="total-row">
              <span>المدفوع:</span>
              <span>${formatCurrency(invoice.paid_amount)}</span>
            </div>
            ${invoice.remaining_amount > 0 ? `
              <div class="total-row" style="color: #dc2626;">
                <span>المتبقي:</span>
                <span>${formatCurrency(invoice.remaining_amount)}</span>
              </div>
            ` : ''}
          </div>

          <div class="footer">
            <p>شكراً لزيارتكم - نتمنى لكم التوفيق</p>
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

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = !dateFilter || invoice.created_at.startsWith(dateFilter);
    return matchesSearch && matchesDate;
  });

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
          <h1 className="text-2xl font-bold text-gray-900">الفواتير</h1>
          <p className="text-gray-500 mt-1">{invoices.length} فاتورة</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="بحث برقم الفاتورة أو اسم العميل..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pr-11"
            />
          </div>
          <div className="relative">
            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="input-field pr-11"
              dir="ltr"
            />
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="card overflow-hidden">
        <div className="table-scroll">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="table-cell text-right">رقم الفاتورة</th>
                <th className="table-cell text-right">التاريخ</th>
                <th className="table-cell text-right">العميل</th>
                <th className="table-cell text-right">المجموع</th>
                <th className="table-cell text-right">المدفوع</th>
                <th className="table-cell text-right">المتبقي</th>
                <th className="table-cell text-center">الحالة</th>
                <th className="table-cell text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                  <td className="table-cell font-medium text-blue-600">{invoice.invoice_number}</td>
                  <td className="table-cell text-gray-600">{formatDate(invoice.created_at)}</td>
                  <td className="table-cell">{invoice.customer?.name || 'عميل نقدي'}</td>
                  <td className="table-cell font-medium">{formatCurrency(invoice.total)}</td>
                  <td className="table-cell text-green-600">{formatCurrency(invoice.paid_amount)}</td>
                  <td className="table-cell">
                    {invoice.remaining_amount > 0 ? (
                      <span className="text-red-600">{formatCurrency(invoice.remaining_amount)}</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="table-cell text-center">
                    <span className={`badge ${
                      invoice.status === 'completed' ? 'badge-success' :
                      invoice.status === 'cancelled' ? 'badge-danger' :
                      'badge-warning'
                    }`}>
                      {invoice.status === 'completed' ? 'مكتملة' :
                       invoice.status === 'cancelled' ? 'ملغاة' : 'معلقة'}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => fetchInvoiceDetails(invoice)}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                        title="التفاصيل"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          fetchInvoiceDetails(invoice).then(() => {
                            printInvoice(invoice, []);
                          });
                        }}
                        className="p-2 hover:bg-blue-100 rounded-lg text-blue-600"
                        title="طباعة فاتورة حرارية"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          fetchInvoiceDetails(invoice).then(() => {
                            downloadPDF(invoice, []);
                          });
                        }}
                        className="p-2 hover:bg-green-100 rounded-lg text-green-600"
                        title="طباعة A4"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredInvoices.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">لا توجد فواتير</p>
          </div>
        )}
      </div>

      {/* Invoice Details Modal */}
      {selectedInvoice && (
        <div className="modal-overlay" onClick={() => setSelectedInvoice(null)}>
          <div className="modal-content max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-900">تفاصيل الفاتورة</h2>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Invoice Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">رقم الفاتورة</p>
                  <p className="font-bold text-blue-600">{selectedInvoice.invoice_number}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">التاريخ</p>
                  <p className="font-medium">{formatDate(selectedInvoice.created_at)}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">العميل</p>
                  <p className="font-medium">{selectedInvoice.customer?.name || 'عميل نقدي'}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">طريقة الدفع</p>
                  <p className="font-medium">
                    {selectedInvoice.payment_type === 'cash' ? 'نقدي' :
                     selectedInvoice.payment_type === 'debt' ? 'دين' : 'دفع جزئي'}
                  </p>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">المنتجات</h3>
                <div className="table-scroll">
                  <table className="w-full border border-gray-200 rounded-lg">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">المنتج</th>
                        <th className="px-4 py-2 text-center text-sm font-medium text-gray-600">الكمية</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">السعر</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">الإجمالي</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoiceItems.map((item) => (
                        <tr key={item.id} className="border-t border-gray-100">
                          <td className="px-4 py-3">{item.product_name}</td>
                          <td className="px-4 py-3 text-center">{item.quantity}</td>
                          <td className="px-4 py-3 text-left">{formatCurrency(item.unit_price)}</td>
                          <td className="px-4 py-3 text-left font-medium">{formatCurrency(item.total_price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">المجموع الفرعي</span>
                  <span className="font-medium">{formatCurrency(selectedInvoice.subtotal)}</span>
                </div>
                {selectedInvoice.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>الخصم</span>
                    <span>- {formatCurrency(selectedInvoice.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold border-t border-gray-200 pt-2">
                  <span>الإجمالي</span>
                  <span className="text-blue-600">{formatCurrency(selectedInvoice.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">المدفوع</span>
                  <span className="text-green-600 font-medium">{formatCurrency(selectedInvoice.paid_amount)}</span>
                </div>
                {selectedInvoice.remaining_amount > 0 && (
                  <div className="flex justify-between text-red-600 font-medium">
                    <span>المتبقي</span>
                    <span>{formatCurrency(selectedInvoice.remaining_amount)}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => printInvoice(selectedInvoice, invoiceItems)}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  <Printer className="w-5 h-5" />
                  طباعة فاتورة حرارية
                </button>
                <button
                  onClick={() => downloadPDF(selectedInvoice, invoiceItems)}
                  className="btn-success flex-1 flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  طباعة A4
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
