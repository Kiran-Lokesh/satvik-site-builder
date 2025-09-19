import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useEffect } from 'react';
import { useCart } from '@/contexts/CartContext';
import { ShoppingCart } from 'lucide-react';
import ProductDetailModal from './ProductDetailModal';

// Import placeholder image
import placeholderImage from '/placeholder.svg';

// Import all product images
import flaxSeedChutney from '@/assets/products/flax_seed_chutney_powder.jpg';
import jawarRotti from '@/assets/products/jawar_rotti.jpg';
import kardantu from '@/assets/products/kardantu.jpg';
import kunda from '@/assets/products/kunda.jpg';
import makhanaCreamOnion from '@/assets/products/makhana_cream_onion.jpg';
import makhanaPeriPeri from '@/assets/products/makhana_peri_peri.jpg';
import makhanaTangyCheese from '@/assets/products/makhana_tangy_cheese.jpg';
import milletBiryani from '@/assets/products/millet_biryani.jpg';
import milletBisiBeleBath from '@/assets/products/millet_bisi_bele_bath.jpg';
import milletDosa from '@/assets/products/millet_dosa.jpg';
import milletIdly from '@/assets/products/millet_idly.jpg';
import milletKheer from '@/assets/products/millet_kheer.jpg';
import milletKhichdi from '@/assets/products/millet_khichdi.jpg';
import milletUpma from '@/assets/products/millet_upma.jpg';
import milletsEnergyDrink from '@/assets/products/millets_energy_drink.jpg';
import milletsRotti from '@/assets/products/millets_rotti.jpg';
import nigerChutney from '@/assets/products/niger_chutney_powder.jpg';
import peanutChutney from '@/assets/products/peanut_chutney_powder.jpg';
import redChilliPowder from '@/assets/products/red_chiili_powder.jpg';
import sajjeRotti from '@/assets/products/sajje_rotti.jpg';
import supremeDinkLaddu from '@/assets/products/supreme_dink_laddu.jpg';
import turmericPowder from '@/assets/products/turmeric_powder.jpg';

// Import Nilgiris rice images
import idliRice from '@/assets/products/idli_rice.png';
import jeerakalasaRice from '@/assets/products/jeerakalasa_rice.png';
import mattaRice from '@/assets/products/matta_rice.png';
import ponniRice from '@/assets/products/ponni_rice.png';
import sonaMasooriRice from '@/assets/products/sona_masoori_rice.png';

// Static imports for local images (used when data source is JSON)
// Image mapping
const imageMap: Record<string, string> = {
  'flax_seed_chutney_powder.jpg': flaxSeedChutney,
  'jawar_rotti.jpg': jawarRotti,
  'kardantu.jpg': kardantu,
  'kunda.jpg': kunda,
  'makhana_cream_onion.jpg': makhanaCreamOnion,
  'makhana_peri_peri.jpg': makhanaPeriPeri,
  'makhana_tangy_cheese.jpg': makhanaTangyCheese,
  'millet_biryani.jpg': milletBiryani,
  'millet_bisi_bele_bath.jpg': milletBisiBeleBath,
  'millet_dosa.jpg': milletDosa,
  'millet_idly.jpg': milletIdly,
  'millet_kheer.jpg': milletKheer,
  'millet_khichdi.jpg': milletKhichdi,
  'millet_upma.jpg': milletUpma,
  'millets_energy_drink.jpg': milletsEnergyDrink,
  'millets_rotti.jpg': milletsRotti,
  'niger_chutney_powder.jpg': nigerChutney,
  'peanut_chutney_powder.jpg': peanutChutney,
  'red_chiili_powder.jpg': redChilliPowder,
  'sajje_rotti.jpg': sajjeRotti,
  'supreme_dink_laddu.jpg': supremeDinkLaddu,
  'turmeric_powder.jpg': turmericPowder,
  'placeholder.svg': placeholderImage, // Use generic placeholder image
  
  // Nilgiris rice images
  'idli_rice.png': idliRice,
  'jeerakalasa_rice.png': jeerakalasaRice,
  'matta_rice.png': mattaRice,
  'ponni_rice.png': ponniRice,
  'sona_masoori_rice.png': sonaMasooriRice,
  // Handle discrepancy in JSON data
  'sona_masoori_priya.jpg': sonaMasooriRice,
};

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

  // Handle unified image interface with fallback
  const [imageError, setImageError] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState(product.image?.url || placeholderImage);
  
  // Reset image error when product changes
  useEffect(() => {
    setImageError(false);
    setCurrentImageUrl(product.image?.url || placeholderImage);
  }, [product.id, product.image?.url]);
  
  // Handle image load error with fallback
  const handleImageError = () => {
    if (!imageError && product.image?.fallbackUrl) {
      console.log(`🔄 Image failed to load, using fallback for ${product.name}`);
      setImageError(true);
      setCurrentImageUrl(product.image.fallbackUrl);
    } else if (!imageError) {
      console.log(`🔄 Image failed to load, using placeholder for ${product.name}`);
      setImageError(true);
      setCurrentImageUrl(placeholderImage);
    }
  };

  // Get available variants (only in-stock ones)
  const availableVariants = product.variants?.filter(variant => variant.inStock !== false) || [];
  const hasVariants = availableVariants.length > 0;
  
  // Check if single-variant product is in stock
  const isInStock = product.inStock !== false;

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
          addToCart(product, variant, quantity);
        }
      } else {
        // Add product with simple price/variant structure
        const variant = product.variant || 'Standard';
        const price = product.price || '0';
        addToCart(product, { id: 'default', name: variant, price: price }, quantity);
      }
      
      // Don't auto-open cart - let user decide when to view it
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
            className="w-full h-48 sm:h-56 object-cover group-hover:scale-105 transition-transform duration-300"
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
              disabled={hasVariants && !selectedVariant || isAddingToCart || !isInStock}
              className={`w-full font-medium ${
                !isInStock 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-accent hover:bg-accent/90 text-black'
              }`}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              {!isInStock 
                ? 'Sold Out' 
                : isAddingToCart 
                  ? 'Adding...' 
                  : `Add ${quantity} to Cart`
              }
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