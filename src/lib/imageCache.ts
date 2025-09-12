// Import all product images
import flax_seed_chutney_powder from '../assets/products/flax_seed_chutney_powder.jpg';
import peanut_chutney_powder from '../assets/products/peanut_chutney_powder.jpg';
import niger_chutney_powder from '../assets/products/niger_chutney_powder.jpg';
import red_chiili_powder from '../assets/products/red_chiili_powder.jpg';
import turmeric_powder from '../assets/products/turmeric_powder.jpg';
import millets_energy_drink from '../assets/products/millets_energy_drink.jpg';
import millets_rotti from '../assets/products/millets_rotti.jpg';
import jawar_rotti from '../assets/products/jawar_rotti.jpg';
import sajje_rotti from '../assets/products/sajje_rotti.jpg';
import kunda from '../assets/products/kunda.jpg';
import kardantu from '../assets/products/kardantu.jpg';
import supreme_dink_laddu from '../assets/products/supreme_dink_laddu.jpg';
import makhana_peri_peri from '../assets/products/makhana_peri_peri.jpg';
import makhana_cream_onion from '../assets/products/makhana_cream_onion.jpg';
import makhana_tangy_cheese from '../assets/products/makhana_tangy_cheese.jpg';
import millet_biryani from '../assets/products/millet_biryani.jpg';
import millet_bisi_bele_bath from '../assets/products/millet_bisi_bele_bath.jpg';
import millet_dosa from '../assets/products/millet_dosa.jpg';
import millet_idly from '../assets/products/millet_idly.jpg';
import millet_kheer from '../assets/products/millet_kheer.jpg';
import millet_khichdi from '../assets/products/millet_khichdi.jpg';
import millet_upma from '../assets/products/millet_upma.jpg';

// Image caching utility for better performance
class ImageCache {
  private cache = new Map<string, string>();
  private preloadCache = new Set<string>();
  
  // Static image map for Vite to handle properly
  private imageMap: Record<string, string> = {
    'flax_seed_chutney_powder.jpg': flax_seed_chutney_powder,
    'peanut_chutney_powder.jpg': peanut_chutney_powder,
    'niger_chutney_powder.jpg': niger_chutney_powder,
    'red_chiili_powder.jpg': red_chiili_powder,
    'turmeric_powder.jpg': turmeric_powder,
    'millets_energy_drink.jpg': millets_energy_drink,
    'millets_rotti.jpg': millets_rotti,
    'jawar_rotti.jpg': jawar_rotti,
    'sajje_rotti.jpg': sajje_rotti,
    'kunda.jpg': kunda,
    'kardantu.jpg': kardantu,
    'supreme_dink_laddu.jpg': supreme_dink_laddu,
    'makhana_peri_peri.jpg': makhana_peri_peri,
    'makhana_cream_onion.jpg': makhana_cream_onion,
    'makhana_tangy_cheese.jpg': makhana_tangy_cheese,
    'millet_biryani.jpg': millet_biryani,
    'millet_bisi_bele_bath.jpg': millet_bisi_bele_bath,
    'millet_dosa.jpg': millet_dosa,
    'millet_idly.jpg': millet_idly,
    'millet_kheer.jpg': millet_kheer,
    'millet_khichdi.jpg': millet_khichdi,
    'millet_upma.jpg': millet_upma,
  };

  // Get cached image URL or create new one
  getImageUrl(imageName: string): string {
    if (this.cache.has(imageName)) {
      return this.cache.get(imageName)!;
    }

    let imageUrl: string;
    
    // If it's already a full URL (from Airtable), use it directly
    if (imageName.startsWith('http')) {
      imageUrl = imageName;
    } else {
      // Use the static image map for proper Vite handling
      imageUrl = this.imageMap[imageName] || '/placeholder.svg';
    }

    // Cache the URL
    this.cache.set(imageName, imageUrl);
    
    // Preload the image for better performance (used on homepage)
    this.preloadImage(imageUrl);
    
    return imageUrl;
  }

  // Smart image format selection
  private getOptimizedImageName(imageName: string): string {
    // For now, just return the original image name since we're not using WebP
    return imageName;
  }

  // Preload image to improve loading performance
  private preloadImage(url: string): void {
    if (this.preloadCache.has(url)) {
      return;
    }

    this.preloadCache.add(url);
    
    const img = new Image();
    img.onload = () => {
      // Image loaded successfully
    };
    img.onerror = () => {
      // Image failed to load, remove from preload cache
      this.preloadCache.delete(url);
    };
    img.src = url;
  }

  // Preload multiple images
  preloadImages(imageNames: string[]): void {
    imageNames.forEach(name => {
      this.getImageUrl(name);
    });
  }

  // Clear cache (useful for development)
  clearCache(): void {
    this.cache.clear();
    this.preloadCache.clear();
  }

  // Get cache stats
  getCacheStats(): { cached: number; preloaded: number } {
    return {
      cached: this.cache.size,
      preloaded: this.preloadCache.size
    };
  }
}

// Export singleton instance
export const imageCache = new ImageCache();

// Export the class for testing
export { ImageCache };
