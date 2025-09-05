import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    description: string;
    image: string;
    features: string[];
  };
}

const ProductCard = ({ product }: ProductCardProps) => {
  // Dynamic import function for product images
  const getProductImage = (imageName: string) => {
    try {
      return new URL(`../assets/products/${imageName}`, import.meta.url).href;
    } catch {
      // Fallback if image doesn't exist
      return '/placeholder.svg';
    }
  };

  return (
    <Card className="group hover:shadow-card transition-all duration-300 hover:-translate-y-1 border-border/50 bg-card">
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
            <h3 className="text-lg font-semibold text-card-foreground group-hover:text-primary transition-colors">
              {product.name}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {product.description}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {product.features.map((feature, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="text-xs bg-brand-green/10 text-brand-green border-brand-green/20 hover:bg-brand-green/20"
              >
                {feature}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;