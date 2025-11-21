import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, ArrowLeft, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { inventoryApiClient, InventoryTransaction } from '@/lib/inventoryApiClient';
import { InventoryHistoryTable } from '@/components/inventory/InventoryHistoryTable';
import { InventoryHistoryFilters } from '@/components/inventory/InventoryHistoryFilters';
import { Product } from '@/components/inventory/ProductSearchDropdown';

export const InventoryHistoryPage: React.FC = () => {
  const { user, getToken } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Initialize with today's date by default (in local timezone)
  const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [warehouseId, setWarehouseId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [date, setDate] = useState(getTodayDateString());

  useEffect(() => {
    if (user) {
      loadHistory();
    }
  }, [user, warehouseId, selectedProduct, date]);

  const loadHistory = async () => {
    if (!user) return;

    const token = await getToken();
    if (!token) return;

    setLoading(true);
    try {
      // Convert single date to date range (start and end of day) in UTC
      // Use 'Z' suffix to ensure UTC timezone
      const fromDateISO = date ? new Date(date + 'T00:00:00Z').toISOString() : undefined;
      const toDateISO = date ? new Date(date + 'T23:59:59Z').toISOString() : undefined;

      const data = await inventoryApiClient.getInventoryHistory(
        token,
        warehouseId || undefined,
        selectedProduct?.id,
        fromDateISO,
        toDateISO
      );
      setTransactions(data);
    } catch (error: any) {
      console.error('Failed to load inventory history', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load inventory history',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const navigateDate = (direction: 'prev' | 'next' | 'today') => {
    const currentDate = date || getTodayDateString();
    let newDateString: string;
    
    if (direction === 'today') {
      newDateString = getTodayDateString();
    } else {
      // Parse as local date for navigation
      const [year, month, day] = currentDate.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day);
      
      if (direction === 'prev') {
        dateObj.setDate(dateObj.getDate() - 1);
      } else {
        dateObj.setDate(dateObj.getDate() + 1);
      }
      
      // Format back as YYYY-MM-DD
      const newYear = dateObj.getFullYear();
      const newMonth = String(dateObj.getMonth() + 1).padStart(2, '0');
      const newDay = String(dateObj.getDate()).padStart(2, '0');
      newDateString = `${newYear}-${newMonth}-${newDay}`;
    }
    
    setDate(newDateString);
  };

  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return 'No date';
    // Parse as local date (not UTC) for display purposes
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isToday = (dateString: string): boolean => {
    if (!dateString) return false;
    const today = getTodayDateString();
    return dateString === today;
  };

  const handleProductSelect = (product: Product | null) => {
    setSelectedProduct(product);
    if (product) {
      setProductSearch(product.name);
    } else {
      setProductSearch('');
    }
  };

  const handleClearFilters = () => {
    setWarehouseId(null);
    setSelectedProduct(null);
    setProductSearch('');
    setDate(getTodayDateString());
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Authentication Required</h2>
          <p className="text-muted-foreground">Please log in to access inventory history</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">Inventory History</CardTitle>
            <div className="flex flex-col gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin/inventory')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Inventory
              </Button>
              <Button variant="outline" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-6">
            <InventoryHistoryFilters
              warehouseId={warehouseId}
              onWarehouseChange={setWarehouseId}
              productSearch={productSearch}
              onProductSearchChange={setProductSearch}
              selectedProduct={selectedProduct}
              onProductSelect={handleProductSelect}
              token=""
              getToken={getToken}
            />
          </div>
        </CardContent>

        {/* Date Selection with Navigation */}
        <CardContent className="border-t pt-4 w-full max-w-full overflow-hidden">
          <div className="flex flex-col items-center gap-3 sm:gap-4 w-full">
            {/* Date Navigation Arrows and Today Button - Centered */}
            <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-center w-full px-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateDate('prev')}
                title="Previous day"
                className="h-8 px-2 sm:px-3 flex-shrink-0"
              >
                <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              
              <div className="flex items-center gap-1 sm:gap-2 flex-1 sm:flex-initial min-w-0 max-w-full px-1 sm:px-2">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground hidden sm:block flex-shrink-0" />
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full sm:w-auto min-w-[100px] sm:min-w-[140px] text-xs sm:text-sm h-8 sm:h-10 flex-shrink-0"
                />
              </div>
              
              <Button
                variant={isToday(date) ? "default" : "outline"}
                size="sm"
                onClick={() => navigateDate('today')}
                title="Go to today"
                className={`hidden sm:inline-flex h-8 sm:h-10 flex-shrink-0 ${isToday(date) ? 'bg-primary text-primary-foreground' : ''}`}
              >
                Today
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateDate('next')}
                title="Next day"
                className="h-8 px-2 sm:px-3 flex-shrink-0"
              >
                <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>
            
            {/* Date Display Text - Below */}
            <div className="flex items-center gap-2 flex-wrap justify-center text-center px-2 w-full">
              <span className="text-xs sm:text-sm font-medium text-muted-foreground">Viewing inventory history for:</span>
              <span className={`text-xs sm:text-sm font-semibold ${isToday(date) ? 'text-primary' : ''}`}>
                {formatDateForDisplay(date)}
                {isToday(date) && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
                    Today
                  </span>
                )}
              </span>
            </div>
          </div>
        </CardContent>

        {/* Table */}
        <CardContent>
          <InventoryHistoryTable transactions={transactions} loading={loading} />
        </CardContent>
      </Card>
    </div>
  );
};

