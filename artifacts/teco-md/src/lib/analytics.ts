// ─── Analytics — gated by cookie consent (GDPR / Legea 133/2011 Moldova) ────
// Niciun pixel nu se declanșează fără consimțământul explicit al utilizatorului.
import { isAnalyticsAllowed, isMarketingAllowed } from "@/lib/consent";

const GA_MEASUREMENT_ID = "G-C473N7E2ZJ";
const META_PIXEL_ID = "833519011841481";
let gaConfigured = false;
let metaConfigured = false;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
    _fbq?: (...args: unknown[]) => void;
  }
}

function ensureGoogleAnalytics() {
  if (!isAnalyticsAllowed()) return;
  window.dataLayer ??= [];
  window.gtag ??= (...args: unknown[]) => window.dataLayer?.push(args);
  if (!gaConfigured) {
    window.gtag("js", new Date());
    window.gtag("config", GA_MEASUREMENT_ID, { send_page_view: false });
    gaConfigured = true;
  }
  if (!document.querySelector('script[data-teco-analytics="google"]')) {
    const script = document.createElement("script");
    script.async = true;
    script.dataset.tecoAnalytics = "google";
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);
  }
}

function ensureMetaPixel() {
  if (!isMarketingAllowed()) return;
  if (!window.fbq) {
    type PixelFunction = ((...args: unknown[]) => void) & {
      callMethod?: (...args: unknown[]) => void;
      queue: unknown[][];
      push: (...args: unknown[]) => void;
      loaded: boolean;
      version: string;
    };
    const pixel = ((...args: unknown[]) => {
      if (pixel.callMethod) pixel.callMethod(...args);
      else pixel.queue.push(args);
    }) as PixelFunction;
    Object.assign(pixel, { queue: [], push: pixel, loaded: true, version: "2.0" });
    window.fbq = pixel;
    window._fbq = pixel;
    const script = document.createElement("script");
    script.async = true;
    script.dataset.tecoAnalytics = "meta";
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(script);
  }
  if (!metaConfigured) {
    window.fbq("init", META_PIXEL_ID);
    metaConfigured = true;
  }
}

/** Load analytics and marketing tags only after matching consent is granted. */
export function initializeAnalytics() {
  ensureGoogleAnalytics();
  ensureMetaPixel();
}

export function trackPageView(path: string, title: string) {
  if (path === "/admin" || path.startsWith("/admin/")) return;
  if (isAnalyticsAllowed()) {
    ensureGoogleAnalytics();
    gtag("event", "page_view", {
      page_location: window.location.href,
      page_path: path,
      page_title: title,
    });
  }
  if (isMarketingAllowed()) {
    ensureMetaPixel();
    fbq("track", "PageView");
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
