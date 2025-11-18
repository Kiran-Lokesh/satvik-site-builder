import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';
import { X, Plus, Minus, Trash2, ArrowRight, Loader2, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

const Cart = () => {
  const navigate = useNavigate();
  const { 
    state, 
    updateQuantity, 
    removeFromCart, 
    closeCart, 
    clearCart,
    getSubtotal,
    getGSTAmount,
    getTotalPrice 
  } = useCart();

  const { items, isOpen } = state;
  const subtotal = getSubtotal();
  const gstAmount = getGSTAmount();
  const totalPrice = getTotalPrice();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Reset checkout state when cart closes
  React.useEffect(() => {
    if (!isOpen) {
      setIsCheckingOut(false);
    }
  }, [isOpen]);

  // Don't render if cart is not open
  if (!isOpen) return null;

  // Handle checkout - create order and navigate to embedded payment form
  const handleProceedToCheckout = async () => {
    console.log('🛒 Starting checkout...');
    setIsCheckingOut(true);

    try {
      if (items.length === 0) {
        throw new Error('Your cart is empty');
      }

      closeCart();
      navigate('/checkout', { replace: false });
    } catch (error) {
      console.error('❌ Checkout preparation failed:', error);
      setIsCheckingOut(false);

      toast({
        title: 'Checkout Failed',
        description: error instanceof Error ? error.message : 'Failed to start checkout. Please try again.',
        variant: 'destructive',
      });
    }
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
            <div className="flex justify-center mb-4">
              <ShoppingCart className="h-16 w-16 text-gray-400" />
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
                {item.priceLabel && item.priceLabel !== '0' && (
                  <p className="text-sm font-medium text-brand">{item.priceLabel}</p>
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
              <div className="flex justify-between items-center border-t pt-2">
                <span className="text-lg font-semibold text-brandText">Total:</span>
                <span className="text-lg font-semibold text-brand">${totalPrice.toFixed(2)}</span>
              </div>
            </>
          )}

          <Button 
            onClick={handleProceedToCheckout}
            disabled={isCheckingOut}
            className="w-full bg-brand hover:bg-brand-dark text-white"
          >
            {isCheckingOut ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <ArrowRight className="h-4 w-4 mr-2" />
                Proceed to Checkout
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
