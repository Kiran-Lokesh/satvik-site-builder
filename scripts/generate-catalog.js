import { createClient } from '@sanity/client'
import { Parser } from 'json2csv'
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
    
    // Convert to CSV
    const parser = new Parser({
      fields: ['id', 'title', 'description', 'availability', 'price', 'link', 'image_link']
    })
    
    const csv = parser.parse(transformedProducts)
    
    // Save CSV file to public directory (for GitHub Pages)
    const outputPath = path.join(process.cwd(), 'public', 'catalog-feed.csv')
    fs.writeFileSync(outputPath, csv)
    
    // Also save to dist directory for deployment
    const distPath = path.join(process.cwd(), 'dist', 'catalog-feed.csv')
    fs.writeFileSync(distPath, csv)
    
    console.log(`✅ Catalog generated successfully!`)
    console.log(`📁 Saved to: ${outputPath}`)
    console.log(`📁 Also saved to: ${distPath}`)
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
