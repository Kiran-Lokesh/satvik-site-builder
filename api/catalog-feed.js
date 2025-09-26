import { createClient } from '@sanity/client'
import { Parser } from 'json2csv'

// Initialize Sanity client
const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID || 'eaaly2y1',
  dataset: process.env.SANITY_DATASET || 'products',
  useCdn: false,
  apiVersion: process.env.SANITY_API_VERSION || '2024-09-19',
  token: process.env.SANITY_TOKEN,
})

// GROQ query to fetch all products
const PRODUCTS_QUERY = `*[_type == "product"]{
  _id,
  name,
  description,
  price,
  "slug": slug.current,
  "imageUrl": mainImage.asset->url
}`

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Fetch products from Sanity
    const products = await client.fetch(PRODUCTS_QUERY)
    
    // Transform products into Meta Commerce Manager format
    const transformedProducts = products.map(product => ({
      id: product._id,
      title: product.name,
      description: product.description || '',
      availability: 'in stock',
      price: `${product.price} CAD`,
      link: `https://satvikfoods.ca/product/${product.slug}`,
      image_link: product.imageUrl || ''
    }))
    
    // Convert to CSV
    const parser = new Parser({
      fields: ['id', 'title', 'description', 'availability', 'price', 'link', 'image_link']
    })
    
    const csv = parser.parse(transformedProducts)
    
    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename="satvik-catalog.csv"')
    res.setHeader('Cache-Control', 'public, max-age=3600') // Cache for 1 hour
    
    // Send CSV response
    res.status(200).send(csv)
    
  } catch (error) {
    console.error('Error generating catalog feed:', error)
    
    res.status(500).json({ 
      error: 'Failed to generate catalog feed',
      details: error.message 
    })
  }
}
