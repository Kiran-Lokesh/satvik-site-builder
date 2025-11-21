import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { InventoryTransaction } from '@/lib/inventoryApiClient';
// Format date helper
const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
};

interface InventoryHistoryTableProps {
  transactions: InventoryTransaction[];
  loading?: boolean;
}

const REASON_LABELS: Record<string, string> = {
  MANUAL_ADJUSTMENT: 'Manual Adjustment',
  ORDER_DEDUCTION: 'Order Deduction',
  TRANSFER: 'Transfer',
  SPOILAGE: 'Spoilage',
  INITIAL_STOCK: 'Initial Stock',
  SAMPLE_MARKETING: 'Sample/Marketing',
};

export const InventoryHistoryTable: React.FC<InventoryHistoryTableProps> = ({
  transactions,
  loading,
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-muted-foreground">Loading history...</div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-muted-foreground">No transaction history found</div>
      </div>
    );
  }


  return (
    <div className="border rounded-lg overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Timestamp</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Warehouse</TableHead>
            <TableHead>Quantity Change</TableHead>
            <TableHead>New Quantity</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Performed By</TableHead>
            <TableHead>Transfer Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((tx) => (
            <TableRow key={tx.id} className="hover:bg-transparent">
              <TableCell className="text-sm">
                {formatDate(tx.timestamp)}
              </TableCell>
              <TableCell className="font-medium">{tx.productName}</TableCell>
              <TableCell>{tx.warehouseName}</TableCell>
              <TableCell>
                <span
                  className={
                    tx.quantityChange > 0
                      ? 'text-green-600 font-semibold'
                      : tx.quantityChange < 0
                      ? 'text-red-600 font-semibold'
                      : ''
                  }
                >
                  {tx.quantityChange > 0 ? '+' : ''}
                  {tx.quantityChange}
                </span>
              </TableCell>
              <TableCell>{tx.newQuantity}</TableCell>
              <TableCell>{REASON_LABELS[tx.reason] || tx.reason}</TableCell>
              <TableCell className="text-sm">{tx.performedBy}</TableCell>
              <TableCell className="text-sm">
                {tx.reason === 'TRANSFER' && tx.sourceWarehouseName && tx.destinationWarehouseName ? (
                  <span>
                    {tx.sourceWarehouseName} → {tx.destinationWarehouseName}
                  </span>
                ) : (
                  '—'
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

