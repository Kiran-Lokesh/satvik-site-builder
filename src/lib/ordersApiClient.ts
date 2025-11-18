/**
 * Orders API Client
 * Handles order creation and retrieval against the Spring Boot backend
 */

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:8081';

type OrderItemResponse = {
  id: string;
  variant_id?: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
};

export interface CreateOrderItem {
  variantId: string;
  quantity: number;
}

export interface CreateOrderGuest {
  name?: string;
  email?: string;
  whatsappNumber?: string;
  createAccount?: boolean;
}

export interface CreateOrderRequest {
  items: CreateOrderItem[];
  paymentMethod: string;
  shippingAddress?: Record<string, unknown>;
  guest?: CreateOrderGuest;
}

export interface CreateOrderResponse {
  orderId: string;
  orderNumber: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string;
  guestEmail?: string;
  guestName?: string;
  items: OrderItemResponse[];
  subtotal: number;
  tax: number;
  shipping: number;
  totalPrice: number;
  paymentMethod?: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  assignedToUserId?: string;
  assignedToDisplayName?: string;
  shippingAddress?: string;
  paymentIntentId?: string;
  createdAt: string;
  updatedAt: string;
}

export class OrdersApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = BACKEND_API_URL) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  private resolveUrl(path: string): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${this.baseUrl}${normalizedPath}`;
  }

  private async request<T>(input: RequestInfo, init: RequestInit): Promise<T> {
    const response = await fetch(input, init);
    if (!response.ok) {
      let detail: string | undefined;
      try {
        const error = await response.json();
        detail = error.detail || error.message;
      } catch {
        // ignore parse error
      }
      throw new Error(detail || `Request failed (${response.status})`);
    }
    return response.json();
  }

  async createOrder(orderData: CreateOrderRequest, idToken?: string): Promise<CreateOrderResponse> {
    const url = this.resolveUrl('/api/orders');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (idToken) {
      headers.Authorization = `Bearer ${idToken}`;
    }

    return this.request<CreateOrderResponse>(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(orderData),
    });
  }

  async getOrder(orderId: string, idToken?: string): Promise<Order> {
    if (!orderId) {
      throw new Error('Order ID is required');
    }

    const url = this.resolveUrl(`/api/orders/${orderId}`);
    const headers: Record<string, string> = {};
    if (idToken) {
      headers.Authorization = `Bearer ${idToken}`;
    }

    return this.request<Order>(url, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });
  }
}

export const ordersApiClient = new OrdersApiClient();

