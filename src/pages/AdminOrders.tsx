import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, ClipboardList, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { adminOrdersApiClient, AdminOrderFilters, OrderHistoryEntry } from '@/lib/adminOrdersApiClient';
import { ordersApiClient, Order } from '@/lib/ordersApiClient';
import { usersApiClient, CurrentUserProfile } from '@/lib/usersApiClient';

const STATUS_OPTIONS = [
  'PENDING_PAYMENT',
  'CREATED',
  'ASSIGNED',
  'READY_FOR_DELIVERY',
  'OUT_FOR_DELIVERY',
  'PAID',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
];

const STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: 'Pending Payment',
  CREATED: 'Created',
  ASSIGNED: 'Assigned',
  READY_FOR_DELIVERY: 'Ready for Delivery',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  PAID: 'Paid',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

const ACTIONABLE_STATUSES = [
  'PAID',
  'READY_FOR_DELIVERY',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
];

const AdminOrdersPage: React.FC = () => {
  const { user, loading: authLoading, signInWithGoogle, getToken } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState<CurrentUserProfile | null>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [isForbidden, setIsForbidden] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState({ page: 0, size: 20, totalPages: 0, totalItems: 0 });
  const [filters, setFilters] = useState({ status: '', assigned: 'all', from: '', to: '' });
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderHistory, setOrderHistory] = useState<OrderHistoryEntry[]>([]);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [assigning, setAssigning] = useState<boolean>(false);
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

      const assignedTo = filters.assigned === 'me' && currentUser ? currentUser.id : undefined;
      const response = await adminOrdersApiClient.getOrders({
        page,
        size: pagination.size,
        status: filters.status || undefined,
        assignedTo,
        from: filters.from || undefined,
        to: filters.to || undefined,
      }, token);

      setOrders(response.data);
      setPagination({
        page: response.page,
        size: response.size,
        totalPages: response.totalPages,
        totalItems: response.totalItems,
      });
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
  }, [user, isAuthorized, filters, pagination.size]);

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
            onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}
          >
            <SelectTrigger id="status-filter">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All statuses</SelectItem>
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
            onValueChange={(value) => setFilters((prev) => ({ ...prev, assigned: value }))}
          >
            <SelectTrigger id="assigned-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All orders</SelectItem>
              <SelectItem value="me" disabled={!currentUser}>Assigned to me</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="from-date">From</Label>
          <Input
            id="from-date"
            type="date"
            value={filters.from}
            onChange={(e) => setFilters((prev) => ({ ...prev, from: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="to-date">To</Label>
          <Input
            id="to-date"
            type="date"
            value={filters.to}
            onChange={(e) => setFilters((prev) => ({ ...prev, to: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="page-size">Page Size</Label>
          <Input
            id="page-size"
            type="number"
            min={1}
            max={100}
            value={pagination.size}
            onChange={(e) => setPagination((prev) => ({ ...prev, size: Number(e.target.value) || 20 }))}
          />
        </div>

        <div className="flex items-end">
          <Button variant="outline" onClick={() => loadOrders(0)}>
            Apply Filters
          </Button>
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
                  {order.assignedToDisplayName || (order.assignedToUserId ? order.assignedToUserId : 'Unassigned')}
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

  const renderHistory = () => (
    <div className="space-y-3">
      {orderHistory.length === 0 && <p className="text-sm text-muted-foreground">No history available.</p>}
      {orderHistory.map((entry) => (
        <div key={entry.id} className="border rounded-lg p-3 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="font-semibold text-brandText">{entry.action}</span>
            <span className="text-muted-foreground">{new Date(entry.createdAt).toLocaleString()}</span>
          </div>
          {entry.actor && (
            <div className="text-xs text-muted-foreground">
              Actor: {entry.actor.displayName || entry.actor.email || entry.actor.id}
            </div>
          )}
          {entry.payload && (
            <pre className="text-xs bg-gray-50 p-2 rounded text-muted-foreground whitespace-pre-wrap">
              {entry.payload}
            </pre>
          )}
        </div>
      ))}
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
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>

          {detailLoading || !selectedOrder ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="h-10 w-10 animate-spin text-brand" />
            </div>
          ) : (
            <div className="space-y-6">
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
                    {ACTIONABLE_STATUSES.map((status) => (
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
                {renderHistory()}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrdersPage;
