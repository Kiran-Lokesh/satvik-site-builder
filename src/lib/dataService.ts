import { DATA_SOURCE_CONFIG, shouldUseAirtable } from './config';
import { getDataByBrands } from './airtable';
import jawariProducts from '@/data/jawari_products.json';

// Types for our data structure
export interface ProductVariant {
  id: string;
  name: string;
  price?: string;
  inStock?: boolean;
  weight?: string;
  unit?: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  image?: string;
  variants?: ProductVariant[];
  featured?: boolean;
}

export interface Category {
  id: string;
  name: string;
  products: Product[];
}

export interface Brand {
  id: string;
  name: string;
  categories: Category[];
}

// Cache for Airtable data
let airtableCache: Brand[] | null = null;
let cacheTimestamp: number = 0;

// Helper function to check if cache is valid
const isCacheValid = (): boolean => {
  if (!airtableCache) return false;
  const now = Date.now();
  const cacheAge = now - cacheTimestamp;
  const cacheValidityMs = DATA_SOURCE_CONFIG.airtableCacheMinutes * 60 * 1000;
  return cacheAge < cacheValidityMs;
};

// Load data from Airtable with caching
const loadFromAirtable = async (): Promise<Brand[]> => {
  try {
    // Check cache first
    if (isCacheValid() && airtableCache) {
      return airtableCache;
    }

    const data = await getDataByBrands();
    
    // Update cache
    airtableCache = data;
    cacheTimestamp = Date.now();
    
    return data;
  } catch (error) {
    console.error('❌ Failed to load from Airtable:', error);
    throw error;
  }
};

// Load data from JSON files
const loadFromJson = (): Brand[] => {
  return (jawariProducts as any).brands || (jawariProducts as unknown as Brand[]);
};

// Main function to get product data
export const getProductData = async (): Promise<Brand[]> => {
  try {
    if (shouldUseAirtable()) {
      return await loadFromAirtable();
    } else {
      return loadFromJson();
    }
  } catch (error) {
    console.error('❌ Error loading product data:', error);
    
    // Fallback to JSON if Airtable fails and fallback is enabled
    if (shouldUseAirtable() && DATA_SOURCE_CONFIG.fallbackToJson) {
      return loadFromJson();
    }
    
    throw error;
  }
};

