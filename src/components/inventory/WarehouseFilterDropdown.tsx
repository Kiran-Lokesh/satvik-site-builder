import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { warehousesApiClient, Warehouse } from '@/lib/warehousesApiClient';
import { useEffect, useState } from 'react';

interface WarehouseFilterDropdownProps {
  onSelect: (warehouseId: string | null) => void;
  selectedWarehouseId?: string | null;
  token: string;
  className?: string;
  getToken?: () => Promise<string | null>;
}

export const WarehouseFilterDropdown: React.FC<WarehouseFilterDropdownProps> = ({
  onSelect,
  selectedWarehouseId,
  token,
  getToken,
  className,
}) => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadWarehouses();
  }, []);

  const loadWarehouses = async () => {
    setLoading(true);
    try {
      const authToken = getToken ? await getToken() : token;
      if (!authToken) {
        return;
      }
      const data = await warehousesApiClient.getAllWarehouses(authToken);
      setWarehouses(data);
    } catch (error) {
      console.error('Failed to load warehouses', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Select
      value={selectedWarehouseId || 'all'}
      onValueChange={(value) => {
        onSelect(value === 'all' ? null : value);
      }}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder="All Warehouses" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Warehouses</SelectItem>
        {warehouses.map((warehouse) => (
          <SelectItem key={warehouse.id} value={warehouse.id}>
            {warehouse.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

