import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { inventoryApiClient, AdjustQuantityWithReasonRequest, InventoryItem, TransactionReason } from '@/lib/inventoryApiClient';
import { warehousesApiClient, Warehouse } from '@/lib/warehousesApiClient';

interface AdjustStockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  inventoryItem: InventoryItem;
  performedBy: string;
  token: string;
  getToken?: () => Promise<string | null>;
}

const REASON_OPTIONS: { value: TransactionReason; label: string }[] = [
  { value: 'MANUAL_ADJUSTMENT', label: 'Manual Adjustment' },
  { value: 'SPOILAGE', label: 'Spoilage' },
  { value: 'SAMPLE_MARKETING', label: 'Sample/Marketing' },
];

export const AdjustStockModal: React.FC<AdjustStockModalProps> = ({
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
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'subtract'>('add');
  const [quantity, setQuantity] = useState<string>('');
  const [reason, setReason] = useState<TransactionReason>('MANUAL_ADJUSTMENT');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | null>(inventoryItem.warehouseId || null);
  const [loadingWarehouses, setLoadingWarehouses] = useState(false);
  const [currentQuantity, setCurrentQuantity] = useState<number>(inventoryItem.quantity);
  const [loadingQuantity, setLoadingQuantity] = useState(false);
  
  // Check if we need to show warehouse selector (when viewing aggregated inventory)
  const needsWarehouseSelection = !inventoryItem.warehouseId;

  useEffect(() => {
    if (open) {
      // Reset form when modal opens
      setAdjustmentType('add');
      setQuantity('');
      setReason('MANUAL_ADJUSTMENT');
      setErrors({});
      setSelectedWarehouseId(inventoryItem.warehouseId || null);
      setCurrentQuantity(inventoryItem.quantity);
      
      // Load warehouses if we need warehouse selection
      if (needsWarehouseSelection) {
        loadWarehouses();
      }
    }
  }, [open, inventoryItem.warehouseId, inventoryItem.quantity, needsWarehouseSelection]);

  // Fetch quantity when warehouse selection changes (for aggregated view)
  useEffect(() => {
    if (needsWarehouseSelection && selectedWarehouseId && open) {
      loadQuantityForWarehouse(selectedWarehouseId);
    }
  }, [selectedWarehouseId, needsWarehouseSelection, open]);
  
  const loadWarehouses = async () => {
    setLoadingWarehouses(true);
    try {
      const authToken = getToken ? await getToken() : token;
      if (!authToken) {
        return;
      }
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

    if (needsWarehouseSelection && !selectedWarehouseId) {
      newErrors.warehouse = 'Warehouse selection is required';
    }

    if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }

    if (!reason) {
      newErrors.reason = 'Reason is required';
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
      const quantityValue = Number(quantity);
      const deltaQuantity = adjustmentType === 'add' ? quantityValue : -quantityValue;

      // Use selected warehouse if needed, otherwise use the inventory item's warehouse
      const warehouseIdToUse = needsWarehouseSelection ? selectedWarehouseId : inventoryItem.warehouseId;
      
      if (!warehouseIdToUse) {
        toast({
          title: 'Error',
          description: 'Warehouse selection is required',
          variant: 'destructive',
        });
        return;
      }

      const request: AdjustQuantityWithReasonRequest = {
        warehouseId: warehouseIdToUse,
        productId: inventoryItem.productId,
        deltaQuantity,
        reason,
        performedBy,
      };

      await inventoryApiClient.adjustQuantityWithReason(request, authToken);
      
      toast({
        title: 'Success',
        description: `Stock ${adjustmentType === 'add' ? 'increased' : 'decreased'} successfully`,
      });
      
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Failed to adjust stock', error);
      const errorMessage = error.message || 'Failed to adjust stock';
      
      // Check for negative quantity error
      if (errorMessage.includes('negative') || errorMessage.includes('Cannot adjust')) {
        setErrors({ quantity: errorMessage });
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

  const calculatedQuantity = (() => {
    if (!quantity || isNaN(Number(quantity))) return currentQuantity;
    const quantityValue = Number(quantity);
    const delta = adjustmentType === 'add' ? quantityValue : -quantityValue;
    return currentQuantity + delta;
  })();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Adjust Stock</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Product</Label>
            <Input value={inventoryItem.productName} disabled />
          </div>

          <div className="space-y-2">
            <Label htmlFor="warehouse">
              Warehouse {needsWarehouseSelection && <span className="text-red-500">*</span>}
            </Label>
            {needsWarehouseSelection ? (
              <>
                <Select
                  value={selectedWarehouseId || ''}
                  onValueChange={(value) => {
                    setSelectedWarehouseId(value);
                    if (value) {
                      loadQuantityForWarehouse(value);
                    }
                  }}
                  disabled={loadingWarehouses || loading}
                >
                  <SelectTrigger id="warehouse">
                    <SelectValue placeholder="Select a warehouse" />
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
              </>
            ) : (
              <Input value={inventoryItem.warehouseName || inventoryItem.warehouseCode || '—'} disabled />
            )}
          </div>

          <div className="space-y-2">
            <Label>Current Quantity</Label>
            <Input 
              value={loadingQuantity ? 'Loading...' : currentQuantity} 
              disabled 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="adjustmentType">
              Adjustment Type <span className="text-red-500">*</span>
            </Label>
            <Select
              value={adjustmentType}
              onValueChange={(value: 'add' | 'subtract') => setAdjustmentType(value)}
            >
              <SelectTrigger id="adjustmentType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="add">Add (+) Stock</SelectItem>
                <SelectItem value="subtract">Subtract (–) Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">
              Quantity <span className="text-red-500">*</span>
            </Label>
            <Input
              id="quantity"
              type="number"
              min="1"
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
            <Label htmlFor="reason">
              Reason <span className="text-red-500">*</span>
            </Label>
            <Select
              value={reason}
              onValueChange={(value: TransactionReason) => setReason(value)}
            >
              <SelectTrigger id="reason">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REASON_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.reason && (
              <p className="text-sm text-red-500">{errors.reason}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>New Quantity (Preview)</Label>
            <Input
              value={calculatedQuantity}
              disabled
              className={
                calculatedQuantity < 0
                  ? 'border-red-500 bg-red-50'
                  : calculatedQuantity === currentQuantity
                  ? ''
                  : 'border-green-500 bg-green-50'
              }
            />
            {calculatedQuantity < 0 && (
              <p className="text-sm text-red-500">
                Warning: Resulting quantity will be negative
              </p>
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
            <Button type="submit" disabled={loading || calculatedQuantity < 0}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Adjust Stock
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

