import { useEffect, useState } from 'react';
import ProductCard from '@/components/ProductCard';
import ProductDetail from '@/components/ProductDetail';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import jawariProductsData from '@/data/jawari_products.json';

interface ProductVariant {
  id: string;
  name: string;
  price?: string;
  inStock?: boolean;
}

interface Product {
  id: string;
  name: string;
  description: string;
  image: string;
  variants?: ProductVariant[];
}

interface Category {
  name: string;
  products: Product[];
}

interface Brand {
  name: string;
  categories: Category[];
}

const Products = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductDetailOpen, setIsProductDetailOpen] = useState(false);

  useEffect(() => {
    // Load products from JSON file
    setBrands(jawariProductsData.brands);
  }, []);

  // Update available categories when brand changes
  useEffect(() => {
    if (selectedBrand === 'all') {
      // Get all unique categories from all brands dynamically
      const allCategories = brands.flatMap(brand => 
        brand.categories.map(category => category.name)
      );
      setAvailableCategories([...new Set(allCategories)]);
    } else {
      // Get categories from selected brand dynamically
      const brand = brands.find(b => b.name === selectedBrand);
      setAvailableCategories(brand ? brand.categories.map(c => c.name) : []);
    }
    // Reset category filter when brand changes
    setSelectedCategory('all');
  }, [selectedBrand, brands]);

  // Filter brands based on selected filters
  const filteredBrands = brands.filter(brand => {
    if (selectedBrand === 'all') return true;
    return brand.name === selectedBrand;
  });

  // Filter categories within each brand
  const getFilteredCategories = (brand: Brand) => {
    return brand.categories.filter(category => {
      // First filter by selected category
      const categoryMatches = selectedCategory === 'all' || category.name === selectedCategory;
      if (!categoryMatches) return false;
      
      // Then check if category has products after search filtering
      const filteredProducts = getFilteredProducts(category.products);
      return filteredProducts.length > 0;
    });
  };

  // Filter products by search query
  const getFilteredProducts = (products: Product[]) => {
    if (!searchQuery.trim()) return products;
    return products.filter(product => 
      product.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedBrand('all');
    setSelectedCategory('all');
    setSearchQuery('');
  };

  // Handle product card click
  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setIsProductDetailOpen(true);
  };

  // Handle product detail close
  const handleProductDetailClose = () => {
    setIsProductDetailOpen(false);
    setSelectedProduct(null);
  };

  // Helper function to get all unique categories across all brands
  const getAllCategories = () => {
    return brands.flatMap(brand => 
      brand.categories.map(category => category.name)
    ).filter((category, index, array) => array.indexOf(category) === index);
  };

  // Helper function to get total product count
  const getTotalProductCount = () => {
    return brands.reduce((total, brand) => 
      total + brand.categories.reduce((brandTotal, category) => 
        brandTotal + category.products.length, 0
      ), 0
    );
  };

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
          <p className="text-sm text-muted">
            {getTotalProductCount()} products across {brands.length} brands and {getAllCategories().length} categories
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Search products by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-3 text-base border-brand/20 focus:border-brand focus:ring-brand/20"
            />
          </div>
        </div>

        {/* Filter Controls */}
        <div className="bg-surface/50 rounded-lg p-6 border border-brand/10">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              {/* Brand Filter */}
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <label className="text-sm font-medium text-brandText whitespace-nowrap">
                  Brand:
                </label>
                <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select a brand" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Brands</SelectItem>
                    {brands.map((brand) => (
                      <SelectItem key={brand.name} value={brand.name}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Category Filter */}
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <label className="text-sm font-medium text-brandText whitespace-nowrap">
                  Category:
                </label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {availableCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Clear Filters Button */}
            {(selectedBrand !== 'all' || selectedCategory !== 'all') && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearFilters}
                className="border-brand/20 text-brand hover:bg-brand/5"
              >
                Clear Filters
              </Button>
            )}
          </div>

          {/* Active Filters Display */}
          {(selectedBrand !== 'all' || selectedCategory !== 'all') && (
            <div className="mt-4 text-center">
              <p className="text-sm text-muted">
                Showing: {selectedBrand === 'all' ? 'All Brands' : selectedBrand}
                {selectedCategory !== 'all' && ` • ${selectedCategory}`}
              </p>
            </div>
          )}
        </div>

        {/* Brands, Categories and Products - Fully Dynamic Rendering */}
        {/* This section automatically adapts to any changes in jawari_products.json */}
        {filteredBrands.map((brand, brandIndex) => {
          const filteredCategories = getFilteredCategories(brand);
          
          // Only show brand if it has categories with products or if showing all
          if (filteredCategories.length === 0) return null;
          
          return (
            <section key={brand.name} className="space-y-12">
              {/* Categories within Brand */}
              {filteredCategories.map((category, categoryIndex) => (
                <div key={`${brand.name}-${category.name}`} className="space-y-8">
                  {/* Category Header */}
                  <div className="text-center space-y-3">
                    <h3 className="text-2xl lg:text-3xl font-semibold text-brandText">
                      {category.name}
                    </h3>
                  </div>

                  {/* Products Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {getFilteredProducts(category.products).map((product) => (
                      <ProductCard 
                        key={product.id} 
                        product={product} 
                        onClick={handleProductClick}
                      />
                    ))}
                  </div>

                  {/* Divider between categories (except for last category in brand) */}
                  {categoryIndex < filteredCategories.length - 1 && (
                    <div className="flex justify-center pt-8">
                      <div className="w-16 h-px bg-brand/20"></div>
                    </div>
                  )}
                </div>
              ))}

              {/* Divider between brands (except for last brand) */}
              {brandIndex < filteredBrands.length - 1 && (
                <div className="flex justify-center pt-12">
                  <div className="w-32 h-px bg-gradient-to-r from-transparent via-brand/30 to-transparent"></div>
                </div>
              )}
            </section>
          );
        })}

        {/* No Results State */}
        {filteredBrands.length === 0 && brands.length > 0 && (
          <div className="text-center py-16">
            <h2 className="text-2xl font-semibold text-muted-foreground mb-4">
              No Products Found
            </h2>
            <p className="text-muted-foreground mb-6">
              No products match your current filters. Try adjusting your selection.
            </p>
            <Button 
              onClick={clearFilters}
              className="bg-brand hover:bg-brand-dark text-white"
            >
              Clear All Filters
            </Button>
          </div>
        )}

        {/* Empty State */}
        {brands.length === 0 && (
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

      {/* Product Detail Modal */}
      <ProductDetail
        product={selectedProduct}
        isOpen={isProductDetailOpen}
        onClose={handleProductDetailClose}
      />
    </div>
  );
};

export default Products;