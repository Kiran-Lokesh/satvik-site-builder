import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCart } from '@/contexts/CartContext';
import { ShoppingCart, X, Star, Heart, Check, Loader2 } from 'lucide-react';

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
  'sona_masoori_priya.jpg': '/placeholder.svg', // No specific image available for Priya Sona Masoori
};

import { UnifiedProduct } from '@/lib/unifiedDataTypes';

interface ProductDetailModalProps {
  product: UnifiedProduct | null;
  isOpen: boolean;
  onClose: () => void;
}

const ProductDetailModal = ({ product, isOpen, onClose }: ProductDetailModalProps) => {
  const { addToCart } = useCart();
  const [selectedVariant, setSelectedVariant] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isAddedToCart, setIsAddedToCart] = useState(false);
  
  // Handle unified image interface with fallback - moved before early return
  const [imageError, setImageError] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState(product?.image?.url || placeholderImage);

  // Reset state when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setSelectedVariant('');
      setQuantity(1);
      setIsAddingToCart(false);
      setIsAddedToCart(false);
    }
  }, [isOpen]);

  // Reset image error when product changes
  useEffect(() => {
    if (product) {
      setImageError(false);
      setCurrentImageUrl(product.image?.url || placeholderImage);
    }
  }, [product?.id, product?.image?.url]);

  if (!product) return null;
  
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
      
      // Show success animation
      setIsAddedToCart(true);
      
      // Reset quantity and close modal after animation
      setTimeout(() => {
        setQuantity(1);
        onClose();
      }, 300);
    } finally {
      setIsAddingToCart(false);
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Product Image */}
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-lg bg-gradient-hero">
              <img
                src={currentImageUrl}
                alt={product.name}
                className="w-full h-80 md:h-96 lg:h-[28rem] object-contain"
                loading="lazy"
                onError={handleImageError}
                decoding="async"
              />
            </div>
            
            {/* Product Badges */}
            <div className="flex flex-wrap gap-2">
              <Badge 
                variant="secondary" 
                className="bg-brand/10 text-brand border-brand/20 hover:bg-brand/20"
              >
                <Star className="h-3 w-3 mr-1" />
                Premium Quality
              </Badge>
              <Badge 
                variant="secondary" 
                className="bg-accent/20 text-brandText border-accent/30"
              >
                <Heart className="h-3 w-3 mr-1" />
                Satvik Foods
              </Badge>
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            {/* Description */}
            {product.description && (
              <div>
                <h3 className="text-lg font-semibold text-brandText mb-2">Description</h3>
                <p className="text-muted leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Price Display for Single Variant */}
            {!hasVariants && product.price && (
              <div className="bg-brand/5 border border-brand/20 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-brandText">Size</h3>
                    <p className="text-muted">{product.variant}</p>
                  </div>
                  <div className="text-right">
                    <h3 className="text-lg font-semibold text-brandText">Price</h3>
                    <p className="text-2xl font-bold text-brand">{product.price}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Variant Selection */}
            {hasVariants && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-brandText">Select Size</h3>
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
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-brandText">Quantity</h3>
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="h-10 w-10 p-0"
                  disabled={quantity <= 1}
                >
                  -
                </Button>
                <span className="w-12 text-center font-medium text-lg">{quantity}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(quantity + 1)}
                  className="h-10 w-10 p-0"
                >
                  +
                </Button>
              </div>
            </div>

            {/* Add to Cart Button */}
            <div className="pt-4">
              <Button
                onClick={handleAddToCart}
                disabled={hasVariants && !selectedVariant || isAddingToCart || !isInStock || isAddedToCart}
                className={`w-full font-medium py-3 text-lg transition-all duration-200 ${
                  !isInStock 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : isAddedToCart
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-accent hover:bg-accent/90 text-black'
                }`}
              >
                {!isInStock ? (
                  <>
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Sold Out
                  </>
                ) : isAddingToCart ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : isAddedToCart ? (
                  <>
                    <Check className="h-5 w-5 mr-2" />
                    Added {quantity}!
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Add {quantity} to Cart
                  </>
                )}
              </Button>
            </div>

            {/* Product Features */}
            <div className="pt-4 border-t">
              <h3 className="text-lg font-semibold text-brandText mb-3">Why Choose This Product?</h3>
              <ul className="space-y-2 text-sm text-muted">
                <li className="flex items-center">
                  <Star className="h-4 w-4 mr-2 text-accent" />
                  Made with premium, natural ingredients
                </li>
                <li className="flex items-center">
                  <Star className="h-4 w-4 mr-2 text-accent" />
                  Traditional recipes with modern quality
                </li>
                <li className="flex items-center">
                  <Star className="h-4 w-4 mr-2 text-accent" />
                  Fresh and authentic taste
                </li>
                <li className="flex items-center">
                  <Star className="h-4 w-4 mr-2 text-accent" />
                  Healthy and nutritious
                </li>
              </ul>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailModal;
