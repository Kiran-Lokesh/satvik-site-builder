import React, { createContext, useContext, useReducer, ReactNode } from 'react';

// Types
export interface CartItem {
  productId: string;
  productName: string;
  variantId?: string;
  variantName: string;
  quantity: number;
  priceLabel?: string;
  unitPrice: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
}

type CartAction =
  | { type: 'ADD_TO_CART'; payload: CartItem }
  | { type: 'REMOVE_FROM_CART'; payload: { productId: string; variantName: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: string; variantName: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'TOGGLE_CART' }
  | { type: 'OPEN_CART' }
  | { type: 'CLOSE_CART' };

// Initial state
const STORAGE_KEY = 'satvik-cart-state';

const initialState: CartState = {
  items: [],
  isOpen: false,
};

const parsePriceLabel = (value?: string): number => {
  if (!value) return 0;
  const sanitized = value.replace(/[^0-9.]/g, '');
  return Number.parseFloat(sanitized || '0');
};

type StoredCartItem = Partial<CartItem> & {
  price?: string;
};

const loadInitialState = (): CartState => {
  if (typeof window === 'undefined') {
    return initialState;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return initialState;
    }
    const parsed = JSON.parse(raw) as { items?: StoredCartItem[] };
    const storedItems = Array.isArray(parsed.items) ? parsed.items : [];
    return {
      items: storedItems
        .map((item) => {
          const productId = item.productId ?? '';
          const variantName = item.variantName ?? 'Standard';
          const quantity = typeof item.quantity === 'number' ? item.quantity : Number(item.quantity ?? 0);
          const priceLabel = item.priceLabel ?? item.price ?? '$0.00';
          const unitPrice = Number.isFinite(item.unitPrice)
            ? Number(item.unitPrice)
            : parsePriceLabel(priceLabel);

          return {
            productId,
            productName: item.productName ?? 'Product',
            variantId: item.variantId,
            variantName,
            quantity: Number.isFinite(quantity) ? quantity : 0,
            priceLabel,
            unitPrice,
          } as CartItem;
        })
        .filter((item) => item.quantity > 0 && item.productId),
      isOpen: false,
    };
  } catch (error) {
    console.warn('Failed to restore cart from storage', error);
    return initialState;
  }
};

// Reducer
const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_TO_CART': {
      const existingItem = state.items.find(
        item => item.productId === action.payload.productId && 
                item.variantName === action.payload.variantName
      );

      if (existingItem) {
        return {
          ...state,
          items: state.items.map(item =>
            item.productId === action.payload.productId && 
            item.variantName === action.payload.variantName
              ? { ...item, quantity: item.quantity + action.payload.quantity }
              : item
          ),
        };
      }

      return {
        ...state,
        items: [...state.items, action.payload],
      };
    }

    case 'REMOVE_FROM_CART':
      return {
        ...state,
        items: state.items.filter(item => 
          !(item.productId === action.payload.productId && item.variantName === action.payload.variantName)
        ),
      };

    case 'UPDATE_QUANTITY':
      return {
        ...state,
        items: state.items.map(item =>
          item.productId === action.payload.productId && item.variantName === action.payload.variantName
            ? { ...item, quantity: action.payload.quantity }
            : item
        ).filter(item => item.quantity > 0), // Remove items with 0 quantity
      };

    case 'CLEAR_CART':
      return {
        ...state,
        items: [],
      };

    case 'TOGGLE_CART':
      return {
        ...state,
        isOpen: !state.isOpen,
      };

    case 'OPEN_CART':
      return {
        ...state,
        isOpen: true,
      };

    case 'CLOSE_CART':
      return {
        ...state,
        isOpen: false,
      };

    default:
      return state;
  }
};

// Context
interface CartContextType {
  state: CartState;
  addToCart: (product: any, variant: any, quantity?: number) => void;
  removeFromCart: (productId: string, variantName: string) => void;
  updateQuantity: (productId: string, variantName: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  getTotalItems: () => number;
  getSubtotal: () => number;
  getGSTAmount: () => number;
  getTotalPrice: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Provider component
export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState, loadInitialState);

  const addToCart = (product: any, variant: any, quantity: number = 1) => {
    const priceLabel =
      (variant?.price && variant.price.trim() !== '' ? variant.price : undefined) ??
      (product?.price && product.price.trim() !== '' ? product.price : undefined) ??
      '$0.00';

    const unitPrice =
      typeof variant?.unitPrice === 'number'
        ? variant.unitPrice
        : typeof variant?.price === 'number'
          ? variant.price
          : parsePriceLabel(priceLabel);

    const cartItem: CartItem = {
      productId: product.id,
      productName: product.name,
      variantId: variant?.id || undefined,
      variantName: variant.name,
      quantity,
      priceLabel,
      unitPrice,
    };
    dispatch({ type: 'ADD_TO_CART', payload: cartItem });
  };

  const removeFromCart = (productId: string, variantName: string) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: { productId, variantName } });
  };

  const updateQuantity = (productId: string, variantName: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, variantName, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const toggleCart = () => {
    dispatch({ type: 'TOGGLE_CART' });
  };

  const openCart = () => {
    dispatch({ type: 'OPEN_CART' });
  };

  const closeCart = () => {
    dispatch({ type: 'CLOSE_CART' });
  };

  const getTotalItems = () => {
    return state.items.reduce((total, item) => total + item.quantity, 0);
  };

  const getSubtotal = () => {
    return state.items.reduce((total, item) => {
      const price = Number.isFinite(item.unitPrice) ? item.unitPrice : parsePriceLabel(item.priceLabel);
      return total + (price * item.quantity);
    }, 0);
  };

  const getGSTAmount = () => {
    return 0; // No GST charged to customers
  };

  const getTotalPrice = () => {
    return getSubtotal(); // Total is just the subtotal (no GST)
  };

  const value: CartContextType = {
    state,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    toggleCart,
    openCart,
    closeCart,
    getTotalItems,
    getSubtotal,
    getGSTAmount,
    getTotalPrice,
  };

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      const payload = JSON.stringify({ items: state.items });
      window.localStorage.setItem(STORAGE_KEY, payload);
    } catch (error) {
      console.warn('Failed to persist cart to storage', error);
    }
  }, [state.items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

// Hook to use cart context
export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
