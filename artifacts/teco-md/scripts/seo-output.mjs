export function escapeXml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

export function makeSitemap(routes) {
  const urls = [...new Set(routes)].sort().map(route => `  <url><loc>${escapeXml(`https://teco.md${route}`)}</loc></url>`);
  // Omit lastmod when no reliable content modification date is available.
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
}

export function isIndexableHead(head) {
  return !/<meta\b(?=[^>]*\bname=["']robots["'])(?=[^>]*\bcontent=["'][^"']*\bnoindex\b)[^>]*>/i.test(head);
}

export function cleanTemplate(html) {
  return html
    .replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, "")
    .replace(/<meta\b[^>]*(?:name|property)=["'](?:description|keywords|robots|author|og:[^"']*|twitter:[^"']*)["'][^>]*>/gi, "")
    .replace(/<link\b[^>]*rel=["'](?:canonical|alternate)["'][^>]*>/gi, "")
    .replace(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi, "");
}

export function documentHtml(template, { head, body }) {
  if (!template.includes("<!--app-html-->")) throw new Error("Missing prerender marker");
  const managedHead = head.replace(/<(title|meta|link|script)\b/g, '<$1 data-teco-prerender=""');
  return cleanTemplate(template).replace("</head>", `${managedHead}\n</head>`).replace("<!--app-html-->", body);
}

/** Exact migrations only. Unrelated retired pages must remain 404. */
export function legacyRedirects(products) {
  const aliases = {
    "/contacts": "/contact/", "/ru/contacts": "/contact/",
    "/montaj-camere-supraveghere": "/montare-camere-supraveghere/",
    "/sisteme-supraveghere": "/camere-supraveghere-moldova/",
    "/cameras": "/camere-supraveghere-moldova/", "/camere": "/camere-supraveghere-moldova/",
    "/camere-supraveghere": "/camere-supraveghere-moldova/",
    "/camere-exterior": "/camere-supraveghere-exterior/",
    "/camere-interior": "/produse/?cat=wifi", "/nvr": "/produse/?cat=nvr",
    "/seturi-supraveghere": "/seturi-camere-supraveghere/",
    "/set-de-supraveghere-video": "/seturi-camere-supraveghere/",
    "/kituri": "/seturi-camere-supraveghere/", "/seturi": "/seturi-camere-supraveghere/",
    "/alarme": "/produse/?cat=alarme",
    "/delivery-and-payment": "/livrare/",
    "/repar-camere-care-nu-nregistreaza-dvr-nvr-hdd-setari-alimentare": "/reparatii-camere-supraveghere/",
    "/repar-camere-de-supraveghere-n-chiinau-i-suburbii-rapid-sigur-i-la-pre-corect": "/reparatii-camere-supraveghere/",
    "/semne-ca-avei-nevoie-de-reparaia-camerelor-de-supraveghere-i-cum-va-putem-ajuta": "/reparatii-camere-supraveghere/",
  };
  for (const [source, destination] of Object.entries(aliases)) {
    if (!source.startsWith("/ru/")) aliases[`/ru${source}`] = destination;
  }
  for (const product of products) {
    if (!product.slug) continue;
    const target = `/product/${encodeURIComponent(product.slug)}/`;
    aliases[`/product/${product.id}`] = target;
    // An exact slug match avoids redirecting one product to an unrelated item.
    aliases[`/${product.slug}`] ??= target;
    aliases[`/ru/${product.slug}`] ??= target;
  }
  return aliases;
}
