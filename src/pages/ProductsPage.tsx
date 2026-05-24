import React, { useEffect, useState, useRef } from 'react';
import {
  supabase,
  formatCurrency,
  formatStockDisplay,
  PRODUCT_UNITS,
  SELL_UNIT,
  usesPiecesPerUnit,
  unitsToPieces,
  piecesToUnits,
  getPiecesPerUnit,
  getSupabaseErrorMessage,
  isMissingColumnError,
  type Product,
  type Category,
} from '../lib/supabase';
import InventorySummaryCards from '../components/InventorySummaryCards';
import { useAuth } from '../contexts/AuthContext';
import {
  Search,
  Plus,
  Edit3,
  Trash2,
  X,
  Barcode,
  Package,
  Image as ImageIcon,
  AlertTriangle,
  Upload,
  Save,
  Loader2,
} from 'lucide-react';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { user, can } = useAuth();
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    barcode: '',
    name: '',
    description: '',
    category_id: '',
    purchase_price: '',
    selling_price: '',
    quantity: '',
    low_stock_threshold: '10',
    unit: 'قطعة',
    pieces_per_unit: '1',
    image_url: '',
  });

  const isBulkUnit = usesPiecesPerUnit(formData.unit);
  const piecesPerUnitNum = isBulkUnit ? Math.max(1, parseInt(formData.pieces_per_unit) || 1) : 1;

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, category:categories(id, name)')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      barcode: '',
      name: '',
      description: '',
      category_id: '',
      purchase_price: '',
      selling_price: '',
      quantity: '',
      low_stock_threshold: '10',
      unit: 'قطعة',
      pieces_per_unit: '1',
      image_url: '',
    });
    setEditingProduct(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
    setTimeout(() => barcodeInputRef.current?.focus(), 100);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    const ppu = getPiecesPerUnit(product);
    const bulk = usesPiecesPerUnit(product.unit);
    setFormData({
      barcode: product.barcode || '',
      name: product.name,
      description: product.description,
      category_id: product.category_id || '',
      purchase_price: product.purchase_price.toString(),
      selling_price: product.selling_price.toString(),
      quantity: bulk ? piecesToUnits(product.quantity, ppu).toString() : product.quantity.toString(),
      low_stock_threshold: bulk
        ? piecesToUnits(product.low_stock_threshold, ppu).toString()
        : product.low_stock_threshold.toString(),
      unit: product.unit || 'قطعة',
      pieces_per_unit: (product.pieces_per_unit ?? 1).toString(),
      image_url: product.image_url || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const bulk = usesPiecesPerUnit(formData.unit);
      const ppu = bulk ? Math.max(1, parseInt(formData.pieces_per_unit) || 1) : 1;
      const qtyUnits = parseInt(formData.quantity) || 0;
      const thresholdUnits = parseInt(formData.low_stock_threshold) || 10;
      const quantityPieces = bulk ? unitsToPieces(qtyUnits, ppu) : qtyUnits;
      const thresholdPieces = bulk ? unitsToPieces(thresholdUnits, ppu) : thresholdUnits;

      if (bulk && ppu < 2) {
        alert('أدخل عدد القطع في الوحدة (مثلاً 24 قطعة بالكرتون)');
        setSaving(false);
        return;
      }

      const baseData = {
        barcode: formData.barcode || null,
        name: formData.name,
        description: formData.description,
        category_id: formData.category_id || null,
        purchase_price: parseInt(formData.purchase_price) || 0,
        selling_price: parseInt(formData.selling_price) || 0,
        quantity: quantityPieces,
        low_stock_threshold: thresholdPieces,
        image_url: formData.image_url || null,
        updated_at: new Date().toISOString(),
      };

      const dataWithUnits = {
        ...baseData,
        unit: formData.unit,
        pieces_per_unit: ppu,
      };

      const saveProduct = async (payload: typeof dataWithUnits | typeof baseData) => {
        if (editingProduct) {
          return supabase.from('products').update(payload).eq('id', editingProduct.id);
        }
        return supabase.from('products').insert([{ ...payload, created_by: user?.id }]).select('id').single();
      };

      let result = await saveProduct(dataWithUnits);
      let usedFallback = false;

      if (result.error && isMissingColumnError(getSupabaseErrorMessage(result.error))) {
        result = await saveProduct(baseData);
        usedFallback = true;
      }

      if (result.error) throw result.error;

      if (!editingProduct && quantityPieces > 0 && result.data && 'id' in result.data) {
        await supabase.from('inventory_movements').insert([{
          product_id: result.data.id,
          movement_type: 'in',
          quantity: quantityPieces,
          previous_quantity: 0,
          new_quantity: quantityPieces,
          notes: bulk ? `إضافة مبدئية (${qtyUnits} ${formData.unit})` : 'إضافة مبدئية',
          created_by: user?.id,
        }]);
      }

      setShowModal(false);
      resetForm();
      fetchProducts();

      if (usedFallback) {
        alert(
          'تم حفظ المنتج.\n\nلتفعيل الوحدات والكرتون، نفّذ في Supabase SQL Editor:\n' +
          "ALTER TABLE products ADD COLUMN IF NOT EXISTS unit text NOT NULL DEFAULT 'قطعة';\n" +
          'ALTER TABLE products ADD COLUMN IF NOT EXISTS pieces_per_unit integer NOT NULL DEFAULT 1;'
        );
      }
    } catch (error) {
      console.error('Error saving product:', error);
      const msg = getSupabaseErrorMessage(error);
      alert(
        msg.includes('duplicate') || msg.includes('unique')
          ? 'الباركود مستخدم مسبقاً لمنتج آخر'
          : `تعذر الحفظ: ${msg}`
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', deleteId);

      if (error) throw error;
      setDeleteId(null);
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('حدث خطأ أثناء الحذف');
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.barcode?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || product.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
          <h1 className="text-2xl font-bold text-gray-900">المنتجات</h1>
          <p className="text-gray-500 mt-1">{products.length} منتج</p>
        </div>
        {can('products_create') && (
          <button onClick={openAddModal} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            إضافة منتج
          </button>
        )}
      </div>

      <InventorySummaryCards
        products={products}
        filteredProducts={filteredProducts}
        showFilteredBreakdown={!!(searchTerm || selectedCategory)}
      />

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="بحث بالاسم أو الباركود..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pr-11"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="input-field"
          >
            <option value="">كل الفئات</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            className="card-hover p-4 group relative"
          >
            {/* Low stock indicator */}
            {product.quantity <= product.low_stock_threshold && (
              <div className="absolute top-2 left-2">
                <div className="bg-amber-500 text-white p-1.5 rounded-full">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
            )}

            {(can('products_edit') || can('products_delete')) && (
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                {can('products_edit') && (
                  <button
                    onClick={() => openEditModal(product)}
                    className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                )}
                {can('products_delete') && (
                  <button
                    onClick={() => setDeleteId(product.id)}
                    className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {/* Product image or placeholder */}
            <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-gray-400">
                  <Package className="w-12 h-12" />
                </div>
              )}
            </div>

            {/* Product info */}
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <h3 className="font-medium text-gray-900 line-clamp-2">{product.name}</h3>
              </div>
              {product.barcode && (
                <div className="flex items-center gap-1.5 text-gray-500 text-sm">
                  <Barcode className="w-4 h-4" />
                  <span>{product.barcode}</span>
                </div>
              )}
              {product.category && (
                <span className="badge badge-info">{product.category.name}</span>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="font-bold text-blue-600">
                  {formatCurrency(product.selling_price)}
                  {usesPiecesPerUnit(product.unit) && (
                    <span className="text-xs font-normal text-gray-500"> / {SELL_UNIT}</span>
                  )}
                </span>
                <span className={`text-sm ${product.quantity <= product.low_stock_threshold ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                  {formatStockDisplay(product)}
                </span>
              </div>
              {usesPiecesPerUnit(product.unit) && (
                <p className="text-xs text-gray-400">
                  {getPiecesPerUnit(product)} {SELL_UNIT} في كل {product.unit}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">لا توجد منتجات</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الباركود
                  </label>
                  <div className="relative">
                    <Barcode className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      ref={barcodeInputRef}
                      type="text"
                      value={formData.barcode}
                      onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                      className="input-field pr-11"
                      placeholder="أدخل أو امسح الباركود"
                      dir="ltr"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    اسم المنتج *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field"
                    required
                    placeholder="اسم المنتج"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الفئة
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="input-field"
                  >
                    <option value="">بدون فئة</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    رابط الصورة
                  </label>
                  <div className="relative">
                    <ImageIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="url"
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      className="input-field pr-11"
                      placeholder="https://..."
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الوصف
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field"
                  rows={3}
                  placeholder="وصف المنتج..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {isBulkUnit ? `سعر شراء ${formData.unit} *` : 'سعر الشراء *'}
                  </label>
                  <input
                    type="number"
                    value={formData.purchase_price}
                    onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                    className="input-field"
                    required
                    min="0"
                    placeholder="0"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {isBulkUnit ? `سعر البيع للقطعة *` : 'سعر البيع *'}
                  </label>
                  <input
                    type="number"
                    value={formData.selling_price}
                    onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                    className="input-field"
                    required
                    min="0"
                    placeholder="0"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الوحدة *
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => {
                      const unit = e.target.value;
                      setFormData({
                        ...formData,
                        unit,
                        pieces_per_unit: usesPiecesPerUnit(unit)
                          ? (formData.pieces_per_unit === '1' ? '' : formData.pieces_per_unit)
                          : '1',
                      });
                    }}
                    className="input-field"
                    required
                  >
                    {PRODUCT_UNITS.map((unit) => (
                      <option key={unit.value} value={unit.value}>
                        {unit.label}
                      </option>
                    ))}
                  </select>
                </div>
                {isBulkUnit && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      عدد القطع في {formData.unit} *
                    </label>
                    <input
                      type="number"
                      value={formData.pieces_per_unit}
                      onChange={(e) => setFormData({ ...formData, pieces_per_unit: e.target.value })}
                      className="input-field"
                      placeholder="مثال: 24"
                      dir="ltr"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      البيع يكون بالقطعة — المخزون يُحسب تلقائياً بالقطع
                    </p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {isBulkUnit ? `عدد ${formData.unit} في المخزون *` : 'الكمية *'}
                  </label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="input-field"
                    required
                    min="0"
                    placeholder="0"
                    dir="ltr"
                  />
                  {isBulkUnit && formData.quantity && formData.pieces_per_unit && (
                    <p className="text-xs text-blue-600 mt-1">
                      = {unitsToPieces(parseInt(formData.quantity) || 0, piecesPerUnitNum)} {SELL_UNIT} للبيع
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  حد التنبيه {isBulkUnit ? `(${formData.unit})` : ''}
                </label>
                <input
                  type="number"
                  value={formData.low_stock_threshold}
                  onChange={(e) => setFormData({ ...formData, low_stock_threshold: e.target.value })}
                  className="input-field w-32"
                  min="0"
                  placeholder="10"
                  dir="ltr"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {isBulkUnit
                    ? `تنبيه عند انخفاض المخزون عن هذا العدد من ${formData.unit}`
                    : `عدد ${formData.unit} للتنبيه عند انخفاض المخزون`}
                </p>
              </div>

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
                      حفظ المنتج
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

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">حذف المنتج</h3>
              <p className="text-gray-500 mb-6">هل أنت متأكد من حذف هذا المنتج؟</p>
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
