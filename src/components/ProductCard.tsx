import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
  'placeholder.svg': jawarRotti, // Use jawar_rotti as fallback for placeholder
};

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    description?: string;
    image?: string;
  };
  onClick?: (product: ProductCardProps['product']) => void;
}

const ProductCard = ({ product, onClick }: ProductCardProps) => {
  // Handle both Airtable URLs and local image names
  const imageName = product.image || 'placeholder.svg';
  
  // Check if it's an Airtable URL (starts with https://v5.airtableusercontent.com)
  const isAirtableUrl = imageName.startsWith('https://v5.airtableusercontent.com');
  
  let imageUrl: string;
  if (isAirtableUrl) {
    // Use Airtable URL directly
    imageUrl = imageName;
  } else {
    // Use local image mapping
    imageUrl = imageMap[imageName] || imageMap['jawar_rotti.jpg']; // fallback to jawar_rotti
  }
  
  // Image URL is ready for display

  return (
    <Card 
      className="group hover:shadow-card transition-all duration-300 border-[rgba(0,77,61,0.08)] bg-card cursor-pointer"
      onClick={() => onClick?.(product)}
    >
      <CardContent className="p-0">
        <div className="relative overflow-hidden rounded-t-lg bg-gradient-hero">
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-48 sm:h-56 object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-brandText group-hover:text-brand transition-colors">
              {product.name}
            </h3>
            {product.description && (
              <p className="text-sm text-muted leading-relaxed">
                {product.description}
              </p>
            )}
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