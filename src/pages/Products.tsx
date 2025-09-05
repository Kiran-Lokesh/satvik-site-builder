import { useEffect, useState } from 'react';
import ProductCard from '@/components/ProductCard';
import productsData from '@/data/products.json';

interface Product {
  id: string;
  name: string;
  description: string;
  image: string;
  features: string[];
}

interface Category {
  id: string;
  name: string;
  description: string;
  products: Product[];
}

const Products = () => {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    // Load products from JSON file
    setCategories(productsData.categories);
  }, []);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
      <div className="space-y-16">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl lg:text-5xl font-bold text-foreground">
            Our Products
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Discover our range of authentic North Karnataka foods, made with traditional methods 
            and the finest natural ingredients for your health and taste.
          </p>
        </div>

        {/* Categories and Products */}
        {categories.map((category, categoryIndex) => (
          <section key={category.id} className="space-y-8">
            {/* Category Header */}
            <div className="text-center space-y-3">
              <h2 className="text-3xl lg:text-4xl font-bold text-primary">
                {category.name}
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                {category.description}
              </p>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {category.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Divider (except for last category) */}
            {categoryIndex < categories.length - 1 && (
              <div className="flex justify-center pt-8">
                <div className="w-24 h-px bg-gradient-warm"></div>
              </div>
            )}
          </section>
        ))}

        {/* Empty State */}
        {categories.length === 0 && (
          <div className="text-center py-16">
            <h2 className="text-2xl font-semibold text-muted-foreground mb-4">
              Products Coming Soon
            </h2>
            <p className="text-muted-foreground">
              We're currently updating our product catalog. Please check back soon!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;