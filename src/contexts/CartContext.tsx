import React, { createContext, useContext, useReducer, ReactNode } from 'react';

// Types
export interface CartItem {
  productId: string;
  productName: string;
  variantName: string;
  quantity: number;
  price?: string;
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
const initialState: CartState = {
  items: [],
  isOpen: false,
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
  const [state, dispatch] = useReducer(cartReducer, initialState);

  const addToCart = (product: any, variant: any, quantity: number = 1) => {
    const cartItem: CartItem = {
      productId: product.id,
      productName: product.name,
      variantName: variant.name,
      quantity,
      price: variant.price,
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
      const price = parseFloat(item.price?.replace('$', '') || '0');
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
