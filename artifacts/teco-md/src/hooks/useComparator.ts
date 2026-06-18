import { useState, useCallback, useEffect } from "react";
import type { StoreProduct } from "@/lib/store";

const MAX = 3;
let globalItems: StoreProduct[] = [];
const listeners = new Set<() => void>();
function notifyComp() { listeners.forEach((l) => l()); }

export function useComparator() {
  const [items, setItems] = useState<StoreProduct[]>(() => globalItems);

  useEffect(() => {
    const sync = () => setItems([...globalItems]);
    listeners.add(sync);
    return () => { listeners.delete(sync); };
  }, []);

  const add = useCallback((p: StoreProduct) => {
    if (globalItems.find((x) => x.id === p.id)) return;
    if (globalItems.length >= MAX) globalItems = globalItems.slice(1);
    globalItems = [...globalItems, p];
    notifyComp();
  }, []);

  const remove = useCallback((id: number) => {
    globalItems = globalItems.filter((x) => x.id !== id);
    notifyComp();
  }, []);

  const toggle = useCallback((p: StoreProduct) => {
    if (globalItems.find((x) => x.id === p.id)) {
      globalItems = globalItems.filter((x) => x.id !== p.id);
    } else {
      if (globalItems.length >= MAX) globalItems = globalItems.slice(1);
      globalItems = [...globalItems, p];
    }
    notifyComp();
  }, []);

  const clear = useCallback(() => {
    globalItems = [];
    notifyComp();
  }, []);

  const has = useCallback((id: number) => items.some((x) => x.id === id), [items]);

  return { items, add, remove, toggle, clear, has, count: items.length };
}
