import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useEffect } from 'react';
import { useCart } from '@/contexts/CartContext';
import { ShoppingCart, Check, Loader2 } from 'lucide-react';
import ProductDetailModal from './ProductDetailModal';

// Import placeholder image only
import placeholderImage from '/placeholder.svg';

import { UnifiedProduct } from '@/lib/unifiedDataTypes';

interface ProductCardProps {
  product: UnifiedProduct;
  onClick?: (product: UnifiedProduct) => void;
}

const ProductCard = ({ product, onClick }: ProductCardProps) => {
  const { addToCart } = useCart();
  const [selectedVariant, setSelectedVariant] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddedToCart, setIsAddedToCart] = useState(false);

  // Handle unified image interface with fallback
  const [imageError, setImageError] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState(product.image?.url || placeholderImage);
  
  // Reset image error when product changes
  useEffect(() => {
    setImageError(false);
    setCurrentImageUrl(product.image?.url || placeholderImage);
  }, [product.id, product.image?.url]);
  
  // Handle image load error with placeholder only
  const handleImageError = () => {
    if (!imageError) {
      console.log(`⚠️ Image failed to load, using placeholder for ${product.name}`);
      setImageError(true);
      setCurrentImageUrl(placeholderImage);
    }
  };

  // Get available variants (only in-stock ones)
  const availableVariants = product.variants?.filter(variant => variant.inStock !== false) || [];
  const hasVariants = availableVariants.length > 0;
  
  // Check if single-variant product is in stock
  const isInStock = product.inStock !== false;

  const parsePriceToNumber = (value?: string | number) => {
    if (typeof value === 'number') return value;
    if (!value) return 0;
    const numeric = value.replace(/[^0-9.]/g, '');
    return Number.parseFloat(numeric || '0');
  };

  // Handle add to cart
  const handleAddToCart = async () => {
    if (hasVariants && !selectedVariant) {
      return; // Don't add if variants exist but none selected
    }
    
    if (!hasVariants && !isInStock) {
      return; // Don't add if single-variant product is out of stock
    }

    setIsAddingToCart(true);
    
    try {
      if (hasVariants) {
        const variant = availableVariants.find(v => v.id === selectedVariant);
        if (variant) {
          addToCart(product, { ...variant, unitPrice: parsePriceToNumber(variant.price) }, quantity);
        }
      } else {
        // Add product with simple price/variant structure
        // For products without variants, use the product ID as the variant ID
        // This should be a UUID when products come from the backend
        const variant = product.variant || 'Standard';
        const price = product.price || '0';
        
        // Check if product.id is a valid UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(product.id)) {
          console.error('Product ID is not a UUID:', product.id, 'Product:', product.name);
          throw new Error(`Product "${product.name}" has an invalid ID format. Please refresh the page and try again.`);
        }
        
        addToCart(
          product,
          { id: product.id, name: variant, price, unitPrice: parsePriceToNumber(price) },
          quantity
        );
      }
      
      // Show success animation
      setIsAddedToCart(true);
      
      // Reset quantity and success state after animation
      setTimeout(() => {
        setIsAddedToCart(false);
        setQuantity(1);
      }, 300);
      
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick(product);
    } else {
      setIsModalOpen(true);
    }
  };

  return (
    <>
      <Card 
        className="group hover:shadow-card transition-all duration-300 border-[rgba(0,77,61,0.08)] bg-card cursor-pointer h-full flex flex-col"
        onClick={handleCardClick}
      >
      <CardContent className="p-0 flex flex-col h-full">
        <div className="relative overflow-hidden rounded-t-lg bg-gradient-hero">
          <img
            src={currentImageUrl}
            alt={product.name}
            className="w-full h-48 sm:h-56 object-contain group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={handleImageError}
            decoding="async"
          />
        </div>
        <div className="p-6 space-y-4 flex flex-col flex-1">
          <div className="space-y-2 flex-1">
            <h3 className="text-lg font-semibold text-brandText group-hover:text-brand transition-colors">
              {product.name}
            </h3>
            {product.description && (
              <p className="text-sm text-muted leading-relaxed line-clamp-3">
                {product.description.length > 120 
                  ? `${product.description.substring(0, 120)}...` 
                  : product.description
                }
              </p>
            )}
          </div>
          
          {/* Price Display */}
          {!hasVariants && product.price && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{product.variant}</span>
              <span className="text-lg font-semibold text-brand">{product.price}</span>
            </div>
          )}
          
          {/* Variant Selection */}
          {hasVariants && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-brandText">Select Size:</label>
              <Select value={selectedVariant} onValueChange={setSelectedVariant}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose size..." />
                </SelectTrigger>
                <SelectContent>
                  {availableVariants.map((variant) => (
                    <SelectItem key={variant.id} value={variant.id}>
                      {variant.name} {variant.price && `- ${variant.price}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Quantity Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-brandText">Quantity:</label>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setQuantity(Math.max(1, quantity - 1));
                }}
                className="h-8 w-8 p-0"
                disabled={quantity <= 1}
              >
                -
              </Button>
              <span className="w-8 text-center font-medium">{quantity}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setQuantity(quantity + 1);
                }}
                className="h-8 w-8 p-0"
              >
                +
              </Button>
            </div>
          </div>
          
          
          {/* Add to Cart Button and Badge - Always at bottom */}
          <div className="space-y-3 mt-auto">
            <Button
              onClick={(e) => {
                e.stopPropagation(); // Prevent card click
                handleAddToCart();
              }}
              disabled={hasVariants && !selectedVariant || isAddingToCart || !isInStock || isAddedToCart}
              className={`w-full font-medium transition-all duration-200 ${
                !isInStock 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : isAddedToCart
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : 'bg-accent hover:bg-accent/90 text-black'
              }`}
            >
              {!isInStock ? (
                <>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Sold Out
                </>
              ) : isAddingToCart ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : isAddedToCart ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Added {quantity}!
                </>
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add {quantity} to Cart
                </>
              )}
            </Button>
            
            <div className="flex justify-end">
              <Badge 
                variant="secondary" 
                className="text-xs bg-brand/10 text-brand border-brand/20 hover:bg-brand/20"
              >
                Premium Quality
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Product Detail Modal */}
    <ProductDetailModal
      product={product}
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
    />
  </>
  );
};

export default ProductCard;