/**
 * Embedded Stripe Payment Form
 * Allows customers to pay directly on the site without redirect
 */
import React, { useState } from 'react';
import { 
  PaymentElement, 
  useStripe, 
  useElements 
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CreditCard, Lock, User, Mail, MapPin, Check } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';

interface DeliveryInfo {
  name: string;
  email: string;
  street: string;
  city: string;
  state: string;
  zip: string;
}

interface StripePaymentFormProps {
  amount: number;
  onSuccess: (paymentIntentId: string) => void;
  onCancel: () => void;
  onBeforeSubmit?: () => boolean;
  deliveryInfo?: DeliveryInfo;
}

export const StripePaymentForm: React.FC<StripePaymentFormProps> = ({
  amount,
  onSuccess,
  onCancel,
  onBeforeSubmit,
  deliveryInfo,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Billing details state
  const [billingName, setBillingName] = useState('');
  const [billingEmail, setBillingEmail] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [billingCity, setBillingCity] = useState('');
  const [billingState, setBillingState] = useState('');
  const [billingZip, setBillingZip] = useState('');
  const [billingCountry, setBillingCountry] = useState('CA');
  
  // Same as delivery checkbox
  const [sameAsDelivery, setSameAsDelivery] = useState(false);
  
  // Auto-fill billing when "Same as delivery" is checked
  const handleSameAsDeliveryChange = (checked: boolean) => {
    setSameAsDelivery(checked);
    if (checked && deliveryInfo) {
      setBillingName(deliveryInfo.name);
      setBillingEmail(deliveryInfo.email);
      setBillingAddress(deliveryInfo.street);
      setBillingCity(deliveryInfo.city);
      setBillingState(deliveryInfo.state);
      setBillingZip(deliveryInfo.zip);
    } else if (!checked) {
      // Clear fields when unchecked
      setBillingName('');
      setBillingEmail('');
      setBillingAddress('');
      setBillingCity('');
      setBillingState('');
      setBillingZip('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    // Run custom validation if provided
    if (onBeforeSubmit && !onBeforeSubmit()) {
      return;
    }

    // Validate billing details
    if (!billingName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter your name on card",
        variant: "destructive",
      });
      return;
    }

    if (!billingEmail.trim() || !billingEmail.includes('@')) {
      toast({
        title: "Email Required",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    if (!billingAddress.trim()) {
      toast({
        title: "Address Required",
        description: "Please enter your billing street address",
        variant: "destructive",
      });
      return;
    }

    if (!billingCity.trim()) {
      toast({
        title: "City Required",
        description: "Please enter your billing city",
        variant: "destructive",
      });
      return;
    }

    if (!billingState.trim()) {
      toast({
        title: "State Required",
        description: "Please enter your billing state/province",
        variant: "destructive",
      });
      return;
    }

    if (!billingZip.trim()) {
      toast({
        title: "ZIP Code Required",
        description: "Please enter your billing ZIP/Postal code",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/order-confirmation`,
          payment_method_data: {
            billing_details: {
              name: billingName,
              email: billingEmail,
              address: {
                line1: billingAddress,
                city: billingCity,
                state: billingState,
                postal_code: billingZip,
                country: billingCountry,
              }
            }
          }
        },
        redirect: 'if_required', // Stay on page if possible
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message || "Please check your card details and try again.",
          variant: "destructive",
        });
        setIsProcessing(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        toast({
          title: "Payment Successful!",
          description: "Your order has been confirmed.",
        });
        onSuccess(paymentIntent.id);
      }
    } catch (err) {
      console.error('Payment error:', err);
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Billing Information */}
      <div className="bg-gray-50 p-6 rounded-lg border space-y-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-brand" />
            <h3 className="text-lg font-semibold text-brandText">Billing Information</h3>
          </div>
          
          {/* Same as delivery checkbox */}
          {deliveryInfo && (
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="same-as-delivery" 
                checked={sameAsDelivery}
                onCheckedChange={handleSameAsDeliveryChange}
              />
              <Label 
                htmlFor="same-as-delivery" 
                className="text-sm font-medium cursor-pointer"
              >
                Same as delivery address
              </Label>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="billing-name" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Name on Card *
            </Label>
            <Input
              id="billing-name"
              type="text"
              placeholder="John Doe"
              value={billingName}
              onChange={(e) => setBillingName(e.target.value)}
              required
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="billing-email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Address *
            </Label>
            <Input
              id="billing-email"
              type="email"
              placeholder="john@example.com"
              value={billingEmail}
              onChange={(e) => setBillingEmail(e.target.value)}
              required
              className="w-full"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="billing-address" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Street Address *
            </Label>
            <Input
              id="billing-address"
              type="text"
              placeholder="123 Main St, Apt 4B"
              value={billingAddress}
              onChange={(e) => setBillingAddress(e.target.value)}
              required
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="billing-city">City *</Label>
            <Input
              id="billing-city"
              type="text"
              placeholder="Toronto"
              value={billingCity}
              onChange={(e) => setBillingCity(e.target.value)}
              required
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="billing-state">State / Province *</Label>
            <Input
              id="billing-state"
              type="text"
              placeholder="ON"
              value={billingState}
              onChange={(e) => setBillingState(e.target.value)}
              required
              className="w-full"
              maxLength={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="billing-zip">ZIP / Postal Code *</Label>
            <Input
              id="billing-zip"
              type="text"
              placeholder="M5H 2N2"
              value={billingZip}
              onChange={(e) => setBillingZip(e.target.value)}
              required
              className="w-full"
              maxLength={10}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="billing-country">Country *</Label>
            <select
              id="billing-country"
              value={billingCountry}
              onChange={(e) => setBillingCountry(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-input bg-background"
              required
            >
              <option value="CA">Canada</option>
              <option value="US">United States</option>
              <option value="GB">United Kingdom</option>
              <option value="AU">Australia</option>
              <option value="IN">India</option>
              <option value="SG">Singapore</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payment Element */}
      <div className="bg-gray-50 p-6 rounded-lg border">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="h-5 w-5 text-brand" />
          <h3 className="text-lg font-semibold text-brandText">Card Details</h3>
        </div>
        
        <PaymentElement 
          options={{
            layout: 'tabs',
            business: {
              name: 'Satvik Foods',
            },
            fields: {
              billingDetails: {
                name: 'never',
                email: 'never',
                address: 'never',
              }
            }
          }}
        />
      </div>

      {/* Security Badge */}
      <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
        <Lock className="h-4 w-4" />
        <span>Secured by Stripe • Your payment information is encrypted</span>
      </div>

      {/* Amount Display */}
      <div className="bg-brand/5 p-4 rounded-lg border border-brand/20">
        <div className="flex justify-between items-center">
          <span className="text-lg font-medium text-brandText">Total Amount:</span>
          <span className="text-2xl font-bold text-brand">
            ${amount.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1"
        >
          Cancel
        </Button>
        
        <Button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1 bg-brand hover:bg-brand-dark text-white"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing Payment...
            </>
          ) : (
            <>
              <Lock className="h-4 w-4 mr-2" />
              Pay ${amount.toFixed(2)}
            </>
          )}
        </Button>
      </div>

      {/* Test Mode Notice */}
      {import.meta.env.DEV && (
        <div className="text-xs text-center text-gray-500 bg-yellow-50 p-3 rounded">
          <strong>Test Mode:</strong> Use card 4242 4242 4242 4242 with any future expiry
        </div>
      )}
    </form>
  );
};

export default StripePaymentForm;

