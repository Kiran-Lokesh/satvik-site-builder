/**
 * Orders API Client
 * Handles order creation and retrieval against the Spring Boot backend
 */

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:8081';

// Log the backend URL for debugging
if (import.meta.env.DEV) {
  console.log('🔗 Orders API Client - Backend URL:', BACKEND_API_URL);
}

type OrderItemResponse = {
  id: string;
  variant_id?: string;
  variant_name?: string;
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
  orderType?: string; // "pickup" or "delivery"
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
  orderType?: string; // "pickup" or "delivery"
  paymentStatus: string;
  fulfillmentStatus: string;
  assignedToUserId?: string;
  assignedToDisplayName?: string;
  assignedWarehouseId?: string;
  assignedWarehouseName?: string;
  assignedAdminEmail?: string;
  inventoryReduced?: boolean;
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
    if (import.meta.env.DEV) {
      console.log('🔗 Orders API Request:', {
        url: input,
        method: init.method,
        headers: init.headers,
        body: init.body ? JSON.parse(init.body as string) : null,
      });
    }
    
    const response = await fetch(input, init);
    
    if (import.meta.env.DEV) {
      console.log('📥 Orders API Response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      });
    }
    
    if (!response.ok) {
      let detail: string | undefined;
      let errorBody: any = null;
      try {
        errorBody = await response.json();
        detail = errorBody.detail || errorBody.message;
      } catch {
        // ignore parse error
      }
      
      if (import.meta.env.DEV) {
        console.error('❌ Orders API Error:', {
          status: response.status,
          statusText: response.statusText,
          detail,
          errorBody,
        });
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

  async getUserOrders(firebaseUid: string, idToken: string, limit: number = 50): Promise<Order[]> {
    if (!firebaseUid) {
      throw new Error('Firebase UID is required');
    }
    if (!idToken) {
      throw new Error('Authentication token is required');
    }

    const url = this.resolveUrl(`/api/orders/user/${firebaseUid}?limit=${limit}`);
    return this.request<Order[]>(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
      cache: 'no-store',
    });
  }

  async updateOrderStatus(
    orderId: string,
    request: { status: string; paymentIntentId?: string },
    idToken?: string
  ): Promise<Order> {
    if (!orderId) {
      throw new Error('Order ID is required');
    }

    const url = this.resolveUrl(`/api/orders/${orderId}/status`);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (idToken) {
      headers.Authorization = `Bearer ${idToken}`;
    }

    return this.request<Order>(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(request),
    });
  }
}

export const ordersApiClient = new OrdersApiClient();

