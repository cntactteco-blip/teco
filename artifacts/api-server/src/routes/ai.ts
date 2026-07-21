import { Router } from "express";
import Groq from "groq-sdk";

const router = Router();

const SYSTEM_PROMPT_BASE = `Ești TecoBot, omul de la Teco.md care răspunde pe chat — un magazin de sisteme de supraveghere din Chișinău, unde lucrezi de ani buni și ai instalat sute de sisteme prin toată Moldova.

CUM VORBEȘTI:
- Vorbești ca un om, nu ca un formular. Cald, direct, fără fraze de robot ("Înțeleg că aveți nevoie de...").
- Răspunzi SCURT (2-4 propoziții). Oamenii sunt pe telefon, nu citesc eseuri.
- Nu pui toate întrebările deodată. Întrebi UN lucru, aștepți răspunsul, apoi continui firesc, ca într-o discuție reală.
- Dacă clientul zice doar "salut" sau ceva vag, nu repeți mesajul de bun venit — întrebi natural cum îl poți ajuta, sau ce îl interesează.
- Validezi nevoia clientului înainte să recomanzi ("Are sens, mulți clienți cu casă la curte aleg exact asta...") — nu sari direct la vânzare.
- Folosești experiența reală ca argument, nu ca slogan repetat: menționezi numărul de instalări sau garanția O DATĂ, când e relevant, nu în fiecare mesaj.

NOTĂ DESPRE TON (citește cu atenție, e important):
- Nu zici "Salut" la fiecare mesaj — doar dacă e chiar primul mesaj al clientului în conversație. După aceea continui direct, fără saluturi repetate.
- Eviți formulele fixe repetate ("Am înțeles", "Perfect", etc. la fiecare răspuns) — variezi cum reacționezi, ca un om care ascultă cu atenție, nu ca un robot cu liste de fraze.
- Poți avea un mic strop de umor sau căldură când situația o permite (ex: client nesigur, glumă ușoară) — dar nu forțezi, nu exagerezi cu emoji.
- Dacă clientul răspunde scurt sau vag, nu cere imediat alte 3 lucruri — continui firesc discuția, ca și cum ai vorbi la telefon cu un vecin.
- Eviți tonul de "agent de vânzări" — ești mai degrabă omul priceput care vrea să-l ajute pe celălalt să aleagă bine, nu să-i vândă orice.

NOTĂ DESPRE LUNGIME (strict, nu negociabil):
- Răspunsul tău normal are 1-2 propoziții SCURTE. Doar dacă recomanzi un produs concret cu preț poți avea 3.
- NU explici termeni tehnici în paranteze (PoE, NVR etc.) decât dacă clientul întreabă explicit ce înseamnă.
- Niciun răspuns nu are mai mult de 2 idei. Dacă simți nevoia să explici mult, oprește-te și întreabă mai simplu.
- Gândește-te că răspunsul tău se citește pe un telefon mic, în mers. Lungimea ucide conversia.

CONTACT TECO.MD:
- Telefon/WhatsApp: +373 67 200 463
- Program: Luni-Sâmbătă 09:00–19:00
- Instalare profesională în 24h oriunde în Moldova
- Garanție 2-3 ani pe produse, garanție pe lucrare
- 847+ instalări finalizate, rating 4.9/5

CATALOG CURENT (prețuri MDL):
{CATALOG}

CUM RECOMANZI:
1. Recomandă produse SPECIFICE din catalog, cu preț exact în MDL — niciodată generic.
2. Dacă nu ai suficiente detalii ca să recomanzi bine, întreabă UN lucru cheie (ex: interior sau exterior, are WiFi), nu un interogatoriu.
3. NU inventezi prețuri, produse sau specificații care nu sunt în catalog.
4. Instalarea e gratuită la consultație — prețul final depinde de nr. camere și distanță, spune asta natural dacă vine vorba.

RECOMANDARE SETURI (cel mai important feature — citește cu atenție):
- După maximum 2-3 întrebări de calificare (interior/exterior, buget aprox., câte camere), recomandă EXACT 3 produse din catalog.
- Scrie un rând SCURT de context ("Iată 3 variante potrivite pentru situația ta:"), apoi pe rândul următor EXACT în formatul:
  RECOMMEND:[id1,id2,id3]
- Cardurile produselor se vor afișa automat vizual — NU mai descrie produsele în text după RECOMMEND.
- Alege 3 produse REALE din catalog la prețuri diferite (ieftin, mediu, premium) — dacă clientul nu are buget, alege variante accesibile.
- Folosește RECOMMEND la prima ocazie potrivită — nu amâna la nesfârșit cu întrebări.

CÂND CERI CONTACT:
- Doar după ce clientul a interacționat cu o recomandare sau arată interes clar de cumpărare.
- Ceri natural: "Ca să te pot ajuta mai concret, cum te-aș putea contacta — nume și telefon?"
- Când primești NUMELE și TELEFONUL, răspunzi normal, cald, dar adaugi pe ultima linie EXACT: LEAD_CAPTURED:name=NUME,phone=TELEFON

LIMBA:
Răspunzi întotdeauna în limba clientului (română sau rusă), niciodată mixat.`;

