import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { inventoryApiClient, InventoryItem } from '@/lib/inventoryApiClient';
import { InventoryTable } from '@/components/inventory/InventoryTable';
import { InventoryEditModal } from '@/components/inventory/InventoryEditModal';
import { WarehouseFilterDropdown } from '@/components/inventory/WarehouseFilterDropdown';

export const InventoryPage: React.FC = () => {
  const { user, getToken } = useAuth();
  const { toast } = useToast();
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  useEffect(() => {
    if (user) {
      loadInventory();
    }
  }, [user, selectedWarehouseId, searchTerm]);

  const loadInventory = async () => {
    if (!user) return;

    const token = await getToken();
    if (!token) return;

    setLoading(true);
    try {
      const items = await inventoryApiClient.getAllInventory(
        token,
        selectedWarehouseId || undefined,
        searchTerm || undefined
      );
      setInventoryItems(items);
      setCurrentPage(1);
    } catch (error: any) {
      console.error('Failed to load inventory', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load inventory',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: InventoryItem) => {
    setSelectedItem(item);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedItem(null);
    setModalOpen(true);
  };

  const handleModalSuccess = () => {
    loadInventory();
  };

  const paginatedItems = inventoryItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(inventoryItems.length / itemsPerPage);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">Inventory</CardTitle>
            <Button onClick={handleAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Add Inventory Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full sm:w-auto">
              {user && (
                <WarehouseFilterDropdown
                  token=""
                  getToken={getToken}
                  selectedWarehouseId={selectedWarehouseId}
                  onSelect={setSelectedWarehouseId}
                  className="w-full sm:w-[200px]"
                />
              )}
            </div>
            <div className="relative w-full sm:w-auto sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
          </div>

          {/* Table */}
          <InventoryTable
            items={paginatedItems}
            onEdit={handleEdit}
            loading={loading}
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                {Math.min(currentPage * itemsPerPage, inventoryItems.length)} of{' '}
                {inventoryItems.length} items
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      {user && (
        <InventoryEditModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          onSuccess={handleModalSuccess}
          token=""
          getToken={getToken}
          inventoryItem={selectedItem}
        />
      )}
    </div>
  );
};

