"use client";
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

export interface CartItem {
  id:          string;
  name:        string;
  price:       number;
  category:    string;
  imageUrl?:   string;
  vendorName?: string;
  quantity:    number;
}

interface CartCtx {
  items:      CartItem[];
  count:      number;
  total:      number;
  addItem:    (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: string) => void;
  updateQty:  (id: string, qty: number) => void;
  clearCart:  () => void;
  isInCart:   (id: string) => boolean;
}

const CartContext = createContext<CartCtx>({
  items: [], count: 0, total: 0,
  addItem: () => {}, removeItem: () => {}, updateQty: () => {},
  clearCart: () => {}, isInCart: () => false,
});

const CART_KEY = "kasifix_cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  // Hydrate from localStorage once on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, []);

  // Persist on every change
  useEffect(() => {
    try { localStorage.setItem(CART_KEY, JSON.stringify(items)); } catch {}
  }, [items]);

  const addItem = useCallback((item: Omit<CartItem, "quantity">) => {
    setItems(prev => {
      const found = prev.find(i => i.id === item.id);
      if (found) return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...item, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const updateQty = useCallback((id: string, qty: number) => {
    if (qty < 1) { removeItem(id); return; }
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: qty } : i));
  }, [removeItem]);

  const clearCart = useCallback(() => setItems([]), []);

  const isInCart = useCallback((id: string) => items.some(i => i.id === id), [items]);

  const count = items.reduce((s, i) => s + i.quantity, 0);
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, count, total, addItem, removeItem, updateQty, clearCart, isInCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
