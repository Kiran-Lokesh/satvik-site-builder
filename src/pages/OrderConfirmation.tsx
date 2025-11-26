import React, { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { MessageCircle, CheckCircle, ArrowLeft, User, MapPin, Store, Truck } from 'lucide-react';
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

  // Customer information state
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState('pickup');
  const [pickupLocation, setPickupLocation] = useState('');
  const [isFormValid, setIsFormValid] = useState(false);

  // Pickup locations
  const pickupLocations = [
    { id: 'belmont', name: 'Belmont Location', address: '187 Belmont Blvd SW, Calgary AB T2X 4W5' },
    { id: 'seton', name: 'Seton Location', address: '210 Setonstone Landing SE, Calgary AB T3M 3R6' }
  ];

  // Calculate delivery fee
  const deliveryFee = subtotal < 50 && deliveryMethod === 'delivery' ? 3 : 0;
  const finalTotal = totalPrice + deliveryFee;

  // Validate form whenever customer details change
  React.useEffect(() => {
    const hasName = customerName.trim().length > 0;
    const hasAddress = deliveryMethod === 'delivery' ? customerAddress.trim().length > 0 : true;
    const hasPickupLocation = deliveryMethod === 'pickup' ? pickupLocation.trim().length > 0 : true;
    
    setIsFormValid(hasName && hasAddress && hasPickupLocation);
  }, [customerName, customerAddress, deliveryMethod, pickupLocation]);

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
        const unitPrice = parseFloat(item.price.replace('$', ''));
        const totalPrice = unitPrice * item.quantity;
        summary += `   Unit Price: ${item.price}\n`;
        if (item.quantity > 1) {
          summary += `   Subtotal: $${totalPrice.toFixed(2)}\n`;
        }
      }
      summary += "\n";
    });

    summary += "DELIVERY/PICKUP INFO:\n";
    summary += "-".repeat(20) + "\n";
    if (deliveryMethod === 'pickup') {
      const selectedLocation = pickupLocations.find(loc => loc.id === pickupLocation);
      summary += `Method: Pickup\n`;
      summary += `Location: ${selectedLocation ? selectedLocation.name : 'Not selected'}\n`;
      if (selectedLocation) {
        summary += `Address: ${selectedLocation.address}\n`;
      }
    } else {
      summary += `Method: Delivery\n`;
      summary += `Delivery Address: ${customerAddress}\n`;
    }
    summary += "\n";

    summary += "ORDER TOTALS:\n";
    summary += "-".repeat(20) + "\n";
    summary += `Total Items: ${items.reduce((sum, item) => sum + item.quantity, 0)}\n`;
    
    if (totalPrice > 0) {
      if (deliveryFee > 0) {
        summary += `Delivery Fee: $${deliveryFee.toFixed(2)}\n`;
      }
      summary += `TOTAL: $${finalTotal.toFixed(2)}\n`;
    }

    summary += "\n" + "=".repeat(50) + "\n";
    summary += "Thank you for choosing Satvik Foods!\n";
    summary += "Please review your order details above.";

    return summary;
  };

  // WhatsApp checkout functionality
  const handleWhatsAppCheckout = () => {
    if (items.length === 0 || !isFormValid) return;

    // Build the message
    let message = "Hello Satvik Foods! I'd like to order:\n\n";
    
    // Add customer information
    message += "CUSTOMER DETAILS:\n";
    message += `Name: ${customerName}\n`;
    if (deliveryMethod === 'pickup') {
      const selectedLocation = pickupLocations.find(loc => loc.id === pickupLocation);
      message += `Method: Pickup\n`;
      message += `Pickup Location: ${selectedLocation ? selectedLocation.name : 'Not selected'}\n`;
      if (selectedLocation) {
        message += `Address: ${selectedLocation.address}\n`;
      }
    } else {
      message += `Method: Delivery\n`;
      message += `Delivery Address: ${customerAddress}\n`;
    }
    message += "\n";
    
    message += "ORDER ITEMS:\n";
    items.forEach((item, index) => {
      message += `${index + 1}. ${item.productName} (${item.variantName}) - Qty: ${item.quantity}`;
      if (item.price && item.price !== '0') {
        const unitPrice = parseFloat(item.price.replace('$', ''));
        const totalPrice = unitPrice * item.quantity;
        message += ` - ${item.price}`;
        if (item.quantity > 1) {
          message += ` (Subtotal: $${totalPrice.toFixed(2)})`;
        }
      }
      message += '\n';
    });

    message += `\nTotal Items: ${items.reduce((sum, item) => sum + item.quantity, 0)}`;
    if (totalPrice > 0) {
      if (deliveryFee > 0) {
        message += `\nDelivery Fee: $${deliveryFee.toFixed(2)}`;
      }
      message += `\nTotal: $${finalTotal.toFixed(2)}`;
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

        {/* Customer Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerName" className="text-sm font-medium">
                  Full Name *
                </Label>
                <Input
                  id="customerName"
                  type="text"
                  placeholder="Enter your full name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerAddress" className="text-sm font-medium">
                  Delivery Address {deliveryMethod === 'delivery' ? '*' : ''}
                </Label>
                <Input
                  id="customerAddress"
                  type="text"
                  placeholder={deliveryMethod === 'delivery' ? "Enter your delivery address" : "Enter your delivery address (optional for pickup)"}
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="w-full"
                  required={deliveryMethod === 'delivery'}
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              * Required fields. This information will be included in your WhatsApp order message.
            </p>
          </CardContent>
        </Card>

        {/* Delivery Method Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Delivery Method
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup value={deliveryMethod} onValueChange={setDeliveryMethod}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pickup" id="pickup" />
                <Label htmlFor="pickup" className="flex items-center gap-2">
                  <Store className="h-4 w-4" />
                  Pickup from Store
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="delivery" id="delivery" />
                <Label htmlFor="delivery" className="flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Delivery to Address
                  {subtotal < 50 ? (
                    <span className="text-sm text-orange-600 font-medium">
                      (+$3 delivery fee - FREE over $50!)
                    </span>
                  ) : (
                    <span className="text-sm text-green-600 font-medium">
                      (FREE delivery!)
                    </span>
                  )}
                </Label>
              </div>
            </RadioGroup>

            {deliveryMethod === 'pickup' && (
              <div className="space-y-2">
                <Label className={`text-sm font-medium ${!pickupLocation.trim() ? 'text-red-600' : ''}`}>
                  Pickup Location *
                </Label>
                <RadioGroup value={pickupLocation} onValueChange={setPickupLocation}>
                  {pickupLocations.map((location) => (
                    <div key={location.id} className="flex items-start space-x-2">
                      <RadioGroupItem value={location.id} id={location.id} />
                      <Label htmlFor={location.id} className="flex-1">
                        <div className="font-medium">{location.name}</div>
                        <div className="text-sm text-muted-foreground">{location.address}</div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            {deliveryMethod === 'delivery' && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Delivery Address</Label>
                <p className="text-sm text-muted-foreground">
                  We'll deliver to: {customerAddress || 'Please enter your address above'}
                </p>
                {subtotal < 50 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 space-y-2">
                    <p className="text-sm text-orange-700 font-medium">
                      Orders under $50 have a $3 delivery fee
                    </p>
                    <p className="text-sm text-orange-600">
                      Add ${(50 - subtotal).toFixed(2)} more to your order to get FREE delivery!
                    </p>
                    <Link to="/products">
                      <Button variant="outline" size="sm" className="text-orange-700 border-orange-300 hover:bg-orange-100">
                        Continue Shopping
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>


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
                disabled={!isFormValid}
                className="flex-1 bg-brand hover:bg-brand-dark text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Complete Order via WhatsApp
              </Button>
            </div>
            
            {!isFormValid && (
              <p className="text-sm text-red-500 text-center">
                {deliveryMethod === 'pickup' && !pickupLocation.trim() 
                  ? 'Please fill in your name and select a pickup location to proceed.'
                  : deliveryMethod === 'delivery' && !customerAddress.trim()
                  ? 'Please fill in your name and delivery address to proceed with the order.'
                  : 'Please fill in your name to proceed with the order.'
                }
              </p>
            )}
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
