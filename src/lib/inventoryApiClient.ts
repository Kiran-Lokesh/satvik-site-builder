const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:8083';

export interface InventoryItem {
  id: string;
  warehouseId: string;
  warehouseName: string;
  warehouseCode: string;
  productId: string;
  productName: string;
  quantity: number;
  costPrice?: number;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItemRequest {
  warehouseId: string;
  productId: string;
  quantity: number;
  costPrice?: number;
}

export interface AdjustQuantityRequest {
  warehouseId: string;
  productId: string;
  deltaQuantity: number;
}

class InventoryApiClient {
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

  async getAllInventory(
    token: string,
    warehouseId?: string,
    productName?: string
  ): Promise<InventoryItem[]> {
    const params = new URLSearchParams();
    if (warehouseId) {
      params.append('warehouseId', warehouseId);
    }
    if (productName) {
      params.append('productName', productName);
    }
    const queryString = params.toString();
    const url = this.resolveUrl(`/api/inventory${queryString ? `?${queryString}` : ''}`);
    
    return this.request<InventoryItem[]>(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async getInventoryForWarehouse(warehouseId: string, token: string): Promise<InventoryItem[]> {
    return this.request<InventoryItem[]>(this.resolveUrl(`/api/inventory/warehouse/${warehouseId}`), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async createOrUpdateInventoryItem(
    data: InventoryItemRequest,
    token: string
  ): Promise<InventoryItem> {
    return this.request<InventoryItem>(this.resolveUrl('/api/inventory'), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  }

  async adjustQuantity(data: AdjustQuantityRequest, token: string): Promise<InventoryItem> {
    return this.request<InventoryItem>(this.resolveUrl('/api/inventory/adjust'), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  }
}

export const inventoryApiClient = new InventoryApiClient();

