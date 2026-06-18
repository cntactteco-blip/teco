import { useSyncExternalStore } from "react";

export interface CartItem {
  id: number;
  name: string;
  price: number;
  qty: number;
  icon: string;
  imageUrl?: string;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  count: number;
  total: number;
  addItem: (product: { id: number; name: string; price: number; icon?: string; imageUrl?: string }) => void;
  removeItem: (id: number) => void;
  updateQty: (id: number, qty: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
}

type Listener = () => void;

function createStore() {
  let state: CartState = {
    items: [],
    isOpen: false,
    count: 0,
    total: 0,
    addItem: (product) => {
      const existing = state.items.find((i) => i.id === product.id);
      let newItems: CartItem[];
      if (existing) {
        newItems = state.items.map((i) =>
          i.id === product.id ? { ...i, qty: i.qty + 1 } : i
        );
      } else {
        newItems = [
          ...state.items,
          { ...product, icon: product.icon || "Camera", qty: 1, imageUrl: product.imageUrl || "" },
        ];
      }
      state = calculateState(newItems, state.isOpen);
      listeners.forEach((l) => l());
    },
    removeItem: (id) => {
      const newItems = state.items.filter((i) => i.id !== id);
      state = calculateState(newItems, state.isOpen);
      listeners.forEach((l) => l());
    },
    updateQty: (id, qty) => {
      const newItems =
        qty <= 0
          ? state.items.filter((i) => i.id !== id)
          : state.items.map((i) => (i.id === id ? { ...i, qty } : i));
      state = calculateState(newItems, state.isOpen);
      listeners.forEach((l) => l());
    },
    clearCart: () => {
      state = calculateState([], false);
      listeners.forEach((l) => l());
    },
    openCart: () => {
      state = { ...state, isOpen: true };
      listeners.forEach((l) => l());
    },
    closeCart: () => {
      state = { ...state, isOpen: false };
      listeners.forEach((l) => l());
    },
  };

  function calculateState(items: CartItem[], isOpen: boolean): CartState {
    const count = items.reduce((sum, item) => sum + item.qty, 0);
    const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);
    return { ...state, items, count, total, isOpen };
  }

  const listeners = new Set<Listener>();

  return {
    subscribe: (listener: Listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot: () => state,
  };
}

const store = createStore();

export function useCart<T>(selector: (state: CartState) => T): T {
  return useSyncExternalStore(store.subscribe, () => selector(store.getSnapshot()));
}
