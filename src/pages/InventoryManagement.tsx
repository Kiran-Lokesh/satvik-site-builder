import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Package } from 'lucide-react';

const InventoryManagement: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Package className="h-8 w-8 text-brand" />
        <h1 className="text-3xl font-bold text-brandText">Inventory Management</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventory Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Inventory management features will be available here soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryManagement;

