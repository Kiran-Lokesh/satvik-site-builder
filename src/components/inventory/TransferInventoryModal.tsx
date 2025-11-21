import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { inventoryApiClient, TransferInventoryRequest, InventoryItem } from '@/lib/inventoryApiClient';
import { warehousesApiClient, Warehouse } from '@/lib/warehousesApiClient';

interface TransferInventoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  inventoryItem: InventoryItem;
  performedBy: string;
  token: string;
  getToken?: () => Promise<string | null>;
}

export const TransferInventoryModal: React.FC<TransferInventoryModalProps> = ({
  open,
  onOpenChange,
  onSuccess,
  inventoryItem,
  performedBy,
  token,
  getToken,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [sourceWarehouseId, setSourceWarehouseId] = useState<string | null>(inventoryItem.warehouseId || null);
  const [destinationWarehouseId, setDestinationWarehouseId] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingWarehouses, setLoadingWarehouses] = useState(false);
  const [currentQuantity, setCurrentQuantity] = useState<number>(inventoryItem.quantity);
  const [loadingQuantity, setLoadingQuantity] = useState(false);

  // Check if we need to show warehouse selector (when viewing aggregated inventory)
  const needsWarehouseSelection = !inventoryItem.warehouseId;

  useEffect(() => {
    if (open) {
      loadWarehouses();
      setSourceWarehouseId(inventoryItem.warehouseId || null);
      setDestinationWarehouseId('');
      setQuantity('');
      setErrors({});
      setCurrentQuantity(inventoryItem.quantity);
    }
  }, [open, inventoryItem.warehouseId, inventoryItem.quantity]);

  // Fetch quantity when source warehouse selection changes (for aggregated view)
  useEffect(() => {
    if (needsWarehouseSelection && sourceWarehouseId && open) {
      loadQuantityForWarehouse(sourceWarehouseId);
    }
  }, [sourceWarehouseId, needsWarehouseSelection, open]);

  const loadWarehouses = async () => {
    setLoadingWarehouses(true);
    const authToken = getToken ? await getToken() : token;
    if (!authToken) {
      setLoadingWarehouses(false);
      return;
    }

    try {
      const data = await warehousesApiClient.getAllWarehouses(authToken);
      setWarehouses(data);
    } catch (error) {
      console.error('Failed to load warehouses', error);
      toast({
        title: 'Error',
        description: 'Failed to load warehouses',
        variant: 'destructive',
      });
    } finally {
      setLoadingWarehouses(false);
    }
  };

  const loadQuantityForWarehouse = async (warehouseId: string) => {
    setLoadingQuantity(true);
    try {
      const authToken = getToken ? await getToken() : token;
      if (!authToken) {
        return;
      }
      const items = await inventoryApiClient.getInventoryByWarehouseAndProducts(
        authToken,
        warehouseId,
        [inventoryItem.productId]
      );
      const item = items.find(i => i.productId === inventoryItem.productId);
      setCurrentQuantity(item?.quantity || 0);
    } catch (error) {
      console.error('Failed to load quantity for warehouse', error);
      setCurrentQuantity(0);
    } finally {
      setLoadingQuantity(false);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (needsWarehouseSelection && !sourceWarehouseId) {
      newErrors.source = 'Source warehouse is required';
    }

    if (!destinationWarehouseId) {
      newErrors.destination = 'Destination warehouse is required';
    } else if (destinationWarehouseId === sourceWarehouseId) {
      newErrors.destination = 'Destination must be different from source warehouse';
    }

    if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    } else if (Number(quantity) > currentQuantity) {
      newErrors.quantity = `Quantity cannot exceed available stock (${currentQuantity})`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const authToken = getToken ? await getToken() : token;
    if (!authToken) {
      toast({
        title: 'Error',
        description: 'Authentication required',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      if (!sourceWarehouseId) {
        setErrors({ source: 'Source warehouse is required' });
        setLoading(false);
        return;
      }

      const request: TransferInventoryRequest = {
        sourceWarehouseId,
        destinationWarehouseId,
        productId: inventoryItem.productId,
        quantity: Number(quantity),
        performedBy,
      };

      await inventoryApiClient.transferInventory(request, authToken);
      
      toast({
        title: 'Success',
        description: 'Inventory transferred successfully',
      });
      
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Failed to transfer inventory', error);
      const errorMessage = error.message || 'Failed to transfer inventory';
      
      // Check for specific errors
      if (errorMessage.includes('Insufficient stock') || errorMessage.includes('insufficient')) {
        setErrors({ quantity: errorMessage });
      } else if (errorMessage.includes('same') || errorMessage.includes('Source and destination')) {
        setErrors({ destination: errorMessage });
      } else {
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Transfer Inventory</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Product</Label>
            <Input value={inventoryItem.productName} disabled />
          </div>

          <div className="space-y-2">
            <Label htmlFor="source">
              Source Warehouse <span className="text-red-500">*</span>
            </Label>
            {needsWarehouseSelection ? (
              <>
                <Select
                  value={sourceWarehouseId || ''}
                  onValueChange={(value) => {
                    setSourceWarehouseId(value);
                    if (value) {
                      loadQuantityForWarehouse(value);
                    }
                  }}
                  disabled={loading || loadingWarehouses}
                >
                  <SelectTrigger id="source">
                    <SelectValue placeholder="Select source warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((warehouse) => (
                      <SelectItem key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.source && (
                  <p className="text-sm text-red-500">{errors.source}</p>
                )}
              </>
            ) : (
              <Input value={inventoryItem.warehouseName || '—'} disabled />
            )}
          </div>

          <div className="space-y-2">
            <Label>Available Stock</Label>
            <Input 
              value={loadingQuantity ? 'Loading...' : currentQuantity} 
              disabled 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="destination">
              Destination Warehouse <span className="text-red-500">*</span>
            </Label>
            <Select
              value={destinationWarehouseId}
              onValueChange={setDestinationWarehouseId}
              disabled={loading || loadingWarehouses}
            >
              <SelectTrigger id="destination">
                <SelectValue placeholder="Select destination warehouse" />
              </SelectTrigger>
              <SelectContent>
                {warehouses
                  .filter((w) => w.id !== sourceWarehouseId)
                  .map((warehouse) => (
                    <SelectItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {errors.destination && (
              <p className="text-sm text-red-500">{errors.destination}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">
              Quantity <span className="text-red-500">*</span>
            </Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              max={currentQuantity}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity to transfer"
              disabled={loading || loadingQuantity}
            />
            {errors.quantity && (
              <p className="text-sm text-red-500">{errors.quantity}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Performed By</Label>
            <Input value={performedBy} disabled />
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
              Transfer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

