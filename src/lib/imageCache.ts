// Image caching utility for better performance
class ImageCache {
  private cache = new Map<string, string>();
  private preloadCache = new Set<string>();

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
      // Smart format selection: prefer WebP for local assets, fallback to JPG
      const optimizedImageName = this.getOptimizedImageName(imageName);
      
      try {
        // Try to load the optimized image from assets directory
        imageUrl = new URL(`../assets/products/${optimizedImageName}`, import.meta.url).href;
      } catch {
        // Fallback if optimized image doesn't exist
        imageUrl = '/placeholder.svg';
      }
    }

    // Cache the URL
    this.cache.set(imageName, imageUrl);
    
    // Preload the image for better performance
    this.preloadImage(imageUrl);
    
    return imageUrl;
  }

  // Smart image format selection
  private getOptimizedImageName(imageName: string): string {
    // If it's already WebP, use it
    if (imageName.endsWith('.webp')) {
      return imageName;
    }
    
    // If it's JPG/JPEG, try WebP first, fallback to original
    if (imageName.endsWith('.jpg') || imageName.endsWith('.jpeg')) {
      const webpName = imageName.replace(/\.(jpg|jpeg)$/i, '.webp');
      // Check if WebP version exists (this is handled by the try/catch in getImageUrl)
      return webpName;
    }
    
    // For other formats, return as-is
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
