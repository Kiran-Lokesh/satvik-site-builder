import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { InventoryItem } from '@/lib/inventoryApiClient';

interface InventoryTableProps {
  items: InventoryItem[];
  onAdjust?: (item: InventoryItem) => void;
  onTransfer?: (item: InventoryItem) => void;
  loading?: boolean;
}

export const InventoryTable: React.FC<InventoryTableProps> = ({
  items,
  onAdjust,
  onTransfer,
  loading,
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-muted-foreground">Loading inventory...</div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-muted-foreground">No inventory items found</div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Product Name</TableHead>
            <TableHead>Warehouse</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Cost Price</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id} className="hover:bg-transparent">
              <TableCell className="font-medium">{item.productName}</TableCell>
              <TableCell>{item.warehouseCode || item.warehouseName || '—'}</TableCell>
              <TableCell>{item.quantity}</TableCell>
              <TableCell>
                {item.costPrice ? `$${item.costPrice.toFixed(2)}` : '—'}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  {onAdjust && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onAdjust(item)}
                    >
                      Adjust
                    </Button>
                  )}
                  {onTransfer && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onTransfer(item)}
                    >
                      Transfer
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