const CATEGORY_LABELS: Record<string, string> = {
  wifi:   "CAMERE WiFi",
  poe:    "CAMERE PoE (Cablate)",
  "4g":   "CAMERE 4G/Solar (fără WiFi, fără curent)",
  nvr:    "NVR-uri (Înregistratoare)",
  kituri: "Kituri Complete (cameră+NVR+HDD, gata de instalat)",
  alarme: "Sisteme Alarmă",
};

interface ProductEntry {
  id: number;
  name: string;
  brand: string;
  price: number;
  oldPrice?: number | null;
  specs: string;
  category: string;
  badge?: string | null;
  inStock?: boolean;
}

function buildCatalog(products: ProductEntry[]): string {
  if (!products?.length) return "(catalog indisponibil)";
  const groups: Record<string, ProductEntry[]> = {};
  for (const p of products) {
    (groups[p.category] ??= []).push(p);
  }
  const order = ["wifi", "poe", "4g", "nvr", "kituri", "alarme"];
  const sorted = [...order.filter(k => groups[k]), ...Object.keys(groups).filter(k => !order.includes(k))];
  return sorted.map(cat => {
    const label = CATEGORY_LABELS[cat] ?? cat.toUpperCase();
    const lines = groups[cat].map(p => {
      const stock = p.inStock === false ? " [LIPSĂ STOC]" : "";
      const promo = p.oldPrice ? ` (era ${p.oldPrice} MDL)` : "";
      const badge = p.badge ? ` [${p.badge}]` : "";
      return `[${p.id}] ${p.brand} ${p.name}${badge}${stock} — ${p.specs} — ${p.price} MDL${promo}`;
    });
    return `=== ${label} ===\n${lines.join("\n")}`;
  }).join("\n\n");
}

function buildSystemPrompt(products: ProductEntry[], lang?: string): string {
  const catalog = buildCatalog(products);
  let prompt = SYSTEM_PROMPT_BASE.replace("{CATALOG}", catalog);
  if (lang === "ru") prompt += "\n\nNOTĂ: Clientul comunică în rusă. Răspunde în rusă.";
  return prompt;
}

function getAI() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not set");
  return new Groq({ apiKey });
}

type ChatMessage = { role: "user" | "assistant"; content: string };

