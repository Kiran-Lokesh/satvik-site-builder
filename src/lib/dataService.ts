// Re-export unified types for backward compatibility
export type {
  UnifiedProductVariant as ProductVariant,
  UnifiedProduct as Product,
  UnifiedCategory as Category,
  UnifiedBrand as Brand,
  UnifiedData,
  UnifiedImage,
} from './unifiedDataTypes';

// Import the types for internal use
import type { UnifiedBrand as Brand } from './unifiedDataTypes';

// Import unified data service
import { unifiedDataService } from './unifiedDataService';
import { isLocalDataSource, isSanityDataSource, DATA_SOURCE_CONFIG } from './config';

// Main function to get product data (now uses unified service)
export const getProductData = async (): Promise<Brand[]> => {
  try {
    const unifiedData = await unifiedDataService.getUnifiedData();
    
    // Transform unified data back to old format for backward compatibility
    const brands: Brand[] = unifiedData.brands.map(brand => ({
      ...brand,
      categories: unifiedData.categories
        .filter(category => {
          // Find products that belong to this brand and category
          const brandProducts = unifiedData.products.filter(product => 
            product.brand.id === brand.id && product.category.id === category.id
          );
          return brandProducts.length > 0;
        })
        .map(category => ({
          ...category,
          products: unifiedData.products
            .filter(product => product.brand.id === brand.id && product.category.id === category.id)
        }))
    }));
    
    return brands;
  } catch (error) {
    console.error('❌ Error loading product data:', error);
    throw error;
  }
};

// Clear all caches (now uses unified service)
export const clearAllCaches = (): void => {
  unifiedDataService.clearCache();
};

// Get current data source info (now uses unified service)
export const getDataSourceInfo = () => {
  return unifiedDataService.getDataSourceInfo();
};

