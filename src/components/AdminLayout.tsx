import React from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { ClipboardList, Package, Shield, Warehouse } from 'lucide-react';
import { cn } from '@/lib/utils';
import Header from './Header';

const AdminLayout: React.FC = () => {
  const location = useLocation();

  const menuItems = [
    {
      name: 'Order Management',
      href: '/admin/orders',
      icon: ClipboardList,
    },
    {
      name: 'Warehouses',
      href: '/admin/warehouses',
      icon: Warehouse,
    },
    {
      name: 'Inventory Management',
      href: '/admin/inventory',
      icon: Package,
    },
  ];

  const isActive = (href: string) => {
    return location.pathname === href;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-72 bg-white border-r border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-brand" />
              <h1 className="text-xl font-bold text-brandText">Admin Dashboard</h1>
            </div>
          </div>
          <nav className="p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                    active
                      ? 'bg-brand/10 text-brand font-semibold'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-brand'
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className="whitespace-nowrap">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 w-full max-w-full overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

