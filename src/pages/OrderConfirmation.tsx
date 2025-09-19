import React from 'react';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const OrderConfirmation = () => {
  const { 
    state, 
    getSubtotal,
    getGSTAmount,
    getTotalPrice 
  } = useCart();

  const { items } = state;
  const subtotal = getSubtotal();
  const gstAmount = getGSTAmount();
  const totalPrice = getTotalPrice();

  // Generate order summary text
  const generateOrderSummary = () => {
    let summary = "ORDER SUMMARY\n";
    summary += "=".repeat(50) + "\n\n";
    
    summary += "ITEMS ORDERED:\n";
    summary += "-".repeat(20) + "\n";
    
    items.forEach((item, index) => {
      summary += `${index + 1}. ${item.productName}\n`;
      summary += `   Variant: ${item.variantName}\n`;
      summary += `   Quantity: ${item.quantity}\n`;
      if (item.price && item.price !== '0') {
        summary += `   Price: ${item.price}\n`;
      }
      summary += "\n";
    });

    summary += "ORDER TOTALS:\n";
    summary += "-".repeat(20) + "\n";
    summary += `Total Items: ${items.reduce((sum, item) => sum + item.quantity, 0)}\n`;
    
    if (totalPrice > 0) {
      summary += `Subtotal: $${subtotal.toFixed(2)}\n`;
      summary += `GST (5%): $${gstAmount.toFixed(2)}\n`;
      summary += `TOTAL: $${totalPrice.toFixed(2)}\n`;
    }

    summary += "\n" + "=".repeat(50) + "\n";
    summary += "Thank you for choosing Satvik Foods!\n";
    summary += "Please review your order details above.\n";
    summary += "Click 'Complete Order via WhatsApp' to proceed.";

    return summary;
  };

  // WhatsApp checkout functionality
  const handleWhatsAppCheckout = () => {
    if (items.length === 0) return;

    // Build the message
    let message = "Hello Satvik Foods! I'd like to order:\n\n";
    
    items.forEach((item, index) => {
      message += `${index + 1}. ${item.productName} (${item.variantName}) - Qty: ${item.quantity}`;
      if (item.price && item.price !== '0') {
        message += ` - ${item.price}`;
      }
      message += '\n';
    });

    message += `\nTotal Items: ${items.reduce((sum, item) => sum + item.quantity, 0)}`;
    if (totalPrice > 0) {
      message += `\nSubtotal: $${subtotal.toFixed(2)}`;
      message += `\nGST (5%): $${gstAmount.toFixed(2)}`;
      message += `\nTotal: $${totalPrice.toFixed(2)}`;
    }
    
    message += "\n\nPlease confirm availability and send me a payment link. Thank you!";

    // Encode the message and create WhatsApp link
    const encodedMessage = encodeURIComponent(message);
    const whatsappNumber = "15875813956"; // Satvik Foods WhatsApp business number
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

    // Open WhatsApp
    window.open(whatsappUrl, '_blank');
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-brand">No Items in Cart</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Your cart is empty. Add some products to place an order.
            </p>
            <Link to="/products">
              <Button className="bg-brand hover:bg-brand-dark text-white">
                Browse Products
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-brand">Order Confirmation</h1>
          <p className="text-muted-foreground">
            Please review your order details below before proceeding to checkout
          </p>
        </div>

        {/* Order Details Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Order Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Order Summary (Read-Only)
              </label>
              <Textarea
                value={generateOrderSummary()}
                readOnly
                className="min-h-[400px] font-mono text-sm bg-muted/50 border-2 border-dashed border-muted-foreground/30 resize-none"
                placeholder="Order details will appear here..."
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link to="/products" className="flex-1">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Continue Shopping
                </Button>
              </Link>
              
              <Button
                onClick={handleWhatsAppCheckout}
                className="flex-1 bg-brand hover:bg-brand-dark text-white"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Complete Order via WhatsApp
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <Card className="bg-muted/30">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <h3 className="font-semibold text-brand">What happens next?</h3>
              <p className="text-sm text-muted-foreground">
                After clicking "Complete Order via WhatsApp", you'll be redirected to WhatsApp where you can 
                confirm your order with our team. We'll verify product availability and send you a payment link.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OrderConfirmation;
