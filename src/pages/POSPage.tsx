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
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showBarcodeField, setShowBarcodeField] = useState(false);
  const [isMobileLayout, setIsMobileLayout] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 1024
  );

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

    const mq = window.matchMedia('(min-width: 1024px)');
    const updateLayout = () => setIsMobileLayout(!mq.matches);
    updateLayout();
    mq.addEventListener('change', updateLayout);

    if (mq.matches && window.matchMedia('(pointer: fine)').matches) {
      setTimeout(() => barcodeInputRef.current?.focus(), 100);
    }

    return () => mq.removeEventListener('change', updateLayout);
  }, []);

  const dismissKeyboard = () => {
    barcodeInputRef.current?.blur();
    searchInputRef.current?.blur();
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

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
    dismissKeyboard();
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
      setMobileCartOpen(false);
      clearCart();
    } catch (error) {
      console.error('Error processing sale:', error);
      alert('حدث خطأ أثناء معالجة البيع');
    } finally {
      setSaving(false);
    }
  };

  const filteredCustomersList = customerSearch.trim()
    ? customers.filter((c) =>
        c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.phone?.includes(customerSearch)
      )
    : customers;

  const openPayment = () => {
    setMobileCartOpen(false);
    setShowPayment(true);
  };

  return (
    <div className="pos-page animate-fade-in">
      {mobileCartOpen && (
        <button
          type="button"
          className="pos-cart-backdrop lg:hidden"
          aria-label="إغلاق السلة"
          onClick={() => setMobileCartOpen(false)}
        />
      )}

      <div className={`pos-products-panel ${cart.length > 0 ? 'has-cart-bar' : ''}`}>
        <div className="pos-search-bar mb-2 shrink-0">
          <div className={`grid gap-2 ${isMobileLayout ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
            {isMobileLayout ? (
              showBarcodeField ? (
                <div className="relative">
                  <Barcode className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 opacity-50" style={{ color: 'var(--pos-muted)' }} />
                  <input
                    ref={barcodeInputRef}
                    type="text"
                    inputMode="text"
                    autoComplete="off"
                    onKeyDown={handleBarcodeScan}
                    onBlur={() => setShowBarcodeField(false)}
                    className="input-field pr-11"
                    placeholder="امسح الباركود..."
                    dir="ltr"
                  />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setShowBarcodeField(true);
                    setTimeout(() => barcodeInputRef.current?.focus(), 50);
                  }}
                  className="btn-secondary w-full flex items-center justify-center gap-2 min-h-[44px]"
                >
                  <Barcode className="w-5 h-5" />
                  مسح باركود
                </button>
              )
            ) : (
              <div className="relative">
                <Barcode className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 opacity-50" style={{ color: 'var(--pos-muted)' }} />
                <input
                  ref={barcodeInputRef}
                  type="text"
                  onKeyDown={handleBarcodeScan}
                  className="input-field pr-11"
                  placeholder="امسح الباركود..."
                  dir="ltr"
                />
              </div>
            )}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 opacity-50" style={{ color: 'var(--pos-muted)' }} />
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
                <div className="pos-dropdown absolute top-full mt-1 left-0 right-0 max-h-64 overflow-y-auto z-20">
                  {searchResults.length > 0 ? (
                    searchResults.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onPointerDown={(e) => e.preventDefault()}
                        onClick={() => addToCart(product)}
                        className="pos-dropdown-item w-full p-3 text-right flex items-center justify-between border-b last:border-0"
                        style={{ borderColor: 'var(--pos-border)' }}
                      >
                        <div className="min-w-0">
                          <p className="font-medium truncate">{product.name}</p>
                          <p className="text-sm" style={{ color: 'var(--pos-muted)' }}>
                            {formatCurrency(product.selling_price)}/{SELL_UNIT} — {formatStockDisplay(product)}
                          </p>
                        </div>
                        <Plus className="w-5 h-5 shrink-0" style={{ color: 'var(--pos-primary)' }} />
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center" style={{ color: 'var(--pos-muted)' }}>
                      لا توجد نتائج
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 -webkit-overflow-scrolling-touch">
          <div className="pos-product-grid">
            {products.map((product) => (
              <button
                key={product.id}
                type="button"
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => addToCart(product)}
                className="pos-product-btn"
              >
                <div
                  className="aspect-square rounded-lg mb-1.5 flex items-center justify-center overflow-hidden"
                  style={{ background: 'var(--pos-surface-alt)' }}
                >
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <ShoppingCart className="w-7 h-7 opacity-40" />
                  )}
                </div>
                <p className="font-medium text-xs sm:text-sm line-clamp-2 leading-snug">{product.name}</p>
                <p className="pos-product-price text-sm mt-0.5">{formatCurrency(product.selling_price)}</p>
                <p className="text-[10px] sm:text-xs mt-0.5" style={{ color: 'var(--pos-muted)' }}>
                  {formatStockDisplay(product)}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={`pos-cart-panel ${mobileCartOpen ? 'is-open' : ''}`}>
        <button
          type="button"
          className="pos-cart-handle w-full lg:hidden"
          onClick={() => setMobileCartOpen(false)}
          aria-label="إغلاق السلة"
        >
          <div className="pos-cart-handle-bar" />
        </button>

        <div className="p-3 sm:p-4 border-b shrink-0" style={{ borderColor: 'var(--pos-border)' }}>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-base sm:text-lg">السلة</h2>
            <span className="pos-badge">{cart.length}</span>
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowCustomerSelect(!showCustomerSelect)}
              className="w-full p-3 rounded-lg flex items-center justify-between min-h-[44px]"
              style={{ border: '1px solid var(--pos-border)', background: 'var(--pos-surface-alt)' }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <User className="w-5 h-5 shrink-0" style={{ color: 'var(--pos-muted)' }} />
                <span className="truncate">
                  {selectedCustomer ? selectedCustomer.name : 'عميل نقدي'}
                </span>
              </div>
              <ChevronDown className="w-5 h-5 shrink-0" style={{ color: 'var(--pos-muted)' }} />
            </button>
            {showCustomerSelect && (
              <div className="pos-dropdown absolute top-full mt-1 left-0 right-0 max-h-64 overflow-y-auto z-30">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCustomer(null);
                    setShowCustomerSelect(false);
                    setCustomerSearch('');
                  }}
                  className={`pos-dropdown-item w-full p-3 text-right flex items-center gap-2 border-b ${!selectedCustomer ? 'selected' : ''}`}
                  style={{ borderColor: 'var(--pos-border)' }}
                >
                  <Check className={`w-5 h-5 shrink-0 ${!selectedCustomer ? '' : 'opacity-0'}`} style={{ color: 'var(--pos-primary)' }} />
                  عميل نقدي
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddCustomer(true);
                    setShowCustomerSelect(false);
                  }}
                  className="pos-dropdown-item w-full p-3 text-right flex items-center gap-2 border-b text-green-700"
                  style={{ borderColor: 'var(--pos-border)' }}
                >
                  <UserPlus className="w-5 h-5 shrink-0" />
                  <span className="font-medium">إضافة عميل جديد</span>
                </button>
                {customers.length > 5 && (
                  <div className="p-2 border-b" style={{ borderColor: 'var(--pos-border)' }}>
                    <input
                      type="text"
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      placeholder="بحث عن عميل..."
                      className="input-field text-sm"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                )}
                {filteredCustomersList.map((customer) => (
                  <button
                    key={customer.id}
                    type="button"
                    onClick={() => {
                      setSelectedCustomer(customer);
                      setShowCustomerSelect(false);
                      setCustomerSearch('');
                    }}
                    className={`pos-dropdown-item w-full p-3 text-right flex items-center gap-2 ${
                      selectedCustomer?.id === customer.id ? 'selected' : ''
                    }`}
                  >
                    <Check
                      className={`w-5 h-5 shrink-0 ${selectedCustomer?.id === customer.id ? '' : 'opacity-0'}`}
                      style={{ color: 'var(--pos-primary)' }}
                    />
                    <div className="min-w-0 text-right">
                      <p className="font-medium truncate">{customer.name}</p>
                      {customer.debt_balance > 0 && (
                        <p className="text-xs" style={{ color: 'var(--pos-danger)' }}>
                          دين: {formatCurrency(customer.debt_balance)}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 min-h-[120px]">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8" style={{ color: 'var(--pos-muted)' }}>
              <ShoppingCart className="w-14 h-14 mb-3 opacity-40" />
              <p>السلة فارغة</p>
              <p className="text-xs mt-1">اضغط على منتج لإضافته</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.product.id} className="pos-cart-item">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.product.name}</p>
                    <p className="text-xs" style={{ color: 'var(--pos-muted)' }}>
                      {formatCurrency(item.unit_price)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.product.id)}
                    className="p-2 rounded-lg shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
                    style={{ color: 'var(--pos-danger)' }}
                    aria-label="حذف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button type="button" onClick={() => updateQuantity(item.product.id, -1)} className="pos-qty-btn">
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="min-w-[2.5rem] text-center text-sm font-semibold">
                      {item.quantity} {SELL_UNIT}
                    </span>
                    <button type="button" onClick={() => updateQuantity(item.product.id, 1)} className="pos-qty-btn">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="pos-total-value text-sm sm:text-base">{formatCurrency(item.total_price)}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-3 sm:p-4 border-t space-y-2 shrink-0 safe-bottom" style={{ borderColor: 'var(--pos-border)' }}>
          <div className="flex items-center justify-between text-sm">
            <span style={{ color: 'var(--pos-muted)' }}>المجموع الفرعي</span>
            <span className="font-medium">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm shrink-0" style={{ color: 'var(--pos-muted)' }}>
              الخصم
            </span>
            <input
              type="number"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              className="input-field flex-1 min-h-[44px]"
              min="0"
              dir="ltr"
            />
          </div>
          <div className="flex items-center justify-between text-lg font-bold pt-1">
            <span>الإجمالي</span>
            <span className="pos-total-value">{formatCurrency(total)}</span>
          </div>
          <button
            type="button"
            onClick={openPayment}
            disabled={cart.length === 0 || total <= 0}
            className="pos-btn-checkout"
          >
            <CreditCard className="w-5 h-5" />
            إتمام الدفع
          </button>
        </div>
      </div>

      {cart.length > 0 && (
        <div className="pos-mobile-bar lg:hidden">
          <button
            type="button"
            className="pos-mobile-bar-cart w-full"
            onClick={() => setMobileCartOpen(true)}
          >
            <span className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 shrink-0" style={{ color: 'var(--pos-primary)' }} />
              <span>السلة ({cart.length}) — اضغط لمراجعة الطلب</span>
            </span>
            <span className="pos-total-value text-sm shrink-0">{formatCurrency(total)}</span>
          </button>
        </div>
      )}

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

              {paymentType === 'debt' && selectedCustomer && (
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <p className="text-sm font-medium text-gray-900 mb-2">تفاصيل الدين</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">الدين القديم:</span>
                      <span className="font-medium text-red-600">{formatCurrency(selectedCustomer.debt_balance)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">المبلغ الحالي:</span>
                      <span className="font-medium">{formatCurrency(total)}</span>
                    </div>
                    <div className="flex justify-between text-sm border-t border-red-200 pt-1 mt-1">
                      <span className="text-gray-700 font-medium">مجموع الدين الجديد:</span>
                      <span className="font-bold text-red-700">{formatCurrency(selectedCustomer.debt_balance + total)}</span>
                    </div>
                  </div>
                </div>
              )}

              {paymentType === 'partial' && selectedCustomer && (
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
