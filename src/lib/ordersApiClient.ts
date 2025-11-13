/**
 * Orders API Client
 * Handles order creation and retrieval against the Spring Boot backend
 */

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:8081';

export interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
}

export interface CreateOrderRequest {
  user_id: string;
  items: OrderItem[];
}

export interface Order {
  id: string;
  user_id: string;
  items: OrderItem[];
  total_price: number;
  status: string;
  created_at: string;
  updated_at: string;
  payment_intent_id?: string;
}

export class OrdersApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = BACKEND_API_URL) {
    this.baseUrl = baseUrl;
  }

  private resolveUrl(path: string): string {
    const normalizedBase = this.baseUrl.replace(/\/+$/, '');
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${normalizedBase}${normalizedPath}`;
  }

  async createOrder(orderData: CreateOrderRequest): Promise<Order> {
    const url = this.resolveUrl('/api/orders');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      let detail: string | undefined;
      try {
        const error = await response.json();
        detail = error.detail;
      } catch {
        // ignore
      }
      throw new Error(detail || `Failed to create order (${response.status})`);
    }

    return response.json();
  }

  async getOrder(orderId: string): Promise<Order> {
    if (!orderId) {
      throw new Error('Order ID is required');
    }

    const url = this.resolveUrl(`/api/orders/${orderId}`);

    const response = await fetch(url, { cache: 'no-store' });

    if (!response.ok) {
      throw new Error(`Order not found (${response.status})`);
    }

    return response.json();
  }
}

export const ordersApiClient = new OrdersApiClient();

