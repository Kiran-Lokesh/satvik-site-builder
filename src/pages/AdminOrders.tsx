import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ChevronDown } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, ClipboardList, ShieldAlert, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { adminOrdersApiClient, AdminOrderFilters, OrderHistoryEntry } from '@/lib/adminOrdersApiClient';
import { ordersApiClient, Order } from '@/lib/ordersApiClient';
import { usersApiClient, CurrentUserProfile } from '@/lib/usersApiClient';
import { websocketClient } from '@/lib/websocketClient';
import { inventoryApiClient, InventoryItem } from '@/lib/inventoryApiClient';
import { ConfirmProcessingModal } from '@/components/orders/ConfirmProcessingModal';

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
  
  // Initialize with today's date by default (in local timezone)
  const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const [filters, setFilters] = useState({ 
    status: 'all', 
    assigned: 'all',
    orderType: 'all',
    date: getTodayDateString() // Single date instead of from/to
  });
  const [admins, setAdmins] = useState<Array<{ id: string; displayName: string | null; email: string }>>([]);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [orderDetails, setOrderDetails] = useState<Map<string, { order: Order; history: OrderHistoryEntry[] }>>(new Map());
  const [loadingDetails, setLoadingDetails] = useState<Set<string>>(new Set());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastLoadTime, setLastLoadTime] = useState<number>(0);
  const recentOrderIds = useRef<Set<string>>(new Set());
  const [confirmProcessingModal, setConfirmProcessingModal] = useState<{ open: boolean; order: Order | null }>({ open: false, order: null });
  const [processingOrder, setProcessingOrder] = useState<string | null>(null);
  const [orderInventory, setOrderInventory] = useState<Map<string, InventoryItem[]>>(new Map());

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
      
      // Convert date string (YYYY-MM-DD) to UTC ISO strings for API
      // Parse as local date, then convert to UTC
      const dateFilter = filters.date || getTodayDateString();
      let fromDateISO: string | undefined;
      let toDateISO: string | undefined;
      
      if (dateFilter) {
        // Parse date string as local date (not UTC)
        const [year, month, day] = dateFilter.split('-').map(Number);
        
        // Create Date objects for start and end of day in LOCAL timezone
        const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
        const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);
        
        // Convert to UTC ISO strings for API
        fromDateISO = startOfDay.toISOString();
        toDateISO = endOfDay.toISOString();
      }
      
      const response = await adminOrdersApiClient.getOrders({
        page,
        size: pagination.size,
        status: filters.status === 'all' ? undefined : filters.status,
        assignedTo,
        orderType: filters.orderType === 'all' ? undefined : filters.orderType,
        from: fromDateISO,
        to: toDateISO,
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

      // If the order details are cached, update them
      setOrderDetails(prev => {
        if (prev.has(order.id)) {
          const next = new Map(prev);
          const existing = next.get(order.id);
          if (existing) {
            next.set(order.id, { ...existing, order });
          }
          return next;
        }
        return prev;
      });
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
  }, [user, isAuthorized, filters, pagination.page, currentUser]);

  const loadOrderDetails = async (orderId: string) => {
    if (!user || orderDetails.has(orderId)) return; // Already loaded
    
    setLoadingDetails(prev => new Set(prev).add(orderId));
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Unable to obtain authentication token');
      }
      const [orderDetail, history] = await Promise.all([
        ordersApiClient.getOrder(orderId, token),
        adminOrdersApiClient.getOrderHistory(orderId, token)
      ]);
      setOrderDetails(prev => new Map(prev).set(orderId, { order: orderDetail, history }));
      
      // Load inventory availability if order is assigned to a warehouse
      if (orderDetail.assignedWarehouseId && orderDetail.items.length > 0) {
        loadOrderInventory(orderDetail, token);
      }
    } catch (error) {
      console.error('Failed to load order detail', error);
      toast({
        title: 'Failed to load order detail',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setLoadingDetails(prev => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
    }
  };

  const loadOrderInventory = async (order: Order, token: string) => {
    if (!order.assignedWarehouseId) return;
    
    try {
      const productIds = order.items.map(item => item.product_id).filter(Boolean);
      if (productIds.length === 0) return;
      
      const inventory = await inventoryApiClient.getInventoryByWarehouseAndProducts(
        token,
        order.assignedWarehouseId,
        productIds
      );
      setOrderInventory(prev => new Map(prev).set(order.id, inventory));
    } catch (error) {
      console.error('Failed to load order inventory', error);
      // Don't show toast for inventory loading errors - it's not critical
    }
  };

  const handleAccordionChange = (orderId: string, isOpen: boolean) => {
    if (isOpen) {
      setExpandedOrders(prev => new Set(prev).add(orderId));
      loadOrderDetails(orderId);
    } else {
      setExpandedOrders(prev => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
    }
  };

  const handleStatusUpdate = async (order: Order, newStatus: string) => {
    try {
      setProcessingOrder(order.id);
      const token = await getToken();
      if (!token) {
        throw new Error('Unable to obtain authentication token');
      }
      await adminOrdersApiClient.updateStatus(order.id, newStatus, token);
      await loadOrders(pagination.page);
      // Clear cached details to force refresh
      setOrderDetails(prev => {
        const next = new Map(prev);
        next.delete(order.id);
        return next;
      });
      toast({
        title: 'Order updated',
        description: `Order ${order.orderNumber} marked as ${STATUS_LABELS[newStatus] ?? newStatus}.`,
      });
    } catch (error) {
      console.error('Failed to update order status', error);
      const errorMessage = (error as Error).message;
      toast({
        title: 'Failed to update status',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setProcessingOrder(null);
    }
  };

  const handleConfirmProcessing = async () => {
    const order = confirmProcessingModal.order;
    if (!order) return;
    
    setConfirmProcessingModal({ open: false, order: null });
    await handleStatusUpdate(order, 'PAID');
  };

  const handleAssignToMe = async (order: Order) => {
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Unable to obtain authentication token');
      }
      await adminOrdersApiClient.assignToMe(order.id, token);
      await loadOrders(pagination.page);
      // Clear cached details to force refresh
      setOrderDetails(prev => {
        const next = new Map(prev);
        next.delete(order.id);
        return next;
      });
      toast({
        title: 'Order assigned',
        description: `Order ${order.orderNumber} has been assigned to you.`,
      });
    } catch (error) {
      console.error('Failed to assign order', error);
      const errorMessage = (error as Error).message;
      toast({
        title: 'Failed to assign order',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  // Date navigation functions
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

  const navigateDate = (direction: 'prev' | 'next' | 'today') => {
    const currentDate = filters.date || getTodayDateString();
    let newDateString: string;
    
    if (direction === 'today') {
      newDateString = getTodayDateString();
    } else {
      // Parse as local date for navigation
      const [year, month, day] = currentDate.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      
      if (direction === 'prev') {
        date.setDate(date.getDate() - 1);
      } else {
        date.setDate(date.getDate() + 1);
      }
      
      // Format back as YYYY-MM-DD
      const newYear = date.getFullYear();
      const newMonth = String(date.getMonth() + 1).padStart(2, '0');
      const newDay = String(date.getDate()).padStart(2, '0');
      newDateString = `${newYear}-${newMonth}-${newDay}`;
    }
    
    // Update filters - the useEffect will automatically reload orders
    setFilters({ ...filters, date: newDateString });
    // Reset to first page when changing dates
    setPagination((prev) => ({ ...prev, page: 0 }));
  };

  const renderOrderDetails = (order: Order, history: OrderHistoryEntry[]) => {
    const renderShippingAddress = () => {
      if (!order?.shippingAddress) {
        return <p className="text-sm text-muted-foreground">No shipping address provided.</p>;
      }
      try {
        const parsed = JSON.parse(order.shippingAddress) as Record<string, unknown>;
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
        return <p className="text-sm text-muted-foreground">{order.shippingAddress}</p>;
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

      if (history.length === 0) {
        return <p className="text-sm text-muted-foreground">No history available.</p>;
      }

      return (
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="min-w-[100px]">Action</TableHead>
              <TableHead className="min-w-[120px]">Previous Status</TableHead>
              <TableHead className="min-w-[120px]">New Status</TableHead>
              <TableHead className="min-w-[120px]">Actor</TableHead>
              <TableHead className="min-w-[150px]">Date & Time</TableHead>
            </TableRow>
          </TableHeader>
            <TableBody>
              {history.map((entry) => {
                const payload = parsePayload(entry.payload);
                const previousStatus = payload?.previousStatus || payload?.previous_status;
                const newStatus = payload?.newStatus || payload?.new_status;
                
                return (
                  <TableRow key={entry.id} className="hover:bg-transparent">
                    <TableCell className="font-medium">{entry.action}</TableCell>
                    <TableCell>
                      {previousStatus ? (
                        <Badge variant="secondary" className="text-xs">
                          {STATUS_LABELS[previousStatus] || previousStatus}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {newStatus ? (
                        <Badge variant="secondary" className="text-xs">
                          {STATUS_LABELS[newStatus] || newStatus}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {entry.actor ? (entry.actor.displayName || entry.actor.email || entry.actor.id) : '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(entry.createdAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      );
    };

    const inventory = orderInventory.get(order.id) || [];
    const getInventoryForProduct = (productId: string) => {
      return inventory.find(inv => inv.productId === productId);
    };

    return (
      <div className="space-y-6">
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          <div className="space-y-2">
            <h3 className="font-semibold text-brandText">Order Info</h3>
            <p className="text-sm text-muted-foreground">Order #: {order.orderNumber}</p>
            <p className="text-sm text-muted-foreground">Created: {new Date(order.createdAt).toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Payment Status: {order.paymentStatus}</p>
            <p className="text-sm text-muted-foreground">Fulfillment Status: {STATUS_LABELS[order.fulfillmentStatus] ?? order.fulfillmentStatus}</p>
            <p className="text-sm text-muted-foreground">
              Assigned To: {order.assignedToDisplayName || order.assignedToUserId || 'Unassigned'}
            </p>
            {order.assignedWarehouseName && (
              <p className="text-sm text-muted-foreground">
                Assigned Warehouse: <span className="font-semibold">{order.assignedWarehouseName}</span>
              </p>
            )}
            {order.inventoryReduced !== undefined && (
              <p className="text-sm">
                Inventory Status:{' '}
                {order.inventoryReduced ? (
                  <Badge variant="default" className="bg-green-500">Deducted</Badge>
                ) : (
                  <Badge variant="secondary">Not Deducted</Badge>
                )}
              </p>
            )}
            {!order.assignedToUserId && currentUser && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAssignToMe(order)}
                className="mt-2"
              >
                Assign to Me
              </Button>
            )}
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-brandText">Customer</h3>
            <p className="text-sm text-muted-foreground">Name: {order.guestName || '—'}</p>
            <p className="text-sm text-muted-foreground">Email: {order.guestEmail || '—'}</p>
            <p className="text-sm text-muted-foreground">Total: ${order.totalPrice.toFixed(2)}</p>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-brandText">Items</h3>
            {order.assignedWarehouseId && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigate(`/admin/inventory/history?warehouseId=${order.assignedWarehouseId}`)}
              >
                View Inventory History
              </Button>
            )}
          </div>
          <div className="space-y-2">
            {order.items.map((item) => {
              const itemInventory = getInventoryForProduct(item.product_id);
              const hasEnoughInventory = itemInventory ? itemInventory.quantity >= item.quantity : null;
              
              return (
                <div key={item.id} className="flex justify-between text-sm border rounded p-2">
                  <div className="flex-1">
                    <p className="font-medium text-brandText">{item.product_name}</p>
                    <p className="text-xs text-muted-foreground">Required: {item.quantity}</p>
                    {order.assignedWarehouseId && itemInventory && (
                      <p className={`text-xs ${hasEnoughInventory ? 'text-green-600' : 'text-red-600'}`}>
                        Available: {itemInventory.quantity} {hasEnoughInventory ? '✓' : '✗'}
                      </p>
                    )}
                    {order.assignedWarehouseId && !itemInventory && (
                      <p className="text-xs text-yellow-600">Product not found in warehouse</p>
                    )}
                  </div>
                  <div className="font-medium text-brand">
                    ${(item.unit_price * item.quantity).toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <h3 className="font-semibold text-brandText">Shipping</h3>
          {renderShippingAddress()}
        </div>

        <Separator />

        <div className="space-y-3">
          <h3 className="font-semibold text-brandText">Order History</h3>
          <div className="max-h-96 overflow-y-auto pr-2">
            {renderHistory()}
          </div>
        </div>
      </div>
    );
  };

  const renderFilters = () => (
    <Card className="w-full max-w-full overflow-hidden">
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 w-full">
        <div className="space-y-2">
          <Label htmlFor="status-filter">Fulfillment Status</Label>
          <Select
            value={filters.status}
            onValueChange={(value) => {
              setFilters((prev) => ({ ...prev, status: value }));
              setPagination((prev) => ({ ...prev, page: 0 }));
            }}
          >
            <SelectTrigger id="status-filter" className="w-full">
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
            <SelectTrigger id="assigned-filter" className="w-full">
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
            <SelectTrigger id="order-type-filter" className="w-full">
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
                value={filters.date}
                onChange={(e) => {
                  setFilters((prev) => ({ ...prev, date: e.target.value }));
                  setPagination((prev) => ({ ...prev, page: 0 }));
                }}
                className="w-full sm:w-auto min-w-[100px] sm:min-w-[140px] text-xs sm:text-sm h-8 sm:h-10 flex-shrink-0"
              />
            </div>
            
            <Button
              variant={isToday(filters.date) ? "default" : "outline"}
              size="sm"
              onClick={() => navigateDate('today')}
              title="Go to today"
              className={`hidden sm:inline-flex h-8 sm:h-10 flex-shrink-0 ${isToday(filters.date) ? 'bg-primary text-primary-foreground' : ''}`}
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
            <span className="text-xs sm:text-sm font-medium text-muted-foreground">Viewing orders for:</span>
            <span className={`text-xs sm:text-sm font-semibold ${isToday(filters.date) ? 'text-primary' : 'text-brandText'}`}>
              {formatDateForDisplay(filters.date)}
              {isToday(filters.date) && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
                  Today
                </span>
              )}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderOrdersTable = () => (
    <Card className="w-full max-w-full overflow-hidden">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Orders</CardTitle>
      </CardHeader>
      <CardContent className="w-full max-w-full overflow-hidden p-0">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="border rounded-lg overflow-x-auto w-full">
              <Table className="w-full min-w-[600px] sm:min-w-[800px]">
                <TableHeader className="sticky top-0 z-10 bg-background">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="min-w-[100px] sm:min-w-[120px]">Order #</TableHead>
                    <TableHead className="min-w-[120px] sm:min-w-[150px]">Created</TableHead>
                    <TableHead className="min-w-[120px] sm:min-w-[150px]">Customer</TableHead>
                    <TableHead className="min-w-[80px] sm:min-w-[100px]">Total</TableHead>
                    <TableHead className="min-w-[140px] sm:min-w-[180px]">Status</TableHead>
                    <TableHead className="min-w-[140px] sm:min-w-[180px]">Assigned To</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No orders found for the selected filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    orders.map((order) => {
                      const isExpanded = expandedOrders.has(order.id);
                      const details = orderDetails.get(order.id);
                      const isLoadingDetail = loadingDetails.has(order.id);
                      
                      return (
                        <React.Fragment key={order.id}>
                          <TableRow className="hover:bg-transparent">
                            <TableCell className="font-medium min-w-[100px] sm:min-w-[120px]">
                              <div className="flex items-center gap-1 sm:gap-2">
                                <ChevronDown
                                  className={`h-3 w-3 sm:h-4 sm:w-4 transition-transform cursor-pointer flex-shrink-0 ${
                                    isExpanded ? 'rotate-180' : ''
                                  }`}
                                  onClick={() => handleAccordionChange(order.id, !isExpanded)}
                                />
                                <span className="truncate text-xs sm:text-sm">{order.orderNumber}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground min-w-[120px] sm:min-w-[150px]">
                              <span className="text-xs">{new Date(order.createdAt).toLocaleDateString()}</span>
                              <span className="text-xs block sm:hidden">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </TableCell>
                            <TableCell className="min-w-[120px] sm:min-w-[150px]">
                              <div className="flex flex-col">
                                <span className="truncate text-xs sm:text-sm">{order.guestName || '—'}</span>
                                <span className="text-xs text-muted-foreground truncate hidden sm:block">{order.guestEmail || '—'}</span>
                              </div>
                            </TableCell>
                            <TableCell className="font-semibold min-w-[80px] sm:min-w-[100px] text-xs sm:text-sm">${order.totalPrice.toFixed(2)}</TableCell>
                            <TableCell className="min-w-[140px] sm:min-w-[180px]">
                              <Select
                                value={order.fulfillmentStatus}
                                onValueChange={async (newStatus) => {
                                  if (newStatus === order.fulfillmentStatus) {
                                    return; // No change
                                  }
                                  if (newStatus === 'CANCELLED') {
                                    const confirmCancel = window.confirm('Are you sure you want to cancel this order?');
                                    if (!confirmCancel) {
                                      return;
                                    }
                                  }
                                  // Show confirmation modal when changing to PAID
                                  if (newStatus === 'PAID') {
                                    setConfirmProcessingModal({ open: true, order });
                                    return;
                                  }
                                  await handleStatusUpdate(order, newStatus);
                                }}
                              >
                                <SelectTrigger className="w-full min-w-[120px] sm:min-w-[150px] text-xs sm:text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {/* Show current status as disabled option */}
                                  <SelectItem value={order.fulfillmentStatus} disabled>
                                    {STATUS_LABELS[order.fulfillmentStatus] ?? order.fulfillmentStatus}
                                  </SelectItem>
                                  {/* Show available statuses to change to */}
                                  {getAvailableStatuses(order.orderType, order.fulfillmentStatus).map((status) => (
                                    <SelectItem key={status} value={status}>
                                      {STATUS_LABELS[status] ?? status}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="min-w-[140px] sm:min-w-[180px]">
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
                                    // Clear cached details to force refresh
                                    setOrderDetails(prev => {
                                      const next = new Map(prev);
                                      next.delete(order.id);
                                      return next;
                                    });
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
                                <SelectTrigger className="w-full min-w-[120px] sm:min-w-[150px] text-xs sm:text-sm">
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
                            </TableCell>
                          </TableRow>
                          {isExpanded && (
                            <TableRow className="hover:bg-transparent">
                              <TableCell colSpan={6} className="p-0">
                                {isLoadingDetail ? (
                                  <div className="flex items-center justify-center p-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                  </div>
                                ) : details ? (
                                  <div className="p-4 sm:p-6 space-y-6">
                                    {renderOrderDetails(details.order, details.history)}
                                  </div>
                                ) : null}
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );

  const renderPagination = () => (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="text-sm text-muted-foreground text-center sm:text-left">
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
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      {errorMessage && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errorMessage}</div>
      )}

      {renderFilters()}

      {renderOrdersTable()}

      {!loading && orders.length > 0 && renderPagination()}

      {/* Confirmation Modal for Processing Order */}
      {confirmProcessingModal.order && (
        <ConfirmProcessingModal
          open={confirmProcessingModal.open}
          onOpenChange={(open) => setConfirmProcessingModal({ open, order: open ? confirmProcessingModal.order : null })}
          onConfirm={handleConfirmProcessing}
          orderNumber={confirmProcessingModal.order.orderNumber}
          warehouseName={confirmProcessingModal.order.assignedWarehouseName}
          loading={processingOrder === confirmProcessingModal.order.id}
        />
      )}
    </div>
  );
};

export default AdminOrdersPage;
