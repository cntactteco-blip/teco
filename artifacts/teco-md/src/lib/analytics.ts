// ─── Analytics — gated by cookie consent (GDPR / Legea 133/2011 Moldova) ────
// Niciun pixel nu se declanșează fără consimțământul explicit al utilizatorului.
import { isAnalyticsAllowed, isMarketingAllowed } from "@/lib/consent";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

function gtag(...args: unknown[]) {
  if (!isAnalyticsAllowed()) return;
  if (typeof window.gtag === "function") window.gtag(...args);
}

function fbq(event: string, name: string, params?: Record<string, unknown>) {
  if (!isMarketingAllowed()) return;
  if (typeof window.fbq === "function") window.fbq(event, name, params);
}

export function trackAddToCart(item: { id: number; name: string; price: number; qty: number; category?: string }) {
  gtag("event", "add_to_cart", {
    currency: "MDL",
    value: item.price * item.qty,
    items: [{ item_id: String(item.id), item_name: item.name, price: item.price, quantity: item.qty, item_category: item.category ?? "" }],
  });
  fbq("track", "AddToCart", { content_ids: [String(item.id)], content_name: item.name, value: item.price * item.qty, currency: "MDL" });
}

export function trackViewProduct(item: { id: number; name: string; price: number; category?: string }) {
  gtag("event", "view_item", {
    currency: "MDL",
    value: item.price,
    items: [{ item_id: String(item.id), item_name: item.name, price: item.price, item_category: item.category ?? "" }],
  });
  fbq("track", "ViewContent", { content_ids: [String(item.id)], content_name: item.name, value: item.price, currency: "MDL" });
}

export function trackBeginCheckout(total: number, items: Array<{ id: number; name: string; price: number; qty: number }>) {
  gtag("event", "begin_checkout", {
    currency: "MDL",
    value: total,
    items: items.map((i) => ({ item_id: String(i.id), item_name: i.name, price: i.price, quantity: i.qty })),
  });
  fbq("track", "InitiateCheckout", { value: total, currency: "MDL", num_items: items.length });
}

export function trackPurchase(orderId: string, total: number, items: Array<{ id: number; name: string; price: number; qty: number }>) {
  gtag("event", "purchase", {
    transaction_id: orderId,
    currency: "MDL",
    value: total,
    items: items.map((i) => ({ item_id: String(i.id), item_name: i.name, price: i.price, quantity: i.qty })),
  });
  fbq("track", "Purchase", { value: total, currency: "MDL" });
}

export function trackLead(source: string) {
  gtag("event", "generate_lead", { event_category: "lead", event_label: source });
  fbq("track", "Lead", { content_name: source });
}

export function trackSearch(query: string) {
  gtag("event", "search", { search_term: query });
}
