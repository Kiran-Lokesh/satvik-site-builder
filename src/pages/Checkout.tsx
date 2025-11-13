/**
 * Checkout Page
 * Embedded Stripe payment form - customers stay on your site!
 */
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, ShoppingBag, Loader2, Store, Truck, MapPin } from 'lucide-react';
import StripePaymentForm from '@/components/StripePaymentForm';
import { paymentsApiClient } from '@/lib/paymentsApiClient';
import { ordersApiClient, Order } from '@/lib/ordersApiClient';
import { toast } from '@/hooks/use-toast';
import { useCart } from '@/contexts/CartContext';

// Stripe promise (load once)
let stripePromise: Promise<any> | null = null;

const Checkout = () => {
  const navigate = useNavigate();
  const { openCart } = useCart();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [publishableKey, setPublishableKey] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [amount, setAmount] = useState<number>(0);
  
  // Delivery options
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>('pickup');
  const [pickupLocation, setPickupLocation] = useState('');
  
  // Full delivery address fields
  const [deliveryName, setDeliveryName] = useState('');
  const [deliveryEmail, setDeliveryEmail] = useState('');
  const [deliveryPhone, setDeliveryPhone] = useState('');
  const [deliveryStreet, setDeliveryStreet] = useState('');
  const [deliveryCity, setDeliveryCity] = useState('');
  const [deliveryProvince, setDeliveryProvince] = useState('');
  const [deliveryPostal, setDeliveryPostal] = useState('');
  const fetchedOrderRef = useRef<string | null>(null);
  const paymentIntentRef = useRef<string | null>(null);
  
  const pickupLocations = [
    { id: 'belmont', name: 'Belmont Location', address: '187 Belmont Blvd SW, Calgary AB T2X 4W5' },
    { id: 'seton', name: 'Seton Location', address: '210 Setonstone Ave SE, Calgary AB T3M 3R6' }
  ];
  
  // Calculate delivery fee and final total
  const subtotal = order?.total_price || 0;
  const deliveryFee = (deliveryMethod === 'delivery' && subtotal < 50) ? 3 : 0;
  const finalTotal = subtotal + deliveryFee;

  // Fetch the order once when we land on the checkout page
  useEffect(() => {
    let isMounted = true;

    const loadOrder = async () => {
      if (!orderId) {
        setError('No order ID provided');
        setIsLoading(false);
        return;
      }

      try {
        if (fetchedOrderRef.current === orderId) {
          return;
        }

        const orderData = await ordersApiClient.getOrder(orderId);
        if (isMounted) {
          setOrder(orderData);
          setIsLoading(false);
          fetchedOrderRef.current = orderId;
        }
      } catch (err) {
        console.error('Failed to load order:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load order');
          setIsLoading(false);
        }
      }
    };

    loadOrder();

    return () => {
      isMounted = false;
    };
  }, [orderId]);

  // Create the payment intent after the order is loaded
  useEffect(() => {
    let isMounted = true;

    const initializePaymentIntent = async () => {
      if (!orderId || !order) {
        return;
      }

      if (paymentIntentRef.current === orderId) {
        return;
      }

      try {
        const paymentIntent = await paymentsApiClient.createPaymentIntent(orderId);

        if (!isMounted) {
          return;
        }

        setClientSecret(paymentIntent.client_secret);
        setPublishableKey(paymentIntent.publishable_key);

        if (!stripePromise && paymentIntent.publishable_key) {
          stripePromise = loadStripe(paymentIntent.publishable_key);
        }

        setIsLoading(false);
        paymentIntentRef.current = orderId;
      } catch (err) {
        console.error('Failed to initialize payment intent:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to initialize payment intent');
          setIsLoading(false);
        }
      }
    };

    initializePaymentIntent();

    return () => {
      isMounted = false;
    };
  }, [orderId, order]);

  const handlePaymentSuccess = (paymentIntentId: string) => {
    navigate(`/order-success?orderId=${orderId}&paymentIntent=${paymentIntentId}`);
  };
  
  const validateDeliveryInfo = (): boolean => {
    if (deliveryMethod === 'pickup' && !pickupLocation) {
      toast({
        title: "Pickup Location Required",
        description: "Please select a pickup location",
        variant: "destructive",
      });
      return false;
    }
    
    if (deliveryMethod === 'delivery') {
      if (!deliveryName.trim() || !deliveryEmail.trim() || !deliveryPhone.trim() ||
          !deliveryStreet.trim() || !deliveryCity.trim() || !deliveryProvince.trim() || !deliveryPostal.trim()) {
        toast({
          title: "Delivery Information Required",
          description: "Please fill in all delivery address fields",
          variant: "destructive",
        });
        return false;
      }
    }
    
    return true;
  };

  const handleCancel = () => {
    navigate('/products');
    setTimeout(() => openCart(), 100); // Open cart sidebar after navigation
  };

  if (!orderId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center text-brand">Invalid Checkout</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">No order found. Please try again.</p>
            <Button onClick={() => navigate('/cart')} className="bg-brand hover:bg-brand-dark text-white">
              Return to Cart
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="py-12 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-brand" />
            <p className="text-muted-foreground">Preparing secure checkout...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Checkout Error</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => navigate('/cart')} className="bg-brand hover:bg-brand-dark text-white">
              Return to Cart
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={handleCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cart
          </Button>
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-brand">Secure Checkout</h1>
          <p className="text-muted-foreground">
            Complete your purchase securely on Satvik Foods
          </p>
        </div>

        {/* Delivery Method */}
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
                <RadioGroupItem value="pickup" id="pickup" />
                <Label htmlFor="pickup" className="flex items-center gap-2 flex-1 cursor-pointer">
                  <Store className="h-4 w-4" />
                  <div>
                    <div className="font-medium">Pickup from Store</div>
                    <div className="text-sm text-muted-foreground">Free</div>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="delivery" id="delivery" />
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

            {/* Pickup Location Selection */}
            {deliveryMethod === 'pickup' && (
              <div className="space-y-2 pt-2">
                <Label className="text-sm font-medium">Select Pickup Location *</Label>
                <RadioGroup value={pickupLocation} onValueChange={setPickupLocation}>
                  {pickupLocations.map((location) => (
                    <div key={location.id} className="flex items-start space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                      <RadioGroupItem value={location.id} id={location.id} />
                      <Label htmlFor={location.id} className="flex-1 cursor-pointer">
                        <div className="font-medium">{location.name}</div>
                        <div className="text-sm text-muted-foreground">{location.address}</div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            {/* Full Delivery Address Form */}
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
                      required={deliveryMethod === 'delivery'}
                      className="w-full bg-white"
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
                      required={deliveryMethod === 'delivery'}
                      className="w-full bg-white"
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
                      required={deliveryMethod === 'delivery'}
                      className="w-full bg-white"
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
                      required={deliveryMethod === 'delivery'}
                      className="w-full bg-white"
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
                      required={deliveryMethod === 'delivery'}
                      className="w-full bg-white"
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
                      required={deliveryMethod === 'delivery'}
                      className="w-full bg-white"
                      maxLength={2}
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
                      required={deliveryMethod === 'delivery'}
                      className="w-full bg-white"
                      maxLength={7}
                    />
                  </div>
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

        {/* Order Summary */}
        {order && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{item.product_name}</p>
                    <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-semibold">${(item.unit_price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
              
              <div className="space-y-2 pt-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {deliveryFee > 0 && (
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
        )}

        {/* Payment Form */}
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
                  onBeforeSubmit={validateDeliveryInfo}
                  deliveryInfo={deliveryMethod === 'delivery' ? {
                    name: deliveryName,
                    email: deliveryEmail,
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

