import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    description: string;
    image: string;
  };
  onClick?: (product: ProductCardProps['product']) => void;
}

const ProductCard = ({ product, onClick }: ProductCardProps) => {
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
    <Card 
      className="group hover:shadow-card transition-all duration-300 hover:-translate-y-1 border-[rgba(0,77,61,0.08)] bg-card cursor-pointer"
      onClick={() => onClick?.(product)}
    >
      <CardContent className="p-0">
        <div className="relative overflow-hidden rounded-t-lg bg-gradient-hero">
          <img
            src={getProductImage(product.image)}
            alt={product.name}
            className="w-full h-48 sm:h-56 object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-brandText group-hover:text-brand transition-colors">
              {product.name}
            </h3>
            <p className="text-sm text-muted leading-relaxed">
              {product.description}
            </p>
          </div>
          
          <div className="flex justify-end">
            <Badge 
              variant="secondary" 
              className="text-xs bg-brand/10 text-brand border-brand/20 hover:bg-brand/20"
            >
              Premium Quality
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;