import { createClient } from '@sanity/client'
import createCsvWriter from 'csv-writer'
import fs from 'fs'
import path from 'path'

// Initialize Sanity client
const client = createClient({
  projectId: process.env.VITE_SANITY_PROJECT_ID || 'eaaly2y1',
  dataset: process.env.VITE_SANITY_DATASET || 'products',
  useCdn: false,
  apiVersion: '2024-09-19',
  token: process.env.VITE_SANITY_TOKEN,
})

// GROQ query to fetch all products with variants
const PRODUCTS_QUERY = `*[_type == "product"]{
  _id,
  id,
  name,
  description,
  price,
  "slug": slug.current,
  "imageUrl": image.asset->url,
  "imageAlt": image.alt,
  variants
}`

async function generateCatalog() {
  try {
    console.log('🔄 Fetching products from Sanity...')
    
    // Fetch products from Sanity
    const products = await client.fetch(PRODUCTS_QUERY)
    console.log(`✅ Found ${products.length} products`)
    
    // Debug: Check for products with variants
    const productsWithVariants = products.filter(p => p.variants && p.variants.length > 0)
    console.log(`📦 Products with variants: ${productsWithVariants.length}`)
    if (productsWithVariants.length > 0) {
      console.log('🔍 Sample product with variants:', JSON.stringify(productsWithVariants[0], null, 2))
    }
    
    
    // Transform products into Meta Commerce Manager format
    const transformedProducts = []
    
    products.forEach(product => {
      // Use product ID for the link instead of generating from name
      const productId = product.id || product._id
      
      // If product has variants, create a separate entry for each variant
      if (product.variants && product.variants.length > 0) {
        product.variants.forEach((variant, index) => {
          const variantPrice = variant.price ? variant.price.replace(/[^0-9.]/g, '') : '0'
          const variantId = `${product._id}_${variant.id || index}`
          
          // Format price to always have 2 decimal places (e.g., 1.99 -> 1.99, 3.99 -> 3.99)
          const formattedPrice = parseFloat(variantPrice || 0).toFixed(2)
          
          transformedProducts.push({
            id: `${productId}_${variant.id || index}`,
            title: `${product.name} - ${variant.name || variant.id}`,
            description: product.description || '',
            availability: variant.inStock ? 'in stock' : 'out of stock',
            condition: 'new',
            price: `${formattedPrice} CAD`,
            link: `https://satvikfoods.ca/product/${productId}`,
            image_link: product.imageUrl || '',
            brand: 'Satvik Foods',
            google_product_category: 'Food, Beverages & Tobacco > Food Items',
            fb_product_category: 'Food & Beverage',
            quantity_to_sell_on_facebook: '100',
            sale_price: `${formattedPrice} CAD`,
            sale_price_effective_date: '',
            item_group_id: productId, // Group variants together
            size: variant.name || variant.id || 'Standard'
          })
        })
      } else {
        // No variants, create single product entry
        const numericPrice = product.price ? product.price.replace(/[^0-9.]/g, '') : '0'
        
        // Format price to always have 2 decimal places
        const formattedPrice = parseFloat(numericPrice || 0).toFixed(2)
        
        transformedProducts.push({
          id: productId,
          title: product.name,
          description: product.description || '',
          availability: 'in stock',
          condition: 'new',
          price: `${formattedPrice} CAD`,
          link: `https://satvikfoods.ca/product/${productId}`,
          image_link: product.imageUrl || '',
          brand: 'Satvik Foods',
          google_product_category: 'Food, Beverages & Tobacco > Food Items',
          fb_product_category: 'Food & Beverage',
          quantity_to_sell_on_facebook: '100',
          sale_price: `${formattedPrice} CAD`,
          sale_price_effective_date: ''
        })
      }
    })
    
    // Ensure dist directory exists
    const distDir = path.join(process.cwd(), 'dist')
    
    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir, { recursive: true })
    }
    
    // Create CSV writer for dist directory
    const csvWriter = createCsvWriter.createObjectCsvWriter({
      path: path.join(distDir, 'catalog-feed.csv'),
      header: [
        {id: 'id', title: 'id'},
        {id: 'title', title: 'title'},
        {id: 'description', title: 'description'},
        {id: 'availability', title: 'availability'},
        {id: 'condition', title: 'condition'},
        {id: 'price', title: 'price'},
        {id: 'link', title: 'link'},
        {id: 'image_link', title: 'image_link'},
        {id: 'brand', title: 'brand'},
        {id: 'google_product_category', title: 'google_product_category'},
        {id: 'fb_product_category', title: 'fb_product_category'},
        {id: 'quantity_to_sell_on_facebook', title: 'quantity_to_sell_on_facebook'},
        {id: 'sale_price', title: 'sale_price'},
        {id: 'sale_price_effective_date', title: 'sale_price_effective_date'},
        {id: 'item_group_id', title: 'item_group_id'},
        {id: 'size', title: 'size'}
      ]
    })
    
    // Write CSV file to dist directory
    await csvWriter.writeRecords(transformedProducts)
    
    // Also copy to public directory for easy access
    const publicDir = path.join(process.cwd(), 'public')
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true })
    }
    
    const distCsvPath = path.join(distDir, 'catalog-feed.csv')
    const publicCsvPath = path.join(publicDir, 'catalog-feed.csv')
    fs.copyFileSync(distCsvPath, publicCsvPath)
    
    console.log(`✅ Catalog generated successfully!`)
    console.log(`📁 Saved to: dist/catalog-feed.csv`)
    console.log(`📁 Copied to: public/catalog-feed.csv`)
    console.log(`🌐 Local access: http://localhost:8080/catalog-feed.csv`)
    console.log(`🌐 Production: https://satvikfoods.ca/catalog-feed.csv`)
    
    // Also log first few products for verification
    console.log('\n📋 Sample products:')
    transformedProducts.slice(0, 3).forEach((product, index) => {
      console.log(`${index + 1}. ${product.title} - ${product.price}`)
    })
    
  } catch (error) {
    console.error('❌ Error generating catalog:', error)
    process.exit(1)
  }
}

// Run the script
generateCatalog()
