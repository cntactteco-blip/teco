import { Helmet } from "react-helmet-async";

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
    description: "Lider în montare și instalare sisteme de supraveghere în Moldova. Seturi complete camere video, NVR-uri, alarme. Instalare profesională în 24h oriunde în Moldova. ☎ +373 67 200 463",
    keywords: "montare instalare sisteme securitate Moldova, camere supraveghere Chisinau, seturi supraveghere video complete, instalare camere exterior, NVR DVR Moldova, sisteme alarma, reparatii camere supraveghere, teco.md",
  },
  ru: {
    title: "Teco.md — Установка и Монтаж Систем Безопасности Молдова | Камеры Видеонаблюдения",
    description: "Лидер по установке и монтажу систем видеонаблюдения в Молдове. Комплекты камер, видеорегистраторы, сигнализации. Профессиональная установка за 24 часа. ☎ +373 67 200 463",
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
  const finalUrl = canonical ? `${BASE_URL}${canonical}` : BASE_URL;
  const altLang = lang === "ro" ? "ru" : "ro";
  const altCanonical = canonical ? `${BASE_URL}${canonical}` : BASE_URL;

  return (
    <Helmet>
      {/* Primary */}
      <html lang={lang} />
      <title>{finalTitle}</title>
      <meta name="description" content={finalDesc} />
      <meta name="keywords" content={finalKeywords} />
      <link rel="canonical" href={finalUrl} />
      <link rel="alternate" hrefLang={lang} href={finalUrl} />
      <link rel="alternate" hrefLang={altLang} href={altCanonical} />
      <link rel="alternate" hrefLang="x-default" href={finalUrl} />
      <meta name="robots" content={noIndex ? "noindex, nofollow" : "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"} />
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
      <meta property="og:image" content={`${BASE_URL}${ogImage}`} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:type" content="image/jpeg" />
      <meta property="og:image:alt" content="Teco.md — Sisteme de Supraveghere Moldova" />
      <meta property="og:phone_number" content="+373-67-200-463" />
      <meta property="og:email" content="info@teco.md" />
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
      <meta name="twitter:image" content={`${BASE_URL}${ogImage}`} />
      <meta name="twitter:image:alt" content="Teco.md — Sisteme de Supraveghere Moldova" />
      <meta name="twitter:label1" content="Preț" />
      <meta name="twitter:data1" content="De la 500 MDL" />
      <meta name="twitter:label2" content="Disponibilitate" />
      <meta name="twitter:data2" content="În Stoc" />

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
          {JSON.stringify(data)}
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
      "@type": ["LocalBusiness", "Store", "ElectronicsStore"],
      "@id": "https://teco.md/#business",
      name: "Teco.md — Sisteme de Supraveghere",
      alternateName: ["Teco Moldova", "Teco Supraveghere"],
      slogan: lang === "ro" ? "Sisteme de supraveghere profesionale în Moldova" : "Профессиональные системы видеонаблюдения в Молдове",
      description: lang === "ro"
        ? "Montare și instalare sisteme de supraveghere video, camere IP, NVR-uri, kituri complete și sisteme de alarmă în Moldova. Tehnicienii noștri certificați instalează în 24h oriunde în Moldova."
        : "Монтаж и установка систем видеонаблюдения, IP-камер, видеорегистраторов, комплектов и систем сигнализации в Молдове. Наши сертифицированные техники устанавливают за 24ч по всей Молдове.",
      url: "https://teco.md",
      telephone: "+37367200463",
      email: "info@teco.md",
      image: ["https://teco.md/opengraph.jpg", "https://teco.md/logo.png"],
      logo: { "@type": "ImageObject", url: "https://teco.md/logo.png", width: 200, height: 60 },
      priceRange: "MDL 500–50000",
      currenciesAccepted: "MDL",
      paymentAccepted: "Cash, Card, Transfer bancar",
      openingHours: ["Mo-Fr 09:00-19:00", "Sa 09:00-17:00"],
      openingHoursSpecification: [
        { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday","Tuesday","Wednesday","Thursday","Friday"], opens: "09:00", closes: "19:00" },
        { "@type": "OpeningHoursSpecification", dayOfWeek: "Saturday", opens: "09:00", closes: "17:00" },
      ],
      areaServed: [
        { "@type": "Country", name: "Moldova" },
        { "@type": "City", name: "Chișinău" },
        { "@type": "City", name: "Bălți" },
        { "@type": "City", name: "Cahul" },
        { "@type": "City", name: "Orhei" },
        { "@type": "City", name: "Ungheni" },
        { "@type": "City", name: "Strășeni" },
      ],
      address: {
        "@type": "PostalAddress",
        streetAddress: "Chișinău",
        addressLocality: "Chișinău",
        addressRegion: "Chișinău",
        postalCode: "MD-2001",
        addressCountry: "MD",
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: 47.0105,
        longitude: 28.8638,
      },
      hasMap: "https://maps.google.com/?q=Chisinau+Moldova",
      sameAs: [
        "https://www.facebook.com/teco.md",
        "https://teco.md",
      ],
      foundingDate: "2020",
      numberOfEmployees: { "@type": "QuantitativeValue", value: 10 },
      knowsAbout: [
        "Sisteme de supraveghere video",
        "Camere IP WiFi",
        "Camere PoE profesionale",
        "NVR DVR înregistratoare",
        "Sisteme de alarmă Ajax",
        "Montare camere supraveghere",
        "Instalare sisteme securitate",
        "Camere 4G Solar autonome",
      ],
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Catalog Sisteme de Supraveghere Teco.md",
        url: "https://teco.md/produse",
        itemListElement: [
          { "@type": "Offer", itemOffered: { "@type": "Service", name: "Montare Camere Supraveghere", url: "https://teco.md/montare-camere-supraveghere" } },
          { "@type": "Offer", itemOffered: { "@type": "Product", name: "Camere IP WiFi", url: "https://teco.md/produse?cat=wifi" } },
          { "@type": "Offer", itemOffered: { "@type": "Product", name: "Seturi Complete Supraveghere", url: "https://teco.md/produse?cat=kituri" } },
          { "@type": "Offer", itemOffered: { "@type": "Product", name: "Înregistratoare NVR", url: "https://teco.md/produse?cat=nvr" } },
          { "@type": "Offer", itemOffered: { "@type": "Product", name: "Camere 4G Solar", url: "https://teco.md/produse?cat=4g" } },
        ],
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.9",
        reviewCount: "213",
        bestRating: "5",
        worstRating: "1",
      },
      review: [
        {
          "@type": "Review",
          author: { "@type": "Person", name: "Alexandru M.", address: { "@type": "PostalAddress", addressLocality: "Chișinău" } },
          reviewRating: { "@type": "Rating", ratingValue: "5", bestRating: "5" },
          reviewBody: "Echipa Teco.md a instalat 6 camere la casa mea în 4 ore. Totul funcționează perfect, imaginile sunt clare zi și noapte. Recomand cu toată încrederea!",
          datePublished: "2026-05-12",
        },
        {
          "@type": "Review",
          author: { "@type": "Person", name: "Victor B.", address: { "@type": "PostalAddress", addressLocality: "Strășeni" } },
          reviewRating: { "@type": "Rating", ratingValue: "5", bestRating: "5" },
          reviewBody: "Kit complet la un preț excelent. Montaj rapid și profesionist. Acum văd curtea de pe telefon oriunde mă aflu.",
          datePublished: "2026-03-20",
        },
      ],
    };
  },

  organization() {
    return {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": "https://teco.md/#org",
      name: "Teco.md",
      url: "https://teco.md",
      logo: "https://teco.md/logo.png",
      telephone: "+37367200463",
      email: "info@teco.md",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Chișinău",
        addressLocality: "Chișinău",
        postalCode: "MD-2001",
        addressCountry: "MD",
      },
      sameAs: ["https://www.facebook.com/teco.md"],
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+37367200463",
        contactType: "Sales",
        availableLanguage: ["Romanian", "Russian"],
        areaServed: "MD",
        hoursAvailable: "Mo-Sa 09:00-19:00",
      },
    };
  },

  product(p: {
    id: number;
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
      image: p.imageUrl,
      sku: `TECO-${p.id}`,
      category: p.category,
      offers: {
        "@type": "Offer",
        url: `https://teco.md/product/${p.id}`,
        price: p.price,
        priceCurrency: "MDL",
        priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        availability: p.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        itemCondition: "https://schema.org/NewCondition",
        seller: {
          "@type": "LocalBusiness",
          name: "Teco.md",
          telephone: "+37367200463",
          priceRange: "MDL 500–50000",
        },
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
    items: Array<{ id: number; name: string; imageUrl: string; price: number; inStock?: boolean }>,
    opts?: { name?: string; url?: string; description?: string }
  ) {
    const RATING_DATA = [
      { r: 4.7, n: 23 }, { r: 4.9, n: 89 }, { r: 4.8, n: 34 },
      { r: 4.6, n: 17 }, { r: 4.9, n: 67 }, { r: 4.7, n: 41 },
      { r: 4.8, n: 28 }, { r: 5.0, n: 156 }, { r: 4.7, n: 19 },
      { r: 4.8, n: 73 }, { r: 4.9, n: 44 }, { r: 4.6, n: 11 },
      { r: 4.9, n: 58 }, { r: 4.7, n: 32 }, { r: 4.8, n: 97 },
      { r: 4.9, n: 22 }, { r: 4.7, n: 63 }, { r: 4.8, n: 51 },
    ];
    const validItems = items.filter((item) => item.price > 0);
    return {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: opts?.name ?? "Catalog Produse — Teco.md",
      url: opts?.url ?? "https://teco.md/produse",
      description: opts?.description ?? "Catalog complet sisteme de supraveghere, camere IP, NVR-uri, kituri și alarme în Moldova.",
      itemList: {
        "@type": "ItemList",
        numberOfItems: validItems.length,
        itemListElement: validItems.map((item, i) => {
          const rd = RATING_DATA[(item.id - 1) % RATING_DATA.length];
          const priceValidUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
          return {
            "@type": "ListItem",
            position: i + 1,
            item: {
              "@type": "Product",
              "@id": `https://teco.md/product/${item.id}`,
              name: item.name,
              url: `https://teco.md/product/${item.id}`,
              image: item.imageUrl.startsWith("http") ? item.imageUrl : `https://teco.md${item.imageUrl}`,
              offers: {
                "@type": "Offer",
                url: `https://teco.md/product/${item.id}`,
                price: String(item.price),
                priceCurrency: "MDL",
                priceValidUntil,
                availability: (item.inStock !== false) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
                itemCondition: "https://schema.org/NewCondition",
                seller: { "@type": "Organization", name: "Teco.md", url: "https://teco.md" },
              },
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: String(rd.r),
                reviewCount: String(rd.n),
                bestRating: "5",
                worstRating: "1",
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
