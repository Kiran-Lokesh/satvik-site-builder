import { useEffect, useState } from 'react';
import ProductCard from '@/components/ProductCard';
import ProductDetailModal from '@/components/ProductDetailModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import { getProductData, type Brand, type Product } from '@/lib/dataService';

// Types are now imported from dataService

const Products = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductDetailOpen, setIsProductDetailOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(12); // Show 12 products per page

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  useEffect(() => {
    // Load products from configured data source
    const loadProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const productData = await getProductData();
        setBrands(productData);
        
        console.log('✅ Products loaded:', productData.length, 'brands');
      } catch (error) {
        console.error('❌ Failed to load products:', error);
        setError(error instanceof Error ? error.message : 'Failed to load products');
        setBrands([]);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  // Update available categories when brand changes
  useEffect(() => {
    if (!brands || brands.length === 0) {
      setAvailableCategories([]);
      return;
    }
    
    if (selectedBrand === 'all') {
      // Get all unique categories from all brands
      const allCategories = brands.flatMap(brand => 
        brand.categories?.map(category => category.name) || []
      );
      setAvailableCategories([...new Set(allCategories)]);
    } else {
      // Get categories from selected brand
      const brand = brands.find(b => b.name === selectedBrand);
      setAvailableCategories(brand?.categories?.map(c => c.name) || []);
    }
    // Reset category filter when brand changes
    setSelectedCategory('all');
  }, [selectedBrand, brands]);

  // Filter products based on selected filters
  const getFilteredProducts = () => {
    if (!brands || brands.length === 0) {
      return [];
    }
    
    return brands.flatMap(brand => {
      // Filter by selected brand
      if (selectedBrand !== 'all' && brand.name !== selectedBrand) {
        return [];
      }
      
      // Check if brand has categories
      if (!brand.categories || brand.categories.length === 0) {
        return [];
      }
      
      return brand.categories.flatMap(category => {
        // Filter by selected category
        if (selectedCategory !== 'all' && category.name !== selectedCategory) {
          return [];
        }
        
        // Check if category has products
        if (!category.products || category.products.length === 0) {
          return [];
        }
        
        // Apply search filter and return products
        return category.products.filter(product => {
          if (!searchQuery.trim()) return true;
          return product.name.toLowerCase().includes(searchQuery.toLowerCase());
        });
      });
    });
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedBrand('all');
    setSelectedCategory('all');
    setSearchQuery('');
    setCurrentPage(1); // Reset to first page
  };

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedBrand, selectedCategory, searchQuery]);

  // Get filtered products for pagination
  const allFilteredProducts = getFilteredProducts();

  // Pagination calculations
  const totalProducts = allFilteredProducts.length;
  const totalPages = Math.ceil(totalProducts / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const endIndex = startIndex + productsPerPage;
  const currentProducts = allFilteredProducts.slice(startIndex, endIndex);

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

  // Helper function to get all unique categories
  const getAllCategories = () => {
    if (!brands || brands.length === 0) {
      return [];
    }
    return brands.flatMap(brand => 
      brand.categories?.map(category => category.name) || []
    ).filter((category, index, array) => array.indexOf(category) === index);
  };

  // Helper function to get total product count
  const getTotalProductCount = () => {
    if (!brands || brands.length === 0) {
      return 0;
    }
    return brands.reduce((total, brand) => 
      total + (brand.categories?.reduce((brandTotal, category) => 
        brandTotal + (category.products?.length || 0), 0
      ) || 0), 0
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="text-center space-y-4">
          <h1 className="text-4xl lg:text-5xl font-bold text-foreground">
            Our Products
          </h1>
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand"></div>
            <p className="text-lg text-muted-foreground">Loading products...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="text-center space-y-4">
          <h1 className="text-4xl lg:text-5xl font-bold text-foreground">
            Our Products
          </h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
            <p className="text-red-600 font-medium">Failed to load products</p>
            <p className="text-red-500 text-sm mt-2">{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-4"
              variant="outline"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
      <div className="space-y-16">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl lg:text-5xl font-bold text-foreground">
            Our Products
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Discover our range of authentic South Indian foods, made with traditional methods 
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

        {/* Products Grid with Pagination */}
        {totalProducts > 0 && (
          <div className="space-y-8">
            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {currentProducts.map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  onClick={handleProductClick}
                />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8">
                <div className="text-sm text-muted-foreground">
                  Showing {startIndex + 1}-{Math.min(endIndex, totalProducts)} of {totalProducts} products
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCurrentPage(prev => Math.max(1, prev - 1));
                      scrollToTop();
                    }}
                    disabled={currentPage === 1}
                    className="border-brand/20 text-brand hover:bg-brand/5"
                  >
                    Previous
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            setCurrentPage(pageNum);
                            scrollToTop();
                          }}
                          className={currentPage === pageNum 
                            ? "bg-brand hover:bg-brand-dark text-white" 
                            : "border-brand/20 text-brand hover:bg-brand/5"
                          }
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCurrentPage(prev => Math.min(totalPages, prev + 1));
                      scrollToTop();
                    }}
                    disabled={currentPage === totalPages}
                    className="border-brand/20 text-brand hover:bg-brand/5"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* No Results State */}
        {totalProducts === 0 && brands.length > 0 && (
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
      <ProductDetailModal
        product={selectedProduct}
        isOpen={isProductDetailOpen}
        onClose={handleProductDetailClose}
      />
    </div>
  );
};

export default Products;