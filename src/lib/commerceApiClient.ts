/**
 * Commerce Service API Client
 * 
 * Client for communicating with the Satvik Foods Commerce Service backend
 * This replaces direct Sanity CMS calls with backend API calls
 */

import type {
  UnifiedProduct,
  UnifiedBrand,
  UnifiedCategory,
} from './unifiedDataTypes';

// Configuration
// Use VITE_COMMERCE_API_URL if set, otherwise fall back to VITE_BACKEND_API_URL
// This allows using a single backend service for both commerce and orders
const API_BASE_URL = import.meta.env.VITE_COMMERCE_API_URL || import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:8080';

// Types for backend responses
interface BackendVariantResponse {
  id: string;
  name: string;
  price: number | null;
  inStock: boolean | null;
}

interface BackendReferenceResponse {
  id: string;
  name: string;
}

interface BackendProductResponse {
  id: string; // UUID
  name: string;
  description: string | null;
  inStock?: boolean | null;
  defaultPrice?: number | null;
  brand: BackendReferenceResponse | null;
  category: BackendReferenceResponse | null;
  imageUrl?: string | null;
  galleryImageUrls?: string[];
  variants: BackendVariantResponse[];
}

interface PaginatedResponse<T> {
  data: T[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
}

/**
 * Commerce Service API Client
 */
export class CommerceApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Make a GET request to the backend
   */
  private async get<T>(endpoint: string): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${body}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API request failed: ${url}`, error);
      throw error;
    }
  }

  /**
   * Fetch all products from backend (which fetches from Sanity)
   */
  async fetchProducts(page: number = 0, size: number = 200): Promise<PaginatedResponse<BackendProductResponse>> {
    const response = await this.get<PaginatedResponse<BackendProductResponse>>(
      `/api/products?page=${page}&size=${size}`
    );

    return response;
  }

  /**
   * Fetch all brands from backend
   */
  async fetchProductById(productId: string): Promise<BackendProductResponse> {
    return this.get<BackendProductResponse>(`/api/products/${productId}`);
  }

  /**
   * Fetch all data (products, brands, categories) in one call.
   * Brands and categories are derived from the product list.
   */
  async fetchAllData(): Promise<{
    products: BackendProductResponse[];
    brands: BackendReferenceResponse[];
    categories: BackendReferenceResponse[];
  }> {
    const pageSize = 200;
    let page = 0;
    let hasMore = true;
    const products: BackendProductResponse[] = [];

    while (hasMore) {
      const response = await this.fetchProducts(page, pageSize);
      products.push(...response.data);
      page += 1;
      hasMore = page < response.totalPages;
    }

    const brandMap = new Map<string, BackendReferenceResponse>();
    const categoryMap = new Map<string, BackendReferenceResponse>();

    products.forEach((product) => {
      if (product.brand) {
        brandMap.set(product.brand.id, product.brand);
      }
      if (product.category) {
        categoryMap.set(product.category.id, product.category);
      }
    });

    return {
      products,
      brands: Array.from(brandMap.values()),
      categories: Array.from(categoryMap.values()),
    };
  }

  /**
   * Test backend connection
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.get<{ status: string }>('/actuator/health');
      return response.status === 'UP';
    } catch (error) {
      console.error('❌ Health check failed:', error);
      return false;
    }
  }
}

/**
 * Transform backend response to UnifiedProduct format
 */
export function transformBackendProductToUnified(
  product: BackendProductResponse,
  fallbackImageUrl?: string
): UnifiedProduct {
  const backendVariants = product.variants ?? [];
  const defaultPriceNumber =
    product.defaultPrice ??
    backendVariants.find((variant) => variant.price != null)?.price ??
    null;

  const variants = backendVariants.map((variant) => ({
    id: variant.id,
    name: variant.name,
    price: variant.price != null ? `$${variant.price.toFixed(2)}` : '',
    unitPrice: variant.price ?? 0,
    inStock: variant.inStock ?? true,
  }));

  const firstVariant = variants[0];
  const primaryImage = product.imageUrl || fallbackImageUrl || '/placeholder.svg';
  const galleryImages = product.galleryImageUrls && product.galleryImageUrls.length > 0
    ? product.galleryImageUrls
    : (product.imageUrl ? [product.imageUrl] : [fallbackImageUrl || '/placeholder.svg']);

  const variantsInStock = variants.some((v) => v.inStock);
  const unifiedInStock = product.inStock ?? (variants.length === 0 ? true : variantsInStock);
  const resolvedPrice =
    defaultPriceNumber != null ? `$${defaultPriceNumber.toFixed(2)}` : firstVariant?.price || '';

  return {
    id: product.id,
    name: product.name,
    description: product.description || '',
    price: resolvedPrice,
    variant: firstVariant?.name,
    variants,
    inStock: unifiedInStock,
    featured: false,
    image: {
      url: primaryImage,
      alt: product.name,
      source: primaryImage.startsWith('http') ? 'external' : 'local',
    },
    gallery: galleryImages.map((url) => ({
      url,
      alt: product.name,
      source: url.startsWith('http') ? 'external' : 'local',
    })),
    brand: {
      id: product.brand?.id || 'unknown',
      name: product.brand?.name || 'Unknown',
      isActive: true,
    },
    category: {
      id: product.category?.id || 'uncategorized',
      name: product.category?.name || 'Uncategorized',
      isActive: true,
    },
    tags: [],
  };
}

// Default client instance
export const commerceApiClient = new CommerceApiClient();

