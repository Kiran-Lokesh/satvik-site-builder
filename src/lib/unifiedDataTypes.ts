/**
 * Unified Data Types
 * 
 * This file defines the common interface that both local JSON and Sanity data sources
 * must implement. All data is normalized to this structure regardless of source.
 */

// ============================================================================
// CORE UNIFIED TYPES
// ============================================================================

/**
 * Unified Product Variant Interface
 * Represents different sizes, weights, or packaging options for a product
 */
export interface UnifiedProductVariant {
  id: string;
  name: string;
  price: string;
  unitPrice?: number;
  inStock: boolean;
  weight?: string;
  unit?: string;
  sku?: string;
  description?: string;
}

/**
 * Unified Product Interface
 * The standard product structure used throughout the application
 */
export interface UnifiedProduct {
  id: string;
  name: string;
  description: string;
  image: UnifiedImage;
  gallery?: UnifiedImage[];
  price?: string; // For single-variant products
  variant?: string; // For single-variant products
  variants?: UnifiedProductVariant[]; // For multi-variant products
  inStock: boolean;
  featured: boolean;
  category: UnifiedCategory;
  brand: UnifiedBrand;
  tags?: string[];
  nutritionalInfo?: Record<string, any>;
  ingredients?: string[];
  allergens?: string[];
  shelfLife?: string;
  storageInstructions?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Unified Category Interface
 * Represents product categories within a brand
 */
export interface UnifiedCategory {
  id: string;
  name: string;
  description?: string;
  image?: UnifiedImage;
  gallery?: UnifiedImage[];
  sortOrder?: number;
  isActive: boolean;
  parentCategoryId?: string;
  seoTitle?: string;
  seoDescription?: string;
}

/**
 * Unified Brand Interface
 * Represents the brand/organization
 */
export interface UnifiedBrand {
  id: string;
  name: string;
  description?: string;
  logo?: UnifiedImage;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  isActive: boolean;
  sortOrder?: number;
  seoTitle?: string;
  seoDescription?: string;
}

/**
 * Unified Image Interface
 * Handles both local images and Sanity CDN images
 */
export interface UnifiedImage {
  url: string;
  alt: string;
  width?: number;
  height?: number;
  format?: string;
  source: 'local' | 'sanity' | 'external';
  originalName?: string;
  caption?: string;
  fallbackUrl?: string; // Fallback URL for when primary image fails to load
}

/**
 * Unified Data Structure
 * The complete data structure returned by the unified data service
 */
export interface UnifiedData {
  brands: UnifiedBrand[];
  categories: UnifiedCategory[];
  products: UnifiedProduct[];
  metadata: {
    totalBrands: number;
    totalCategories: number;
    totalProducts: number;
    lastUpdated: string;
    dataSource: 'local' | 'sanity' | 'backend';
  };
}

// ============================================================================
// DATA SOURCE SPECIFIC TYPES
// ============================================================================

/**
 * Local JSON Data Types
 * Raw structure from local JSON files
 */
export interface LocalJsonData {
  brands: LocalBrand[];
}

export interface LocalBrand {
  id: string;
  name: string;
  categories: LocalCategory[];
}

export interface LocalCategory {
  id: string;
  name: string;
  products: LocalProduct[];
}

export interface LocalProduct {
  id: string;
  name: string;
  description?: string;
  image?: string;
  price?: string;
  variant?: string;
  variants?: LocalProductVariant[];
  featured?: boolean;
  inStock?: boolean;
}

export interface LocalProductVariant {
  id: string;
  name: string;
  price?: string;
  inStock?: boolean;
  weight?: string;
  unit?: string;
}

/**
 * Sanity Data Types
 * Raw structure from Sanity CMS
 */
export interface SanityRawData {
  products: SanityRawProduct[];
  brands: SanityRawBrand[];
  categories: SanityRawCategory[];
}

export interface SanityRawBrand {
  _id: string;
  id: string;
  name: string;
  description?: string;
  logo?: SanityImage;
  website?: string;
  isActive?: boolean;
}

export interface SanityRawCategory {
  _id: string;
  id: string;
  name: string;
  description?: string;
  image?: SanityImage;
  sortOrder?: number;
  isActive?: boolean;
}

export interface SanityRawProduct {
  _id: string;
  id: string;
  name: string;
  description: string;
  price?: string;
  variant?: string;
  variants?: SanityRawProductVariant[];
  inStock: boolean;
  featured: boolean;
  image?: SanityImage;
  brand: SanityRawBrand;
  category: SanityRawCategory;
  tags?: string[];
  nutritionalInfo?: Record<string, any>;
  ingredients?: string[];
  allergens?: string[];
  shelfLife?: string;
  storageInstructions?: string;
  _createdAt: string;
  _updatedAt: string;
}

export interface SanityRawProductVariant {
  id: string;
  name: string;
  price: string;
  inStock: boolean;
  weight?: string;
  unit?: string;
  sku?: string;
  description?: string;
}

export interface SanityImage {
  asset: {
    _ref: string;
    _type: string;
  };
  alt?: string;
  caption?: string;
  hotspot?: {
    x: number;
    y: number;
    height: number;
    width: number;
  };
  crop?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

// ============================================================================
// TRANSFORMATION CONTEXT
// ============================================================================

/**
 * Transformation Context
 * Provides context for data transformations
 */
export interface TransformationContext {
  source: 'local' | 'sanity' | 'backend';
  baseUrl?: string;
  imageBaseUrl?: string;
  defaultImage?: string;
  fallbackImage?: string;
}

/**
 * Transformation Result
 * Result of data transformation operations
 */
export interface TransformationResult<T> {
  data: T;
  errors: string[];
  warnings: string[];
  metadata: {
    source: 'local' | 'sanity' | 'backend';
    transformedAt: string;
    recordCount: number;
  };
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Data Source Identifier
 */
export type DataSource = 'local' | 'sanity' | 'backend';

/**
 * Image Source Type
 */
export type ImageSource = 'local' | 'sanity' | 'external';

/**
 * Product Status
 */
export type ProductStatus = 'active' | 'inactive' | 'draft' | 'archived';

/**
 * Category Status
 */
export type CategoryStatus = 'active' | 'inactive' | 'hidden';

/**
 * Brand Status
 */
export type BrandStatus = 'active' | 'inactive' | 'pending';
