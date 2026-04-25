import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { api } from './api';
import { ServerCartItem } from './api-types';
import { useAuth } from './auth-context';

export interface CartItem {
  variantId: string;
  productId: string;
  productName: string;
  productSlug: string;
  variantName: string;
  sku: string;
  quantity: number;
  priceNgn: number;
  priceUsd: number;
  currentPriceNgn: number | null;
  currentPriceUsd: number | null;
  priceChanged: boolean;
  unavailable: boolean;
  options: Record<string, string>;
  imageUrl?: string;
}

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  syncing: boolean;
  addItem: (
    item: Omit<
      CartItem,
      'quantity' | 'currentPriceNgn' | 'currentPriceUsd' | 'priceChanged' | 'unavailable'
    >,
    quantity?: number,
  ) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  getSubtotal: (currency: string) => number;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);
const CART_KEY = 'mn_cart';

async function loadGuestCart(): Promise<CartItem[]> {
  try {
    const stored = await AsyncStorage.getItem(CART_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((raw) => {
        const r = raw as Partial<CartItem>;
        return {
          variantId: String(r.variantId ?? ''),
          productId: String(r.productId ?? ''),
          productName: String(r.productName ?? ''),
          productSlug: String(r.productSlug ?? ''),
          variantName: String(r.variantName ?? ''),
          sku: String(r.sku ?? ''),
          quantity: Number(r.quantity ?? 1),
          priceNgn: Number(r.priceNgn ?? 0),
          priceUsd: Number(r.priceUsd ?? 0),
          currentPriceNgn: r.currentPriceNgn ?? null,
          currentPriceUsd: r.currentPriceUsd ?? null,
          priceChanged: Boolean(r.priceChanged ?? false),
          unavailable: Boolean(r.unavailable ?? false),
          options: (r.options ?? {}) as Record<string, string>,
          imageUrl: r.imageUrl,
        };
      })
      .filter((i) => i.variantId);
  } catch {
    return [];
  }
}

async function saveGuestCart(items: CartItem[]) {
  try {
    await AsyncStorage.setItem(CART_KEY, JSON.stringify(items));
  } catch {
    // Storage full or unavailable — degrade silently.
  }
}

async function clearGuestCartStorage() {
  try {
    await AsyncStorage.removeItem(CART_KEY);
  } catch {
    // ignored
  }
}

function fromServer(row: ServerCartItem): CartItem {
  return {
    variantId: row.variantId ?? '',
    productId: row.productId ?? '',
    productName: row.productName,
    productSlug: row.productSlug,
    variantName: row.variantName ?? '',
    sku: row.sku,
    quantity: row.quantity,
    priceNgn: Number(row.priceNgn),
    priceUsd: Number(row.priceUsd),
    currentPriceNgn: row.currentPriceNgn != null ? Number(row.currentPriceNgn) : null,
    currentPriceUsd: row.currentPriceUsd != null ? Number(row.currentPriceUsd) : null,
    priceChanged: Boolean(row.priceChanged),
    unavailable: Boolean(row.unavailable),
    options: row.options ?? {},
    imageUrl: row.imageUrl ?? undefined,
  };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [syncing, setSyncing] = useState(false);

  const mergedForSessionRef = useRef(false);
  const modeLoadedRef = useRef<'guest' | 'auth' | null>(null);

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;

    const loadAuthCart = async () => {
      setSyncing(true);
      try {
        const guest = await loadGuestCart();
        if (guest.length > 0 && !mergedForSessionRef.current) {
          mergedForSessionRef.current = true;
          const payload = guest
            .filter((i) => i.variantId && i.quantity > 0)
            .map((i) => ({ variantId: i.variantId, quantity: i.quantity }));
          if (payload.length > 0) {
            try {
              const merged = await api.mergeCart(payload);
              if (cancelled) return;
              setItems(merged.data.map(fromServer));
              await clearGuestCartStorage();
              modeLoadedRef.current = 'auth';
              return;
            } catch {
              mergedForSessionRef.current = false;
            }
          } else {
            await clearGuestCartStorage();
          }
        }

        const res = await api.getCart();
        if (cancelled) return;
        setItems(res.data.map(fromServer));
        modeLoadedRef.current = 'auth';
      } catch {
        if (cancelled) return;
        setItems([]);
      } finally {
        if (!cancelled) setSyncing(false);
      }
    };

    if (isAuthenticated) {
      void loadAuthCart();
    } else {
      mergedForSessionRef.current = false;
      void loadGuestCart().then((cart) => {
        if (!cancelled) {
          setItems(cart);
          modeLoadedRef.current = 'guest';
        }
      });
    }

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, authLoading]);

  // Persist guest cart on change.
  useEffect(() => {
    if (authLoading || isAuthenticated) return;
    if (modeLoadedRef.current !== 'guest') return;
    if (items.length === 0) {
      void clearGuestCartStorage();
    } else {
      void saveGuestCart(items);
    }
  }, [items, isAuthenticated, authLoading]);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return;
    setSyncing(true);
    try {
      const res = await api.getCart();
      setItems(res.data.map(fromServer));
    } finally {
      setSyncing(false);
    }
  }, [isAuthenticated]);

  const addItem = useCallback<CartContextValue['addItem']>(
    (item, quantity = 1) => {
      setItems((prev) => {
        const existing = prev.find((i) => i.variantId === item.variantId);
        if (existing) {
          return prev.map((i) =>
            i.variantId === item.variantId ? { ...i, quantity: i.quantity + quantity } : i,
          );
        }
        return [
          ...prev,
          {
            ...item,
            quantity,
            currentPriceNgn: null,
            currentPriceUsd: null,
            priceChanged: false,
            unavailable: false,
          },
        ];
      });

      if (isAuthenticated) {
        setSyncing(true);
        api
          .addToCart(item.variantId, quantity)
          .then(() => api.getCart())
          .then((res) => setItems(res.data.map(fromServer)))
          .catch(() =>
            api
              .getCart()
              .then((res) => setItems(res.data.map(fromServer)))
              .catch(() => {}),
          )
          .finally(() => setSyncing(false));
      }
    },
    [isAuthenticated],
  );

  const removeItem = useCallback(
    (variantId: string) => {
      const snapshot = items;
      setItems((prev) => prev.filter((i) => i.variantId !== variantId));
      if (isAuthenticated) {
        setSyncing(true);
        api
          .removeFromCart(variantId)
          .catch(() => setItems(snapshot))
          .finally(() => setSyncing(false));
      }
    },
    [items, isAuthenticated],
  );

  const updateQuantity = useCallback(
    (variantId: string, quantity: number) => {
      const snapshot = items;
      if (quantity <= 0) {
        setItems((prev) => prev.filter((i) => i.variantId !== variantId));
      } else {
        setItems((prev) =>
          prev.map((i) => (i.variantId === variantId ? { ...i, quantity } : i)),
        );
      }
      if (isAuthenticated) {
        setSyncing(true);
        const p =
          quantity <= 0
            ? api.removeFromCart(variantId)
            : api.updateCartQuantity(variantId, quantity);
        p.catch(() => setItems(snapshot)).finally(() => setSyncing(false));
      }
    },
    [items, isAuthenticated],
  );

  const clearCart = useCallback(() => {
    const snapshot = items;
    setItems([]);
    void clearGuestCartStorage();
    if (isAuthenticated) {
      setSyncing(true);
      api
        .clearCart()
        .catch(() => setItems(snapshot))
        .finally(() => setSyncing(false));
    }
  }, [items, isAuthenticated]);

  const getSubtotal = useCallback(
    (currency: string) => {
      return items.reduce((sum, item) => {
        const snapshot = currency === 'USD' ? item.priceUsd : item.priceNgn;
        const current =
          currency === 'USD' ? item.currentPriceUsd : item.currentPriceNgn;
        const unit = current ?? snapshot;
        return sum + unit * item.quantity;
      }, 0);
    },
    [items],
  );

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        syncing,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getSubtotal,
        refresh,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
