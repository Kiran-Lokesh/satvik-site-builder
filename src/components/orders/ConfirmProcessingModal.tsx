import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmProcessingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  orderNumber: string;
  warehouseName?: string;
  loading?: boolean;
}

export const ConfirmProcessingModal: React.FC<ConfirmProcessingModalProps> = ({
  open,
  onOpenChange,
  onConfirm,
  orderNumber,
  warehouseName,
  loading = false,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Confirm Order Processing
          </DialogTitle>
          <DialogDescription>
            Processing this order will reduce inventory from{' '}
            {warehouseName ? (
              <span className="font-semibold">{warehouseName}</span>
            ) : (
              'your warehouse'
            )}
            . This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Order <span className="font-semibold">{orderNumber}</span> will be marked as PAID and inventory will be deducted.
          </p>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className="bg-primary text-primary-foreground"
          >
            {loading ? 'Processing...' : 'Proceed'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

