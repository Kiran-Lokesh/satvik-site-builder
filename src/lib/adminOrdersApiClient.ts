import { Order } from '@/lib/ordersApiClient';

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:8081';

export interface AdminOrderFilters {
  page?: number;
  size?: number;
  status?: string;
  assignedTo?: string;
  from?: string;
  to?: string;
}

export interface PaginatedOrdersResponse {
  data: Order[];
  page: number;
  size: number;
  totalPages: number;
  totalItems: number;
}

export interface OrderHistoryEntry {
  id: string;
  action: string;
  payload: string | null;
  createdAt: string;
  actor: {
    id: string;
    displayName: string | null;
    email: string | null;
  } | null;
}

class AdminOrdersApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = BACKEND_API_URL) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  private resolveUrl(path: string): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${this.baseUrl}${normalizedPath}`;
  }

  private buildQuery(params: Record<string, string | number | undefined>): string {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, String(value));
      }
    });
    const queryString = query.toString();
    return queryString ? `?${queryString}` : '';
  }

  private async request<T>(input: RequestInfo, init: RequestInit): Promise<T> {
    const response = await fetch(input, init);
    if (!response.ok) {
      let detail: string | undefined;
      try {
        const error = await response.json();
        detail = error.detail || error.message;
      } catch {
        // ignore parse errors
      }
      const error = new Error(detail || `Request failed (${response.status})`);
      // @ts-expect-error attach status for handling
      error.status = response.status;
      throw error;
    }
    return response.json();
  }

  async getOrders(filters: AdminOrderFilters, idToken: string): Promise<PaginatedOrdersResponse> {
    const query = this.buildQuery({
      page: filters.page,
      size: filters.size,
      status: filters.status,
      assignedTo: filters.assignedTo,
      from: filters.from,
      to: filters.to,
    });
    const url = this.resolveUrl(`/api/admin/orders${query}`);
    return this.request(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    });
  }

  async assignToMe(orderId: string, idToken: string): Promise<Order> {
    const url = this.resolveUrl(`/api/admin/orders/${orderId}/assign`);
    return this.request(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    });
  }

  async updateStatus(orderId: string, status: string, idToken: string): Promise<Order> {
    const url = this.resolveUrl(`/api/admin/orders/${orderId}/status`);
    return this.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ status }),
    });
  }

  async getOrderHistory(orderId: string, idToken: string): Promise<OrderHistoryEntry[]> {
    const url = this.resolveUrl(`/api/orderHistory?orderId=${orderId}`);
    return this.request(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    });
  }
}

export const adminOrdersApiClient = new AdminOrdersApiClient();
