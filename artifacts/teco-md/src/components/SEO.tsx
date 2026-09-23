import { Helmet } from "react-helmet-async";
import { absoluteImage, canonicalUrl } from "@/lib/seo-url";

/* ─────────────────────────────────────────────────────────────
   SEO 2026–2027  |  Teco.md
   ───────────────────────────────────────────────────────────── */

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogType?: string;
  ogImage?: string;
  canonical?: string;
  noIndex?: boolean;
  lang?: "ro" | "ru";
  jsonLd?: Record<string, unknown>[];
}

const BASE_URL = "https://teco.md";

const DEFAULT_META = {
  ro: {
    title: "Teco.md — Montare și Instalare Sisteme de Securitate Moldova | Camere de Supraveghere",
    description: "Camere de supraveghere, seturi video, NVR-uri și alarme în Moldova. Consultanță, montaj și reparații. Compară echipamentele și solicită o ofertă în MDL.",
    keywords: "montare instalare sisteme securitate Moldova, camere supraveghere Chisinau, seturi supraveghere video complete, instalare camere exterior, NVR DVR Moldova, sisteme alarma, reparatii camere supraveghere, teco.md",
  },
  ru: {
    title: "Teco.md — Установка и Монтаж Систем Безопасности Молдова | Камеры Видеонаблюдения",
    description: "Камеры видеонаблюдения, комплекты, видеорегистраторы и сигнализации в Молдове. Подбор оборудования, монтаж и ремонт. Запросите предложение в MDL.",
    keywords: "установка монтаж системы безопасности Молдова, камеры видеонаблюдения Кишинев, комплекты видеонаблюдения, установка уличных камер, NVR DVR Молдова, системы сигнализации, ремонт камер, teco.md",
  },
};

export function SEO({
  title,
  description,
  keywords,
  ogType = "website",
  ogImage = "/opengraph.jpg",
  canonical,
  noIndex = false,
  lang = "ro",
  jsonLd,
}: SEOProps) {
  const meta = DEFAULT_META[lang];
  const finalTitle = title || meta.title;
  const finalDesc = description || meta.description;
  const finalKeywords = keywords || meta.keywords;
  const finalUrl = canonicalUrl(canonical || "/");
  const imageUrl = absoluteImage(ogImage);

  return (
    <Helmet>
      {/* Primary */}
      <html lang={lang} />
      <title>{finalTitle}</title>
      <meta name="description" content={finalDesc} />
      <meta name="keywords" content={finalKeywords} />
      {!noIndex && <link rel="canonical" href={finalUrl} />}
      {/* Separate language URLs are required before adding hreflang. */}
      <meta name="robots" content={noIndex ? "noindex, follow" : "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"} />
      <meta name="author" content="Teco.md" />
      <meta name="publisher" content="Teco.md" />
      <meta name="revisit-after" content="7 days" />
      <meta name="rating" content="general" />
      <meta name="distribution" content="global" />
      <meta name="language" content={lang === "ro" ? "Romanian" : "Russian"} />
      <meta name="geo.region" content="MD" />
      <meta name="geo.placename" content="Chișinău, Moldova" />
      <meta name="geo.position" content="47.0105;28.8638" />
      <meta name="ICBM" content="47.0105, 28.8638" />
      <meta name="theme-color" content="#FF4F00" />
      <meta name="msapplication-TileColor" content="#FF4F00" />
      <meta name="msapplication-navbutton-color" content="#FF4F00" />
      <meta name="apple-mobile-web-app-status-bar-style" content="#FF4F00" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-title" content="Teco.md" />
      <meta name="application-name" content="Teco.md" />
      <meta name="referrer" content="origin-when-cross-origin" />
      <meta name="format-detection" content="telephone=yes" />

      {/* Open Graph */}
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDesc} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={finalUrl} />
      <meta property="og:site_name" content="Teco.md" />
      <meta property="og:locale" content={lang === "ro" ? "ro_MD" : "ru_MD"} />
      <meta property="og:locale:alternate" content={lang === "ro" ? "ru_MD" : "ro_MD"} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:type" content="image/jpeg" />
      <meta property="og:image:alt" content="Teco.md — Sisteme de Supraveghere Moldova" />
      <meta property="og:phone_number" content="+373-67-200-463" />
      <meta property="og:email" content="contact@teco.md" />
      <meta property="og:street-address" content="Chișinău" />
      <meta property="og:locality" content="Chișinău" />
      <meta property="og:country-name" content="Moldova" />
      <meta property="og:region" content="Moldova" />
      <meta property="og:postal-code" content="MD-2001" />
      <meta property="og:determiner" content="the" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@teco_md" />
      <meta name="twitter:creator" content="@teco_md" />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDesc} />
      <meta name="twitter:image" content={imageUrl} />
      <meta name="twitter:image:alt" content="Teco.md — Sisteme de Supraveghere Moldova" />

      {/* PWA / App */}
      <link rel="manifest" href={typeof window !== "undefined" && window.location.pathname.startsWith("/admin") ? "/manifest-admin.json" : "/manifest.json"} />
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      <link rel="shortcut icon" href="/favicon.svg" />
      <link rel="mask-icon" href="/favicon.svg" color="#FF4F00" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

      {/* Preconnect */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
      <link rel="dns-prefetch" href="https://fonts.gstatic.com" />

      {/* JSON-LD structured data */}
      {jsonLd?.map((data, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(data).replace(/</g, "\\u003c")}
        </script>
      ))}
    </Helmet>
  );
}

