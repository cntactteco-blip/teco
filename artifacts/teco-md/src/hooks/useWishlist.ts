import { useState, useCallback, useEffect } from "react";

const KEY = "teco_wishlist";

function load(): number[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; }
}

let globalIds: number[] = load();
const listeners = new Set<() => void>();
function notifyWishlist() { listeners.forEach((l) => l()); }

export function useWishlist() {
  const [ids, setIds] = useState<number[]>(() => globalIds);

  useEffect(() => {
    const sync = () => setIds([...globalIds]);
    listeners.add(sync);
    return () => { listeners.delete(sync); };
  }, []);

  const toggle = useCallback((id: number) => {
    globalIds = globalIds.includes(id)
      ? globalIds.filter((x) => x !== id)
      : [...globalIds, id];
    localStorage.setItem(KEY, JSON.stringify(globalIds));
    notifyWishlist();
  }, []);

  const has = useCallback((id: number) => ids.includes(id), [ids]);

  return { ids, toggle, has, count: ids.length };
}
