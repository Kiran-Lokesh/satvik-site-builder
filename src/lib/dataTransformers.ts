/**
 * Data Transformers
 * 
 * This module provides transformation functions to convert data between:
 * - Local JSON format ↔ Unified format
 * - Sanity format ↔ Unified format
 * - Unified format → Local JSON format (for export)
 * - Unified format → Sanity format (for import)
 */

import {
  // Unified types
  UnifiedData,
  UnifiedBrand,
  UnifiedCategory,
  UnifiedProduct,
  UnifiedProductVariant,
  UnifiedImage,
  
  // Local types
  LocalJsonData,
  LocalBrand,
  LocalCategory,
  LocalProduct,
  LocalProductVariant,
  
  // Sanity types
  SanityRawData,
  SanityRawBrand,
  SanityRawCategory,
  SanityRawProduct,
  SanityRawProductVariant,
  SanityImage,
  
  // Utility types
  TransformationContext,
  TransformationResult,
  DataSource,
} from './unifiedDataTypes';

import { getImageUrl } from './sanity';

// import { imageHandler, ImageHandlerConfig } from './unifiedImageHandler';

// Import all local product images for mapping
import flaxSeedChutney from '@/assets/products/flax_seed_chutney_powder.jpg';
import jawarRotti from '@/assets/products/jawar_rotti.jpg';
import kardantu from '@/assets/products/kardantu.jpg';
import kunda from '@/assets/products/kunda.jpg';
import makhanaCreamOnion from '@/assets/products/makhana_cream_onion.jpg';
import makhanaPeriPeri from '@/assets/products/makhana_peri_peri.jpg';
import makhanaTangyCheese from '@/assets/products/makhana_tangy_cheese.jpg';
import milletBiryani from '@/assets/products/millet_biryani.jpg';
import milletBisiBeleBath from '@/assets/products/millet_bisi_bele_bath.jpg';
import milletDosa from '@/assets/products/millet_dosa.jpg';
import milletIdly from '@/assets/products/millet_idly.jpg';
import milletKheer from '@/assets/products/millet_kheer.jpg';
import milletKhichdi from '@/assets/products/millet_khichdi.jpg';
import milletUpma from '@/assets/products/millet_upma.jpg';
import milletsEnergyDrink from '@/assets/products/millets_energy_drink.jpg';
import milletsRotti from '@/assets/products/millets_rotti.jpg';
import nigerChutney from '@/assets/products/niger_chutney_powder.jpg';
import peanutChutney from '@/assets/products/peanut_chutney_powder.jpg';
import redChilliPowder from '@/assets/products/red_chiili_powder.jpg';
import sajjeRotti from '@/assets/products/sajje_rotti.jpg';
import supremeDinkLaddu from '@/assets/products/supreme_dink_laddu.jpg';
import turmericPowder from '@/assets/products/turmeric_powder.jpg';

// Import rice images (PNG format)
import idliRice from '@/assets/products/idli_rice.png';
import jeerakalasaRice from '@/assets/products/jeerakalasa_rice.png';
import mattaRice from '@/assets/products/matta_rice.png';
import ponniRice from '@/assets/products/ponni_rice.png';
import sonaMasooriRice from '@/assets/products/sona_masoori_rice.png';

// ============================================================================
// IMAGE FALLBACK HELPERS
// ============================================================================

/**
 * Find matching local image by product name
 */
