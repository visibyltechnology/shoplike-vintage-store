import { createContext, useContext, useState, useEffect, useCallback } from "react";

interface WishlistItem {
  id: number;
  name: string;
  price: number;
  comparePrice?: number | null;
  images?: string[] | null;
  section: string;
  categoryName?: string | null;
  isOnSale: boolean;
  isFeatured: boolean;
  inStock: boolean;
}

interface WishlistContextType {
  items: WishlistItem[];
  addItem: (product: WishlistItem) => void;
  removeItem: (id: number) => void;
  toggleItem: (product: WishlistItem) => void;
  isInWishlist: (id: number) => boolean;
  count: number;
  clear: () => void;
}

const WishlistContext = createContext<WishlistContextType | null>(null);
const STORAGE_KEY = "sv_wishlist";

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((product: WishlistItem) => {
    setItems((prev) => {
      if (prev.find((i) => i.id === product.id)) return prev;
      return [...prev, product];
    });
  }, []);

  const removeItem = useCallback((id: number) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const toggleItem = useCallback((product: WishlistItem) => {
    setItems((prev) => {
      const exists = prev.find((i) => i.id === product.id);
      if (exists) return prev.filter((i) => i.id !== product.id);
      return [...prev, product];
    });
  }, []);

  const isInWishlist = useCallback((id: number) => items.some((i) => i.id === id), [items]);

  return (
    <WishlistContext.Provider value={{ items, addItem, removeItem, toggleItem, isInWishlist, count: items.length, clear: () => setItems([]) }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used inside WishlistProvider");
  return ctx;
}
