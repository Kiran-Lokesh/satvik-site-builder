import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usersApiClient, CurrentUserProfile, UpdateProfileRequest } from '@/lib/usersApiClient';
import { ordersApiClient, Order } from '@/lib/ordersApiClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Loader2, Package, User, Mail, Phone, Calendar, MapPin, Save, Edit2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

const Profile = () => {
  const { user, getToken, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<CurrentUserProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingProfile, setEditingProfile] = useState<UpdateProfileRequest>({});
  const [saving, setSaving] = useState(false);
  const hasScrolledRef = useRef(false);

  // Scroll to top immediately before paint (only once)
  useLayoutEffect(() => {
    if (!hasScrolledRef.current) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      hasScrolledRef.current = true;
    }
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      // Wait for auth to finish loading before checking user
      if (authLoading) {
        return;
      }
      
      if (!user) {
        setError('Please log in to view your profile');
        setLoading(false);
        return;
      }

      try {
        const idToken = await getToken();
        if (!idToken) {
          setError('Failed to get authentication token');
          setLoading(false);
          return;
        }

        // Load user profile
        const userProfile = await usersApiClient.getCurrentUser(idToken);
        setProfile(userProfile);

        // Load user orders using Firebase UID
        let userOrders: Order[] = [];
        if (userProfile.firebaseUid) {
          try {
            userOrders = await ordersApiClient.getUserOrders(userProfile.firebaseUid, idToken);
            setOrders(userOrders);
          } catch (orderError) {
            console.error('Failed to load orders:', orderError);
            // Don't fail the whole page if orders fail to load
            setOrders([]);
          }
        }

        // Set editing profile with default address from profile or orders
        const getDefaultAddressFromOrders = (orderList: Order[]): string | null => {
          if (!orderList.length) return null;
          for (const order of orderList) {
            if (order.shippingAddress) {
              try {
                const address = typeof order.shippingAddress === 'string' 
                  ? JSON.parse(order.shippingAddress) 
                  : order.shippingAddress;
                if (address && typeof address === 'object') {
                  const parts = [];
                  if (address.street) parts.push(address.street);
                  if (address.city) parts.push(address.city);
                  if (address.state) parts.push(address.state);
                  if (address.postalCode) parts.push(address.postalCode);
                  if (address.country) parts.push(address.country);
                  return parts.join(', ') || null;
                }
                return typeof address === 'string' ? address : null;
              } catch {
                return typeof order.shippingAddress === 'string' ? order.shippingAddress : null;
              }
            }
          }
          return null;
        };

        setEditingProfile({
          displayName: userProfile.displayName || '',
          whatsappNumber: userProfile.whatsappNumber || '',
          defaultAddress: userProfile.defaultAddress || getDefaultAddressFromOrders(userOrders) || '',
        });
      } catch (err) {
        console.error('Failed to load profile:', err);
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user, getToken, authLoading]);

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const idToken = await getToken();
      if (!idToken) {
        throw new Error('Failed to get authentication token');
      }

      await usersApiClient.updateProfile(editingProfile, idToken);
      
      // Reload profile
      const updatedProfile = await usersApiClient.getCurrentUser(idToken);
      setProfile(updatedProfile);
      setIsEditing(false);
      
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      });
    } catch (err) {
      console.error('Failed to update profile:', err);
      toast({
        title: 'Update failed',
        description: err instanceof Error ? err.message : 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'paid':
      case 'assigned':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (status: string) => {
    // Remove "Pending Payment" and just show "Pending"
    if (status.toLowerCase() === 'pending_payment') {
      return 'Pending';
    }
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Check if we should show payment status badge
  // Don't show it if fulfillment status is PENDING_PAYMENT (to avoid duplicate "Pending" badges)
  const shouldShowPaymentStatus = (fulfillmentStatus: string, paymentStatus: string | undefined) => {
    if (!paymentStatus) return false;
    // Don't show payment status if fulfillment is PENDING_PAYMENT (they're the same thing)
    if (fulfillmentStatus.toLowerCase() === 'pending_payment') return false;
    // Don't show if payment status is PENDING_PAYMENT (already covered by fulfillment status)
    if (paymentStatus.toLowerCase() === 'pending_payment') return false;
    return true;
  };

  // Get default address from most recent order with shipping address (fallback)
  const getDefaultAddressFromOrders = (orderList: Order[]): string | null => {
    if (!orderList.length) return null;
    // Find the most recent order with a shipping address
    for (const order of orderList) {
      if (order.shippingAddress) {
        try {
          const address = typeof order.shippingAddress === 'string' 
            ? JSON.parse(order.shippingAddress) 
            : order.shippingAddress;
          if (address && typeof address === 'object') {
            // Format address object
            const parts = [];
            if (address.street) parts.push(address.street);
            if (address.city) parts.push(address.city);
            if (address.state) parts.push(address.state);
            if (address.postalCode) parts.push(address.postalCode);
            if (address.country) parts.push(address.country);
            return parts.join(', ') || null;
          }
          return typeof address === 'string' ? address : null;
        } catch {
          return typeof order.shippingAddress === 'string' ? order.shippingAddress : null;
        }
      }
    }
    return null;
  };

  // Use saved default address or fallback to most recent order address
  const defaultAddress = profile?.defaultAddress || getDefaultAddressFromOrders(orders);

  // Show loading while auth is initializing or profile is loading
  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-brand" />
        <p className="mt-4 text-gray-600">Loading your profile...</p>
      </div>
    );
  }

  // After auth has loaded, check if user is logged in
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <p className="text-lg text-gray-600">Please log in to view your profile</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <p className="text-lg text-red-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8">My Profile</h1>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
                <CardDescription>Your account details</CardDescription>
              </div>
              {!isEditing && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2"
                >
                  <Edit2 className="h-4 w-4" />
                  Edit
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <>
                <div>
                  <Label htmlFor="displayName">Name</Label>
                  <Input
                    id="displayName"
                    value={editingProfile.displayName || ''}
                    onChange={(e) => setEditingProfile({ ...editingProfile, displayName: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <div className="flex-1">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile?.email || ''}
                      disabled
                      className="mt-1 bg-gray-50"
                    />
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <div className="flex-1">
                    <Label htmlFor="whatsappNumber">Phone Number</Label>
                    <Input
                      id="whatsappNumber"
                      type="tel"
                      value={editingProfile.whatsappNumber || ''}
                      onChange={(e) => setEditingProfile({ ...editingProfile, whatsappNumber: e.target.value })}
                      placeholder="e.g., +1234567890"
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-gray-400 mt-2" />
                  <div className="flex-1">
                    <Label htmlFor="defaultAddress">Default Delivery Address</Label>
                    <Textarea
                      id="defaultAddress"
                      value={editingProfile.defaultAddress || ''}
                      onChange={(e) => setEditingProfile({ ...editingProfile, defaultAddress: e.target.value })}
                      placeholder="Enter your delivery address"
                      className="mt-1 min-h-[80px]"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setEditingProfile({
                        displayName: profile?.displayName || '',
                        whatsappNumber: profile?.whatsappNumber || '',
                        defaultAddress: profile?.defaultAddress || getDefaultAddressFromOrders(orders) || '',
                      });
                    }}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              <>
                {profile?.displayName && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Name</p>
                    <p className="text-lg">{profile.displayName}</p>
                  </div>
                )}
                {profile?.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Email</p>
                      <p className="text-lg">{profile.email}</p>
                    </div>
                  </div>
                )}
                {profile?.whatsappNumber && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Phone Number</p>
                      <p className="text-lg">{profile.whatsappNumber}</p>
                    </div>
                  </div>
                )}
                {defaultAddress && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Default Delivery Address</p>
                      <p className="text-lg">{defaultAddress}</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Order Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order Statistics
            </CardTitle>
            <CardDescription>Your order history summary</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-brand">{orders.length}</div>
            <p className="text-sm text-gray-600 mt-1">Total Orders</p>
          </CardContent>
        </Card>
      </div>

      {/* Order History */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Order History
          </CardTitle>
          <CardDescription>Your past orders</CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">You haven't placed any orders yet</p>
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {orders.map((order) => (
                <AccordionItem key={order.id} value={order.id} className="border rounded-lg mb-4 px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 w-full text-left">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">Order #{order.orderNumber}</h3>
                          <Badge className={getStatusColor(order.fulfillmentStatus)}>
                            {formatStatus(order.fulfillmentStatus)}
                          </Badge>
                          {shouldShowPaymentStatus(order.fulfillmentStatus, order.paymentStatus) && (
                            <Badge variant="outline" className={getStatusColor(order.paymentStatus!)}>
                              {formatStatus(order.paymentStatus!)}
                            </Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {format(new Date(order.createdAt), 'MMM dd, yyyy')}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium">{order.items.length}</span> item{order.items.length !== 1 ? 's' : ''}
                          </div>
                          <div>
                            <span className="font-medium">${order.totalPrice.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 pb-4">
                    <div className="space-y-4">
                      {/* Order Items */}
                      {order.items.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-3">Order Items:</p>
                          <div className="space-y-2">
                            {order.items.map((item, idx) => {
                              // Display: Product Name (Variant Name) if variant exists, or just Product Name
                              // Handle cases where product_name might be empty or contain variant name (for old orders)
                              let productName = item.product_name;
                              const variantName = item.variant_name;
                              
                              // If product_name is empty but we have variant_name, use variant_name as fallback
                              // This handles old orders where product_name wasn't set correctly
                              if (!productName || productName.trim() === '') {
                                if (variantName) {
                                  productName = variantName;
                                } else {
                                  productName = 'Unknown Product';
                                }
                              }
                              
                              // If variant_name exists and is different from product_name, show both
                              // Otherwise, just show product_name
                              const displayText = (variantName && variantName !== productName)
                                ? `${productName} (${variantName})`
                                : productName;
                              
                              return (
                                <div key={idx} className="flex justify-between items-center py-2 border-b last:border-0">
                                  <div>
                                    <p className="font-medium">{displayText}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-medium">${(item.unit_price * item.quantity).toFixed(2)}</p>
                                    <p className="text-sm text-gray-500">Qty: {item.quantity} × ${item.unit_price.toFixed(2)}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      
                      {/* Order Summary */}
                      <div className="border-t pt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Subtotal</span>
                          <span className="font-medium">${order.subtotal.toFixed(2)}</span>
                        </div>
                        {order.tax > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Tax</span>
                            <span className="font-medium">${order.tax.toFixed(2)}</span>
                          </div>
                        )}
                        {order.shipping > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Shipping</span>
                            <span className="font-medium">${order.shipping.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-lg font-bold border-t pt-2">
                          <span>Total</span>
                          <span className="text-brand">${order.totalPrice.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Shipping Address */}
                      {order.shippingAddress && (
                        <div className="border-t pt-4">
                          <p className="text-sm font-medium text-gray-700 mb-2">Shipping Address:</p>
                          <p className="text-sm text-gray-600">
                            {(() => {
                              try {
                                const address = typeof order.shippingAddress === 'string' 
                                  ? JSON.parse(order.shippingAddress) 
                                  : order.shippingAddress;
                                if (address && typeof address === 'object') {
                                  const parts = [];
                                  if (address.street) parts.push(address.street);
                                  if (address.city) parts.push(address.city);
                                  if (address.state) parts.push(address.state);
                                  if (address.postalCode) parts.push(address.postalCode);
                                  if (address.country) parts.push(address.country);
                                  return parts.join(', ') || 'N/A';
                                }
                                return typeof address === 'string' ? address : 'N/A';
                              } catch {
                                return typeof order.shippingAddress === 'string' ? order.shippingAddress : 'N/A';
                              }
                            })()}
                          </p>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
