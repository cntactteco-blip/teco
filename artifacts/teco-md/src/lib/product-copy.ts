/** Keep a single product-price claim in the short description in sync with the actual offer. */
export function currentProductDescription(description: unknown, price: unknown): string {
  const copy = String(description ?? "");
  const current = Number(price);
  if (!Number.isFinite(current) || current <= 0) return copy;

  const amount = /\b(\d{1,3}(?:[ .,\u00a0]\d{3})+|\d{3,7})\s*(MDL|lei)\b/gi;
  const matches = [...copy.matchAll(amount)];
  // Several monetary amounts may describe bundle components or a real comparison.
  if (matches.length !== 1) return copy;
  const match = matches[0];
  const at = match.index;
  const before = copy.slice(Math.max(0, at - 80), at);
  if (!/preț(?:ul|uri)?|pret(?:ul|uri)?/i.test(before) ||
      /preț(?:ul)?\s+(?:vechi|inițial)|pret(?:ul)?\s+(?:vechi|initial)|redus\s+de\s+la|în\s+loc\s+de/i.test(before)) return copy;

  const stated = Number(match[1].replace(/\D/g, ""));
  if (!stated || stated === current) return copy;
  const formatted = new Intl.NumberFormat("ro-MD").format(current);
  return copy.slice(0, at) + match[0].replace(match[1], formatted) + copy.slice(at + match[0].length);
}

/** Keep product snippets readable when an imported catalog name is very long. */
export function seoSnippet(value: unknown, maxLength: number): string {
  const clean = String(value ?? "").replace(/\s+/g, " ").trim();
  if (clean.length <= maxLength) return clean;
  const prefix = clean.slice(0, maxLength - 1);
  const boundary = prefix.lastIndexOf(" ");
  return `${boundary > maxLength * 0.65 ? prefix.slice(0, boundary) : prefix.trimEnd()}…`;
}

export function productSeoTitle(name: unknown, brand?: unknown, model?: unknown): string {
  const clean = (value: unknown) => String(value ?? "").replace(/\s+/g, " ").trim();
  const label = clean(name);
  const maker = clean(brand);
  const code = clean(model);
  if (!code) return `${seoSnippet(maker && !label.toLowerCase().includes(maker.toLowerCase()) ? `${label} ${maker}` : label, 53)} | TECO.md`;
  // Keep the exact model intact; a character limit must not erase product identity.
  const identity = [maker && !code.toLowerCase().includes(maker.toLowerCase()) ? maker : "", code].filter(Boolean).join(" ");
  let descriptor = label;
  for (const part of [code, maker].filter(Boolean)) {
    const at = descriptor.toLowerCase().indexOf(part.toLowerCase());
    if (at >= 0) descriptor = descriptor.slice(0, at) + descriptor.slice(at + part.length);
  }
  descriptor = descriptor.replace(/^[\s,|/–—-]+|[\s,|/–—-]+$/g, "").replace(/\s+/g, " ").replace(/\s+([,;])/g, "$1").trim();
  const budget = 53 - identity.length - 1;
  return `${[budget >= 8 && descriptor ? seoSnippet(descriptor, budget) : "", identity].filter(Boolean).join(" ")} | TECO.md`;
}

export function productSeoDescription(description: unknown, name: unknown, price: unknown): string {
  const copy = currentProductDescription(description, price).trim() ||
    `${name}. Preț: ${new Intl.NumberFormat("ro-MD").format(Number(price))} MDL. Vezi detaliile și disponibilitatea la TECO.md.`;
  return seoSnippet(copy, 155);
}
