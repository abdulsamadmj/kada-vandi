import React, { createContext, useContext, useEffect, useReducer } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product } from '../types/database';

interface CartItem extends Product {
  quantity: number;
}

interface CartState {
  items: { [key: string]: CartItem };
  vendorId: string | null;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: { product: Product; quantity: number } }
  | { type: 'REMOVE_ITEM'; payload: { productId: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_VENDOR'; payload: { vendorId: string } }
  | { type: 'LOAD_CART'; payload: CartState };

interface CartContextType {
  state: CartState;
  addItem: (product: Product, quantity: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  setCartVendor: (vendorId: string) => void;
  getTotalAmount: () => number;
  getItemCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const initialState: CartState = {
  items: {},
  vendorId: null,
};

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { product, quantity } = action.payload;
      // Only allow adding items from the same vendor
      if (state.vendorId && state.vendorId !== product.vendor_id) {
        throw new Error('Cannot add items from different vendors');
      }
      return {
        ...state,
        vendorId: state.vendorId || product.vendor_id,
        items: {
          ...state.items,
          [product.id]: {
            ...product,
            quantity: (state.items[product.id]?.quantity || 0) + quantity,
          },
        },
      };
    }
    case 'REMOVE_ITEM': {
      const { [action.payload.productId]: removed, ...remainingItems } = state.items;
      const newState = {
        ...state,
        items: remainingItems,
      };
      // If cart is empty, clear vendor
      if (Object.keys(remainingItems).length === 0) {
        newState.vendorId = null;
      }
      return newState;
    }
    case 'UPDATE_QUANTITY': {
      const { productId, quantity } = action.payload;
      if (quantity <= 0) {
        const { [productId]: removed, ...remainingItems } = state.items;
        const newState = {
          ...state,
          items: remainingItems,
        };
        if (Object.keys(remainingItems).length === 0) {
          newState.vendorId = null;
        }
        return newState;
      }
      return {
        ...state,
        items: {
          ...state.items,
          [productId]: {
            ...state.items[productId],
            quantity,
          },
        },
      };
    }
    case 'CLEAR_CART':
      return initialState;
    case 'SET_VENDOR':
      if (state.vendorId && state.vendorId !== action.payload.vendorId) {
        // If changing vendors, clear the cart
        return {
          items: {},
          vendorId: action.payload.vendorId,
        };
      }
      return {
        ...state,
        vendorId: action.payload.vendorId,
      };
    case 'LOAD_CART':
      return action.payload;
    default:
      return state;
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Load cart from storage on mount
  useEffect(() => {
    const loadCart = async () => {
      try {
        const savedCart = await AsyncStorage.getItem('cart');
        if (savedCart) {
          dispatch({ type: 'LOAD_CART', payload: JSON.parse(savedCart) });
        }
      } catch (error) {
        console.error('Error loading cart:', error);
      }
    };
    loadCart();
  }, []);

  // Save cart to storage on changes
  useEffect(() => {
    const saveCart = async () => {
      try {
        await AsyncStorage.setItem('cart', JSON.stringify(state));
      } catch (error) {
        console.error('Error saving cart:', error);
      }
    };
    saveCart();
  }, [state]);

  const addItem = (product: Product, quantity: number) => {
    dispatch({ type: 'ADD_ITEM', payload: { product, quantity } });
  };

  const removeItem = (productId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { productId } });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const setCartVendor = (vendorId: string) => {
    dispatch({ type: 'SET_VENDOR', payload: { vendorId } });
  };

  const getTotalAmount = () => {
    return Object.values(state.items).reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  };

  const getItemCount = () => {
    return Object.values(state.items).reduce(
      (total, item) => total + item.quantity,
      0
    );
  };

  return (
    <CartContext.Provider
      value={{
        state,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        setCartVendor,
        getTotalAmount,
        getItemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
} 