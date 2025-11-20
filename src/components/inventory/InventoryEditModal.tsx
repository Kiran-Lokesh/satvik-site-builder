import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { inventoryApiClient, InventoryItemRequest } from '@/lib/inventoryApiClient';
import { ProductSearchDropdown, Product } from './ProductSearchDropdown';
import { warehousesApiClient } from '@/lib/warehousesApiClient';

interface InventoryEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  token: string;
  getToken?: () => Promise<string | null>;
  inventoryItem?: {
    id: string;
    warehouseId: string;
    productId: string;
    productName: string;
    quantity: number;
    costPrice?: number;
  } | null;
}

export const InventoryEditModal: React.FC<InventoryEditModalProps> = ({
  open,
  onOpenChange,
  onSuccess,
  token,
  getToken,
  inventoryItem,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [warehouses, setWarehouses] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState<string>('');
  const [costPrice, setCostPrice] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      loadWarehouses();
      if (inventoryItem) {
        setSelectedWarehouseId(inventoryItem.warehouseId);
        setSelectedProduct({ id: inventoryItem.productId, name: inventoryItem.productName });
        setQuantity(inventoryItem.quantity.toString());
        setCostPrice(inventoryItem.costPrice?.toString() || '');
      } else {
        resetForm();
      }
      setErrors({});
    }
  }, [open, inventoryItem]);

  const loadWarehouses = async () => {
    try {
      const authToken = getToken ? await getToken() : token;
      if (!authToken) {
        return;
      }
      const data = await warehousesApiClient.getAllWarehouses(authToken);
      setWarehouses(data.map((w) => ({ id: w.id, name: w.name })));
    } catch (error) {
      console.error('Failed to load warehouses', error);
    }
  };

  const resetForm = () => {
    setSelectedWarehouseId('');
    setSelectedProduct(null);
    setQuantity('');
    setCostPrice('');
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!selectedWarehouseId) {
      newErrors.warehouse = 'Warehouse is required';
    }

    if (!selectedProduct) {
      newErrors.product = 'Product is required';
    }

    if (!quantity || isNaN(Number(quantity)) || Number(quantity) < 0) {
      newErrors.quantity = 'Valid quantity is required (must be >= 0)';
    }

    if (costPrice && (isNaN(Number(costPrice)) || Number(costPrice) < 0)) {
      newErrors.costPrice = 'Cost price must be a valid number >= 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      const authToken = getToken ? await getToken() : token;
      if (!authToken) {
        toast({
          title: 'Error',
          description: 'Authentication required',
          variant: 'destructive',
        });
        return;
      }

      const request: InventoryItemRequest = {
        warehouseId: selectedWarehouseId,
        productId: selectedProduct!.id,
        quantity: parseInt(quantity, 10),
        costPrice: costPrice ? parseFloat(costPrice) : undefined,
      };

      await inventoryApiClient.createOrUpdateInventoryItem(request, authToken);
      toast({
        title: 'Success',
        description: inventoryItem ? 'Inventory updated successfully' : 'Inventory item created successfully',
      });
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      console.error('Failed to save inventory item', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save inventory item',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {inventoryItem ? 'Edit Inventory Item' : 'Add Inventory Item'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="warehouse">
              Warehouse <span className="text-red-500">*</span>
            </Label>
            <Select
              value={selectedWarehouseId || ''}
              onValueChange={(value) => setSelectedWarehouseId(value)}
            >
              <SelectTrigger id="warehouse">
                <SelectValue placeholder="Select warehouse" />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((warehouse) => (
                  <SelectItem key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.warehouse && (
              <p className="text-sm text-red-500">{errors.warehouse}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="product">
              Product <span className="text-red-500">*</span>
            </Label>
            <ProductSearchDropdown
              onSelect={setSelectedProduct}
              selectedProductId={selectedProduct?.id}
            />
            {errors.product && (
              <p className="text-sm text-red-500">{errors.product}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">
              Quantity <span className="text-red-500">*</span>
            </Label>
            <Input
              id="quantity"
              type="number"
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity"
              disabled={loading}
            />
            {errors.quantity && (
              <p className="text-sm text-red-500">{errors.quantity}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="costPrice">Cost Price</Label>
            <Input
              id="costPrice"
              type="number"
              min="0"
              step="0.01"
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value)}
              placeholder="Enter cost price"
              disabled={loading}
            />
            {errors.costPrice && (
              <p className="text-sm text-red-500">{errors.costPrice}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {inventoryItem ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

