export const SITE_URL = "https://teco.md";

/** Cloudflare serves directory index pages with a trailing slash. */
export function canonicalPath(input: string): string {
  const url = new URL(input, SITE_URL);
  const pathname = url.pathname.replace(/\/+$/, "") + "/";
  const category = url.searchParams.get("cat");
  return pathname + (pathname === "/produse/" && category && category !== "all"
    ? `?cat=${encodeURIComponent(category)}` : "");
}

export function canonicalUrl(input: string): string {
  return SITE_URL + canonicalPath(input);
}

export function absoluteImage(input: string): string {
  const url = new URL(input, SITE_URL);
  return ["https:", "http:"].includes(url.protocol) ? url.href : `${SITE_URL}/opengraph.jpg`;
}