function findMatchingLocalImage(productName: string, productId?: string): string | null {
  const name = productName.toLowerCase();
  
  // If we have an ID, use it for precise matching first
  if (productId) {
    const idToImageMap: Record<string, string> = {
      'priya-sona-masoori': 'sona_masoori_priya.jpg',
      'nilgiris-sona-masoori': 'sona_masoori_rice.png',
    };
    if (idToImageMap[productId]) {
      return idToImageMap[productId];
    }
  }
  
  // Map product names to image filenames (fallback for products without specific ID mapping)
  const nameToImageMap: Record<string, string> = {
    'flaxseed chutney powder': 'flax_seed_chutney_powder.jpg',
    'jawar rotti': 'jawar_rotti.jpg',
    'kardantu': 'kardantu.jpg',
    'kunda': 'kunda.jpg',
    'makhana cream onion': 'makhana_cream_onion.jpg',
    'makhana peri peri': 'makhana_peri_peri.jpg',
    'makhana tangy cheese': 'makhana_tangy_cheese.jpg',
    'millet biryani': 'millet_biryani.jpg',
    'millet bisi bele bath': 'millet_bisi_bele_bath.jpg',
    'millet dosa': 'millet_dosa.jpg',
    'millet idly': 'millet_idly.jpg',
    'millet kheer': 'millet_kheer.jpg',
    'millet khichdi': 'millet_khichdi.jpg',
    'millet upma': 'millet_upma.jpg',
    'millets energy drink': 'millets_energy_drink.jpg',
    'millets rotti': 'millets_rotti.jpg',
    'niger chutney powder': 'niger_chutney_powder.jpg',
    'peanut chutney powder': 'peanut_chutney_powder.jpg',
    'red chilli powder': 'red_chiili_powder.jpg',
    'sajje rotti': 'sajje_rotti.jpg',
    'supreme dink laddu': 'supreme_dink_laddu.jpg',
    'turmeric powder': 'turmeric_powder.jpg',
    // Rice products
    'idli rice': 'idli_rice.png',
    'jeerakasala rice': 'jeerakalasa_rice.png',
    'jeerakalasa rice': 'jeerakalasa_rice.png',
    'palakaddan matta rice': 'matta_rice.png',
    'matta rice': 'matta_rice.png',
    'thanjavoor ponni rice': 'ponni_rice.png',
    'ponni rice': 'ponni_rice.png',
    'sona masoori': 'sona_masoori_rice.png',
    'sona masoori rice': 'sona_masoori_rice.png',
  };
  
  // Try exact match first
  if (nameToImageMap[name]) {
    return nameToImageMap[name];
  }
  
  // Try partial matches
  for (const [key, imageName] of Object.entries(nameToImageMap)) {
    if (name.includes(key) || key.includes(name)) {
      return imageName;
    }
  }
  
  return null;
}

/**
 * Get local image URL by filename
 */
function getLocalImageUrl(imageName: string): string {
  const imageMap: Record<string, string> = {
    'flax_seed_chutney_powder.jpg': flaxSeedChutney,
    'jawar_rotti.jpg': jawarRotti,
    'kardantu.jpg': kardantu,
    'kunda.jpg': kunda,
    'makhana_cream_onion.jpg': makhanaCreamOnion,
    'makhana_peri_peri.jpg': makhanaPeriPeri,
    'makhana_tangy_cheese.jpg': makhanaTangyCheese,
    'millet_biryani.jpg': milletBiryani,
    'millet_bisi_bele_bath.jpg': milletBisiBeleBath,
    'millet_dosa.jpg': milletDosa,
    'millet_idly.jpg': milletIdly,
    'millet_kheer.jpg': milletKheer,
    'millet_khichdi.jpg': milletKhichdi,
    'millet_upma.jpg': milletUpma,
    'millets_energy_drink.jpg': milletsEnergyDrink,
    'millets_rotti.jpg': milletsRotti,
    'niger_chutney_powder.jpg': nigerChutney,
    'peanut_chutney_powder.jpg': peanutChutney,
    'red_chiili_powder.jpg': redChilliPowder,
    'sajje_rotti.jpg': sajjeRotti,
    'supreme_dink_laddu.jpg': supremeDinkLaddu,
    'turmeric_powder.jpg': turmericPowder,
    // Rice images (PNG format)
    'idli_rice.png': idliRice,
    'jeerakalasa_rice.png': jeerakalasaRice,
    'matta_rice.png': mattaRice,
    'ponni_rice.png': ponniRice,
    'sona_masoori_rice.png': sonaMasooriRice,
    // Handle discrepancy in JSON data
    'sona_masoori_priya.jpg': '/placeholder.svg', // No specific image available for Priya Sona Masoori
  };
  
  return imageMap[imageName] || '/placeholder.svg';
}

// ============================================================================
// TRANSFORMATION CONTEXT
// ============================================================================

/**
 * Default transformation context
 */
const DEFAULT_CONTEXT: TransformationContext = {
  source: 'local',
  baseUrl: '/',
  imageBaseUrl: '/src/assets/products/',
  defaultImage: '/placeholder.svg',
  fallbackImage: '/placeholder.svg',
};

// ============================================================================
// LOCAL JSON → UNIFIED TRANSFORMERS
// ============================================================================

/**
 * Transform local JSON data to unified format
 */
