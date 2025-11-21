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

export type TransactionReason = 
  | 'MANUAL_ADJUSTMENT'
  | 'ORDER_DEDUCTION'
  | 'TRANSFER'
  | 'SPOILAGE'
  | 'INITIAL_STOCK';

export interface AdjustQuantityWithReasonRequest {
  warehouseId: string;
  productId: string;
  deltaQuantity: number;
  reason: TransactionReason;
  performedBy: string;
}

export interface TransferInventoryRequest {
  sourceWarehouseId: string;
  destinationWarehouseId: string;
  productId: string;
  quantity: number;
  performedBy: string;
}

export interface InventoryTransaction {
  id: string;
  warehouseId: string;
  warehouseName: string;
  productId: string;
  productName: string;
  quantityChange: number;
  newQuantity: number;
  reason: TransactionReason;
  sourceWarehouseId?: string;
  sourceWarehouseName?: string;
  destinationWarehouseId?: string;
  destinationWarehouseName?: string;
  performedBy: string;
  timestamp: string;
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

  async adjustQuantityWithReason(
    data: AdjustQuantityWithReasonRequest,
    token: string
  ): Promise<InventoryItem> {
    return this.request<InventoryItem>(this.resolveUrl('/api/inventory/adjust'), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  }

  async transferInventory(
    data: TransferInventoryRequest,
    token: string
  ): Promise<void> {
    const response = await fetch(this.resolveUrl('/api/inventory/transfer'), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
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
    
    // Transfer endpoint returns 200 OK with no body, which is fine
    return;
  }

  async getInventoryByWarehouseAndProducts(
    token: string,
    warehouseId: string,
    productIds: string[]
  ): Promise<InventoryItem[]> {
    const productIdsParam = productIds.join(',');
    const url = this.resolveUrl(`/api/inventory/by-warehouse-and-products?warehouseId=${warehouseId}&productIds=${productIdsParam}`);
    return this.request<InventoryItem[]>(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async getInventoryHistory(
    token: string,
    warehouseId?: string,
    productId?: string,
    fromDate?: string,
    toDate?: string
  ): Promise<InventoryTransaction[]> {
    const params = new URLSearchParams();
    if (warehouseId) {
      params.append('warehouseId', warehouseId);
    }
    if (productId) {
      params.append('productId', productId);
    }
    if (fromDate) {
      params.append('fromDate', fromDate);
    }
    if (toDate) {
      params.append('toDate', toDate);
    }
    const queryString = params.toString();
    const url = this.resolveUrl(`/api/inventory/history${queryString ? `?${queryString}` : ''}`);
    
    return this.request<InventoryTransaction[]>(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  }
}

export const inventoryApiClient = new InventoryApiClient();

