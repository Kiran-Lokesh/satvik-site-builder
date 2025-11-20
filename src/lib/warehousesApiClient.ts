const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:8083';

export interface Warehouse {
  id: string;
  name: string;
  address?: string;
  contactPerson?: string;
  adminIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface WarehouseRequest {
  name: string;
  address?: string;
  contactPerson?: string;
  adminIds?: string[];
}

export interface Admin {
  id: string;
  email: string;
  displayName: string | null;
  role: string;
}

class WarehousesApiClient {
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
        detail = error.detail || error.message || error.error;
      } catch {
        // ignore parse errors
      }
      const error = new Error(detail || `Request failed (${response.status})`);
      // @ts-expect-error attach status for handling
      error.status = response.status;
      throw error;
    }
    if (response.status === 204) {
      return {} as T;
    }
    return response.json();
  }

  async getAllWarehouses(token: string): Promise<Warehouse[]> {
    return this.request<Warehouse[]>(this.resolveUrl('/api/admin/warehouses'), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async getWarehouseById(id: string, token: string): Promise<Warehouse> {
    return this.request<Warehouse>(this.resolveUrl(`/api/admin/warehouses/${id}`), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async createWarehouse(data: WarehouseRequest, token: string): Promise<Warehouse> {
    return this.request<Warehouse>(this.resolveUrl('/api/admin/warehouses'), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  }

  async updateWarehouse(id: string, data: WarehouseRequest, token: string): Promise<Warehouse> {
    return this.request<Warehouse>(this.resolveUrl(`/api/admin/warehouses/${id}`), {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  }

  async deleteWarehouse(id: string, token: string): Promise<void> {
    await this.request<void>(this.resolveUrl(`/api/admin/warehouses/${id}`), {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async getAllAdmins(token: string): Promise<Admin[]> {
    return this.request<Admin[]>(this.resolveUrl('/api/admin/orders/admins'), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  }
}

export const warehousesApiClient = new WarehousesApiClient();

