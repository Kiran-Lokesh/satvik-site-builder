/**
 * Payments Service API Client
 * Handles Stripe checkout integration
 */

// Configuration - use backend API URL for checkout endpoints
const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:8081';

export interface CheckoutSessionResponse {
  session_id: string;
  session_url: string;
  publishable_key: string;
}

export interface PaymentIntentResponse {
  client_secret: string;
  payment_intent_id: string;
  publishable_key: string;
  amount: number;
}

export class PaymentsApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = BACKEND_API_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Create a Stripe Payment Intent for embedded payment form (requires existing order)
   */
  async createPaymentIntent(
    orderId: string, 
    customerName?: string, 
    customerEmail?: string
  ): Promise<PaymentIntentResponse> {
    const url = `${this.baseUrl}/api/checkout/payment-intent`;

    try {
      const requestBody: any = { order_id: orderId };
      if (customerName) requestBody.customer_name = customerName;
      if (customerEmail) requestBody.customer_email = customerEmail;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create payment intent');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to create payment intent:', error);
      throw error;
    }
  }

  /**
   * Create a Payment Intent with order data (order not yet created in DB)
   * Order will be created after payment succeeds
   */
  async createPaymentIntentWithOrder(
    orderData: {
      items: Array<{ variantId: string; quantity: number }>;
      paymentMethod: string;
      orderType?: string;
      shippingAddress?: Record<string, unknown>;
      guest?: {
        name?: string;
        email?: string;
        whatsappNumber?: string;
        createAccount?: boolean;
      };
      customerName: string;
      customerEmail: string;
    }
  ): Promise<PaymentIntentResponse> {
    const url = `${this.baseUrl}/api/checkout/payment-intent-with-order`;

    try {
      // Log the request data for debugging
      console.log('Creating payment intent with order data:', {
        itemsCount: orderData.items.length,
        paymentMethod: orderData.paymentMethod,
        orderType: orderData.orderType,
        customerName: orderData.customerName,
        customerEmail: orderData.customerEmail,
        hasShippingAddress: !!orderData.shippingAddress,
        hasGuest: !!orderData.guest,
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Payment intent creation failed:', {
          status: response.status,
          error,
          requestData: {
            itemsCount: orderData.items.length,
            customerName: orderData.customerName,
            customerEmail: orderData.customerEmail,
          },
        });
        
        // Handle validation errors
        if (error.errors) {
          const errorMessages = Object.entries(error.errors)
            .map(([field, message]) => `${field}: ${message}`)
            .join(', ');
          console.error('Validation errors:', error.errors);
          throw new Error(`Validation failed: ${errorMessages}`);
        }
        // Handle other errors
        throw new Error(error.message || error.detail || 'Failed to create payment intent with order');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to create payment intent with order:', error);
      throw error;
    }
  }

  /**
   * Create a Stripe checkout session for an order (legacy - redirects to Stripe)
   */
  async createCheckoutSession(orderId: string): Promise<CheckoutSessionResponse> {
    const url = `${this.baseUrl}/api/checkout`;
    console.log(`💳 Creating checkout session for order: ${orderId}`);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ order_id: orderId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create checkout session');
      }

      const data = await response.json();
      console.log('✅ Checkout session created:', data.session_id);
      return data;
    } catch (error) {
      console.error('❌ Failed to create checkout session:', error);
      throw error;
    }
  }

  /**
   * Get Stripe configuration (publishable key)
   */
  async getStripeConfig(): Promise<{ publishable_key: string }> {
    const url = `${this.baseUrl}/api/checkout/config`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to get Stripe config');
      }
      return await response.json();
    } catch (error) {
      console.error('❌ Failed to get Stripe config:', error);
      throw error;
    }
  }

  /**
   * Create order from payment intent (fallback for local dev or webhook failures)
   * This endpoint creates the order from payment intent metadata when webhooks aren't available
   */
  async createOrderFromPaymentIntent(paymentIntentId: string): Promise<any> {
    const url = `${this.baseUrl}/api/checkout/create-order-from-payment?paymentIntentId=${encodeURIComponent(paymentIntentId)}`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || error.message || 'Failed to create order from payment intent');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ Failed to create order from payment intent:', error);
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/actuator/health`);
      if (!response.ok) {
        throw new Error(`Health endpoint returned ${response.status}`);
      }
      const data = await response.json();
      return data.status === 'UP';
    } catch (error) {
      console.error('❌ Payments service health check failed:', error);
      return false;
    }
  }
}

// Default client instance
export const paymentsApiClient = new PaymentsApiClient();

