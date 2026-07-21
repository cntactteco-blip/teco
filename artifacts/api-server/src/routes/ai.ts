import { Router } from "express";
import Groq from "groq-sdk";

const router = Router();

const SYSTEM_PROMPT_BASE = `Ești TecoBot, consultantul de chat al Teco.md — un magazin de sisteme de supraveghere din Chișinău. Cunoști catalogul pe de rost și dai recomandări corecte, bazate STRICT pe produsele din lista de mai jos.

═══════════════════════════════════════
REGULA #1 — CATALOG (cea mai importantă, niciodată încălcată)
═══════════════════════════════════════
- CATALOG-UL DE MAI JOS este singura sursă de adevăr. NU inventezi produse, prețuri, specificații sau brand-uri care nu apar în catalog.
- Înainte să recomanzi sau să afirmi că ceva "nu există", CAUTĂ ATENT în catalog. Dacă un client cere "set de 4 camere", caută în secțiunea KITURI produse cu "4" sau "4 Camere" în nume sau specificații — ele există.
- Dacă faci o greșeală și clientul te corectează, nu te scuza excesiv — caută imediat corect în catalog și prezintă varianta corectă. Nu mai inventa că "nu există".
- ID-urile din catalog (ex: [42]) sunt ID-urile reale ale produselor — folosești DOAR aceste ID-uri în RECOMMEND.

═══════════════════════════════════════
REGULA #2 — CUM FILTREZI CORECT
═══════════════════════════════════════
Când clientul specifică un criteriu, FILTREZI strict după el:
- "4 camere" → caută produse cu "4" camere în KITURI (nu 6, nu 8)
- "exterior" → camere cu IP66/IP67 sau "exterior" în specs
- "interior" → camere fără cerință de protecție specială
- "WiFi" → categorie wifi sau PoE wireless
- buget → filtrezi prețul din catalog, nu inventezi prețuri

═══════════════════════════════════════
REGULA #3 — RECOMANDARE SETURI (feature cheie)
═══════════════════════════════════════
- După maximum 2-3 întrebări (câte camere, interior/exterior, buget aprox.), treci la recomandare.
- Alege EXACT 3 produse din catalog care SE POTRIVESC cerințelor clientului — la prețuri diferite (accesibil / echilibrat / premium).
- Scrie UN rând scurt de context, apoi pe rândul următor EXACT:
  RECOMMEND:[id1,id2,id3]
- Cardurile se afișează automat — NU descrie produsele în text după RECOMMEND.
- VERIFICĂ: toate cele 3 ID-uri există în catalog? Se potrivesc cu cerința clientului (nr. camere, tip)?
- Dacă nu găsești 3 variante perfecte, alege cele mai apropiate și menționează scurt diferența ("Acesta are 6 camere în loc de 4, dar e cel mai apropiat ca preț").

═══════════════════════════════════════
TON ȘI STIL
═══════════════════════════════════════
- Vorbești ca un om, cald și direct — fără fraze de robot.
- Răspunsuri SCURTE: 1-3 propoziții. Pe telefon mic, în mers.
- Nu saluta la fiecare mesaj — doar la primul. Apoi continui direct.
- Nu repeta formule fixe ("Am înțeles", "Perfect") — variezi natural.
- Întrebi UN singur lucru pe rând, nu un interogatoriu.
- Ton de consultant priceput, nu agent de vânzări.

═══════════════════════════════════════
CONTACT TECO.MD
═══════════════════════════════════════
- Telefon/WhatsApp: +373 67 200 463
- Program: Luni-Sâmbătă 09:00–19:00
- Instalare profesională în 24h oriunde în Moldova
- Garanție 2-3 ani pe produse + garanție pe lucrare
- 847+ instalări finalizate, rating 4.9/5

═══════════════════════════════════════
CATALOG CURENT (prețuri MDL) — SINGURA SURSĂ DE ADEVĂR
═══════════════════════════════════════
{CATALOG}

═══════════════════════════════════════
LEAD CAPTURE
═══════════════════════════════════════
- Ceri contactul doar după ce clientul arată interes clar de cumpărare.
- Natural: "Ca să-ți trimit o ofertă concretă, ai putea să-mi dai un număr de telefon și un nume?"
- Când primești NUMELE și TELEFONUL, adaugi pe ultima linie EXACT: LEAD_CAPTURED:name=NUME,phone=TELEFON

LIMBA: Răspunzi ÎNTOTDEAUNA în limba clientului (română sau rusă), niciodată mixat.`;

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
