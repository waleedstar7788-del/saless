import { formatCurrency, getTotalInventoryCost, getTotalInventorySaleValue, type Product } from '../lib/supabase';
import { Wallet, TrendingUp } from 'lucide-react';

type Props = {
  products: Product[];
  filteredProducts?: Product[];
  showFilteredBreakdown?: boolean;
};

export default function InventorySummaryCards({
  products,
  filteredProducts,
  showFilteredBreakdown = false,
}: Props) {
  const totalCost = getTotalInventoryCost(products);
  const totalSale = getTotalInventorySaleValue(products);
  const expectedProfit = totalSale - totalCost;

  const filtered = filteredProducts ?? products;
  const showBreakdown =
    showFilteredBreakdown && filtered.length !== products.length;
  const filteredCost = getTotalInventoryCost(filtered);
  const filteredSale = getTotalInventorySaleValue(filtered);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Blue — total purchase expense */}
        <div className="card p-5 bg-gradient-to-l from-blue-600 to-blue-700 text-white">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-xl shrink-0">
              <Wallet className="w-8 h-8" />
            </div>
            <div>
              <p className="text-blue-100 text-sm">مجموع المصروف</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(totalCost)}</p>
              <p className="text-blue-200 text-xs mt-1">سعر الشراء × الكمية — كل المنتجات</p>
            </div>
          </div>
        </div>

        {/* Red — total if all pieces sold */}
        <div className="card p-5 bg-gradient-to-l from-red-600 to-red-700 text-white">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-xl shrink-0">
              <TrendingUp className="w-8 h-8" />
            </div>
            <div>
              <p className="text-red-100 text-sm">مجموع إذا القطع انباعت</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(totalSale)}</p>
              <p className="text-red-200 text-xs mt-1">سعر البيع × الكمية — ربح متوقع {formatCurrency(expectedProfit)}</p>
            </div>
          </div>
        </div>
      </div>

      {showBreakdown && (
        <p className="text-sm text-gray-500 text-center">
          المعروض بالبحث: مصروف {formatCurrency(filteredCost)} — بيع {formatCurrency(filteredSale)} (
          {filtered.length} منتج)
        </p>
      )}
    </div>
  );
}
