import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  supabase,
  formatCurrency,
  formatStockDisplay,
  SELL_UNIT,
  type Product,
  type Customer,
  type Invoice,
} from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  Search,
  Barcode,
  ShoppingCart,
  Trash2,
  User,
  CreditCard,
  Banknote,
  Minus,
  Plus,
  X,
  Printer,
  FileText,
  ChevronDown,
  Check,
  Clock,
  Loader2,
  UserPlus,
  Phone,
  MapPin,
  Save,
} from 'lucide-react';

interface CartItem {
  product: Product;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerSelect, setShowCustomerSelect] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerAddress, setNewCustomerAddress] = useState('');
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [paymentType, setPaymentType] = useState<'cash' | 'debt' | 'partial'>('cash');
  const [paidAmount, setPaidAmount] = useState('');
  const [discount, setDiscount] = useState('0');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [lastInvoice, setLastInvoice] = useState<Invoice | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const printReceipt = (invoice: Invoice) => {
    const paymentTypeLabel = invoice.payment_type === 'cash' ? 'نقدي' : invoice.payment_type === 'debt' ? 'دين' : 'دفع جزئي';

    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) return;

    const itemsHtml = cart.map(item =>
      '<div class="item">' +
        '<div class="item-name">' + item.product.name + '</div>' +
        '<div class="item-qty">×' + item.quantity + ' ' + SELL_UNIT + '</div>' +
        '<div class="item-price">' + formatCurrency(item.total_price) + '</div>' +
      '</div>'
    ).join('');

    const discountHtml = invoice.discount > 0
      ? '<div class="total-row"><span>-' + formatCurrency(invoice.discount) + '</span><span>الخصم:</span></div>'
      : '';

    const debtHtml = invoice.remaining_amount > 0
      ? '<div class="total-row debt"><span>' + formatCurrency(invoice.remaining_amount) + '</span><span>المتبقي (دين):</span></div>'
      : '';

    const html = '<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8">' +
      '<title>وصل - ' + invoice.invoice_number + '</title>' +
      '<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">' +
      '<style>' +
        '* { font-family: Cairo, sans-serif; margin: 0; padding: 0; box-sizing: border-box; }' +
        'body { padding: 20px; background: white; font-size: 14px; }' +
        '.receipt { max-width: 320px; margin: 0 auto; }' +
        '.header { text-align: center; padding-bottom: 15px; border-bottom: 2px dashed #333; margin-bottom: 15px; }' +
        '.header h1 { font-size: 20px; font-weight: bold; color: #1e40af; }' +
        '.header p { font-size: 11px; color: #666; margin-top: 5px; }' +
        '.info { margin-bottom: 15px; }' +
        '.info-row { display: flex; justify-content: space-between; margin-bottom: 4px; }' +
        '.items { border-top: 1px dashed #999; border-bottom: 1px dashed #999; padding: 10px 0; margin-bottom: 10px; }' +
        '.item { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px; }' +
        '.item-name { flex: 1; }' +
        '.item-qty { width: 40px; text-align: center; color: #666; }' +
        '.item-price { width: 80px; text-align: left; }' +
        '.totals { padding-top: 10px; }' +
        '.total-row { display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 6px; }' +
        '.total-row.bold { font-weight: bold; font-size: 16px; color: #1e40af; }' +
        '.total-row.debt { color: #dc2626; font-weight: 600; }' +
        '.total-row.paid { color: #059669; font-weight: 600; }' +
        '.footer { text-align: center; padding-top: 15px; font-size: 11px; color: #666; border-top: 2px dashed #333; margin-top: 10px; }' +
        '@media print { body { print-color-adjust: exact; } }' +
      '</style></head><body>' +
      '<div class="receipt">' +
        '<div class="header"><h1>نظام الفاتح للمبيعات</h1><p>وصل بيع</p></div>' +
        '<div class="info">' +
          '<div class="info-row"><span>' + invoice.invoice_number + '</span><span>رقم الفاتورة:</span></div>' +
          '<div class="info-row"><span>' + new Date(invoice.created_at).toLocaleDateString('ar-IQ') + '</span><span>التاريخ:</span></div>' +
          '<div class="info-row"><span>' + new Date(invoice.created_at).toLocaleTimeString('ar-IQ') + '</span><span>الوقت:</span></div>' +
          '<div class="info-row"><span>' + (selectedCustomer?.name || 'عميل نقدي') + '</span><span>العميل:</span></div>' +
          '<div class="info-row"><span>' + paymentTypeLabel + '</span><span>طريقة الدفع:</span></div>' +
        '</div>' +
        '<div class="items">' + itemsHtml + '</div>' +
        '<div class="totals">' +
          '<div class="total-row"><span>' + formatCurrency(invoice.subtotal) + '</span><span>المجموع الفرعي:</span></div>' +
          discountHtml +
          '<div class="total-row bold"><span>' + formatCurrency(invoice.total) + '</span><span>الإجمالي:</span></div>' +
          '<div class="total-row paid"><span>' + formatCurrency(invoice.paid_amount) + '</span><span>المدفوع:</span></div>' +
          debtHtml +
        '</div>' +
        '<div class="footer"><p>شكراً لزيارتكم</p><p>نظام الفاتح للمبيعات</p></div>' +
      '</div></body></html>';

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 300);
  };

  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
    barcodeInputRef.current?.focus();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, category:categories(id, name)')
        .eq('is_active', true)
        .gt('quantity', 0)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName.trim()) return;

    setSavingCustomer(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert([
          {
            name: newCustomerName.trim(),
            phone: newCustomerPhone.trim() || null,
            address: newCustomerAddress.trim(),
            created_by: user?.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Add to local list and select
      const newCustomer = data as Customer;
      setCustomers((prev) => [newCustomer, ...prev]);
      setSelectedCustomer(newCustomer);
      setNewCustomerName('');
      setNewCustomerPhone('');
      setNewCustomerAddress('');
      setShowAddCustomer(false);
      setShowCustomerSelect(false);
    } catch (error) {
      console.error('Error adding customer:', error);
      alert('حدث خطأ أثناء إضافة العميل');
    } finally {
      setSavingCustomer(false);
    }
  };

  const handleBarcodeScan = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const barcode = (e.target as HTMLInputElement).value.trim();
      if (!barcode) return;

      const product = products.find((p) => p.barcode === barcode);
      if (product) {
        addToCart(product);
        (e.target as HTMLInputElement).value = '';
      } else {
        alert('المنتج غير موجود');
      }
    }
  }, [products]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (term.length < 2) {
      setSearchResults([]);
      return;
    }

    const results = products.filter(
      (p) =>
        p.name.toLowerCase().includes(term.toLowerCase()) ||
        p.barcode?.toLowerCase().includes(term.toLowerCase())
    );
    setSearchResults(results);
  };

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.quantity) {
          alert('الكمية المطلوبة غير متوفرة');
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                total_price: item.unit_price * (item.quantity + 1),
              }
            : item
        );
      }

      return [
        ...prev,
        {
          product,
          quantity: 1,
          unit_price: product.selling_price,
          total_price: product.selling_price,
        },
      ];
    });

    setShowSearch(false);
    setSearchTerm('');
    setSearchResults([]);
    barcodeInputRef.current?.focus();
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id !== productId) return item;

        const newQuantity = item.quantity + delta;
        if (newQuantity <= 0) return item;
        if (newQuantity > item.product.quantity) {
          alert('الكمية المطلوبة غير متوفرة');
          return item;
        }

        return {
          ...item,
          quantity: newQuantity,
          total_price: item.unit_price * newQuantity,
        };
      })
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscount('0');
    setNotes('');
    setSelectedCustomer(null);
    setPaymentType('cash');
    setPaidAmount('');
  };

  const subtotal = cart.reduce((sum, item) => sum + item.total_price, 0);
  const discountAmount = parseInt(discount) || 0;
  const total = subtotal - discountAmount;
  const remainingAmount = total - (parseInt(paidAmount) || 0);

  const processSale = async () => {
    if (cart.length === 0) {
      alert('السلة فارغة');
      return;
    }

    if (paymentType !== 'cash' && !selectedCustomer) {
      alert('يجب اختيار عميل للبيع بالدين');
      return;
    }

    if (paymentType === 'partial' && (parseInt(paidAmount) || 0) >= total) {
      alert('المبلغ المدفوع يجب أن يكون أقل من الإجمالي');
      return;
    }

    setSaving(true);

    try {
      // Generate invoice number
      const { data: settingsData } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'invoice_prefix')
        .single();

      const prefix = settingsData?.value || 'INV';
      const datePart = new Date().toISOString().split('T')[0].replace(/-/g, '');

      const { data: lastInvoiceNum } = await supabase
        .from('invoices')
        .select('invoice_number')
        .order('created_at', { ascending: false })
        .limit(1);

      let nextNum = 1;
      if (lastInvoiceNum && lastInvoiceNum.length > 0) {
        const lastNum = lastInvoiceNum[0].invoice_number.split('-').pop();
        nextNum = parseInt(lastNum) + 1;
      }

      const invoiceNumber = `${prefix}-${datePart}-${String(nextNum).padStart(4, '0')}`;

      // Create invoice
      const paid = paymentType === 'cash' ? total : parseInt(paidAmount) || 0;
      const remaining = paymentType === 'cash' ? 0 : total - paid;

      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert([
          {
            invoice_number: invoiceNumber,
            customer_id: selectedCustomer?.id || null,
            subtotal,
            discount: discountAmount,
            total,
            paid_amount: paid,
            remaining_amount: remaining,
            payment_type: paymentType,
            status: 'completed',
            notes,
            created_by: user?.id,
          },
        ])
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Create invoice items
      const invoiceItems = cart.map((item) => ({
        invoice_id: invoice.id,
        product_id: item.product.id,
        product_name: item.product.name,
        barcode: item.product.barcode,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
      }));

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(invoiceItems);

      if (itemsError) throw itemsError;

      // Update product quantities and create inventory movements
      for (const item of cart) {
        const { error: updateError } = await supabase.rpc('update_product_quantity', {
          p_product_id: item.product.id,
          p_quantity: -item.quantity,
        });

        if (updateError) {
          // Manual update if RPC doesn't exist
          await supabase
            .from('products')
            .update({
              quantity: item.product.quantity - item.quantity,
              updated_at: new Date().toISOString(),
            })
            .eq('id', item.product.id);
        }

        await supabase.from('inventory_movements').insert([
          {
            product_id: item.product.id,
            movement_type: 'sale',
            quantity: item.quantity,
            previous_quantity: item.product.quantity,
            new_quantity: item.product.quantity - item.quantity,
            reference_type: 'invoice',
            reference_id: invoice.id,
            created_by: user?.id,
          },
        ]);
      }

      // Update customer debt if applicable
      if (selectedCustomer && remaining > 0) {
        await supabase
          .from('customers')
          .update({
            debt_balance: selectedCustomer.debt_balance + remaining,
            updated_at: new Date().toISOString(),
          })
          .eq('id', selectedCustomer.id);
      }

      // Create payment record
      if (paid > 0) {
        await supabase.from('payments').insert([
          {
            invoice_id: invoice.id,
            customer_id: selectedCustomer?.id || null,
            amount: paid,
            payment_method: 'cash',
            payment_type: paymentType === 'cash' ? 'full' : 'partial',
            created_by: user?.id,
          },
        ]);
      }

      setLastInvoice(invoice);
      setShowSuccess(true);
      clearCart();
    } catch (error) {
      console.error('Error processing sale:', error);
      alert('حدث خطأ أثناء معالجة البيع');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-shell animate-fade-in flex flex-col lg:flex-row gap-3 sm:gap-4 lg:gap-6 min-h-[min(70vh,calc(100dvh-11rem))] lg:min-h-[calc(100dvh-8rem)]">
      {/* Products Section */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 order-2 lg:order-1">
        <div className="card p-3 sm:p-4 mb-3 sm:mb-4 shrink-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Barcode Scanner */}
            <div className="relative">
              <Barcode className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                ref={barcodeInputRef}
                type="text"
                onKeyDown={handleBarcodeScan}
                className="input-field pr-11"
                placeholder="امسح الباركود..."
                dir="ltr"
              />
            </div>

            {/* Search Products */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => setShowSearch(true)}
                className="input-field pr-11"
                placeholder="بحث عن منتج..."
              />

              {showSearch && searchTerm.length >= 2 && (
                <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto z-10">
                  {searchResults.length > 0 ? (
                    searchResults.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => addToCart(product)}
                        className="w-full p-3 text-right hover:bg-gray-50 flex items-center justify-between border-b border-gray-100 last:border-0"
                      >
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-gray-500">{formatCurrency(product.selling_price)}/{SELL_UNIT} — {formatStockDisplay(product)}</p>
                        </div>
                        <Plus className="w-5 h-5 text-blue-600" />
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500">لا توجد نتائج</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Products Grid */}
        <div className="flex-1 overflow-y-auto min-h-0 overscroll-contain">
          <div className="product-grid">
            {products.map((product) => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="card-hover p-3 text-right"
              >
                <div className="aspect-square bg-gray-100 rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <ShoppingCart className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <p className="font-medium text-sm line-clamp-2">{product.name}</p>
                <p className="text-blue-600 font-bold mt-1">{formatCurrency(product.selling_price)}</p>
                <p className="text-xs text-gray-500">{formatStockDisplay(product)}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cart Section */}
      <div className="w-full lg:w-96 xl:w-[26rem] flex flex-col card shrink-0 order-1 lg:order-2 max-h-[42vh] sm:max-h-[48vh] lg:max-h-none min-h-[200px] lg:min-h-0">
        {/* Cart Header */}
        <div className="p-3 sm:p-4 border-b border-gray-200 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-lg">السلة</h2>
            <span className="badge badge-info">{cart.length} منتج</span>
          </div>

          {/* Customer Selection */}
          <div className="relative">
            <button
              onClick={() => setShowCustomerSelect(!showCustomerSelect)}
              className="w-full p-3 border border-gray-300 rounded-lg flex items-center justify-between hover:bg-gray-50"
            >
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-gray-400" />
                {selectedCustomer ? (
                  <span className="text-gray-900">{selectedCustomer.name}</span>
                ) : (
                  <span className="text-gray-500">عميل نقدي</span>
                )}
              </div>
              <ChevronDown className="w-5 h-5 text-gray-400" />
            </button>

            {showCustomerSelect && (
              <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-lg shadow-lg border border-gray-200 max-h-72 overflow-y-auto z-10">
                <button
                  onClick={() => {
                    setSelectedCustomer(null);
                    setShowCustomerSelect(false);
                  }}
                  className={`w-full p-3 text-right hover:bg-gray-50 flex items-center gap-2 border-b border-gray-100 ${!selectedCustomer ? 'bg-blue-50' : ''}`}
                >
                  <Check className={`w-5 h-5 ${!selectedCustomer ? 'text-blue-600' : 'text-transparent'}`} />
                  عميل نقدي
                </button>

                {/* Add new customer button */}
                <button
                  onClick={() => {
                    setShowAddCustomer(true);
                    setShowCustomerSelect(false);
                  }}
                  className="w-full p-3 text-right hover:bg-green-50 flex items-center gap-2 text-green-700 border-b border-gray-100"
                >
                  <UserPlus className="w-5 h-5" />
                  <span className="font-medium">إضافة عميل جديد</span>
                </button>

                {/* Search hint */}
                {customers.length > 5 && (
                  <div className="p-2 bg-gray-50 border-b border-gray-100">
                    <input
                      type="text"
                      placeholder="بحث عن عميل..."
                      className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-right"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                )}

                {customers.map((customer) => (
                  <button
                    key={customer.id}
                    onClick={() => {
                      setSelectedCustomer(customer);
                      setShowCustomerSelect(false);
                    }}
                    className={`w-full p-3 text-right hover:bg-gray-50 flex items-center gap-2 ${selectedCustomer?.id === customer.id ? 'bg-blue-50' : ''}`}
                  >
                    <Check className={`w-5 h-5 ${selectedCustomer?.id === customer.id ? 'text-blue-600' : 'text-transparent'}`} />
                    <div>
                      <p className="font-medium">{customer.name}</p>
                      {customer.debt_balance > 0 && (
                        <p className="text-xs text-red-600">دين: {formatCurrency(customer.debt_balance)}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <ShoppingCart className="w-16 h-16 mb-4" />
              <p>السلة فارغة</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.product.id} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.product.name}</p>
                    <p className="text-gray-500 text-xs">{formatCurrency(item.unit_price)}</p>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="p-1 text-red-500 hover:bg-red-100 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.product.id, -1)}
                      className="w-8 h-8 flex items-center justify-center bg-white border border-gray-300 rounded-lg hover:bg-gray-100"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-auto min-w-8 text-center font-medium">{item.quantity} {SELL_UNIT}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, 1)}
                      className="w-8 h-8 flex items-center justify-center bg-white border border-gray-300 rounded-lg hover:bg-gray-100"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="font-bold text-blue-600">{formatCurrency(item.total_price)}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Footer */}
        <div className="p-4 border-t border-gray-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">المجموع الفرعي</span>
            <span className="font-medium">{formatCurrency(subtotal)}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-600">الخصم</span>
            <input
              type="number"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              className="input-field w-32"
              min="0"
              dir="ltr"
            />
          </div>

          <div className="flex items-center justify-between text-xl font-bold">
            <span>الإجمالي</span>
            <span className="text-blue-600">{formatCurrency(total)}</span>
          </div>

          <button
            onClick={() => setShowPayment(true)}
            disabled={cart.length === 0 || total === 0}
            className="w-full btn-success py-3 flex items-center justify-center gap-2"
          >
            <CreditCard className="w-5 h-5" />
            إتمام البيع
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <div className="modal-overlay" onClick={() => setShowPayment(false)}>
          <div className="modal-content max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">إتمام عملية الدفع</h2>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <p className="text-gray-600 mb-1">المبلغ المستحق</p>
                <p className="text-3xl font-bold text-blue-600">{formatCurrency(total)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  طريقة الدفع
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setPaymentType('cash')}
                    className={`p-3 rounded-lg border-2 flex flex-col items-center gap-1 ${
                      paymentType === 'cash' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <Banknote className="w-6 h-6" />
                    <span className="text-sm">نقدي</span>
                  </button>
                  <button
                    onClick={() => setPaymentType('debt')}
                    className={`p-3 rounded-lg border-2 flex flex-col items-center gap-1 ${
                      paymentType === 'debt' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <Clock className="w-6 h-6" />
                    <span className="text-sm">دين</span>
                  </button>
                  <button
                    onClick={() => setPaymentType('partial')}
                    className={`p-3 rounded-lg border-2 flex flex-col items-center gap-1 ${
                      paymentType === 'partial' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <CreditCard className="w-6 h-6" />
                    <span className="text-sm">جزئي</span>
                  </button>
                </div>
              </div>

              {(paymentType === 'partial' || paymentType === 'debt') && selectedCustomer && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">العميل: {selectedCustomer.name}</p>
                  <p className="text-sm text-gray-600">
                    الدين الحالي: {formatCurrency(selectedCustomer.debt_balance)}
                  </p>
                </div>
              )}

              {paymentType === 'partial' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    المبلغ المدفوع
                  </label>
                  <input
                    type="number"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    className="input-field"
                    placeholder="0"
                    min="0"
                    max={total - 1}
                    dir="ltr"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    المتبقي: {formatCurrency(remainingAmount)}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ملاحظات
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input-field"
                  rows={2}
                  placeholder="ملاحظات الفاتورة..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={processSale}
                  disabled={saving}
                  className="btn-success flex-1 py-3 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      جاري المعالجة...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      تأكيد البيع
                    </>
                  )}
                </button>
                <button onClick={() => setShowPayment(false)} className="btn-secondary">
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccess && lastInvoice && (
        <div className="modal-overlay" onClick={() => setShowSuccess(false)}>
          <div className="modal-content max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">تمت العملية بنجاح</h2>
              <p className="text-gray-500 mb-4">الفاتورة: {lastInvoice.invoice_number}</p>

              {/* Payment Details */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-right space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-900">{formatCurrency(lastInvoice.total)}</span>
                  <span className="text-gray-600">الإجمالي</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-green-600">{formatCurrency(lastInvoice.paid_amount)}</span>
                  <span className="text-gray-600">المدفوع</span>
                </div>
                {lastInvoice.remaining_amount > 0 && (
                  <div className="flex justify-between items-center border-t border-gray-200 pt-2">
                    <span className="font-bold text-red-600">{formatCurrency(lastInvoice.remaining_amount)}</span>
                    <span className="text-gray-600">المتبقي (دين)</span>
                  </div>
                )}
                {selectedCustomer && lastInvoice.remaining_amount > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">{selectedCustomer.name}</span>
                    <span className="text-gray-500">العميل</span>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => lastInvoice && printReceipt(lastInvoice)}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  <Printer className="w-5 h-5" />
                  طباعة
                </button>
                <button
                  onClick={() => setShowSuccess(false)}
                  className="btn-secondary flex-1"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddCustomer && (
        <div className="modal-overlay" onClick={() => setShowAddCustomer(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-green-600" />
                إضافة عميل جديد
              </h2>
              <button
                onClick={() => setShowAddCustomer(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCustomer} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  اسم العميل *
                </label>
                <input
                  type="text"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  className="input-field"
                  required
                  autoFocus
                  placeholder="اسم العميل"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  رقم الهاتف
                </label>
                <div className="relative">
                  <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={newCustomerPhone}
                    onChange={(e) => setNewCustomerPhone(e.target.value)}
                    className="input-field pr-11"
                    placeholder="07701234567"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  العنوان
                </label>
                <div className="relative">
                  <MapPin className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={newCustomerAddress}
                    onChange={(e) => setNewCustomerAddress(e.target.value)}
                    className="input-field pr-11"
                    placeholder="العنوان..."
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={savingCustomer}
                  className="btn-success flex-1 flex items-center justify-center gap-2"
                >
                  {savingCustomer ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      جاري الإضافة...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      إضافة واختيار
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddCustomer(false)}
                  className="btn-secondary"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
