import React, { useState } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { ClipboardList, Package, Shield, Warehouse, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import Header from './Header';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

const AdminLayout: React.FC = () => {
  const location = useLocation();
  const { getToken } = useAuth();
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);

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

  const handleSyncProducts = async () => {
    try {
      setIsSyncing(true);
      const token = await getToken();
      if (!token) {
        toast({
          title: 'Authentication required',
          description: 'Please log in to sync products.',
          variant: 'destructive',
        });
        return;
      }

      const backendUrl = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:8080';
      const response = await fetch(`${backendUrl}/api/products/sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Sync failed: ${response.status}`);
      }

      const result = await response.json();
      toast({
        title: 'Products synced successfully',
        description: `Synced ${result.productsProcessed} products and ${result.variantsProcessed} variants from Sanity.`,
      });
    } catch (error) {
      console.error('Failed to sync products:', error);
      toast({
        title: 'Sync failed',
        description: error instanceof Error ? error.message : 'Failed to sync products with Sanity.',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-72 bg-white border-r border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-6 w-6 text-brand" />
              <h1 className="text-xl font-bold text-brandText">Admin Dashboard</h1>
            </div>
            <Button
              onClick={handleSyncProducts}
              disabled={isSyncing}
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2"
            >
              <RefreshCw className={cn("h-4 w-4", isSyncing && "animate-spin")} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Products'}</span>
            </Button>
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

