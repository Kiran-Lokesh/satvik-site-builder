import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';
import { X, Plus, Minus, Trash2, MessageCircle } from 'lucide-react';

const Cart = () => {
  const { 
    state, 
    updateQuantity, 
    removeFromCart, 
    closeCart, 
    getSubtotal,
    getGSTAmount,
    getTotalPrice 
  } = useCart();

  const { items, isOpen } = state;
  const subtotal = getSubtotal();
  const gstAmount = getGSTAmount();
  const totalPrice = getTotalPrice();

  // Don't render if cart is not open
  if (!isOpen) return null;

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
    const whatsappNumber = "916363698917"; // Satvik Foods WhatsApp business number
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

    // Open WhatsApp
    window.open(whatsappUrl, '_blank');
  };

  if (items.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[80vh] overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold text-brandText">Shopping Cart</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={closeCart}
              className="p-2 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="p-6 text-center">
            <div className="text-gray-500 mb-4">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
            <p className="text-gray-500 mb-4">Add some products to get started!</p>
            <Button
              onClick={closeCart}
              className="bg-brand hover:bg-brand-dark text-white"
            >
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-brandText">Shopping Cart</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={closeCart}
            className="p-2 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {items.map((item) => (
            <div key={`${item.productId}-${item.variantName}`} className="flex items-center space-x-4 p-4 border rounded-lg">
              <div className="flex-1">
                <h3 className="font-medium text-brandText">{item.productName}</h3>
                <p className="text-sm text-gray-500">{item.variantName}</p>
                {item.price && item.price !== '0' && (
                  <p className="text-sm font-medium text-brand">{item.price}</p>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateQuantity(item.productId, item.variantName, item.quantity - 1)}
                  className="h-8 w-8 p-0"
                >
                  <Minus className="h-3 w-3" />
                </Button>
                
                <Badge variant="secondary" className="px-2 py-1">
                  {item.quantity}
                </Badge>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateQuantity(item.productId, item.variantName, item.quantity + 1)}
                  className="h-8 w-8 p-0"
                >
                  <Plus className="h-3 w-3" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFromCart(item.productId, item.variantName)}
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t p-6 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-brandText">Total Items:</span>
            <span className="text-lg font-semibold text-brand">
              {items.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          </div>
          
          {totalPrice > 0 && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Subtotal:</span>
                <span className="text-sm text-muted-foreground">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">GST (5%):</span>
                <span className="text-sm text-muted-foreground">${gstAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center border-t pt-2">
                <span className="text-lg font-semibold text-brandText">Total:</span>
                <span className="text-lg font-semibold text-brand">${totalPrice.toFixed(2)}</span>
              </div>
            </>
          )}

          <Button
            onClick={handleWhatsAppCheckout}
            className="w-full bg-brand hover:bg-brand-dark text-white"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Checkout via WhatsApp
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