export function transformLocalToUnified(
  localData: LocalJsonData,
  context: Partial<TransformationContext> = {}
): TransformationResult<UnifiedData> {
  const finalContext: TransformationContext = { ...DEFAULT_CONTEXT, ...context, source: 'local' as const };
  const errors: string[] = [];
  const warnings: string[] = [];
  
  console.log(`🔄 Transforming local JSON data to unified format...`);

  try {
    const brands: UnifiedBrand[] = [];
    const categories: UnifiedCategory[] = [];
    const products: UnifiedProduct[] = [];

    // Transform brands
    for (const localBrand of localData.brands) {
      try {
        const unifiedBrand = transformLocalBrandToUnified(localBrand, finalContext);
        brands.push(unifiedBrand);

        // Transform categories and products
        for (const localCategory of localBrand.categories) {
          const unifiedCategory = transformLocalCategoryToUnified(
            localCategory,
            unifiedBrand,
            finalContext
          );
          categories.push(unifiedCategory);

          // Transform products
          for (const localProduct of localCategory.products) {
            const unifiedProduct = transformLocalProductToUnified(
              localProduct,
              unifiedBrand,
              unifiedCategory,
              finalContext
            );
            products.push(unifiedProduct);
          }
        }
      } catch (error) {
        errors.push(`Failed to transform brand ${localBrand.name}: ${error}`);
      }
    }

    const unifiedData: UnifiedData = {
      brands,
      categories,
      products,
      metadata: {
        totalBrands: brands.length,
        totalCategories: categories.length,
        totalProducts: products.length,
        lastUpdated: new Date().toISOString(),
        dataSource: 'local',
      },
    };

    return {
      data: unifiedData,
      errors,
      warnings,
      metadata: {
        source: 'local',
        transformedAt: new Date().toISOString(),
        recordCount: products.length,
      },
    };
  } catch (error) {
    return {
      data: createEmptyUnifiedData('local'),
      errors: [`Failed to transform local data: ${error}`],
      warnings,
      metadata: {
        source: 'local',
        transformedAt: new Date().toISOString(),
        recordCount: 0,
      },
    };
  }
}

/**
 * Transform local brand to unified format
 */
function transformLocalBrandToUnified(
  localBrand: LocalBrand,
  context: TransformationContext
): UnifiedBrand {
  return {
    id: localBrand.id,
    name: localBrand.name,
    description: undefined,
    logo: undefined,
    website: undefined,
    email: undefined,
    phone: undefined,
    address: undefined,
    isActive: true,
    sortOrder: 0,
    seoTitle: undefined,
    seoDescription: undefined,
  };
}

/**
 * Transform local category to unified format
 */
function transformLocalCategoryToUnified(
  localCategory: LocalCategory,
  brand: UnifiedBrand,
  context: TransformationContext
): UnifiedCategory {
  return {
    id: localCategory.id,
    name: localCategory.name,
    description: undefined,
    image: undefined,
    sortOrder: 0,
    isActive: true,
    parentCategoryId: undefined,
    seoTitle: undefined,
    seoDescription: undefined,
  };
}

/**
 * Transform local product to unified format
 */
function transformLocalProductToUnified(
  localProduct: LocalProduct,
  brand: UnifiedBrand,
  category: UnifiedCategory,
  context: TransformationContext
): UnifiedProduct {
  // Process image using the shared helper function
  const image = {
    url: localProduct.image ? getLocalImageUrl(localProduct.image) : context.defaultImage,
    alt: localProduct.name,
    source: 'local' as const,
    originalName: localProduct.image,
  };

  // Transform variants
  const variants = localProduct.variants?.map(transformLocalVariantToUnified) || [];

  return {
    id: localProduct.id,
    name: localProduct.name,
    description: localProduct.description || '',
    image,
    price: localProduct.price,
    variant: localProduct.variant,
    variants: variants.length > 0 ? variants : undefined,
    inStock: localProduct.inStock ?? true,
    featured: localProduct.featured ?? false,
    category,
    brand,
    tags: [],
    nutritionalInfo: undefined,
    ingredients: undefined,
    allergens: undefined,
    shelfLife: undefined,
    storageInstructions: undefined,
    createdAt: undefined,
    updatedAt: undefined,
  };
}

/**
 * Transform local product variant to unified format
 */
