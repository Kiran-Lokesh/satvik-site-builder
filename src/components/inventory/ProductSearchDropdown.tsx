import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';
import { commerceApiClient } from '@/lib/commerceApiClient';
import { useDebounce } from '@/hooks/useDebounce';

export interface Product {
  id: string;
  name: string;
}

interface ProductSearchDropdownProps {
  onSelect: (product: Product) => void;
  selectedProductId?: string;
  className?: string;
}

export const ProductSearchDropdown: React.FC<ProductSearchDropdownProps> = ({
  onSelect,
  selectedProductId,
  className,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    if (debouncedSearchTerm.trim().length > 0) {
      searchProducts(debouncedSearchTerm);
    } else {
      setProducts([]);
    }
  }, [debouncedSearchTerm]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const searchProducts = async (term: string) => {
    setLoading(true);
    try {
      const response = await commerceApiClient.fetchProducts(0, 50);
      const filtered = response.data
        .filter((p) => p.name.toLowerCase().includes(term.toLowerCase()))
        .slice(0, 10)
        .map((p) => ({ id: p.id, name: p.name }));
      setProducts(filtered);
    } catch (error) {
      console.error('Failed to search products', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (product: Product) => {
    onSelect(product);
    setSearchTerm(product.name);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="pl-10"
        />
      </div>

      {isOpen && (searchTerm.trim().length > 0 || products.length > 0) && (
        <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : products.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No products found
            </div>
          ) : (
            <div className="p-1">
              {products.map((product) => (
                <div
                  key={product.id}
                  onClick={() => handleSelect(product)}
                  className="p-2 rounded hover:bg-muted/50 cursor-pointer text-sm"
                >
                  {product.name}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

