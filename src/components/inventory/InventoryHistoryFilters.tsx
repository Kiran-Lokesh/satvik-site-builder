import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search } from 'lucide-react';
import { WarehouseFilterDropdown } from './WarehouseFilterDropdown';
import { ProductSearchDropdown, Product } from './ProductSearchDropdown';

interface InventoryHistoryFiltersProps {
  warehouseId: string | null;
  onWarehouseChange: (warehouseId: string | null) => void;
  productSearch: string;
  onProductSearchChange: (search: string) => void;
  selectedProduct: Product | null;
  onProductSelect: (product: Product | null) => void;
  token: string;
  getToken?: () => Promise<string | null>;
}

export const InventoryHistoryFilters: React.FC<InventoryHistoryFiltersProps> = ({
  warehouseId,
  onWarehouseChange,
  productSearch,
  onProductSearchChange,
  selectedProduct,
  onProductSelect,
  token,
  getToken,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Warehouse</Label>
        <WarehouseFilterDropdown
          token={token}
          getToken={getToken}
          selectedWarehouseId={warehouseId}
          onSelect={onWarehouseChange}
        />
      </div>

      <div className="space-y-2">
        <Label>Product</Label>
        <ProductSearchDropdown
          onSelect={onProductSelect}
          selectedProductId={selectedProduct?.id}
        />
      </div>
    </div>
  );
};

