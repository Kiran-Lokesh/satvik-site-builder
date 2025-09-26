# Satvik Foods Catalog API

This is a Next.js API project that provides a product catalog feed for Meta Commerce Manager integration.

## Features

- Fetches products from Sanity CMS
- Transforms data into Meta Commerce Manager CSV format
- Provides `/api/catalog-feed` endpoint
- Caches responses for performance

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env.local
```

3. Update `.env.local` with your Sanity credentials:
```
SANITY_PROJECT_ID=your_project_id
SANITY_DATASET=your_dataset
SANITY_TOKEN=your_token
```

## Development

```bash
npm run dev
```

The API will be available at `http://localhost:3000/api/catalog-feed`

## Deployment

This can be deployed to Vercel, Netlify, or any platform that supports Next.js.

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy

The catalog feed will be available at `https://your-domain.vercel.app/api/catalog-feed`

## Usage

Visit `/api/catalog-feed` to download the CSV file that can be used as a data source in Meta Commerce Manager.

## CSV Format

The endpoint returns a CSV with the following columns:
- `id`: Product ID from Sanity
- `title`: Product name
- `description`: Product description
- `availability`: Always "in stock"
- `price`: Price with CAD currency
- `link`: Product page URL
- `image_link`: Product image URL
