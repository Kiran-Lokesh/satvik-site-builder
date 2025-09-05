# Satvik Foods - Professional Food Distribution Website

A modern, responsive website for Satvik Foods, featuring authentic North Karnataka food products. Built with React, TypeScript, and Tailwind CSS.

## 🌟 Features

- **Responsive Design**: Mobile-first, fully responsive across all devices
- **JSON-Driven Products**: Easy to update product catalog through JSON file
- **Modern UI**: Beautiful, professional design with warm, food-industry colors
- **SEO Optimized**: Proper meta tags, semantic HTML, and structured content
- **Contact Form**: EmailJS integration for direct email communication
- **Performance**: Optimized images and smooth animations
- **Accessibility**: WCAG compliant with proper semantic markup

## 🏗️ Tech Stack

- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Vite** for build tooling
- **shadcn/ui** for UI components
- **React Router** for navigation
- **EmailJS** for contact form
- **Lucide React** for icons

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd satvik-foods-website
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:8080`

## 📧 EmailJS Setup

To enable the contact form, configure EmailJS:

1. **Create EmailJS Account**
   - Go to [EmailJS](https://www.emailjs.com/)
   - Create a free account

2. **Setup Email Service**
   - Add your email service (Gmail, Outlook, etc.)
   - Note your Service ID

3. **Create Email Template**
   - Create a template with variables: `{{from_name}}`, `{{from_email}}`, `{{message}}`
   - Note your Template ID

4. **Get Public Key**
   - Find your Public Key in account settings

5. **Update Contact Page**
   In `src/pages/Contact.tsx`, replace the placeholder values:
   ```typescript
   const SERVICE_ID = 'your_actual_service_id';
   const TEMPLATE_ID = 'your_actual_template_id';
   const PUBLIC_KEY = 'your_actual_public_key';
   ```

6. **Uncomment EmailJS Code**
   Uncomment the emailjs.send() function in the handleSubmit method.

## 📦 Product Management

### Adding New Products

1. **Add Product Images**
   - Place product images in `src/assets/products/`
   - Use descriptive filenames (e.g., `turmeric-powder.png`)

2. **Update Products JSON**
   Edit `src/data/products.json`:
   ```json
   {
     "categories": [
       {
         "id": "new-category",
         "name": "New Category",
         "description": "Category description",
         "products": [
           {
             "id": "new-product",
             "name": "Product Name",
             "description": "Product description",
             "image": "product-image.png",
             "features": ["Feature 1", "Feature 2"]
           }
         ]
       }
     ]
   }
   ```

3. **The website will automatically update** to show new categories and products!

### Product JSON Structure

```json
{
  "categories": [
    {
      "id": "unique-category-id",
      "name": "Display Name", 
      "description": "Category description",
      "products": [
        {
          "id": "unique-product-id",
          "name": "Product Display Name",
          "description": "Product description text",
          "image": "filename.png",
          "features": ["Feature 1", "Feature 2", "Feature 3"]
        }
      ]
    }
  ]
}
```

## 🎨 Customization

### Colors & Branding

The design system is defined in `src/index.css`:

```css
:root {
  --brand-green: 140 45% 35%;    /* Primary green */
  --brand-gold: 45 85% 65%;      /* Golden accent */
  --brand-orange: 25 85% 70%;    /* Orange accent */
  --brand-cream: 48 56% 97%;     /* Light background */
  --brand-earth: 25 35% 25%;     /* Dark earth tone */
}
```

### Typography

Update font families in `tailwind.config.ts` if needed.

### Component Variants

Customize button and card variants in the shadcn components located in `src/components/ui/`.

## 📱 Pages Structure

- **Home (`/`)**: Hero section, company intro, features
- **Products (`/products`)**: JSON-driven product catalog
- **About (`/about`)**: Company story, mission, values
- **Contact (`/contact`)**: Contact form and business info

## 🔧 Build & Deployment

### Development Build
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Deploy to Vercel/Netlify
1. Build the project: `npm run build`
2. Deploy the `dist` folder to your hosting platform

## 📊 SEO Features

- ✅ Semantic HTML structure
- ✅ Meta descriptions and keywords
- ✅ Open Graph tags
- ✅ Twitter Cards
- ✅ Canonical URLs
- ✅ Alt text for all images
- ✅ Structured content hierarchy
- ✅ Mobile-friendly viewport

## 🎯 Performance Features

- ✅ Lazy loading images
- ✅ Optimized animations
- ✅ Minimal bundle size
- ✅ Modern build tooling (Vite)
- ✅ Tree-shaking
- ✅ Code splitting

## 📞 Support

For questions or support:
- Email: [Add your support email]
- Documentation: This README
- Issues: Create GitHub issues for bugs

## 📝 License

[Add your license information]

---

**Built with ❤️ for Satvik Foods - Bringing tradition to your table**