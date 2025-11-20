import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, ClipboardList, ShieldAlert, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { adminOrdersApiClient, AdminOrderFilters, OrderHistoryEntry } from '@/lib/adminOrdersApiClient';
import { ordersApiClient, Order } from '@/lib/ordersApiClient';
import { usersApiClient, CurrentUserProfile } from '@/lib/usersApiClient';
import { websocketClient } from '@/lib/websocketClient';

const STATUS_OPTIONS = [
  'PENDING_PAYMENT',
  'PENDING_PAYMENT_VERIFICATION',
  'PAID',
  'READY_FOR_PICKUP',
  'READY_FOR_DELIVERY',
  'OUT_FOR_DELIVERY',
  'COMPLETE',
  'CANCELLED',
];

const STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: 'Pending Payment',
  PENDING_PAYMENT_VERIFICATION: 'Pending Payment Verification',
  PAID: 'Paid',
  READY_FOR_PICKUP: 'Ready for Pickup',
  READY_FOR_DELIVERY: 'Ready for Delivery',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  COMPLETE: 'Complete',
  CANCELLED: 'Cancelled',
};

const ACTIONABLE_STATUSES = [
  'PAID',
  'READY_FOR_PICKUP',
  'READY_FOR_DELIVERY',
  'OUT_FOR_DELIVERY',
  'COMPLETE',
  'CANCELLED',
];

// Get available statuses based on order type and current status
const getAvailableStatuses = (orderType: string | undefined, currentStatus: string | undefined): string[] => {
  let availableStatuses = ACTIONABLE_STATUSES;
  
  // Filter by order type
  if (orderType) {
    const orderTypeLower = orderType.toLowerCase();
    
    if (orderTypeLower === 'pickup') {
      // For pickup orders, exclude delivery-specific statuses
      availableStatuses = availableStatuses.filter(
        status => status !== 'READY_FOR_DELIVERY' && status !== 'OUT_FOR_DELIVERY'
      );
    } else if (orderTypeLower === 'delivery') {
      // For delivery orders, exclude pickup-specific statuses
      availableStatuses = availableStatuses.filter(
        status => status !== 'READY_FOR_PICKUP'
      );
    }
  }
  
  // Exclude the current status to prevent updating to the same status
  if (currentStatus) {
    availableStatuses = availableStatuses.filter(
      status => status !== currentStatus
    );
  }
  
  return availableStatuses;
};