function transformLocalVariantToUnified(
  localVariant: LocalProductVariant
): UnifiedProductVariant {
  return {
    id: localVariant.id,
    name: localVariant.name,
    price: localVariant.price || '',
    inStock: localVariant.inStock ?? true,
    weight: localVariant.weight,
    unit: localVariant.unit,
    sku: undefined,
    description: undefined,
  };
}

// ============================================================================
// SANITY → UNIFIED TRANSFORMERS
// ============================================================================

/**
 * Transform Sanity data to unified format
 */
export function transformSanityToUnified(
  sanityData: SanityRawData,
  context: Partial<TransformationContext> = {}
): TransformationResult<UnifiedData> {
  const finalContext: TransformationContext = { ...DEFAULT_CONTEXT, ...context, source: 'sanity' as const };
  const errors: string[] = [];
  const warnings: string[] = [];
  
  console.log(`🔄 Transforming Sanity CMS data to unified format...`);

  try {
    const brands: UnifiedBrand[] = [];
    const categories: UnifiedCategory[] = [];
    const products: UnifiedProduct[] = [];

    // Create brand lookup
    const brandMap = new Map<string, UnifiedBrand>();
    for (const sanityBrand of sanityData.brands) {
      const unifiedBrand = transformSanityBrandToUnified(sanityBrand, finalContext);
      brands.push(unifiedBrand);
      brandMap.set(sanityBrand.id, unifiedBrand);
    }

    // Create category lookup
    const categoryMap = new Map<string, UnifiedCategory>();
    for (const sanityCategory of sanityData.categories) {
      const unifiedCategory = transformSanityCategoryToUnified(sanityCategory, finalContext);
      categories.push(unifiedCategory);
      categoryMap.set(sanityCategory.id, unifiedCategory);
    }

    // Transform products
    for (const sanityProduct of sanityData.products) {
      try {
        const brand = brandMap.get(sanityProduct.brand.id);
        const category = categoryMap.get(sanityProduct.category.id);

        if (!brand || !category) {
          warnings.push(`Product ${sanityProduct.name} has invalid brand or category reference`);
          continue;
        }

        const unifiedProduct = transformSanityProductToUnified(
          sanityProduct,
          brand,
          category,
          finalContext
        );
        products.push(unifiedProduct);
      } catch (error) {
        errors.push(`Failed to transform product ${sanityProduct.name}: ${error}`);
      }
    }

    const unifiedData: UnifiedData = {
      brands,
      categories,
      products,
      metadata: {
        totalBrands: brands.length,
        totalCategories: categories.length,
        totalProducts: products.length,
        lastUpdated: new Date().toISOString(),
        dataSource: 'sanity',
      },
    };

    return {
      data: unifiedData,
      errors,
      warnings,
      metadata: {
        source: 'sanity',
        transformedAt: new Date().toISOString(),
        recordCount: products.length,
      },
    };
  } catch (error) {
    return {
      data: createEmptyUnifiedData('sanity'),
      errors: [`Failed to transform Sanity data: ${error}`],
      warnings,
      metadata: {
        source: 'sanity',
        transformedAt: new Date().toISOString(),
        recordCount: 0,
      },
    };
  }
}

/**
 * Transform Sanity brand to unified format
 */
function transformSanityBrandToUnified(
  sanityBrand: SanityRawBrand,
  context: TransformationContext
): UnifiedBrand {
  const logo = sanityBrand.logo ? {
    url: `https://cdn.sanity.io/images/eaaly2y1/products/${sanityBrand.logo.asset._ref.replace('image-', '').replace('-jpg', '.jpg')}`,
    alt: sanityBrand.logo.alt || sanityBrand.name,
    source: 'sanity' as const,
    originalName: sanityBrand.logo.asset._ref,
  } : undefined;

  return {
    id: sanityBrand.id,
    name: sanityBrand.name,
    description: sanityBrand.description,
    logo,
    website: sanityBrand.website,
    email: undefined,
    phone: undefined,
    address: undefined,
    isActive: sanityBrand.isActive ?? true,
    sortOrder: 0,
    seoTitle: undefined,
    seoDescription: undefined,
  };
}

/**
 * Transform Sanity category to unified format
 */
