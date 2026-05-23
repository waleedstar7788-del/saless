import React, { useEffect, useState } from 'react';
import {
  supabase,
  formatCurrency,
  formatDate,
  formatStockDisplay,
  getProductInventoryCost,
  usesPiecesPerUnit,
  unitsToPieces,
  getPiecesPerUnit,
  SELL_UNIT,
  type Product,
  type InventoryMovement,
} from '../lib/supabase';
import InventorySummaryCards from '../components/InventorySummaryCards';
import { useAuth } from '../contexts/AuthContext';
import {
  Search,
  Plus,
  Warehouse,
  ArrowUpCircle,
  ArrowDownCircle,
  Edit3,
  X,
  Save,
  Loader2,
  History,
  AlertTriangle,
} from 'lucide-react';

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [movementType, setMovementType] = useState<'in' | 'out' | 'adjustment'>('in');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchProducts();
    fetchMovements();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, category:categories(id, name)')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchMovements = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory_movements')
        .select('*, product:products(id, name, barcode)')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setMovements(data || []);
    } catch (error) {
      console.error('Error fetching movements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    setSaving(true);

    try {
      const qtyInput = parseInt(quantity);
      const bulk = usesPiecesPerUnit(selectedProduct.unit);
      const ppu = getPiecesPerUnit(selectedProduct);
      const qty = bulk && movementType !== 'adjustment'
        ? unitsToPieces(qtyInput, ppu)
        : qtyInput;

      let newQuantity = selectedProduct.quantity;

      if (movementType === 'in') {
        newQuantity = selectedProduct.quantity + qty;
      } else if (movementType === 'out') {
        if (qty > selectedProduct.quantity) {
          alert(`الكمية المطلوبة أكبر من المتوفر (${selectedProduct.quantity} ${SELL_UNIT})`);
          setSaving(false);
          return;
        }
        newQuantity = selectedProduct.quantity - qty;
      } else {
        newQuantity = bulk ? unitsToPieces(qtyInput, ppu) : qtyInput;
      }

      // Update product quantity
      const { error: updateError } = await supabase
        .from('products')
        .update({
          quantity: newQuantity,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedProduct.id);

      if (updateError) throw updateError;

      // Create movement record
      const { error: movementError } = await supabase
        .from('inventory_movements')
        .insert([
          {
            product_id: selectedProduct.id,
            movement_type: movementType,
            quantity: qty,
            previous_quantity: selectedProduct.quantity,
            new_quantity: newQuantity,
            notes: bulk && movementType !== 'adjustment'
              ? `${notes}${notes ? ' — ' : ''}${qtyInput} ${selectedProduct.unit}`.trim()
              : notes,
            created_by: user?.id,
          },
        ]);

      if (movementError) throw movementError;

      setShowModal(false);
      resetForm();
      fetchProducts();
      fetchMovements();
    } catch (error) {
      console.error('Error updating inventory:', error);
      alert('حدث خطأ أثناء التحديث');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setSelectedProduct(null);
    setQuantity('');
    setNotes('');
    setMovementType('in');
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockProducts = products.filter((p) => p.quantity <= p.low_stock_threshold);
  const getMovementTypeLabel = (type: string) => {
    switch (type) {
      case 'in': return 'إضافة';
      case 'out': return 'صرف';
      case 'adjustment': return 'تعديل';
      case 'sale': return 'بيع';
      case 'return': return 'إرجاع';
      default: return type;
    }
  };

  const getMovementTypeColor = (type: string) => {
    switch (type) {
      case 'in': return 'text-green-600 bg-green-100';
      case 'out': return 'text-red-600 bg-red-100';
      case 'adjustment': return 'text-blue-600 bg-blue-100';
      case 'sale': return 'text-amber-600 bg-amber-100';
      case 'return': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إدارة المخزون</h1>
          <p className="text-gray-500 mt-1">{products.length} منتج</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowHistory(!showHistory)} className="btn-secondary flex items-center gap-2">
            <History className="w-5 h-5" />
            سجل الحركة
          </button>
        </div>
      </div>

      <InventorySummaryCards
        products={products}
        filteredProducts={filteredProducts}
        showFilteredBreakdown={!!searchTerm}
      />

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <div className="card border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
            <h3 className="font-semibold text-gray-900">تنبيه المخزون المنخفض</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {lowStockProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => {
                  setSelectedProduct(product);
                  setShowModal(true);
                }}
                className="bg-white p-3 rounded-lg text-right hover:bg-amber-100 transition-colors border border-amber-200"
              >
                <p className="font-medium text-sm">{product.name}</p>
                <p className={`text-lg font-bold ${product.quantity === 0 ? 'text-red-600' : 'text-amber-600'}`}>
                  {formatStockDisplay(product)}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="card p-4">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="بحث عن منتج..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pr-11"
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="table-cell text-right">المنتج</th>
                <th className="table-cell text-right">الفئة</th>
                <th className="table-cell text-center">الكمية / الوحدة</th>
                <th className="table-cell text-right">سعر التكلفة</th>
                <th className="table-cell text-right">قيمة المخزون</th>
                <th className="table-cell text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="table-cell">
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      {product.barcode && (
                        <p className="text-sm text-gray-500">{product.barcode}</p>
                      )}
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className="badge badge-info">{product.category?.name || 'بدون فئة'}</span>
                  </td>
                  <td className="table-cell text-center">
                    <span className={`font-bold ${product.quantity <= product.low_stock_threshold ? 'text-red-600' : 'text-gray-900'}`}>
                      {formatStockDisplay(product)}
                    </span>
                    {product.quantity <= product.low_stock_threshold && (
                      <AlertTriangle className="w-4 h-4 text-amber-500 inline mr-1" />
                    )}
                  </td>
                  <td className="table-cell">{formatCurrency(product.purchase_price)}</td>
                  <td className="table-cell font-medium">{formatCurrency(getProductInventoryCost(product))}</td>
                  <td className="table-cell">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedProduct(product);
                          setMovementType('in');
                          setShowModal(true);
                        }}
                        className="p-2 hover:bg-green-100 rounded-lg text-green-600"
                        title="إضافة مخزون"
                      >
                        <ArrowUpCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedProduct(product);
                          setMovementType('out');
                          setShowModal(true);
                        }}
                        className="p-2 hover:bg-red-100 rounded-lg text-red-600"
                        title="صرف مخزون"
                      >
                        <ArrowDownCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedProduct(product);
                          setMovementType('adjustment');
                          setShowModal(true);
                        }}
                        className="p-2 hover:bg-blue-100 rounded-lg text-blue-600"
                        title="تعديل الكمية"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Warehouse className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">لا توجد منتجات</p>
          </div>
        )}
      </div>

      {/* Movement History */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowHistory(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-900">سجل حركة المخزون</h2>
              <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {movements.map((movement) => (
                <div key={movement.id} className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <span className={`badge ${getMovementTypeColor(movement.movement_type)}`}>
                      {getMovementTypeLabel(movement.movement_type)}
                    </span>
                    <div>
                      <p className="font-medium">{movement.product?.name || 'منتج محذوف'}</p>
                      <p className="text-sm text-gray-500">{formatDate(movement.created_at)}</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="font-bold">
                      {movement.movement_type === 'in' || movement.movement_type === 'return' ? '+' : '-'}
                      {movement.quantity}
                    </p>
                    <p className="text-sm text-gray-500">
                      {movement.previous_quantity} → {movement.new_quantity}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Movement Modal */}
      {showModal && selectedProduct && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {movementType === 'in' ? 'إضافة مخزون' :
                 movementType === 'out' ? 'صرف مخزون' : 'تعديل الكمية'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{selectedProduct.name}</p>
                    <p className="text-sm text-gray-500">{selectedProduct.barcode || 'بدون باركود'}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-sm text-gray-500">الكمية الحالية</p>
                    <p className="text-2xl font-bold text-blue-600">{formatStockDisplay(selectedProduct)}</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleMovement} className="space-y-4">
                <div className="flex gap-2">
                  {(['in', 'out', 'adjustment'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setMovementType(type)}
                      className={`flex-1 p-3 rounded-lg border-2 ${
                        movementType === type
                          ? type === 'in' ? 'border-green-600 bg-green-50' :
                            type === 'out' ? 'border-red-600 bg-red-50' :
                            'border-blue-600 bg-blue-50'
                          : 'border-gray-200'
                      }`}
                    >
                      {type === 'in' ? 'إضافة' : type === 'out' ? 'صرف' : 'تعديل'}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {movementType === 'adjustment'
                      ? `الكمية الجديدة (${SELL_UNIT})`
                      : usesPiecesPerUnit(selectedProduct.unit)
                        ? `الكمية (${selectedProduct.unit})`
                        : 'الكمية'}
                  </label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="input-field"
                    required
                    min={movementType === 'adjustment' ? '0' : '1'}
                    max={
                      movementType === 'out' && !usesPiecesPerUnit(selectedProduct.unit)
                        ? selectedProduct.quantity
                        : undefined
                    }
                    placeholder="0"
                    dir="ltr"
                  />
                  {usesPiecesPerUnit(selectedProduct.unit) && movementType !== 'adjustment' && quantity && (
                    <p className="text-xs text-blue-600 mt-1">
                      = {unitsToPieces(parseInt(quantity) || 0, getPiecesPerUnit(selectedProduct))} {SELL_UNIT}
                    </p>
                  )}
                  {movementType !== 'adjustment' && quantity && (
                    <p className="text-sm text-gray-500 mt-2">
                      بعد العملية: {formatStockDisplay({
                        ...selectedProduct,
                        quantity: movementType === 'in'
                          ? selectedProduct.quantity + (usesPiecesPerUnit(selectedProduct.unit)
                            ? unitsToPieces(parseInt(quantity) || 0, getPiecesPerUnit(selectedProduct))
                            : parseInt(quantity) || 0)
                          : selectedProduct.quantity - (usesPiecesPerUnit(selectedProduct.unit)
                            ? unitsToPieces(parseInt(quantity) || 0, getPiecesPerUnit(selectedProduct))
                            : parseInt(quantity) || 0),
                      })}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ملاحظات
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="input-field"
                    rows={2}
                    placeholder="ملاحظات..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                    {saving ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        جاري الحفظ...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        تأكيد
                      </>
                    )}
                  </button>
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
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
