import React, { useEffect, useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { AdminMultiSelect, Admin } from './AdminMultiSelect';
import { warehousesApiClient, WarehouseRequest } from '@/lib/warehousesApiClient';
import { useToast } from '@/hooks/use-toast';

interface WarehouseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouse?: {
    id: string;
    name: string;
    address?: string;
    contactPerson?: string;
    adminIds: string[];
  } | null;
  onSuccess: () => void;
  token: string;
}

export const WarehouseForm: React.FC<WarehouseFormProps> = ({
  open,
  onOpenChange,
  warehouse,
  onSuccess,
  token,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [formData, setFormData] = useState<WarehouseRequest>({
    name: '',
    address: '',
    contactPerson: '',
    adminIds: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      loadAdmins();
      if (warehouse) {
        setFormData({
          name: warehouse.name || '',
          address: warehouse.address || '',
          contactPerson: warehouse.contactPerson || '',
          adminIds: warehouse.adminIds ? [...warehouse.adminIds] : [],
        });
      } else {
        setFormData({
          name: '',
          address: '',
          contactPerson: '',
          adminIds: [],
        });
      }
      setErrors({});
    }
  }, [open, warehouse?.id]);

  const loadAdmins = async () => {
    setLoadingAdmins(true);
    try {
      const adminList = await warehousesApiClient.getAllAdmins(token);
      setAdmins(adminList);
    } catch (error) {
      console.error('Failed to load admins', error);
      toast({
        title: 'Error',
        description: 'Failed to load admins',
        variant: 'destructive',
      });
    } finally {
      setLoadingAdmins(false);
    }
  };

  const handleAdminIdsChange = useCallback((selectedIds: string[]) => {
    setFormData((prev) => {
      const prevIds = prev.adminIds || [];
      
      // Quick length check
      if (prevIds.length !== selectedIds.length) {
        return { ...prev, adminIds: selectedIds };
      }
      
      // If lengths are the same, check if arrays are identical
      if (prevIds.length === 0 && selectedIds.length === 0) {
        return prev; // No change
      }
      
      // Create sets for comparison
      const prevSet = new Set(prevIds);
      const newSet = new Set(selectedIds);
      
      // Check if sets are different
      if (prevSet.size !== newSet.size) {
        return { ...prev, adminIds: selectedIds };
      }
      
      // Check if all IDs in new set exist in prev set
      let hasChanges = false;
      for (const id of newSet) {
        if (!prevSet.has(id)) {
          hasChanges = true;
          break;
        }
      }
      
      // Also check if any IDs were removed
      if (!hasChanges) {
        for (const id of prevSet) {
          if (!newSet.has(id)) {
            hasChanges = true;
            break;
          }
        }
      }
      
      return hasChanges ? { ...prev, adminIds: selectedIds } : prev;
    });
  }, []);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Warehouse name is required';
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
      if (warehouse) {
        await warehousesApiClient.updateWarehouse(warehouse.id, formData, token);
        toast({
          title: 'Success',
          description: 'Warehouse updated successfully',
        });
      } else {
        await warehousesApiClient.createWarehouse(formData, token);
        toast({
          title: 'Success',
          description: 'Warehouse created successfully',
        });
      }
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Failed to save warehouse', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save warehouse',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {warehouse ? 'Edit Warehouse' : 'Add Warehouse'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Warehouse Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Enter warehouse name"
              disabled={loading}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={formData.address || ''}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              placeholder="Enter warehouse address"
              disabled={loading}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactPerson">Contact Person</Label>
            <Input
              id="contactPerson"
              value={formData.contactPerson || ''}
              onChange={(e) =>
                setFormData({ ...formData, contactPerson: e.target.value })
              }
              placeholder="Enter contact person name"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label>Assigned Admins</Label>
            {loadingAdmins ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <AdminMultiSelect
                admins={admins}
                selectedIds={formData.adminIds || []}
                onChange={handleAdminIdsChange}
              />
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
              {warehouse ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

