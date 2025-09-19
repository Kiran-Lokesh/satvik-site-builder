import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'

// Initialize Sanity client
export const client = createClient({
  projectId: import.meta.env.VITE_SANITY_PROJECT_ID || 'eaaly2y1',
  dataset: import.meta.env.VITE_SANITY_DATASET || 'products',
  useCdn: false, // Set to false for authenticated requests
  apiVersion: '2024-09-19',
  token: import.meta.env.VITE_SANITY_TOKEN, // Add token for authenticated requests
  ignoreBrowserTokenWarning: true, // Suppress browser token warning
})

// Get a pre-configured url-builder from your sanity client
const builder = imageUrlBuilder(client)

// Helper function to generate image URLs
export function urlFor(source: any) {
  return builder.image(source)
}

// Type definitions for your Sanity data
export interface SanityBrand {
  _id: string
  id: string
  name: string
}

export interface SanityCategory {
  _id: string
  id: string
  name: string
}

export interface SanityProductVariant {
  id: string
  name: string
  price: string
  inStock: boolean
}

export interface SanityProduct {
  _id: string
  id: string
  name: string
  description: string
  price?: string
  variant?: string
  variants?: SanityProductVariant[]
  inStock: boolean
  featured: boolean
  image?: {
    asset: {
      _ref: string
    }
    alt: string
  }
  brand: {
    _ref: string
  }
  category: {
    _ref: string
  }
}

export interface SanityProductWithRelations extends Omit<SanityProduct, 'brand' | 'category'> {
  brand: SanityBrand
  category: SanityCategory
}

// Query functions for your frontend
export const queries = {
  // Get all products with brand and category data
  getAllProducts: `*[_type == "product"] | order(name asc) {
    _id,
    id,
    name,
    description,
    price,
    variant,
    variants,
    inStock,
    featured,
    image,
    "brand": brand->{_id, id, name},
    "category": category->{_id, id, name}
  }`,

  // Get featured products
  getFeaturedProducts: `*[_type == "product" && featured == true] | order(name asc) {
    _id,
    id,
    name,
    description,
    price,
    variant,
    variants,
    inStock,
    image,
    "brand": brand->{_id, id, name},
    "category": category->{_id, id, name}
  }`,

  // Get products by brand
  getProductsByBrand: (brandId: string) => `*[_type == "product" && brand->id == "${brandId}"] | order(name asc) {
    _id,
    id,
    name,
    description,
    price,
    variant,
    variants,
    inStock,
    image,
    "brand": brand->{_id, id, name},
    "category": category->{_id, id, name}
  }`,

  // Get products by category
  getProductsByCategory: (categoryId: string) => `*[_type == "product" && category->id == "${categoryId}"] | order(name asc) {
    _id,
    id,
    name,
    description,
    price,
    variant,
    variants,
    inStock,
    image,
    "brand": brand->{_id, id, name},
    "category": category->{_id, id, name}
  }`,

  // Get all brands
  getAllBrands: `*[_type == "brand"] | order(name asc) {
    _id,
    id,
    name
  }`,

  // Get all categories
  getAllCategories: `*[_type == "category"] | order(name asc) {
    _id,
    id,
    name
  }`,

  // Get single product by ID
  getProductById: (productId: string) => `*[_type == "product" && id == "${productId}"][0] {
    _id,
    id,
    name,
    description,
    price,
    variant,
    variants,
    inStock,
    featured,
    image,
    "brand": brand->{_id, id, name},
    "category": category->{_id, id, name}
  }`,

  // Get products by brand and category
  getProductsByBrandAndCategory: (brandId: string, categoryId: string) => `*[_type == "product" && brand->id == "${brandId}" && category->id == "${categoryId}"] | order(name asc) {
    _id,
    id,
    name,
    description,
    price,
    variant,
    variants,
    inStock,
    image,
    "brand": brand->{_id, id, name},
    "category": category->{_id, id, name}
  }`,
}

// Helper function to get image URL
export function getImageUrl(image: any, width?: number, height?: number) {
  if (!image?.asset) return null
  
  let urlBuilder = urlFor(image)
  
  if (width) urlBuilder = urlBuilder.width(width)
  if (height) urlBuilder = urlBuilder.height(height)
  
  return urlBuilder.url()
}