/* ── Pre-built schemas for common pages ───────────────────────── */

export const schemas = {
  website(lang: "ro" | "ru" = "ro") {
    return {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": "https://teco.md/#website",
      url: "https://teco.md",
      name: "Teco.md",
      description: lang === "ro"
        ? "Sisteme de supraveghere video, camere IP și instalare profesională în Moldova"
        : "Системы видеонаблюдения, IP-камеры и профессиональная установка в Молдове",
      inLanguage: ["ro", "ru"],
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: "https://teco.md/produse?q={search_term_string}",
        },
        "query-input": "required name=search_term_string",
      },
    };
  },

  localBusiness(lang: "ro" | "ru" = "ro") {
    return {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": "https://teco.md/#business",
      name: "TECO.md", url: "https://teco.md/", telephone: "+37367200463",
      email: "contact@teco.md",
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+37367200463",
        email: "contact@teco.md",
        contactType: "customer service",
        availableLanguage: ["Romanian", "Russian"],
        areaServed: "MD",
        url: "https://teco.md/contact/",
      },
      description: lang === "ro" ? "Echipamente de supraveghere, instalare și reparații în Moldova." : "Оборудование видеонаблюдения, монтаж и ремонт в Молдове.",
      areaServed: { "@type": "Country", name: "Moldova" },
      logo: "https://teco.md/logo.png",
    };
  },

  organization() {
    return {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": "https://teco.md/#business",
      name: "TECO.md", url: "https://teco.md/", telephone: "+37367200463",
      email: "contact@teco.md",
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+37367200463",
        email: "contact@teco.md",
        contactType: "customer service",
        availableLanguage: ["Romanian", "Russian"],
        areaServed: "MD",
        url: "https://teco.md/contact/",
      },
      logo: "https://teco.md/logo.png",
      areaServed: { "@type": "Country", name: "Moldova" },
    };
  },

  product(p: {
    id: number;
    slug?: string;
    name: string;
    brand: string;
    description: string;
    price: number;
    oldPrice?: number | null;
    imageUrl: string;
    category: string;
    inStock: boolean;
    rating?: { ratingValue: number; reviewCount: number };
    reviews?: Array<{ name: string; rating: number; text: string; date: string }>;
  }) {
    return {
      "@context": "https://schema.org",
      "@type": "Product",
      name: p.name,
      brand: { "@type": "Brand", name: p.brand },
      description: p.description,
      image: absoluteImage(p.imageUrl),
      sku: `TECO-${p.id}`,
      category: p.category,
      offers: {
        "@type": "Offer",
        url: canonicalUrl(`/product/${p.slug || p.id}`),
        price: p.price,
        priceCurrency: "MDL",
        availability: p.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        itemCondition: "https://schema.org/NewCondition",
        seller: { "@type": "Organization", "@id": "https://teco.md/#business", name: "TECO.md" },
        ...(p.oldPrice ? { priceSpecification: {
          "@type": "PriceSpecification",
          priceType: "https://schema.org/SalePrice",
          price: p.price,
          priceCurrency: "MDL",
        },
        highPrice: p.oldPrice,
        } : {}),
      },
      ...(p.rating ? {
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: p.rating.ratingValue,
          reviewCount: p.rating.reviewCount,
          bestRating: "5",
          worstRating: "1",
        },
      } : {}),
      ...(p.reviews && p.reviews.length > 0 ? {
        review: p.reviews.map((r) => ({
          "@type": "Review",
          author: { "@type": "Person", name: r.name },
          reviewRating: {
            "@type": "Rating",
            ratingValue: String(r.rating),
            bestRating: "5",
            worstRating: "1",
          },
          reviewBody: r.text,
          datePublished: r.date,
        })),
      } : {}),
    };
  },

  collectionPage(
    items: Array<{ id: number; slug?: string; name: string; imageUrl: string; price: number; inStock?: boolean }>,
    opts?: { name?: string; url?: string; description?: string }
  ) {
    const validItems = items.filter((item) => item.price > 0);
    return {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: opts?.name ?? "Catalog Produse — Teco.md",
      url: opts?.url ?? "https://teco.md/produse",
      description: opts?.description ?? "Catalog complet sisteme de supraveghere, camere IP, NVR-uri, kituri și alarme în Moldova.",
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: validItems.length,
        itemListElement: validItems.map((item, i) => {
          const slugOrId = item.slug || item.id;
          return {
            "@type": "ListItem",
            position: i + 1,
            item: {
              "@type": "Product",
              "@id": `https://teco.md/product/${slugOrId}`,
              name: item.name,
              url: `https://teco.md/product/${slugOrId}`,
              image: item.imageUrl.startsWith("http") ? item.imageUrl : `https://teco.md${item.imageUrl}`,
              offers: {
                "@type": "Offer",
                url: `https://teco.md/product/${slugOrId}`,
                price: String(item.price),
                priceCurrency: "MDL",
                availability: (item.inStock !== false) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
                itemCondition: "https://schema.org/NewCondition",
                seller: { "@type": "Organization", name: "Teco.md", url: "https://teco.md" },
              },
            },
          };
        }),
      },
    };
  },

  breadcrumb(items: Array<{ name: string; url: string }>) {
    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: items.map((item, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: item.name,
        item: { "@type": "Thing", "@id": item.url },
      })),
    };
  },

  blogPost(p: {
    title: string;
    slug: string;
    description: string;
    content: string;
    imageUrl: string;
    publishedAt: string;
    author?: string;
    category?: string;
  }) {
    return {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: p.title,
      description: p.description,
      url: `https://teco.md/blog/${p.slug}`,
      image: p.imageUrl,
      datePublished: p.publishedAt,
      dateModified: p.publishedAt,
      author: {
        "@type": "Organization",
        name: p.author || "Teco.md",
        url: "https://teco.md",
      },
      publisher: {
        "@type": "Organization",
        name: "Teco.md",
        logo: { "@type": "ImageObject", url: "https://teco.md/logo.png" },
      },
      articleBody: p.content,
      articleSection: p.category || "Securitate",
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": `https://teco.md/blog/${p.slug}`,
      },
      inLanguage: "ro",
      isPartOf: { "@type": "WebSite", "@id": "https://teco.md/#website" },
      wordCount: p.content?.split(/\s+/).length || 0,
    };
  },

  service(p: {
    name: string;
    description: string;
    url?: string;
    price?: string;
    imageUrl?: string;
  }) {
    return {
      "@context": "https://schema.org",
      "@type": "Service",
      name: p.name,
      description: p.description,
      url: p.url || "https://teco.md/servicii",
      image: p.imageUrl,
      provider: {
        "@type": "LocalBusiness",
        name: "Teco.md",
        telephone: "+37367200463",
        address: {
          "@type": "PostalAddress",
          streetAddress: "Chișinău",
          addressLocality: "Chișinău",
          postalCode: "MD-2001",
          addressCountry: "MD",
        },
      },
      areaServed: { "@type": "Country", name: "Moldova" },
      serviceType: "Security Systems Installation",
      ...(p.price ? { offers: {
        "@type": "Offer",
        price: p.price,
        priceCurrency: "MDL",
        priceValidUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      } } : {}),
    };
  },

  faq(questions: Array<{ question: string; answer: string }>) {
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: questions.map((q) => ({
        "@type": "Question",
        name: q.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: q.answer,
        },
      })),
    };
  },

  howTo(p: {
    name: string;
    description: string;
    totalTime?: string;
    steps: Array<{ name: string; text: string; url?: string }>;
    supply?: string[];
    tool?: string[];
  }) {
    return {
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: p.name,
      description: p.description,
      ...(p.totalTime ? { totalTime: p.totalTime } : {}),
      ...(p.supply ? { supply: p.supply.map((s) => ({ "@type": "HowToSupply", name: s })) } : {}),
      ...(p.tool ? { tool: p.tool.map((t) => ({ "@type": "HowToTool", name: t })) } : {}),
      step: p.steps.map((s, i) => ({
        "@type": "HowToStep",
        position: i + 1,
        name: s.name,
        text: s.text,
        ...(s.url ? { url: s.url } : {}),
      })),
    };
  },

  repairService(p: {
    name: string;
    description: string;
    price?: string;
  }) {
    return {
      "@context": "https://schema.org",
      "@type": "RepairAction",
      name: p.name,
      description: p.description,
      provider: {
        "@type": "LocalBusiness",
        name: "Teco.md",
        telephone: "+37367200463",
        areaServed: { "@type": "Country", name: "Moldova" },
      },
      ...(p.price ? { offers: { "@type": "Offer", price: p.price, priceCurrency: "MDL" } } : {}),
    };
  },
};
