import Airtable from 'airtable';

// Helper function to get product image
const getProductImage = (imageUrl: string, productName: string): string => {
  if (imageUrl) return imageUrl;
  
  // Fallback to existing images based on product name
  const imageMap: Record<string, string> = {
    // Handle both JSON and CSV/Airtable product name variations
    // Note: ImageCache will automatically convert JPG to WebP for better performance
    'Flax Seed Chutney Powder': 'flax_seed_chutney_powder.jpg', // JSON version
    'Flax Se Chutney Powder': 'flax_seed_chutney_powder.jpg',   // CSV/Airtable version
    'Peanut Chutney Powder': 'peanut_chutney_powder.jpg',
    'Niger Seed Chutney Powder': 'niger_chutney_powder.jpg',
    'Red Chilli Powder': 'red_chiili_powder.jpg',
    'Turmeric Powder': 'turmeric_powder.jpg',
    'Jawar Rotti': 'jawar_rotti.jpg',
    'Sajje Rotti': 'sajje_rotti.jpg',
    'Pearl Millet Rotti': 'sajje_rotti.jpg',
    'Millets Rotti': 'millets_rotti.jpg',
    'Millets Turmeric Drink With Nuts': 'millets_energy_drink.jpg',
    'Belgaum Special Kunda': 'kunda.jpg',
    'Karadantu': 'kardantu.jpg',
    'Supreme Dink Ladu': 'supreme_dink_laddu.jpg',
    'Makhana (FOX NUTS) Peri Peri': 'makhana_peri_peri.jpg',
    'Roasted Makhana (FOX NUTS) Cream & Onion': 'makhana_cream_onion.jpg',
    'Roasted Makhana (FOX NUTS) Tangy Cheese': 'makhana_tangy_cheese.jpg',
    'Millet Biryani': 'millet_biryani.jpg',
    'Millet Bisi Bele Bath': 'millet_bisi_bele_bath.jpg',
    'Millet Dosa': 'millet_dosa.jpg',
    'Millet Idly': 'millet_idly.jpg',
    'Millet Kheer': 'millet_kheer.jpg',
    'Millet Khichdi': 'millet_khichdi.jpg',
    'Millet Upma': 'millet_upma.jpg',
    'Multi-Grain Breakfast Mix': 'placeholder.svg',
    'Organic Coriander Powder': 'placeholder.svg',
    'Premium Garam Masala': 'placeholder.svg',
    // Add more mappings as needed
  };
  
  return imageMap[productName] || 'placeholder.svg';
};

// Initialize Airtable with your API key and base ID
const airtable = new Airtable({
  apiKey: import.meta.env.VITE_AIRTABLE_API_KEY || process.env.VITE_AIRTABLE_API_KEY
});

const base = airtable.base(import.meta.env.VITE_AIRTABLE_BASE_ID || process.env.VITE_AIRTABLE_BASE_ID);

// Type definitions for Airtable records
interface AirtableRecord {
  id: string;
  fields: Record<string, any>;
}

interface Brand {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  website?: string;
  airtableId?: string; // Store the actual Airtable record ID
}

interface Category {
  id: string;
  name: string;
  description?: string;
  brandId: string;
  brandName?: string;
  sortOrder?: number;
}

interface ProductVariant {
  id: string;
  name: string;
  price?: string;
  inStock?: boolean;
  weight?: string;
  unit?: string;
  productId: string;
}

interface Product {
  id: string;
  name: string;
  description?: string;
  image?: string;
  categoryId: string;
  categoryName?: string;
  brandId: string;
  brandName?: string;
  variants?: ProductVariant[];
  featured?: boolean;
  sortOrder?: number;
}

// Helper function to resolve linked records
const resolveLinkedRecords = (record: AirtableRecord, fieldName: string, linkedTable: string): string[] => {
  const linkedIds = record.fields[fieldName] || [];
  return Array.isArray(linkedIds) ? linkedIds : [];
};

// Helper function to get linked record details
const getLinkedRecordDetails = async (tableName: string, recordIds: string[]): Promise<Record<string, any>> => {
  if (!recordIds.length) return {};
  
  try {
    const records = await base(tableName).select({
      filterByFormula: `OR(${recordIds.map(id => `RECORD_ID() = "${id}"`).join(', ')})`
    }).all();
    
    const details: Record<string, any> = {};
    records.forEach(record => {
      details[record.id] = {
        id: record.id,
        name: record.fields.Name || record.fields.name || '',
        ...record.fields
      };
    });
    
    return details;
  } catch (error) {
    console.error(`Error fetching linked records from ${tableName}:`, error);
    return {};
  }
};

