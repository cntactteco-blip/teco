import { absoluteImage, canonicalUrl } from "./seo-url.ts";
import { currentProductDescription } from "./product-copy.ts";

export interface ProductSchemaInput {
  id: number;
  slug?: string;
  name: string;
  brand?: string;
  model?: string;
  description: string;
  price: number;
  oldPrice?: number | null;
  imageUrl?: string;
  category?: string;
  inStock: boolean;
}

/** Shared by the initial HTML and the browser. Only publish known catalog facts. */
export function productSchema(p: ProductSchemaInput) {
  const image = p.imageUrl?.trim();
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: currentProductDescription(p.description, p.price).slice(0, 5000),
    sku: `TECO-${p.id}`,
    ...(p.brand?.trim() ? { brand: { "@type": "Brand", name: p.brand.trim() } } : {}),
    ...(p.model?.trim() ? { model: p.model.trim() } : {}),
    ...(p.category ? { category: p.category } : {}),
    ...(image && !image.startsWith("data:") ? { image: [absoluteImage(image)] } : {}),
    offers: {
      "@type": "Offer",
      url: canonicalUrl(`/product/${p.slug || p.id}`),
      price: p.price,
      priceCurrency: "MDL",
      availability: p.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", "@id": "https://teco.md/#business", name: "TECO.md", url: "https://teco.md/" },
    },
  };
}
