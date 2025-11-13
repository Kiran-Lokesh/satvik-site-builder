/**
 * useSearch Hook
 * 
 * Provides search functionality across products, brands, and categories from the configured data source.
 * Supports real-time search with debouncing and multiple search strategies.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { unifiedDataService } from '@/lib/unifiedDataService';
import { UnifiedProduct, UnifiedBrand, UnifiedCategory } from '@/lib/unifiedDataTypes';
import { getCurrentDataSource } from '@/lib/config';

interface SearchResult {
  products: UnifiedProduct[];
  brands: UnifiedBrand[];
  categories: UnifiedCategory[];
  totalResults: number;
}

interface UseSearchOptions {
  debounceMs?: number;
  minQueryLength?: number;
  maxResults?: number;
  searchIn?: ('products' | 'brands' | 'categories')[];
  includeInactive?: boolean;
}

interface UseSearchReturn {
  query: string;
  results: SearchResult;
  loading: boolean;
  error: string | null;
  dataSource: 'local' | 'sanity' | 'backend';
  hasSearched: boolean;
  setQuery: (query: string) => void;
  clearSearch: () => void;
  clearError: () => void;
}

export const useSearch = (options: UseSearchOptions = {}): UseSearchReturn => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState<SearchResult>({
    products: [],
    brands: [],
    categories: [],
    totalResults: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'local' | 'sanity' | 'backend'>('local');
  const [hasSearched, setHasSearched] = useState(false);

  const {
    debounceMs = 300,
    minQueryLength = 2,
    maxResults = 50,
    searchIn = ['products', 'brands', 'categories'],
    includeInactive = false
  } = options;

  // Debounce the query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < minQueryLength) {
      setResults({
        products: [],
        brands: [],
        categories: [],
        totalResults: 0
      });
      setHasSearched(false);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setHasSearched(true);
      
      const currentSource = getCurrentDataSource();
      setDataSource(currentSource);
      
      const searchTerm = searchQuery.toLowerCase();
      const searchResults: SearchResult = {
        products: [],
        brands: [],
        categories: [],
        totalResults: 0
      };
      
      // Search products
      if (searchIn.includes('products')) {
        const products = await unifiedDataService.getProducts();
        const filteredProducts = products.filter(product => {
          if (!includeInactive && !product.inStock) return false;
          
          return (
            product.name.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm) ||
            product.tags?.some(tag => tag.toLowerCase().includes(searchTerm)) ||
            product.brand.name.toLowerCase().includes(searchTerm) ||
            product.category.name.toLowerCase().includes(searchTerm)
          );
        });
        
        searchResults.products = filteredProducts.slice(0, maxResults);
      }
      
      // Search brands
      if (searchIn.includes('brands')) {
        const brands = await unifiedDataService.getBrands();
        const filteredBrands = brands.filter(brand => {
          if (!includeInactive && !brand.isActive) return false;
          
          return (
            brand.name.toLowerCase().includes(searchTerm) ||
            brand.description?.toLowerCase().includes(searchTerm)
          );
        });
        
        searchResults.brands = filteredBrands.slice(0, maxResults);
      }
      
      // Search categories
      if (searchIn.includes('categories')) {
        const categories = await unifiedDataService.getCategories();
        const filteredCategories = categories.filter(category => {
          if (!includeInactive && !category.isActive) return false;
          
          return (
            category.name.toLowerCase().includes(searchTerm) ||
            category.description?.toLowerCase().includes(searchTerm)
          );
        });
        
        searchResults.categories = filteredCategories.slice(0, maxResults);
      }
      
      searchResults.totalResults = 
        searchResults.products.length + 
        searchResults.brands.length + 
        searchResults.categories.length;
      
      setResults(searchResults);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      setError(errorMessage);
      console.error('❌ useSearch error:', err);
    } finally {
      setLoading(false);
    }
  }, [minQueryLength, maxResults, searchIn, includeInactive]);

  // Perform search when debounced query changes
  useEffect(() => {
    performSearch(debouncedQuery);
  }, [debouncedQuery, performSearch]);

  const clearSearch = useCallback(() => {
    setQuery('');
    setDebouncedQuery('');
    setResults({
      products: [],
      brands: [],
      categories: [],
      totalResults: 0
    });
    setHasSearched(false);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    query,
    results,
    loading,
    error,
    dataSource,
    hasSearched,
    setQuery,
    clearSearch,
    clearError
  };
};