function transformSanityCategoryToUnified(
  sanityCategory: SanityRawCategory,
  context: TransformationContext
): UnifiedCategory {
  const image = sanityCategory.image ? {
    url: `https://cdn.sanity.io/images/eaaly2y1/products/${sanityCategory.image.asset._ref.replace('image-', '').replace('-jpg', '.jpg')}`,
    alt: sanityCategory.image.alt || sanityCategory.name,
    source: 'sanity' as const,
    originalName: sanityCategory.image.asset._ref,
  } : undefined;

  return {
    id: sanityCategory.id,
    name: sanityCategory.name,
    description: sanityCategory.description,
    image,
    sortOrder: sanityCategory.sortOrder ?? 0,
    isActive: sanityCategory.isActive ?? true,
    parentCategoryId: undefined,
    seoTitle: undefined,
    seoDescription: undefined,
  };
}

/**
 * Transform Sanity product to unified format
 */
function transformSanityProductToUnified(
  sanityProduct: SanityRawProduct,
  brand: UnifiedBrand,
  category: UnifiedCategory,
  context: TransformationContext
): UnifiedProduct {
  // Process image with fallback to local images
  const getImageWithFallback = (sanityProduct: SanityRawProduct) => {
    // Try Sanity image first
    if (sanityProduct.image) {
      // Use proper Sanity imageUrlBuilder to construct the URL
      const sanityUrl = getImageUrl(sanityProduct.image);
      
      // Try to find a matching local image as fallback
      const localImageName = findMatchingLocalImage(sanityProduct.name, sanityProduct.id);
      const localUrl = localImageName ? getLocalImageUrl(localImageName) : context.defaultImage;
      
      return {
        url: sanityUrl || context.defaultImage, // Fallback to default if URL construction fails
        alt: sanityProduct.image.alt || sanityProduct.name,
        source: 'sanity' as const,
        originalName: sanityProduct.image.asset._ref,
        fallbackUrl: localUrl, // Store fallback URL for client-side use
      };
    }
    
    // No Sanity image, try to find matching local image
    const localImageName = findMatchingLocalImage(sanityProduct.name, sanityProduct.id);
    if (localImageName) {
      return {
        url: getLocalImageUrl(localImageName),
        alt: sanityProduct.name,
        source: 'local' as const,
        originalName: localImageName,
      };
    }
    
    // No image found, use default
    return {
      url: context.defaultImage,
      alt: sanityProduct.name,
      source: 'local' as const,
      originalName: 'placeholder',
    };
  };

  const image = getImageWithFallback(sanityProduct);

  // Transform variants
  const variants = sanityProduct.variants?.map(transformSanityVariantToUnified) || [];

  return {
    id: sanityProduct.id,
    name: sanityProduct.name,
    description: sanityProduct.description,
    image,
    price: sanityProduct.price,
    variant: sanityProduct.variant,
    variants: variants.length > 0 ? variants : undefined,
    inStock: sanityProduct.inStock,
    featured: sanityProduct.featured,
    category,
    brand,
    tags: sanityProduct.tags || [],
    nutritionalInfo: sanityProduct.nutritionalInfo,
    ingredients: sanityProduct.ingredients,
    allergens: sanityProduct.allergens,
    shelfLife: sanityProduct.shelfLife,
    storageInstructions: sanityProduct.storageInstructions,
    createdAt: sanityProduct._createdAt,
    updatedAt: sanityProduct._updatedAt,
  };
}

/**
 * Transform Sanity product variant to unified format
 */
function transformSanityVariantToUnified(
  sanityVariant: SanityRawProductVariant
): UnifiedProductVariant {
  return {
    id: sanityVariant.id,
    name: sanityVariant.name,
    price: sanityVariant.price,
    inStock: sanityVariant.inStock,
    weight: sanityVariant.weight,
    unit: sanityVariant.unit,
    sku: sanityVariant.sku,
    description: sanityVariant.description,
  };
}

// ============================================================================
// UNIFIED → LOCAL JSON TRANSFORMERS
// ============================================================================

/**
 * Transform unified data to local JSON format
 */
