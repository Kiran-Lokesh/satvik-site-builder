import { createClient } from '@sanity/client'

// Initialize Sanity client
export const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID || 'eaaly2y1',
  dataset: process.env.SANITY_DATASET || 'products',
  useCdn: false, // Set to false for authenticated requests
  apiVersion: process.env.SANITY_API_VERSION || '2024-09-19',
  token: process.env.SANITY_TOKEN, // Add token for authenticated requests
})
