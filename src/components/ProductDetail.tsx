import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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

interface ProductDetailProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

const ProductDetail = ({ product, isOpen, onClose }: ProductDetailProps) => {
  if (!product) return null;

  // Dynamic import function for product images
  const getProductImage = (imageName: string) => {
    try {
      // Try to load the image directly
      return new URL(`../assets/products/${imageName}`, import.meta.url).href;
    } catch {
      // Fallback if image doesn't exist
      return '/placeholder.svg';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-brandText">
            {product.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
          {/* Product Image */}
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-lg bg-gradient-hero">
              <img
                src={getProductImage(product.image)}
                alt={product.name}
                className="w-full h-80 object-cover"
                loading="lazy"
              />
            </div>
            
            {/* Product Badge */}
            <div className="flex justify-center">
              <Badge 
                variant="secondary" 
                className="text-sm bg-brand/10 text-brand border-brand/20 hover:bg-brand/20 px-4 py-2"
              >
                Premium Quality
              </Badge>
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-brandText">
                Product Description
              </h3>
              <p className="text-muted leading-relaxed text-base">
                {product.description}
              </p>
            </div>

            {/* Additional Product Information */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-brandText">
                Product Features
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-brand rounded-full"></div>
                  <span className="text-sm text-muted">100% Natural</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-brand rounded-full"></div>
                  <span className="text-sm text-muted">Traditional Recipe</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-brand rounded-full"></div>
                  <span className="text-sm text-muted">Premium Quality</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-brand rounded-full"></div>
                  <span className="text-sm text-muted">Health Benefits</span>
                </div>
              </div>
            </div>

            {/* Product Variants */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-brandText">
                  Available Sizes
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {product.variants.map((variant) => (
                    <div 
                      key={variant.id}
                      className={`p-4 rounded-lg border-2 transition-colors ${
                        variant.inStock !== false 
                          ? 'border-brand/20 bg-brand/5 hover:bg-brand/10' 
                          : 'border-gray-200 bg-gray-50 opacity-60'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium text-brandText">
                            {variant.name}
                          </h4>
                          {variant.price && (
                            <p className="text-sm text-brand font-semibold">
                              {variant.price}
                            </p>
                          )}
                        </div>
                        <Badge 
                          variant={variant.inStock !== false ? "default" : "secondary"}
                          className={variant.inStock !== false ? "bg-brand text-white" : "bg-gray-400"}
                        >
                          {variant.inStock !== false ? "In Stock" : "Out of Stock"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Call to Action */}
            <div className="pt-6 border-t border-brand/10">
              <Button 
                className="w-full bg-brand hover:bg-brand-dark text-white"
                onClick={() => {
                  // You can add contact functionality here
                  window.open('mailto:info@satvikfoods.ca?subject=Inquiry about ' + product.name, '_blank');
                }}
              >
                Contact Us
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetail;
