/**
 * Order Success Page
 * Shown after successful payment
 */
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Package, ArrowRight, Loader2 } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { ordersApiClient, Order } from '@/lib/ordersApiClient';
import { paymentsApiClient } from '@/lib/paymentsApiClient';
import { useAuth } from '@/hooks/useAuth';

const OrderSuccess = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const paymentIntentId = searchParams.get('paymentIntent');
  
  const { clearCart } = useCart();
  const { user, getToken } = useAuth();
  const clearedRef = useRef(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const fetchedRef = useRef<string | null>(null);
  const hasScrolledRef = useRef(false);

  // Scroll to top immediately before paint (only once)
  useLayoutEffect(() => {
    if (!hasScrolledRef.current) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      hasScrolledRef.current = true;
    }
  }, []);

  useEffect(() => {
    // Clear cart once on initial mount
    if (!clearedRef.current) {
      clearCart();
      clearedRef.current = true;
    }

    // If we have payment intent ID but no order ID, try to find/create order from payment intent
    if (paymentIntentId && !orderId) {
      const fetchOrderFromPayment = async () => {
        try {
          // Wait a bit for webhook to process (if in production)
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Try to get order by querying user orders (if logged in)
          if (user) {
            try {
              const idToken = await getToken();
              if (idToken) {
                const userOrders = await ordersApiClient.getUserOrders(user.uid, idToken, 10);
                // Find order with matching payment intent ID
                const matchingOrder = userOrders.find(o => o.paymentIntentId === paymentIntentId);
                if (matchingOrder) {
                  setOrder(matchingOrder);
                  setIsLoading(false);
                  return;
                }
              }
            } catch (err) {
              console.warn('Failed to fetch user orders:', err);
            }
          }
          
          // If order not found, try to create it from payment intent (fallback for local dev)
          try {
            console.log('Order not found, attempting to create from payment intent...');
            const createdOrder = await paymentsApiClient.createOrderFromPaymentIntent(paymentIntentId);
            setOrder(createdOrder);
            setIsLoading(false);
            return;
          } catch (createErr) {
            console.error('Failed to create order from payment intent:', createErr);
            // If creation fails, it might still be processing via webhook
            // Show a message that order is being processed
          }
          
          setIsLoading(false);
        } catch (err) {
          console.error('Failed to fetch order from payment intent:', err);
          setIsLoading(false);
        }
      };
      
      fetchOrderFromPayment();
    } else if (orderId) {
      // Fetch order by ID
      if (fetchedRef.current === orderId) {
        setIsLoading(false);
        return;
      }

      const fetchOrder = async () => {
        try {
          const result = await ordersApiClient.getOrder(orderId);
          setOrder(result);
          fetchedRef.current = orderId;
        } catch (err) {
          console.error('Failed to fetch order:', err);
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchOrder();
    } else {
      setIsLoading(false);
    }
  }, [orderId, paymentIntentId, clearCart, user, getToken]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Success Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="rounded-full bg-green-100 p-6">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-brand">Payment Successful!</h1>
          <p className="text-lg text-muted-foreground">
            Thank you for your order. We've received your payment.
          </p>
        </div>

        {/* Order Details */}
        {order ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm">
                <div>
                  <p className="text-muted-foreground">Order ID:</p>
                  <p className="font-mono font-semibold">{order.orderNumber}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="font-medium mb-2">Items Ordered:</p>
                <div className="space-y-2">
                  {order.items.map((item, index) => {
                    // Display: Product Name (Variant Name) if variant exists, or just Product Name
                    const productName = item.product_name || 'Unknown Product';
                    const variantName = item.variant_name;
                    const displayText = variantName 
                      ? `${productName} (${variantName})`
                      : productName;
                    
                    return (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{displayText} × {item.quantity}</span>
                        <span className="font-medium">${(item.unit_price * item.quantity).toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="border-t pt-4 flex justify-between items-center">
                <span className="text-lg font-semibold">Total Paid:</span>
                <span className="text-2xl font-bold text-brand">${order.totalPrice.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        ) : paymentIntentId ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Payment Successful
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Your payment has been processed successfully. Your order is being created and you will receive a confirmation shortly.
              </p>
              {isLoading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading order details...</span>
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}

        {/* What's Next */}
        <Card>
          <CardHeader>
            <CardTitle>What happens next?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>✅ Your payment has been processed successfully</p>
              <p>📦 We'll start preparing your order right away</p>
              <p>🚚 You'll receive tracking information once your order ships</p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link to="/products" className="flex-1">
            <Button variant="outline" className="w-full">
              Continue Shopping
            </Button>
          </Link>
          
          <Link to="/" className="flex-1">
            <Button className="w-full bg-brand hover:bg-brand-dark text-white">
              <ArrowRight className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;




