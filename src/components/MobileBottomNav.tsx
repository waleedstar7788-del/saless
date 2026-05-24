import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Menu,
  Users,
} from 'lucide-react';
import type { PermissionKey } from '../lib/permissions';

const items: {
  path: string;
  label: string;
  icon: typeof LayoutDashboard;
  permission: PermissionKey;
}[] = [
  { path: '/', label: 'الرئيسية', icon: LayoutDashboard, permission: 'dashboard' },
  { path: '/pos', label: 'البيع', icon: ShoppingCart, permission: 'pos' },
  { path: '/products', label: 'منتجات', icon: Package, permission: 'products' },
  { path: '/customers', label: 'عملاء', icon: Users, permission: 'customers' },
];

type Props = {
  onOpenMenu: () => void;
};

export default function MobileBottomNav({ onOpenMenu }: Props) {
  const { can } = useAuth();
  const visible = items.filter((i) => can(i.permission));

  return (
    <nav
      className="mobile-bottom-nav lg:hidden"
      aria-label="تنقل سريع"
    >
      {visible.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `mobile-nav-item ${isActive ? 'active' : ''}`
          }
        >
          <item.icon className="w-5 h-5 shrink-0" />
          <span>{item.label}</span>
        </NavLink>
      ))}
      <button type="button" onClick={onOpenMenu} className="mobile-nav-item">
        <Menu className="w-5 h-5 shrink-0" />
        <span>القائمة</span>
      </button>
    </nav>
  );
}
