import { client } from '../../../lib/sanity'
import { Parser } from 'json2csv'

// GROQ query to fetch all products
const PRODUCTS_QUERY = `*[_type == "product"]{
  _id,
  name,
  description,
  price,
  "slug": slug.current,
  "imageUrl": mainImage.asset->url
}`

export async function GET() {
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
    
    // Return CSV response
    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="satvik-catalog.csv"',
        'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
      }
    })
    
  } catch (error) {
    console.error('Error generating catalog feed:', error)
    
    return new Response(JSON.stringify({ 
      error: 'Failed to generate catalog feed',
      details: error.message 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
}
