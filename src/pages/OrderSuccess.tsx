/**
 * Order Success Page
 * Shown after successful payment
 */
import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Package, ArrowRight } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { ordersApiClient, Order } from '@/lib/ordersApiClient';

const OrderSuccess = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const paymentIntent = searchParams.get('paymentIntent');
  
  const { clearCart } = useCart();
  const clearedRef = useRef(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const fetchedRef = useRef<string | null>(null);

  useEffect(() => {
    // Clear cart once on initial mount
    if (!clearedRef.current) {
      clearCart();
      clearedRef.current = true;
    }

    // Fetch order details if available
    if (orderId) {
      if (fetchedRef.current === orderId) {
        setIsLoading(false);
        return;
      }

      ordersApiClient.getOrder(orderId)
        .then(result => {
          setOrder(result);
          fetchedRef.current = orderId;
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [orderId, clearCart]);

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
        {order && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Order ID:</p>
                  <p className="font-mono font-semibold">{order.id}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status:</p>
                  <p className="font-semibold capitalize text-green-600">{order.status}</p>
                </div>
                {paymentIntent && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Payment ID:</p>
                    <p className="font-mono text-xs">{paymentIntent}</p>
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <p className="font-medium mb-2">Items Ordered:</p>
                <div className="space-y-2">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{item.product_name} × {item.quantity}</span>
                      <span className="font-medium">${(item.unit_price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4 flex justify-between items-center">
                <span className="text-lg font-semibold">Total Paid:</span>
                <span className="text-2xl font-bold text-brand">${order.total_price.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* What's Next */}
        <Card>
          <CardHeader>
            <CardTitle>What happens next?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>✅ Your payment has been processed successfully</p>
              <p>📧 You will receive an order confirmation email shortly</p>
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




