/**
 * Checkout Page
 * Embedded Stripe payment form - customers stay on your site!
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, ShoppingBag, Loader2, Store, Truck, MapPin, LogIn } from 'lucide-react';
import StripePaymentForm from '@/components/StripePaymentForm';
import { paymentsApiClient } from '@/lib/paymentsApiClient';
import { ordersApiClient, Order } from '@/lib/ordersApiClient';
import { toast } from '@/hooks/use-toast';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/hooks/useAuth';
import { usersApiClient } from '@/lib/usersApiClient';

let stripePromise: Promise<any> | null = null;

const Checkout = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { user, loading: authLoading, signInWithGoogle, getToken } = useAuth();
  const {
    state: cartState,
    openCart,
  } = useCart();

  const [orderId, setOrderId] = useState<string | null>(searchParams.get('orderId'));
  const [order, setOrder] = useState<Order | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [publishableKey, setPublishableKey] = useState<string | null>(null);

  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>('pickup');
  const [pickupLocation, setPickupLocation] = useState('');
  const [deliveryName, setDeliveryName] = useState('');
  const [deliveryEmail, setDeliveryEmail] = useState('');
  const [deliveryPhone, setDeliveryPhone] = useState('');
  const [deliveryStreet, setDeliveryStreet] = useState('');
  const [deliveryCity, setDeliveryCity] = useState('');
  const [deliveryProvince, setDeliveryProvince] = useState('');
  const [deliveryPostal, setDeliveryPostal] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [createAccountAfterCheckout, setCreateAccountAfterCheckout] = useState(false);

  const [isLoading, setIsLoading] = useState<boolean>(Boolean(orderId));
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchedOrderRef = useRef<string | null>(null);
  const paymentIntentRef = useRef<string | null>(null);

  const pickupLocations = useMemo(() => ([
    { id: 'belmont', name: 'Belmont Location', address: '187 Belmont Blvd SW, Calgary AB T2X 4W5' },
    { id: 'seton', name: 'Seton Location', address: '210 Setonstone Ave SE, Calgary AB T3M 3R6' },
  ]), []);

  const cartSubtotal = useMemo(() => (
    cartState.items.reduce((total, item) => total + (item.unitPrice * item.quantity), 0)
  ), [cartState.items]);

  const subtotal = order ? order.subtotal : cartSubtotal;
  const deliveryFee = deliveryMethod === 'delivery' && subtotal < 50 ? 3 : 0;
  const finalTotal = order ? order.totalPrice : subtotal + deliveryFee;

  useEffect(() => {
    if (user) {
      if (!contactName && user.displayName) {
        setContactName(user.displayName);
      }
      if (!contactEmail && user.email) {
        setContactEmail(user.email);
      }
    }
  }, [user, contactName, contactEmail]);

  useEffect(() => {
    const existingOrderId = searchParams.get('orderId');
    if (!existingOrderId || existingOrderId === fetchedOrderRef.current) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    (async () => {
      try {
        const token = await getToken();
        const fetchedOrder = await ordersApiClient.getOrder(existingOrderId, token ?? undefined);
        if (!isMounted) return;
        setOrder(fetchedOrder);
        setOrderId(existingOrderId);
        fetchedOrderRef.current = existingOrderId;

        if (!user) {
          if (fetchedOrder.guestName) setContactName(fetchedOrder.guestName);
          if (fetchedOrder.guestEmail) setContactEmail(fetchedOrder.guestEmail);
        }
      } catch (err) {
        console.error('Failed to load order', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load order');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [searchParams, getToken, user]);

  useEffect(() => {
    if (!order || !orderId) {
      return;
    }
    if (paymentIntentRef.current === orderId) {
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    (async () => {
      try {
        const paymentIntent = await paymentsApiClient.createPaymentIntent(
          orderId,
          contactName || order.guestName,
          contactEmail || order.guestEmail
        );

        if (!isMounted) return;

        setClientSecret(paymentIntent.client_secret);
        setPublishableKey(paymentIntent.publishable_key);

        if (!stripePromise && paymentIntent.publishable_key) {
          stripePromise = loadStripe(paymentIntent.publishable_key);
        }

        paymentIntentRef.current = orderId;
      } catch (err) {
        console.error('Failed to initialize payment intent', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to initialize payment intent');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [order, orderId, contactName, contactEmail]);

  const pickupLocationsOptions = pickupLocations;

  const validateContactInfo = (): boolean => {
    if (user) {
      if (!contactEmail.trim()) {
        toast({
          title: 'Email Required',
          description: 'Please provide an email so we can send order updates.',
          variant: 'destructive',
        });
        return false;
      }
      return true;
    }

    if (!contactName.trim()) {
      toast({
        title: 'Name Required',
        description: 'Please provide your name to continue.',
        variant: 'destructive',
      });
      return false;
    }

    if (!contactEmail.trim()) {
      toast({
        title: 'Email Required',
        description: 'Please provide your email address.',
        variant: 'destructive',
      });
      return false;
    }

    if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(contactEmail.trim())) {
      toast({
        title: 'Invalid Email',
        description: 'Please provide a valid email address.',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const validateDeliveryInfo = (): boolean => {
    if (deliveryMethod === 'pickup' && !pickupLocation) {
      toast({
        title: 'Pickup Location Required',
        description: 'Please select a pickup location.',
        variant: 'destructive',
      });
      return false;
    }

    if (deliveryMethod === 'delivery') {
      if (!deliveryName.trim() || !deliveryEmail.trim() || !deliveryPhone.trim() ||
        !deliveryStreet.trim() || !deliveryCity.trim() || !deliveryProvince.trim() || !deliveryPostal.trim()) {
        toast({
          title: 'Delivery Details Required',
          description: 'Please fill in all delivery address fields.',
          variant: 'destructive',
        });
        return false;
      }
    }

    return true;
  };

  const validateOrderItems = (): boolean => {
    if (order) {
      return true;
    }

    if (!cartState.items.length) {
      toast({
        title: 'Cart Empty',
        description: 'Please add items to your cart before checking out.',
        variant: 'destructive',
      });
      return false;
    }

    const missingVariant = cartState.items.find((item) => !item.variantId);
    if (missingVariant) {
      toast({
        title: 'Variant Not Found',
        description: `We could not determine the variant for ${missingVariant.productName}. Please re-add the item to your cart.`,
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const buildShippingAddress = () => {
    if (deliveryMethod === 'delivery') {
      return {
        method: 'delivery',
        name: deliveryName,
        email: deliveryEmail,
        phone: deliveryPhone,
        street: deliveryStreet,
        city: deliveryCity,
        province: deliveryProvince,
        postalCode: deliveryPostal,
        notes: deliveryNotes,
      };
    }

    return {
      method: 'pickup',
      location: pickupLocation,
      notes: deliveryNotes,
      contactName,
      contactEmail,
      whatsappNumber,
    };
  };

  const handleStartPayment = async () => {
    setError(null);

    if (order) {
      // Order already exists, nothing to do.
      return;
    }

    if (!validateContactInfo() || !validateDeliveryInfo() || !validateOrderItems()) {
      return;
    }

    setIsProcessingOrder(true);

    try {
      const orderItems = cartState.items.map((item) => ({
        variantId: item.variantId!,
        quantity: item.quantity,
      }));

      const guest = user ? undefined : {
        name: contactName,
        email: contactEmail,
        whatsappNumber,
        createAccount: createAccountAfterCheckout,
      };

      const idToken = user ? await getToken() : null;

      const createResponse = await ordersApiClient.createOrder({
        items: orderItems,
        paymentMethod: 'stripe',
        shippingAddress: buildShippingAddress(),
        guest,
      }, idToken ?? undefined);

      setOrderId(createResponse.orderId);
      setSearchParams({ orderId: createResponse.orderId });

      const createdOrder = await ordersApiClient.getOrder(createResponse.orderId, idToken ?? undefined);
      setOrder(createdOrder);

      if (user && whatsappNumber.trim()) {
        try {
          if (idToken) {
            await usersApiClient.updateProfile({ whatsappNumber: whatsappNumber.trim() }, idToken);
          }
        } catch (profileError) {
          console.warn('Failed to update WhatsApp number', profileError);
        }
      }
    } catch (err) {
      console.error('Failed to create order', err);
      setError(err instanceof Error ? err.message : 'Failed to create order. Please try again.');
    } finally {
      setIsProcessingOrder(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error('Google sign-in failed', err);
      toast({
        title: 'Login Failed',
        description: err instanceof Error ? err.message : 'Unable to sign in with Google right now.',
        variant: 'destructive',
      });
    } finally {
      setIsSigningIn(false);
    }
  };

  const handlePaymentSuccess = (paymentIntentId: string) => {
    if (!orderId) return;
    navigate(`/order-success?orderId=${orderId}&paymentIntent=${paymentIntentId}`);
  };

  const handleCancel = () => {
    navigate('/products');
    setTimeout(() => openCart(), 100);
  };

  if (isLoading && !order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="py-12 text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-brand" />
            <p className="text-muted-foreground">Preparing your secure checkout...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!order && cartState.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center text-brand">Your cart is empty</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">Add products to your cart before starting checkout.</p>
            <Button onClick={() => navigate('/products')} className="bg-brand hover:bg-brand-dark text-white">
              Browse Products
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={handleCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cart
          </Button>
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-brand">Secure Checkout</h1>
          <p className="text-muted-foreground">Complete your purchase securely on Satvik Foods</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Account & Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {user ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact-name">Name</Label>
                    <Input
                      id="contact-name"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="Your name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-email">Email</Label>
                    <Input
                      id="contact-email"
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="you@example.com"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp Number (optional)</Label>
                  <Input
                    id="whatsapp"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="+1 555-123-4567"
                  />
                  <p className="text-xs text-muted-foreground">
                    We&#39;ll use this to keep you updated about your order.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="guest-name">Full Name *</Label>
                    <Input
                      id="guest-name"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="guest-email">Email Address *</Label>
                    <Input
                      id="guest-email"
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="john@example.com"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guest-whatsapp">WhatsApp Number (optional)</Label>
                  <Input
                    id="guest-whatsapp"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="+1 555-123-4567"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="create-account"
                    checked={createAccountAfterCheckout}
                    onCheckedChange={(value) => setCreateAccountAfterCheckout(Boolean(value))}
                  />
                  <Label htmlFor="create-account" className="text-sm">
                    I&#39;d like to sign in with Google after checkout to save my details
                  </Label>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleLogin}
                  disabled={isSigningIn || authLoading}
                  className="flex items-center gap-2"
                >
                  {isSigningIn ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                  Login with Google
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Delivery Method
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup value={deliveryMethod} onValueChange={(value) => setDeliveryMethod(value as 'pickup' | 'delivery')}>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="pickup" id="pickup" disabled={Boolean(order)} />
                <Label htmlFor="pickup" className="flex items-center gap-2 flex-1 cursor-pointer">
                  <Store className="h-4 w-4" />
                  <div>
                    <div className="font-medium">Pickup from Store</div>
                    <div className="text-sm text-muted-foreground">Free</div>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="delivery" id="delivery" disabled={Boolean(order)} />
                <Label htmlFor="delivery" className="flex items-center gap-2 flex-1 cursor-pointer">
                  <Truck className="h-4 w-4" />
                  <div>
                    <div className="font-medium">Delivery to Address</div>
                    <div className="text-sm text-muted-foreground">
                      {subtotal < 50 ? (
                        <span className="text-orange-600">$3.00 delivery fee (FREE over $50!)</span>
                      ) : (
                        <span className="text-green-600">FREE delivery!</span>
                      )}
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>

            {deliveryMethod === 'pickup' && (
              <div className="space-y-2 pt-2">
                <Label className="text-sm font-medium">Select Pickup Location *</Label>
                <RadioGroup value={pickupLocation} onValueChange={setPickupLocation}>
                  {pickupLocationsOptions.map((location) => (
                    <div key={location.id} className="flex items-start space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                      <RadioGroupItem value={location.id} id={location.id} disabled={Boolean(order)} />
                      <Label htmlFor={location.id} className="flex-1 cursor-pointer">
                        <div className="font-medium">{location.name}</div>
                        <div className="text-sm text-muted-foreground">{location.address}</div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            {deliveryMethod === 'delivery' && (
              <div className="space-y-4 pt-2 bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  <h4 className="font-semibold text-blue-900">Delivery Information</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="delivery-name">Full Name *</Label>
                    <Input
                      id="delivery-name"
                      type="text"
                      placeholder="John Doe"
                      value={deliveryName}
                      onChange={(e) => setDeliveryName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="delivery-email">Email Address *</Label>
                    <Input
                      id="delivery-email"
                      type="email"
                      placeholder="john@example.com"
                      value={deliveryEmail}
                      onChange={(e) => setDeliveryEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="delivery-phone">Phone Number *</Label>
                    <Input
                      id="delivery-phone"
                      type="tel"
                      placeholder="+1 (123) 456-7890"
                      value={deliveryPhone}
                      onChange={(e) => setDeliveryPhone(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="delivery-street">Street Address *</Label>
                    <Input
                      id="delivery-street"
                      type="text"
                      placeholder="123 Main St, Apt 4B"
                      value={deliveryStreet}
                      onChange={(e) => setDeliveryStreet(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="delivery-city">City *</Label>
                    <Input
                      id="delivery-city"
                      type="text"
                      placeholder="Calgary"
                      value={deliveryCity}
                      onChange={(e) => setDeliveryCity(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="delivery-province">Province *</Label>
                    <Input
                      id="delivery-province"
                      type="text"
                      placeholder="AB"
                      value={deliveryProvince}
                      onChange={(e) => setDeliveryProvince(e.target.value)}
                      maxLength={2}
                      required
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="delivery-postal">Postal Code *</Label>
                    <Input
                      id="delivery-postal"
                      type="text"
                      placeholder="T2X 4W5"
                      value={deliveryPostal}
                      onChange={(e) => setDeliveryPostal(e.target.value)}
                      maxLength={7}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="delivery-notes">Delivery Notes (optional)</Label>
                  <Textarea
                    id="delivery-notes"
                    placeholder="Any delivery instructions?"
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                  />
                </div>

                {subtotal < 50 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <p className="text-sm text-orange-700 font-medium">
                      💡 Add ${(50 - subtotal).toFixed(2)} more to your order to get FREE delivery!
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              Order Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {order ? (
              order.items.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{item.product_name}</p>
                    <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-semibold">${(item.unit_price * item.quantity).toFixed(2)}</p>
                </div>
              ))
            ) : (
              cartState.items.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{item.productName} - {item.variantName}</p>
                    <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-semibold">${(item.unitPrice * item.quantity).toFixed(2)}</p>
                </div>
              ))
            )}

            <div className="space-y-2 pt-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {deliveryFee > 0 && !order && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Delivery Fee:</span>
                  <span>${deliveryFee.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-4 border-t-2">
                <span className="text-lg font-bold">Total:</span>
                <span className="text-2xl font-bold text-brand">${finalTotal.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {!order && (
          <Button
            className="w-full bg-brand hover:bg-brand-dark text-white"
            size="lg"
            disabled={isProcessingOrder || authLoading}
            onClick={handleStartPayment}
          >
            {isProcessingOrder ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Preparing Payment...
              </>
            ) : (
              'Continue to Payment'
            )}
          </Button>
        )}

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        )}

        {clientSecret && stripePromise && (
          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
            </CardHeader>
            <CardContent>
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: 'stripe',
                    variables: {
                      colorPrimary: '#004d3d',
                      borderRadius: '8px',
                      fontFamily: 'system-ui, sans-serif',
                    },
                  },
                  loader: 'auto',
                }}
              >
                <StripePaymentForm
                  amount={finalTotal}
                  onSuccess={handlePaymentSuccess}
                  onCancel={handleCancel}
                  onBeforeSubmit={() => Boolean(order)}
                  deliveryInfo={deliveryMethod === 'delivery' ? {
                    name: deliveryName || contactName,
                    email: deliveryEmail || contactEmail,
                    street: deliveryStreet,
                    city: deliveryCity,
                    state: deliveryProvince,
                    zip: deliveryPostal,
                  } : undefined}
                />
              </Elements>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Checkout;

