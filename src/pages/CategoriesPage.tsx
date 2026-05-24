import React, { useEffect, useState } from 'react';
import { supabase, type Category } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  Plus,
  Edit3,
  Trash2,
  X,
  FolderTree,
  Save,
  Loader2,
  Package,
} from 'lucide-react';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<(Category & { product_count?: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select(`
          *,
          products(count)
        `)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      const categoriesWithCount = data?.map((cat: any) => ({
        ...cat,
        product_count: cat.products?.[0]?.count || 0,
      })) || [];

      setCategories(categoriesWithCount);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '' });
    setEditingCategory(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const data = {
        name: formData.name,
        description: formData.description,
        updated_at: new Date().toISOString(),
      };

      let error;
      if (editingCategory) {
        ({ error } = await supabase
          .from('categories')
          .update(data)
          .eq('id', editingCategory.id));
      } else {
        ({ error } = await supabase
          .from('categories')
          .insert([{ ...data, created_by: user?.id }]));
      }

      if (error) throw error;

      setShowModal(false);
      resetForm();
      fetchCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      alert('حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      // First, set products in this category to have no category
      await supabase
        .from('products')
        .update({ category_id: null })
        .eq('category_id', deleteId);

      const { error } = await supabase
        .from('categories')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', deleteId);

      if (error) throw error;
      setDeleteId(null);
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('حدث خطأ أثناء الحذف');
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
    <div className="page-shell animate-fade-in">
      <div className="page-header">
        <div className="min-w-0">
          <h1 className="page-title">الفئات</h1>
          <p className="page-subtitle">{categories.length} فئة</p>
        </div>
        <div className="page-actions">
          <button onClick={openAddModal} className="btn-primary flex items-center justify-center gap-2">
            <Plus className="w-5 h-5 shrink-0" />
            <span>إضافة فئة</span>
          </button>
        </div>
      </div>

      <div className="category-grid">
        {categories.map((category) => (
          <div
            key={category.id}
            className="card-hover p-5 flex items-start justify-between group"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <FolderTree className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{category.name}</h3>
                {category.description && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{category.description}</p>
                )}
                <p className="text-xl font-bold text-gray-900 mt-2">
                  {category.product_count}
                  <span className="text-sm text-gray-500 font-normal"> منتج</span>
                </p>
              </div>
            </div>
            <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
              <button
                onClick={() => openEditModal(category)}
                className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDeleteId(category.id)}
                className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {categories.length === 0 && (
        <div className="text-center py-12">
          <FolderTree className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">لا توجد فئات</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingCategory ? 'تعديل الفئة' : 'إضافة فئة جديدة'}
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
                  اسم الفئة *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  required
                  placeholder="اسم الفئة"
                />
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
                  placeholder="وصف الفئة..."
                />
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
                      حفظ الفئة
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
              <h3 className="text-lg font-bold text-gray-900 mb-2">حذف الفئة</h3>
              <p className="text-gray-500 mb-6">هل أنت متأكد من حذف هذه الفئة؟ سيتم نقل المنتجات إلى "بدون فئة".</p>
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
