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

// GROQ query to fetch all products
const PRODUCTS_QUERY = `*[_type == "product"]{
  _id,
  name,
  description,
  price,
  "slug": slug.current,
  "imageUrl": image.asset->url,
  "imageAlt": image.alt
}`

async function generateCatalog() {
  try {
    console.log('🔄 Fetching products from Sanity...')
    
    // Fetch products from Sanity
    const products = await client.fetch(PRODUCTS_QUERY)
    console.log(`✅ Found ${products.length} products`)
    
    // Transform products into Meta Commerce Manager format
    const transformedProducts = products.map(product => {
      // Handle slug - use product name as fallback if slug is null
      const slug = product.slug || product.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      
      return {
        id: product._id,
        title: product.name,
        description: product.description || '',
        availability: 'in stock',
        price: `${product.price} CAD`,
        link: `https://satvikfoods.ca/product/${slug}`,
        image_link: product.imageUrl || ''
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
        {id: 'price', title: 'price'},
        {id: 'link', title: 'link'},
        {id: 'image_link', title: 'image_link'}
      ]
    })
    
    // Write CSV file to dist directory
    await csvWriter.writeRecords(transformedProducts)
    
    console.log(`✅ Catalog generated successfully!`)
    console.log(`📁 Saved to: dist/catalog-feed.csv`)
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