export function transformUnifiedToLocal(
  unifiedData: UnifiedData
): TransformationResult<LocalJsonData> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const brands: LocalBrand[] = [];

    // Group products by brand and category
    const brandMap = new Map<string, LocalBrand>();

    for (const product of unifiedData.products) {
      const brandId = product.brand.id;
      const categoryId = product.category.id;

      // Get or create brand
      if (!brandMap.has(brandId)) {
        const brand = unifiedData.brands.find(b => b.id === brandId);
        if (!brand) {
          errors.push(`Brand ${brandId} not found for product ${product.name}`);
          continue;
        }

        brandMap.set(brandId, {
          id: brand.id,
          name: brand.name,
          categories: [],
        });
      }

      const localBrand = brandMap.get(brandId)!;

      // Get or create category
      let localCategory = localBrand.categories.find(c => c.id === categoryId);
      if (!localCategory) {
        const category = unifiedData.categories.find(c => c.id === categoryId);
        if (!category) {
          errors.push(`Category ${categoryId} not found for product ${product.name}`);
          continue;
        }

        localCategory = {
          id: category.id,
          name: category.name,
          products: [],
        };
        localBrand.categories.push(localCategory);
      }

      // Transform product
      const localProduct = transformUnifiedProductToLocal(product);
      localCategory.products.push(localProduct);
    }

    const localData: LocalJsonData = {
      brands: Array.from(brandMap.values()),
    };

    return {
      data: localData,
      errors,
      warnings,
      metadata: {
        source: 'local',
        transformedAt: new Date().toISOString(),
        recordCount: unifiedData.products.length,
      },
    };
  } catch (error) {
    return {
      data: { brands: [] },
      errors: [`Failed to transform unified data to local format: ${error}`],
      warnings,
      metadata: {
        source: 'local',
        transformedAt: new Date().toISOString(),
        recordCount: 0,
      },
    };
  }
}

/**
 * Transform unified product to local format
 */
function transformUnifiedProductToLocal(product: UnifiedProduct): LocalProduct {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    image: product.image.source === 'local' ? product.image.originalName : product.image.url,
    price: product.price,
    variant: product.variant,
    variants: product.variants?.map(transformUnifiedVariantToLocal),
    featured: product.featured,
    inStock: product.inStock,
  };
}

/**
 * Transform unified variant to local format
 */
function transformUnifiedVariantToLocal(variant: UnifiedProductVariant): LocalProductVariant {
  return {
    id: variant.id,
    name: variant.name,
    price: variant.price,
    inStock: variant.inStock,
    weight: variant.weight,
    unit: variant.unit,
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create empty unified data structure
 */
function createEmptyUnifiedData(source: DataSource): UnifiedData {
  return {
    brands: [],
    categories: [],
    products: [],
    metadata: {
      totalBrands: 0,
      totalCategories: 0,
      totalProducts: 0,
      lastUpdated: new Date().toISOString(),
      dataSource: source,
    },
  };
}

/**
 * Validate unified data structure
 */
export function validateUnifiedData(data: UnifiedData): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check required fields
  if (!data.brands || !Array.isArray(data.brands)) {
    errors.push('Brands array is missing or invalid');
  }

  if (!data.categories || !Array.isArray(data.categories)) {
    errors.push('Categories array is missing or invalid');
  }

  if (!data.products || !Array.isArray(data.products)) {
    errors.push('Products array is missing or invalid');
  }

  if (!data.metadata) {
    errors.push('Metadata is missing');
  }

  // Validate products have required references
  for (const product of data.products) {
    if (!product.brand || !product.category) {
      errors.push(`Product ${product.name} is missing brand or category reference`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Merge two unified datasets
 */
export function mergeUnifiedData(
  primary: UnifiedData,
  secondary: UnifiedData
): UnifiedData {
  const mergedBrands = [...primary.brands];
  const mergedCategories = [...primary.categories];
  const mergedProducts = [...primary.products];

  // Add brands from secondary that don't exist in primary
  for (const brand of secondary.brands) {
    if (!mergedBrands.find(b => b.id === brand.id)) {
      mergedBrands.push(brand);
    }
  }

  // Add categories from secondary that don't exist in primary
  for (const category of secondary.categories) {
    if (!mergedCategories.find(c => c.id === category.id)) {
      mergedCategories.push(category);
    }
  }

  // Add products from secondary that don't exist in primary
  for (const product of secondary.products) {
    if (!mergedProducts.find(p => p.id === product.id)) {
      mergedProducts.push(product);
    }
  }

  return {
    brands: mergedBrands,
    categories: mergedCategories,
    products: mergedProducts,
    metadata: {
      totalBrands: mergedBrands.length,
      totalCategories: mergedCategories.length,
      totalProducts: mergedProducts.length,
      lastUpdated: new Date().toISOString(),
      dataSource: primary.metadata.dataSource, // Keep primary source
    },
  };
}
