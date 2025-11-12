"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface CartContextType {
  cartCount: number;
  updateCartCount: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartCount, setCartCount] = useState(0);
  const { data: session } = useSession();

  const updateCartCount = async () => {
    if (!session?.user?.id) {
      setCartCount(0);
      return;
    }

    try {
      const response = await fetch("/api/cart");
      if (response.ok) {
        const data = await response.json();
        const totalItems = data.cart?.items?.reduce(
          (sum: number, item: any) => sum + item.quantity,
          0
        ) || 0;
        setCartCount(totalItems);
      }
    } catch (error) {
      console.error("Error fetching cart:", error);
      setCartCount(0);
    }
  };

  // Update cart count when session changes
  useEffect(() => {
    updateCartCount();
  }, [session]);

  // Poll for cart updates every 5 seconds
  useEffect(() => {
    if (session?.user?.id) {
      const interval = setInterval(updateCartCount, 5000);
      return () => clearInterval(interval);
    }
  }, [session]);

  return (
    <CartContext.Provider value={{ cartCount, updateCartCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
} 