const AdminOrdersPage: React.FC = () => {
  const { user, loading: authLoading, signInWithGoogle, getToken } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState<CurrentUserProfile | null>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [isForbidden, setIsForbidden] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState({ page: 0, size: 50, totalPages: 0, totalItems: 0 });
  
  // Initialize with today's date by default
  const getTodayDateString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };
  
  const [filters, setFilters] = useState({ 
    status: 'all', 
    assigned: 'all',
    orderType: 'all',
    date: getTodayDateString() // Single date instead of from/to
  });
  const [admins, setAdmins] = useState<Array<{ id: string; displayName: string | null; email: string }>>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderHistory, setOrderHistory] = useState<OrderHistoryEntry[]>([]);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [assigning, setAssigning] = useState<boolean>(false);
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastLoadTime, setLastLoadTime] = useState<number>(0);
  const recentOrderIds = useRef<Set<string>>(new Set());

  const statusOptions = useMemo(() => STATUS_OPTIONS, []);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    if (!user) {
      setCurrentUser(null);
      setIsAuthorized(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const token = await getToken();
        if (!token) {
          setIsAuthorized(false);
          return;
        }
        const profile = await usersApiClient.getCurrentUser(token);
        if (cancelled) return;
        setCurrentUser(profile);
        const role = profile.role?.toUpperCase();
        const authorized = role === 'ADMIN' || role === 'SUPERADMIN';
        setIsAuthorized(authorized);
        setIsForbidden(!authorized);
      } catch (error) {
        console.error('Failed to load current user profile', error);
        setIsAuthorized(false);
        setIsForbidden(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading, getToken]);

  const loadOrders = async (page = 0) => {
    if (!user) {
      return;
    }
    setLoading(true);
    setErrorMessage(null);

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Unable to obtain authentication token');
      }

      const assignedTo = filters.assigned === 'me' && currentUser ? currentUser.id : 
                        filters.assigned !== 'all' ? filters.assigned : undefined;
      // Use the same date for both from and to to show orders for a single day
      const dateFilter = filters.date || getTodayDateString();
      const response = await adminOrdersApiClient.getOrders({
        page,
        size: pagination.size,
        status: filters.status === 'all' ? undefined : filters.status,
        assignedTo,
        orderType: filters.orderType === 'all' ? undefined : filters.orderType,
        from: dateFilter,
        to: dateFilter,
      }, token);

      // Use API response as source of truth - it has the most up-to-date data
      // WebSocket will add new orders that aren't in this list
      setOrders(response.data);
      
      // Track all order IDs from API response to prevent duplicates
      // Merge with existing set to maintain history across API calls (prevents race conditions)
      response.data.forEach(o => {
        if (o.id) recentOrderIds.current.add(o.id.toString());
        if (o.orderNumber) recentOrderIds.current.add(o.orderNumber);
      });
      
      setPagination({
        page: response.page,
        size: response.size,
        totalPages: response.totalPages,
        totalItems: response.totalItems,
      });
      setLastLoadTime(Date.now()); // Track when we last loaded orders
      setIsForbidden(false);
    } catch (error) {
      console.error('Failed to load admin orders', error);
      const err = error as Error & { status?: number };
      if (err.status === 403 || err.status === 401) {
        setIsForbidden(true);
      } else {
        setErrorMessage(err.message);
        toast({
          title: 'Failed to load orders',
          description: err.message,
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || !isAuthorized) {
      return;
    }
    loadOrders(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isAuthorized, filters]);

  // Load admins on mount
  useEffect(() => {
    const loadAdmins = async () => {
      if (!user || !isAuthorized) {
        return;
      }
      try {
        const token = await getToken();
        if (!token) {
          return;
        }
        const adminList = await adminOrdersApiClient.getAllAdmins(token);
        setAdmins(adminList);
      } catch (error) {
        console.error('Failed to load admins', error);
      }
    };
    loadAdmins();
  }, [user, isAuthorized, getToken]);

  // Connect to WebSocket for real-time order updates
  useEffect(() => {
    if (!user || !isAuthorized) {
      try {
        websocketClient.disconnect();
      } catch (error) {
        console.error('Error disconnecting WebSocket:', error);
      }
      return;
    }

    const handleNewOrder = (order: Order) => {
      console.log('🆕 handleNewOrder called with order:', order.orderNumber, order.id, order.fulfillmentStatus);
      console.log('🆕 Current filters:', filters);
      console.log('🆕 Current pagination:', pagination);
      
      // If we just loaded orders (within last 10 seconds), skip adding via WebSocket
      // The order will be in the API response, so we don't need to add it again
      const timeSinceLastLoad = Date.now() - lastLoadTime;
      if (timeSinceLastLoad < 10000) {
        console.log('⏭️ Skipping WebSocket order - orders were just loaded from API (within 10s)');
        return;
      }
      
      // STRICT DEDUPLICATION: Check if order already exists BEFORE any state updates
      const orderIdStr = order.id?.toString() || '';
      const orderNumber = order.orderNumber || '';
      
      // Check recent orders set first (synchronous check)
      if (orderIdStr && recentOrderIds.current.has(orderIdStr)) {
        console.log('⚠️ Order ID already in recent orders set, skipping duplicate:', orderIdStr);
        return;
      }
      if (orderNumber && recentOrderIds.current.has(orderNumber)) {
        console.log('⚠️ Order number already in recent orders set, skipping duplicate:', orderNumber);
        return;
      }
      
      // Also check current orders state (need to use a callback to access current state)
      setOrders((prevOrders) => {
        // Check by ID (most reliable)
        if (orderIdStr) {
          const existsById = prevOrders.some((o) => o.id?.toString() === orderIdStr);
          if (existsById) {
            console.log('⚠️ Order already exists in list by ID, skipping duplicate:', orderIdStr);
            // Still add to recent set to prevent future duplicates
            recentOrderIds.current.add(orderIdStr);
            if (orderNumber) recentOrderIds.current.add(orderNumber);
            return prevOrders;
          }
        }
        
        // Check by order number
        if (orderNumber) {
          const existsByOrderNumber = prevOrders.some((o) => o.orderNumber === orderNumber);
          if (existsByOrderNumber) {
            console.log('⚠️ Order already exists in list by order number, skipping duplicate:', orderNumber);
            // Still add to recent set to prevent future duplicates
            if (orderIdStr) recentOrderIds.current.add(orderIdStr);
            recentOrderIds.current.add(orderNumber);
            return prevOrders;
          }
        }
        
        // Additional check: if same customer email, same total, and same timestamp (within 1 second), likely duplicate
        if (order.guestEmail && order.totalPrice) {
          const potentialDuplicate = prevOrders.find((o) => {
            const sameEmail = o.guestEmail === order.guestEmail;
            const sameTotal = o.totalPrice === order.totalPrice;
            const sameTime = Math.abs(new Date(o.createdAt).getTime() - new Date(order.createdAt).getTime()) < 1000;
            return sameEmail && sameTotal && sameTime;
          });
          
          if (potentialDuplicate) {
            console.log('⚠️ Potential duplicate detected (same email, total, timestamp), skipping:', orderNumber);
            // Still add to recent set to prevent future duplicates
            if (orderIdStr) recentOrderIds.current.add(orderIdStr);
            if (orderNumber) recentOrderIds.current.add(orderNumber);
            return prevOrders;
          }
        }
        
        // Check if order matches current filters before adding
        const matchesFilters = () => {
          // Check status filter
          if (filters.status !== 'all' && order.fulfillmentStatus !== filters.status) {
            console.log('❌ Order does not match status filter:', order.fulfillmentStatus, 'vs', filters.status);
            return false;
          }
          
          // Check assigned filter
          if (filters.assigned === 'me' && currentUser && order.assignedToUserId !== currentUser.id) {
            console.log('❌ Order does not match assigned filter');
            return false;
          }
          
          // Check assigned filter for specific admin
          if (filters.assigned !== 'all' && filters.assigned !== 'me' && order.assignedToUserId !== filters.assigned) {
            console.log('❌ Order does not match assigned admin filter');
            return false;
          }
          
          // Check order type filter
          if (filters.orderType !== 'all' && order.orderType !== filters.orderType) {
            console.log('❌ Order does not match order type filter:', order.orderType, 'vs', filters.orderType);
            return false;
          }
          
          // Check date filter - only show orders from the selected date
          if (filters.date) {
            const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
            if (orderDate !== filters.date) {
              console.log('❌ Order does not match date filter:', orderDate, 'vs', filters.date);
              return false;
            }
          }
          
          console.log('✅ Order matches filters');
          return true;
        };

        if (!matchesFilters()) {
          return prevOrders;
        }
        
        // Add to recent orders set IMMEDIATELY to prevent race conditions
        if (orderIdStr) recentOrderIds.current.add(orderIdStr);
        if (orderNumber) recentOrderIds.current.add(orderNumber);
        
        console.log('✅ Adding new order to list:', orderNumber);
        
        // Add new order to the beginning of the list if we're on the first page
        if (pagination.page === 0) {
          setPagination((prev) => ({
            ...prev,
            totalItems: prev.totalItems + 1,
          }));
          toast({
            title: 'New order received',
            description: `Order ${orderNumber} has been placed`,
          });
          return [order, ...prevOrders];
        } else {
          // If not on first page, just update the total count
          setPagination((prev) => ({
            ...prev,
            totalItems: prev.totalItems + 1,
          }));
          return prevOrders;
        }
      });
    };

    const handleOrderUpdate = (order: Order) => {
      const orderIdStr = order.id?.toString() || '';
      const orderNumber = order.orderNumber || '';
      
      // STRICT DEDUPLICATION: Check if this is actually a new order being sent as an update
      // If order doesn't exist in list and wasn't recently loaded, treat it as new (with deduplication)
      setOrders((prevOrders) => {
        const index = prevOrders.findIndex((o) => o.id?.toString() === orderIdStr);
        if (index >= 0) {
          // Order exists - update it
          const updated = [...prevOrders];
          updated[index] = order;
          return updated;
        }
        
        // Order doesn't exist - check if it's a duplicate before adding
        // Check recent orders set first
        if (orderIdStr && recentOrderIds.current.has(orderIdStr)) {
          console.log('⚠️ Order update for order already in recent set, skipping:', orderIdStr);
          return prevOrders;
        }
        if (orderNumber && recentOrderIds.current.has(orderNumber)) {
          console.log('⚠️ Order update for order number already in recent set, skipping:', orderNumber);
          return prevOrders;
        }
        
        // Check by order number in current list
        if (orderNumber && prevOrders.some((o) => o.orderNumber === orderNumber)) {
          console.log('⚠️ Order update for order number already in list, skipping:', orderNumber);
          if (orderIdStr) recentOrderIds.current.add(orderIdStr);
          recentOrderIds.current.add(orderNumber);
          return prevOrders;
        }
        
        // Additional duplicate check
        if (order.guestEmail && order.totalPrice) {
          const potentialDuplicate = prevOrders.find((o) => {
            const sameEmail = o.guestEmail === order.guestEmail;
            const sameTotal = o.totalPrice === order.totalPrice;
            const sameTime = Math.abs(new Date(o.createdAt).getTime() - new Date(order.createdAt).getTime()) < 1000;
            return sameEmail && sameTotal && sameTime;
          });
          
          if (potentialDuplicate) {
            console.log('⚠️ Order update for potential duplicate, skipping:', orderNumber);
            if (orderIdStr) recentOrderIds.current.add(orderIdStr);
            if (orderNumber) recentOrderIds.current.add(orderNumber);
            return prevOrders;
          }
        }
        
        // If we just loaded orders (within last 10 seconds), skip adding via WebSocket update
        const timeSinceLastLoad = Date.now() - lastLoadTime;
        if (timeSinceLastLoad < 10000) {
          console.log('⏭️ Skipping WebSocket order update - orders were just loaded from API (within 10s)');
          return prevOrders;
        }
        
        // Check if order matches current filters before adding
        const matchesFilters = () => {
          if (filters.status !== 'all' && order.fulfillmentStatus !== filters.status) {
            return false;
          }
          if (filters.assigned === 'me' && currentUser && order.assignedToUserId !== currentUser.id) {
            return false;
          }
          if (filters.assigned !== 'all' && filters.assigned !== 'me' && order.assignedToUserId !== filters.assigned) {
            return false;
          }
          if (filters.orderType !== 'all' && order.orderType !== filters.orderType) {
            return false;
          }
          if (filters.date) {
            const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
            if (orderDate !== filters.date) {
              return false;
            }
          }
          return true;
        };

        if (!matchesFilters()) {
          return prevOrders;
        }
        
        // Add to recent orders set IMMEDIATELY
        if (orderIdStr) recentOrderIds.current.add(orderIdStr);
        if (orderNumber) recentOrderIds.current.add(orderNumber);
        
        console.log('✅ Adding order from update message (wasn\'t in list):', orderNumber);
        
        // Add new order to the beginning of the list if we're on the first page
        if (pagination.page === 0) {
          setPagination((prev) => ({
            ...prev,
            totalItems: prev.totalItems + 1,
          }));
          return [order, ...prevOrders];
        } else {
          setPagination((prev) => ({
            ...prev,
            totalItems: prev.totalItems + 1,
          }));
          return prevOrders;
        }
      });

      // If the selected order was updated, refresh it
      if (selectedOrderId === order.id) {
        setSelectedOrder(order);
      }
    };

    try {
      websocketClient.connect(handleNewOrder, handleOrderUpdate, (error) => {
        console.error('WebSocket error:', error);
        // Don't crash the page if WebSocket fails - it's optional for real-time updates
      });
    } catch (error) {
      console.error('Failed to connect WebSocket (non-critical):', error);
      // Continue without WebSocket - page will still work, just without real-time updates
    }

    return () => {
      try {
        websocketClient.disconnect();
      } catch (error) {
        console.error('Error disconnecting WebSocket:', error);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isAuthorized, filters, pagination.page, currentUser, selectedOrderId]);

  const openOrderDetail = async (orderId: string) => {
    if (!user) return;
    setSelectedOrderId(orderId);
    setDetailLoading(true);

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Unable to obtain authentication token');
      }
      const orderDetail = await ordersApiClient.getOrder(orderId, token);
      setSelectedOrder(orderDetail);
      const history = await adminOrdersApiClient.getOrderHistory(orderId, token);
      setOrderHistory(history);
    } catch (error) {
      console.error('Failed to load order detail', error);
      toast({
        title: 'Failed to load order detail',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelectedOrderId(null);
    setSelectedOrder(null);
    setOrderHistory([]);
  };

  const handleAssignToMe = async () => {
    if (!selectedOrderId || !currentUser) return;
    setAssigning(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Unable to obtain authentication token');
      const updatedOrder = await adminOrdersApiClient.assignToMe(selectedOrderId, token);
      setSelectedOrder(updatedOrder);
      await loadOrders(pagination.page);
      const history = await adminOrdersApiClient.getOrderHistory(selectedOrderId, token);
      setOrderHistory(history);
      toast({ title: 'Order assigned', description: 'You are now responsible for this order.' });
    } catch (error) {
      console.error('Failed to assign order', error);
      toast({
        title: 'Failed to assign order',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setAssigning(false);
    }
  };

  // Date navigation functions
  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return 'No date';
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  const navigateDate = (direction: 'prev' | 'next' | 'today') => {
    const currentDate = filters.date || getTodayDateString();
    const date = new Date(currentDate + 'T00:00:00');
    let newDateString: string;
    
    if (direction === 'today') {
      newDateString = getTodayDateString();
    } else if (direction === 'prev') {
      date.setDate(date.getDate() - 1);
      newDateString = date.toISOString().split('T')[0];
    } else {
      date.setDate(date.getDate() + 1);
      newDateString = date.toISOString().split('T')[0];
    }
    
    // Update filters - the useEffect will automatically reload orders
    setFilters({ ...filters, date: newDateString });
    // Reset to first page when changing dates
    setPagination((prev) => ({ ...prev, page: 0 }));
  };

  const handleStatusChange = async (status: string) => {
    if (!selectedOrderId) return;
    if (status === 'CANCELLED') {
      const confirmCancel = window.confirm('Are you sure you want to cancel this order?');
      if (!confirmCancel) {
        return;
      }
    }

    setUpdatingStatus(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Unable to obtain authentication token');
      const updatedOrder = await adminOrdersApiClient.updateStatus(selectedOrderId, status, token);
      setSelectedOrder(updatedOrder);
      await loadOrders(pagination.page);
      const history = await adminOrdersApiClient.getOrderHistory(selectedOrderId, token);
      setOrderHistory(history);
      toast({ title: 'Order updated', description: `Order marked as ${STATUS_LABELS[status] ?? status}.` });
    } catch (error) {
      console.error('Failed to update order status', error);
      toast({
        title: 'Failed to update order status',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const renderFilters = () => (
    <Card>
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="status-filter">Fulfillment Status</Label>
          <Select
            value={filters.status}
            onValueChange={(value) => {
              setFilters((prev) => ({ ...prev, status: value }));
              setPagination((prev) => ({ ...prev, page: 0 }));
            }}
          >
            <SelectTrigger id="status-filter">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {statusOptions.map((status) => (
                <SelectItem key={status} value={status}>
                  {STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="assigned-filter">Assigned</Label>
          <Select
            value={filters.assigned}
            onValueChange={(value) => {
              setFilters((prev) => ({ ...prev, assigned: value }));
              setPagination((prev) => ({ ...prev, page: 0 }));
            }}
          >
            <SelectTrigger id="assigned-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All orders</SelectItem>
              <SelectItem value="me" disabled={!currentUser}>Assigned to me</SelectItem>
              {admins.map((admin) => (
                <SelectItem key={admin.id} value={admin.id}>
                  {admin.displayName || admin.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="order-type-filter">Order Type</Label>
          <Select
            value={filters.orderType}
            onValueChange={(value) => {
              setFilters((prev) => ({ ...prev, orderType: value }));
              setPagination((prev) => ({ ...prev, page: 0 }));
            }}
          >
            <SelectTrigger id="order-type-filter">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="pickup">Pickup</SelectItem>
              <SelectItem value="delivery">Delivery</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
      
      {/* Date Selection with Navigation */}
      <CardContent className="border-t pt-4">
        <div className="flex flex-col items-center gap-4">
          {/* Date Navigation Arrows and Today Button - Centered */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDate('prev')}
              title="Previous day"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-2 px-4">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={filters.date}
                onChange={(e) => {
                  setFilters((prev) => ({ ...prev, date: e.target.value }));
                  setPagination((prev) => ({ ...prev, page: 0 }));
                }}
                className="w-auto"
              />
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDate('today')}
              title="Go to today"
            >
              Today
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDate('next')}
              title="Next day"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Date Display Text - Below */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Viewing orders for:</span>
            <span className="text-sm font-semibold text-brandText">
              {formatDateForDisplay(filters.date)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderOrdersTable = () => (
    <Card>
      <CardHeader>
        <CardTitle>Orders</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">Order #</th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">Created</th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">Customer</th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">Total</th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">Status</th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">Assigned To</th>
              <th className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-brandText">{order.orderNumber}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {new Date(order.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  <div className="flex flex-col">
                    <span>{order.guestName || '—'}</span>
                    <span className="text-xs text-gray-500">{order.guestEmail || '—'}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-brand">${order.totalPrice.toFixed(2)}</td>
                <td className="px-4 py-3 text-sm">
                  <Badge variant="secondary">{STATUS_LABELS[order.fulfillmentStatus] ?? order.fulfillmentStatus}</Badge>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  <Select
                    value={order.assignedToUserId || 'unassigned'}
                    onValueChange={async (value) => {
                      if (value === order.assignedToUserId) {
                        return; // No change
                      }
                      try {
                        const token = await getToken();
                        if (!token) {
                          throw new Error('Unable to obtain authentication token');
                        }
                        if (value === 'unassigned') {
                          // Unassign order
                          await adminOrdersApiClient.unassignOrder(order.id, token);
                          await loadOrders(pagination.page);
                          toast({
                            title: 'Order unassigned',
                            description: `Order ${order.orderNumber} has been unassigned`,
                          });
                        } else {
                          // Assign to admin
                          await adminOrdersApiClient.assignToAdmin(order.id, value, token);
                          await loadOrders(pagination.page);
                          toast({
                            title: 'Order assigned',
                            description: `Order ${order.orderNumber} has been assigned`,
                          });
                        }
                      } catch (error) {
                        console.error('Failed to update order assignment', error);
                        toast({
                          title: 'Failed to update assignment',
                          description: (error as Error).message,
                          variant: 'destructive',
                        });
                      }
                    }}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {admins.map((admin) => (
                        <SelectItem key={admin.id} value={admin.id}>
                          {admin.displayName || admin.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button variant="outline" size="sm" onClick={() => openOrderDetail(order.id)}>
                    View
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {orders.length === 0 && !loading && (
          <div className="py-8 text-center text-muted-foreground">No orders found for the selected filters.</div>
        )}
      </CardContent>
    </Card>
  );

  const renderPagination = () => (
    <div className="flex items-center justify-between">
      <div className="text-sm text-muted-foreground">
        Page {pagination.page + 1} of {Math.max(pagination.totalPages, 1)} · {pagination.totalItems} orders
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={pagination.page === 0 || loading}
          onClick={() => loadOrders(Math.max(pagination.page - 1, 0))}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={pagination.page >= pagination.totalPages - 1 || loading}
          onClick={() => loadOrders(Math.min(pagination.page + 1, pagination.totalPages - 1))}
        >
          Next
        </Button>
      </div>
    </div>
  );

  const renderShippingAddress = () => {
    if (!selectedOrder?.shippingAddress) {
      return <p className="text-sm text-muted-foreground">No shipping address provided.</p>;
    }
    try {
      const parsed = JSON.parse(selectedOrder.shippingAddress) as Record<string, unknown>;
      return (
        <div className="text-sm text-muted-foreground space-y-1">
          {Object.entries(parsed).map(([key, value]) => (
            <div key={key}>
              <span className="font-medium text-brandText capitalize mr-2">{key}:</span>
              <span>{String(value)}</span>
            </div>
          ))}
        </div>
      );
    } catch {
      return <p className="text-sm text-muted-foreground">{selectedOrder.shippingAddress}</p>;
    }
  };

  const renderHistory = () => {
    const parsePayload = (payload: string | null) => {
      if (!payload) return null;
      try {
        return JSON.parse(payload);
      } catch {
        return null;
      }
    };

    if (orderHistory.length === 0) {
      return <p className="text-sm text-muted-foreground">No history available.</p>;
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-700">Action</th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-700">Previous Status</th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-700">New Status</th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-700">Actor</th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-700">Date & Time</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orderHistory.map((entry) => {
              const payload = parsePayload(entry.payload);
              const previousStatus = payload?.previousStatus || payload?.previous_status;
              const newStatus = payload?.newStatus || payload?.new_status;
              
              return (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-brandText">{entry.action}</td>
                  <td className="px-4 py-3 text-sm">
                    {previousStatus ? (
                      <Badge variant="secondary" className="text-xs">
                        {STATUS_LABELS[previousStatus] || previousStatus}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {newStatus ? (
                      <Badge variant="secondary" className="text-xs">
                        {STATUS_LABELS[newStatus] || newStatus}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {entry.actor ? (entry.actor.displayName || entry.actor.email || entry.actor.id) : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {new Date(entry.createdAt).toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-20 flex justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-brand" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-20 flex flex-col items-center space-y-4">
        <ShieldAlert className="h-12 w-12 text-brand" />
        <h1 className="text-2xl font-semibold text-brandText">Admin Access Required</h1>
        <p className="text-muted-foreground text-center max-w-md">
          You need to log in with your admin account to view the orders dashboard.
        </p>
        <Button onClick={() => signInWithGoogle()}>Login with Google</Button>
      </div>
    );
  }

  if (isForbidden) {
    return (
      <div className="container mx-auto px-4 py-20 flex flex-col items-center space-y-4">
        <ShieldAlert className="h-12 w-12 text-red-500" />
        <h1 className="text-2xl font-semibold text-brandText">Access Denied</h1>
        <p className="text-muted-foreground text-center max-w-md">
          Your account does not have permission to view the admin orders dashboard.
        </p>
        <Button variant="outline" onClick={() => navigate('/')}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-2">
        <ClipboardList className="h-6 w-6 text-brand" />
        <h1 className="text-2xl font-bold text-brandText">Admin Orders Dashboard</h1>
      </div>

      {renderFilters()}

      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-brand" />
        </div>
      ) : (
        <>
          {errorMessage && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errorMessage}</div>
          )}
          {renderOrdersTable()}
          {renderPagination()}
        </>
      )}

      <Dialog open={Boolean(selectedOrderId)} onOpenChange={(open) => !open && closeDetail()}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>

          {detailLoading || !selectedOrder ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="h-10 w-10 animate-spin text-brand" />
            </div>
          ) : (
            <div className="space-y-6 overflow-y-auto pr-2 flex-1">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h3 className="font-semibold text-brandText">Order Info</h3>
                  <p className="text-sm text-muted-foreground">Order #: {selectedOrder.orderNumber}</p>
                  <p className="text-sm text-muted-foreground">Created: {new Date(selectedOrder.createdAt).toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Payment Status: {selectedOrder.paymentStatus}</p>
                  <p className="text-sm text-muted-foreground">Fulfillment Status: {STATUS_LABELS[selectedOrder.fulfillmentStatus] ?? selectedOrder.fulfillmentStatus}</p>
                  <p className="text-sm text-muted-foreground">
                    Assigned To: {selectedOrder.assignedToDisplayName || selectedOrder.assignedToUserId || 'Unassigned'}
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-brandText">Customer</h3>
                  <p className="text-sm text-muted-foreground">Name: {selectedOrder.guestName || '—'}</p>
                  <p className="text-sm text-muted-foreground">Email: {selectedOrder.guestEmail || '—'}</p>
                  <p className="text-sm text-muted-foreground">Total: ${selectedOrder.totalPrice.toFixed(2)}</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h3 className="font-semibold text-brandText">Items</h3>
                <div className="space-y-2">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <div>
                        <p className="font-medium text-brandText">{item.product_name}</p>
                        <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <div className="font-medium text-brand">
                        ${(item.unit_price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h3 className="font-semibold text-brandText">Shipping</h3>
                {renderShippingAddress()}
              </div>

              <Separator />

              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={handleAssignToMe}
                  disabled={assigning || (currentUser && selectedOrder.assignedToUserId === currentUser.id)}
                >
                  {assigning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Assign to Me
                </Button>

                <Select
                  onValueChange={handleStatusChange}
                  disabled={updatingStatus}
                >
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="Update status" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableStatuses(selectedOrder?.orderType, selectedOrder?.fulfillmentStatus).map((status) => (
                      <SelectItem key={status} value={status}>
                        {STATUS_LABELS[status] ?? status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-3">
                <h3 className="font-semibold text-brandText">Order History</h3>
                <div className="max-h-96 overflow-y-auto pr-2">
                  {renderHistory()}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrdersPage;