// Get all brands
export const getBrands = async (): Promise<Brand[]> => {
  try {
    const records = await base('Brands').select({
      sort: [{ field: 'Brand Name', direction: 'asc' }]
    }).all();

    return records.map(record => ({
      id: String(record.fields['Brand ID'] || record.id),
      name: String(record.fields['Brand Name'] || record.fields.Name || record.fields.name || ''),
      description: String(record.fields.Description || record.fields.description || ''),
      logo: record.fields.Logo?.[0]?.url || record.fields.logo?.[0]?.url || '',
      website: String(record.fields.Website || record.fields.website || ''),
      airtableId: record.id // Store the actual Airtable record ID
    }));
  } catch (error) {
    console.error('Error fetching brands:', error);
    throw new Error('Failed to fetch brands from Airtable');
  }
};

// Get all categories
export const getCategories = async (): Promise<Category[]> => {
  try {
    const records = await base('Categories').select({
      sort: [{ field: 'Category Name', direction: 'asc' }]
    }).all();

    // Get brand details for linked records
    const brandIds = records.flatMap(record => 
      resolveLinkedRecords(record, 'Brand', 'Brands')
    );
    const brandDetails = await getLinkedRecordDetails('Brands', brandIds);

    return records.map(record => {
      const brandId = resolveLinkedRecords(record, 'Brand', 'Brands')[0];
      const brand = brandDetails[brandId];

      return {
        id: String(record.fields['Category ID'] || record.id),
        name: String(record.fields['Category Name'] || record.fields.Name || record.fields.name || ''),
        description: String(record.fields.Description || record.fields.description || ''),
        brandId: brandId || '',
        brandName: brand?.name || '',
        sortOrder: 0
      };
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw new Error('Failed to fetch categories from Airtable');
  }
};

// Get all products
export const getProducts = async (): Promise<Product[]> => {
  try {
    const records = await base('Products').select({
      sort: [{ field: 'Product Name', direction: 'asc' }]
    }).all();

    // Get category and brand details for linked records
    const categoryIds = records.flatMap(record => 
      resolveLinkedRecords(record, 'Category', 'Categories')
    );
    const brandIds = records.flatMap(record => 
      resolveLinkedRecords(record, 'Brand', 'Brands')
    );
    
    const [categoryDetails, brandDetails] = await Promise.all([
      getLinkedRecordDetails('Categories', categoryIds),
      getLinkedRecordDetails('Brands', brandIds)
    ]);

    return records.map(record => {
      const categoryId = resolveLinkedRecords(record, 'Category', 'Categories')[0];
      const brandId = resolveLinkedRecords(record, 'Brand', 'Brands')[0];
      const category = categoryDetails[categoryId];
      const brand = brandDetails[brandId];

      return {
        id: String(record.fields['Product ID'] || record.id),
        name: String(record.fields['Product Name'] || record.fields.Name || record.fields.name || ''),
        description: String(record.fields.Description || record.fields.description || ''),
        image: record.fields.Image?.[0]?.url || record.fields.image?.[0]?.url || '',
        categoryId: categoryId || '',
        categoryName: category?.name || '',
        brandId: brandId || '',
        brandName: brand?.name || '',
        featured: Boolean(record.fields.Featured || record.fields.featured || false),
        sortOrder: 0
      };
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    throw new Error('Failed to fetch products from Airtable');
  }
};

// Get all product variants
export const getVariants = async (): Promise<ProductVariant[]> => {
  try {
    const records = await base('Product Variants').select({
      sort: [{ field: 'Product', direction: 'asc' }]
    }).all();

    return records.map(record => {
      const productId = resolveLinkedRecords(record, 'Product', 'Products')[0];

      return {
        id: String(record.fields['Variant ID'] || record.id),
        name: String(record.fields['Variant Name'] || record.fields.Name || record.fields.name || ''),
        price: String(record.fields.Price || record.fields.price || ''),
        inStock: record.fields['In Stock'] !== undefined ? Boolean(record.fields['In Stock']) : 
                 record.fields.inStock !== undefined ? Boolean(record.fields.inStock) : true,
        weight: String(record.fields.Weight || record.fields.weight || ''),
        unit: String(record.fields.Unit || record.fields.unit || ''),
        productId: productId || ''
      };
    });
  } catch (error) {
    console.error('Error fetching variants:', error);
    throw new Error('Failed to fetch variants from Airtable');
  }
};

// Get products with their variants grouped together
export const getProductsWithVariants = async (): Promise<Product[]> => {
  try {
    const [products, variants] = await Promise.all([
      getProducts(),
      getVariants()
    ]);

    // Group variants by product ID
    const variantsByProduct: Record<string, ProductVariant[]> = {};
    variants.forEach(variant => {
      if (!variantsByProduct[variant.productId]) {
        variantsByProduct[variant.productId] = [];
      }
      variantsByProduct[variant.productId].push(variant);
    });

    // Add variants to products
    return products.map(product => ({
      ...product,
      variants: variantsByProduct[product.id] || []
    }));
  } catch (error) {
    console.error('Error fetching products with variants:', error);
    throw new Error('Failed to fetch products with variants from Airtable');
  }
};

// Get data organized by brands (similar to your current JSON structure)
export const getDataByBrands = async (): Promise<Array<{
  id: string;
  name: string;
  categories: Array<{
    id: string;
    name: string;
    products: Product[];
  }>;
}>> => {
  try {
    // Get brands with their linked categories and products
    const brands = await getBrands();
    
    // For each brand, get its linked categories and products
    const result = await Promise.all(brands.map(async (brand) => {
      try {
        // Get the brand record with all linked data using the Airtable record ID
        const brandRecord = await base('Brands').find(brand.airtableId || brand.id);
        
        // Extract category IDs from the linked Categories field
        const categoryIds = Array.isArray(brandRecord.fields['Categories']) ? brandRecord.fields['Categories'] : [];
        const productIds = Array.isArray(brandRecord.fields['Products']) ? brandRecord.fields['Products'] : [];
        
        
        // Get category details
        const categories = [];
        if (categoryIds.length > 0) {
          const categoryRecords = await base('Categories').select({
            filterByFormula: `OR(${categoryIds.map(id => `RECORD_ID() = "${id}"`).join(', ')})`
          }).all();
          
          // Get products for each category
          for (const categoryRecord of categoryRecords) {
            const categoryProductIds = Array.isArray(categoryRecord.fields['Products']) ? categoryRecord.fields['Products'] : [];
            const products = [];
            
            if (categoryProductIds.length > 0) {
              const productRecords = await base('Products').select({
                filterByFormula: `OR(${categoryProductIds.map(id => `RECORD_ID() = "${id}"`).join(', ')})`
              }).all();
              
              // Get variants for each product
              for (const productRecord of productRecords) {
                
                // Fetch variants by Product ID pattern (as shown in CSV data)
                const productId = String(productRecord.fields['Product ID'] || productRecord.id);
                const variants = [];
                
                try {
                  // Query variants where Product field matches the product ID
                  const variantRecords = await base('Product Variants').select({
                    filterByFormula: `{Product} = "${productId}"`
                  }).all();
                  
                  variants.push(...variantRecords.map(variant => ({
                    id: String(variant.fields['Variant ID'] || variant.id),
                    name: String(variant.fields['Variant Name'] || variant.fields.Name || ''),
                    price: String(variant.fields.Price || ''),
                    inStock: variant.fields['In Stock'] !== undefined ? Boolean(variant.fields['In Stock']) : true,
                    weight: String(variant.fields.Weight || ''),
                    unit: String(variant.fields.Unit || ''),
                    productId: productId
                  })));
                } catch (error) {
                  console.warn(`⚠️ Could not fetch variants for product ${productId}:`, error);
                }
                
                const productName = String(productRecord.fields['Product Name'] || productRecord.fields.Name || '');
                const imageUrl = productRecord.fields.Image?.[0]?.url || '';
                
                // Create unique ID by combining Product ID with Airtable Record ID to avoid duplicates
                const uniqueId = `${productId}-${productRecord.id}`;
                
                const finalImage = getProductImage(imageUrl, productName);
                
                products.push({
                  id: uniqueId,
                  name: productName,
                  description: String(productRecord.fields.Description || ''),
                  image: finalImage,
                  variants: variants,
                  featured: Boolean(productRecord.fields.Featured || false)
                });
                
              }
            }
            
            categories.push({
              id: String(categoryRecord.fields['Category ID'] || categoryRecord.id),
              name: String(categoryRecord.fields['Category Name'] || categoryRecord.fields.Name || ''),
              products: products
            });
          }
        }
        
        return {
          id: brand.id,
          name: brand.name,
          categories: categories
        };
      } catch (error) {
        console.error(`Error processing brand ${brand.name}:`, error);
        return {
          id: brand.id,
          name: brand.name,
          categories: []
        };
      }
    }));
    
    
    return result;
  } catch (error) {
    console.error('Error fetching data by brands:', error);
    throw new Error('Failed to fetch data by brands from Airtable');
  }
};

// Utility function to test the connection
export const testConnection = async (): Promise<boolean> => {
  try {
    await base('Brands').select({ maxRecords: 1 }).all();
    return true;
  } catch (error) {
    console.error('Airtable connection test failed:', error);
    return false;
  }
};
