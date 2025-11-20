import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Search, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { warehousesApiClient, Warehouse } from '@/lib/warehousesApiClient';
import { WarehouseForm } from './WarehouseForm';
import { DeleteConfirmModal } from './DeleteConfirmModal';

interface WarehouseListProps {
  token: string;
}

export const WarehouseList: React.FC<WarehouseListProps> = ({ token }) => {
  const { toast } = useToast();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadWarehouses();
  }, []);

  const loadWarehouses = async () => {
    setLoading(true);
    try {
      const data = await warehousesApiClient.getAllWarehouses(token);
      setWarehouses(data);
    } catch (error: any) {
      console.error('Failed to load warehouses', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load warehouses',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredWarehouses = useMemo(() => {
    if (!searchTerm) return warehouses;
    const term = searchTerm.toLowerCase();
    return warehouses.filter(
      (wh) =>
        wh.name?.toLowerCase().includes(term) ||
        wh.address?.toLowerCase().includes(term) ||
        wh.contactPerson?.toLowerCase().includes(term)
    );
  }, [warehouses, searchTerm]);

  const paginatedWarehouses = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredWarehouses.slice(start, end);
  }, [filteredWarehouses, currentPage]);

  const totalPages = Math.ceil(filteredWarehouses.length / itemsPerPage);

  const handleEdit = (warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse);
    setFormOpen(true);
  };

  const handleDelete = (warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedWarehouse) return;

    setDeleting(true);
    try {
      await warehousesApiClient.deleteWarehouse(selectedWarehouse.id, token);
      toast({
        title: 'Success',
        description: 'Warehouse deleted successfully',
      });
      loadWarehouses();
      setDeleteModalOpen(false);
      setSelectedWarehouse(null);
    } catch (error: any) {
      console.error('Failed to delete warehouse', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete warehouse',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleFormSuccess = () => {
    loadWarehouses();
    setSelectedWarehouse(null);
  };

  const formatAdmins = (adminIds: string[]): string => {
    if (!adminIds || adminIds.length === 0) return 'None';
    // For now, just show count. In a real app, you'd fetch admin names
    return `${adminIds.length} admin(s)`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">Warehouses</CardTitle>
            <Button onClick={() => {
              setSelectedWarehouse(null);
              setFormOpen(true);
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Warehouse
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search bar */}
          <div className="mb-6 flex justify-end">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search warehouses..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="sticky top-0 z-10">
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Warehouse Name</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Contact Person</TableHead>
                      <TableHead>Admins</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedWarehouses.length === 0 ? (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          {searchTerm ? 'No warehouses found matching your search' : 'No warehouses found'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedWarehouses.map((warehouse) => (
                        <TableRow key={warehouse.id} className="hover:bg-transparent">
                          <TableCell className="font-medium">{warehouse.name}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {warehouse.address || '-'}
                          </TableCell>
                          <TableCell>{warehouse.contactPerson || '-'}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {formatAdmins(warehouse.adminIds)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(warehouse)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(warehouse)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                    {Math.min(currentPage * itemsPerPage, filteredWarehouses.length)} of{' '}
                    {filteredWarehouses.length} warehouses
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
            </>
          )}
        </CardContent>
      </Card>

      {/* Form Modal */}
      <WarehouseForm
        open={formOpen}
        onOpenChange={setFormOpen}
        warehouse={selectedWarehouse}
        onSuccess={handleFormSuccess}
        token={token}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        warehouseName={selectedWarehouse?.name || ''}
        onConfirm={confirmDelete}
        loading={deleting}
      />
    </div>
  );
};