router.post("/chat", async (req, res) => {
  try {
    const { messages = [], lang = "ro", products = [] } = req.body as {
      messages: ChatMessage[];
      lang?: string;
      products?: ProductEntry[];
    };

    const groq = getAI();
    const systemPrompt = buildSystemPrompt(products, lang);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");

    const groqMessages = [
      { role: "system" as const, content: systemPrompt },
      ...messages.map((m: ChatMessage) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    const stream = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: groqMessages,
      max_tokens: 1024,
      stream: true,
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || "";
      if (text) {
        res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: String(err) })}\n\n`);
    res.end();
  }
});

router.post("/lead-analyze", async (req, res) => {
  try {
    const { lead } = req.body as {
      lead: { name: string; phone: string; message?: string; source?: string };
    };

    const groq = getAI();
    const prompt = `Analizează acest lead pentru magazinul Teco.md (sisteme supraveghere Moldova):
Nume: ${lead.name}
Telefon: ${lead.phone}
Mesaj: ${lead.message || "—"}
Sursă: ${lead.source || "—"}

Răspunde în română în format JSON strict (doar JSON, fără alte texte):
{
  "score": 1-10,
  "potential": "mic|mediu|mare",
  "estimatedBudget": "estimare în MDL",
  "recommendation": "ce să îi oferi",
  "whatsappMessage": "mesaj WhatsApp personalizat gata de trimis în română"
}`;

    const result = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1024,
    });

    const text = result.choices[0]?.message?.content ?? "{}";
    const clean = text.replace(/```json|```/g, "").trim();
    res.json(JSON.parse(clean));
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.post("/whatsapp-message", async (req, res) => {
  try {
    const { lead, context } = req.body as {
      lead: { name: string; phone: string; message?: string };
      context?: string;
    };

    const groq = getAI();
    const prompt = `Generează un mesaj WhatsApp profesional și prietenos pentru clientul:
Nume: ${lead.name}
Mesaj/Cerere: ${lead.message || "interesat de sisteme supraveghere"}
Context suplimentar: ${context || "—"}

Magazin: Teco.md — sisteme supraveghere, instalare profesională în Moldova
Telefon: +373 67 200 463

Mesajul trebuie să fie:
- Scurt (max 5 rânduri)
- Personalizat cu numele clientului
- În română
- Să includă o ofertă sau să ceară detalii
- Să se termine cu o întrebare pentru a continua dialogul

Returnează DOAR mesajul, fără explicații.`;

    const result = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 512,
    });

    res.json({ message: result.choices[0]?.message?.content ?? "" });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.post("/description", async (req, res) => {
  try {
    const { name, specs, brand, price, category } = req.body as {
      name: string; specs: string; brand: string; price: number; category: string;
    };

    const groq = getAI();
    const prompt = `Generează o descriere SEO optimizată pentru produs de la Teco.md:
Produs: ${name}
Brand: ${brand}
Specificații: ${specs}
Preț: ${price} MDL
Categorie: ${category}

Cerințe:
- 2-3 propoziții
- Menționează specificațiile cheie
- Orientat spre client moldovean
- Include cuvinte cheie SEO pentru Moldova
- În română
- Fără bullet points, text continuu

Returnează DOAR descrierea produsului.`;

    const result = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 512,
    });

    res.json({ description: result.choices[0]?.message?.content ?? "" });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.post("/business-insights", async (req, res) => {
  try {
    const { orders, leads, products } = req.body as {
      orders: unknown[]; leads: unknown[]; products: unknown[];
    };

    const groq = getAI();
    const prompt = `Analizează datele de business ale magazinului Teco.md (sisteme supraveghere, Moldova):

Comenzi recente: ${JSON.stringify(orders?.slice(0, 20) ?? [])}
Lead-uri recente: ${JSON.stringify(leads?.slice(0, 20) ?? [])}
Produse (top după stoc): ${JSON.stringify(products?.slice(0, 15) ?? [])}

Oferă 3-5 recomandări acționabile în română în format JSON strict (doar JSON):
{
  "summary": "rezumat scurt al stării business-ului",
  "insights": [
    {"title": "...", "description": "...", "action": "ce să faci concret"}
  ],
  "topOpportunity": "cea mai mare oportunitate de creștere acum"
}`;

    const result = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2048,
    });

    const text = result.choices[0]?.message?.content ?? "{}";
    const clean = text.replace(/```json|```/g, "").trim();
    res.json(JSON.parse(clean));
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.post("/import-products", async (req, res) => {
  try {
    const { csvData, usdRate, markup, fileName } = req.body as {
      csvData: string;
      usdRate?: string;
      markup?: string;
      fileName?: string;
    };

    const rate = parseFloat(usdRate ?? "17.8") || 17.8;
    const markupPct = parseFloat(markup ?? "0") || 0;

    const groq = getAI();
    const prompt = `Ești un expert în import de produse pentru un magazin online de sisteme de supraveghere din Moldova (Teco.md).

Analizează acest CSV/tabel de produse și extrage fiecare produs ca JSON.

REGULI CRITICE pentru prețuri (foarte important):
1. Dacă există coloane cu prețuri în MDL (ex: "lei", "MDL"), folosește-le DIRECT — NU converti din USD.
2. Coloana "la zi" sau "preț curent" sau cel mai mic preț MDL = câmpul "price" (prețul de vânzare).
3. Coloana "RRP" sau "preț recomandat" sau cel mai mare preț MDL = câmpul "oldPrice" (prețul barat/anterior).
4. Dacă există DOAR prețuri în USD (și nu există coloane MDL), atunci: price = USD × ${rate.toFixed(2)} × ${(1 + markupPct / 100).toFixed(4)}. Rotunjește la număr întreg.
5. Nu calcula oldPrice din USD când există deja un preț MDL în coloane — ia-l direct.
6. Dacă nu există oldPrice separat, lasă câmpul null.

REGULI pentru categorii — alege una din: "wifi", "poe", "4g", "nvr", "kituri", "alarme", "Camere IP"

Fișier: ${fileName ?? "import.xlsx"}
Rată USD→MDL: ${rate}

Date CSV:
${csvData}

Returnează STRICT un array JSON valid (fără text înainte/după, fără markdown), cu structura exactă:
[
  {
    "name": "nume complet produs",
    "model": "cod model",
    "brand": "brand",
    "price": 799,
    "oldPrice": 999,
    "category": "wifi",
    "specs": "specificații scurte (rezoluție, tip, culoare etc.)",
    "description": "descriere 2-3 propoziții SEO în română pentru Moldova",
    "inStock": true
  }
]`;

    const result = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 4096,
    });

    const text = result.choices[0]?.message?.content ?? "[]";
    const clean = text.replace(/```json|```/g, "").trim();
    const match = clean.match(/\[[\s\S]*\]/);
    const parsed = JSON.parse(match ? match[0] : clean);
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.post("/blog-post", async (req, res) => {
  try {
    const { topic } = req.body as { topic: string };
    const groq = getAI();
    const prompt = `Ești un expert SEO și content writer pentru Teco.md — magazin de sisteme de supraveghere din Moldova (camere, NVR, kituri, alarme Ajax).

Scrie un articol de blog complet și optimizat SEO despre: "${topic}"

Returnează STRICT JSON valid (fără markdown, fără \`\`\`), cu structura exactă:
{
  "title": "titlu atractiv în română (max 65 caractere)",
  "titleRu": "titlu în rusă",
  "slug": "slug-url-fara-diacritice-cu-liniute",
  "category": "Ghiduri",
  "categoryRu": "Руководства",
  "description": "meta description SEO română (150-160 caractere)",
  "descriptionRu": "meta description rusă",
  "metaTitle": "meta title română cu keyword (max 65 caractere)",
  "metaTitleRu": "meta title rusă",
  "metaDescription": "meta description română (150-160 caractere)",
  "metaDescriptionRu": "meta description rusă",
  "keywords": "cuvinte, cheie, separate, prin, virgula",
  "keywordsRu": "ключевые, слова, через, запятую",
  "content": "articol complet în română în format Markdown cu headings H2/H3, liste, minim 600 cuvinte, optimizat SEO, include sfaturi practice pentru Moldova",
  "contentRu": "articol complet în rusă în format Markdown, minim 600 cuvinte"
}`;

    const result = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 8192,
    });

    const text = result.choices[0]?.message?.content ?? "{}";
    const clean = text.replace(/```json|```/g, "").trim();
    res.json(JSON.parse(clean));
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
