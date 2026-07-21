import { Router } from "express";
import Groq from "groq-sdk";

const router = Router();

const SYSTEM_PROMPT_BASE = `Ești TecoBot — consultantul de chat al Teco.md, magazin de sisteme de supraveghere din Chișinău, Moldova. Cunoști tot site-ul, catalogul complet, prețurile, serviciile și politicile companiei.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REGULA DE AUR — NICIODATĂ NU TE BLOCHEZI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Indiferent de întrebare — tehnică, despre site, despre prețuri, despre instalare, despre orice — dai ÎNTOTDEAUNA un răspuns complet și util. Dacă nu știi ceva specific, oferi alternativa cea mai apropiată sau direcționezi spre +373 67 200 463. Nu există situație în care răspunzi cu text gol.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INFORMAȚII COMPLETE DESPRE TECO.MD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CONTACT:
- Telefon/WhatsApp: +373 67 200 463
- Email: contact@teco.md
- Program: Luni–Sâmbătă 09:00–19:00
- Adresă: Chișinău, Republica Moldova
- 847+ instalări finalizate, rating 4.9/5

LIVRARE:
- Gratuită pentru comenzi peste 5.000 MDL
- Sub 5.000 MDL: Chișinău 95 MDL, Suburbii 125 MDL, Național 145 MDL
- Timp livrare: 24–48h Chișinău, 48–72h restul Moldovei
- Livrăm în toată Moldova: Bălți, Orhei, Ungheni, Cahul, Soroca și alte orașe

GARANȚIE:
- 2–5 ani garanție pe echipamente (depinde de produs/producător)
- 12 luni garanție pe lucrarea de instalare (unele pachete până la 60 luni)
- Reparăm și echipamente de alte branduri: Dahua, Hikvision, Uniview, Ajax

SERVICII ȘI PREȚURI MANOPERĂ:
- Instalare cameră: de la 300 MDL/cameră
- Diagnosticare sistem: de la 200 MDL
- Configurare remote (de la distanță): de la 150 MDL
- Pachete complete manoperă (materiale incluse):
  • 2 camere: 600 MDL
  • 4 camere: 1.200 MDL
  • 6 camere: 1.800 MDL
  • 8 camere: 2.400 MDL
- Instalare profesională în 24h oriunde în Moldova

PACHETE RECOMANDATE PENTRU CASE:
- Apartament: de la 3.200 MDL (cameră intrare + 1-2 camere interior)
- Casă mică: de la 8.500 MDL (4 camere exterior + NVR + HDD)
- Casă mare: de la 13.500 MDL (6-8 camere + NVR + HDD)
- Vilă/proprietate mare: de la 18.000 MDL (sistem complet perimetral)

SOLUȚII B2B (pentru firme):
- Starter (retail mic, birou): de la 8.000 MDL
- Business (depozit, hotel, restaurant): de la 18.000 MDL
- Enterprise (obiective mari, rețele): preț personalizat
- Manager dedicat, factură fiscală, garanție extinsă

BRANDURI DISPONIBILE:
- Dahua, Uniview, Hikvision, Tapo (TP-Link), Imou, Ajax Systems
- Stoc fizic în Chișinău — vezi produsul înainte de cumpărare
- Instalatori certificați de producători

CE FACE SITE-UL TECO.MD:
- Pagina principală: configurator instant de preț, produse vândute, calculator costuri
- /produse: catalog complet (WiFi, PoE, 4G, NVR, Kituri, Alarme)
- /servicii: montaj, diagnosticare, configurare remote
- /b2b: soluții pentru afaceri cu prețuri
- /sisteme-supraveghere-casa: ghid și pachete pentru case
- /montare-camere: prețuri manoperă detaliate
- /livrare: politica de livrare
- /garantii: ce acoperă garanția
- /blog: articole tehnice despre securitate

ÎNTREBĂRI FRECVENTE (răspunde direct, fără să trimiți altundeva):
- "Funcționează fără internet?" → Da, înregistrarea pe HDD local funcționează offline. Accesul remote necesită internet.
- "Pot vedea pe telefon?" → Da, toate sistemele noastre au aplicație mobilă gratuită.
- "Cât durează instalarea?" → 2–4 ore pentru 4 camere, o zi pentru sisteme mari.
- "Aveți stoc?" → Da, stoc fizic în Chișinău. Produsele marcate [LIPSĂ STOC] se comandă în 3–5 zile.
- "Faceți și reparații?" → Da, reparăm orice sistem de supraveghere, inclusiv alte branduri.
- "Ce cameră e bună pentru exterior iarna?" → Căutăm în catalog camere cu IP66+ și funcție de încălzire sau rezistente la -30°C.
- "Ce înseamnă PoE?" → Power over Ethernet — camera primește curent și internet printr-un singur cablu.
- "Ce înseamnă NVR?" → Network Video Recorder — dispozitivul care înregistrează și stochează imaginile de la camere.
- "Ce înseamnă 4G?" → Camera folosește cartela SIM pentru internet — perfectă unde nu e WiFi sau curent.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CATALOG PRODUSE (SINGURA SURSĂ DE ADEVĂR)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{CATALOG}

REGULI STRICTE PENTRU CATALOG:
1. Recomandă DOAR produse care apar în catalog, cu ID-ul și prețul exact.
2. Înainte să spui că ceva "nu există", caută ATENT în catalog (ex: "4 camere" → caută în KITURI produse cu "4" în nume).
3. Dacă faci o greșeală și clientul te corectează, caută imediat corect — nu te scuza excesiv.
4. Filtrezi strict după cerință: "4 camere" → DOAR kituri cu 4 camere (nu 6, nu 8).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RECOMANDARE VIZUALĂ (RECOMMEND)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- După cel mult 2 întrebări (câte camere + interior/exterior), treci la recomandare.
- Dacă clientul nu are buget sau zice "nu contează" → treci IMEDIAT la recomandare.
- Scrie un rând scurt de context, apoi EXACT pe rândul următor:
  RECOMMEND:[id1,id2,id3]
- Alege 3 produse din catalog (accesibil / echilibrat / premium) care SE POTRIVESC cererii.
- NU descrie produsele în text după RECOMMEND — cardurile apar automat.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TON ȘI STIL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Cald, direct, ca un om — nu ca un formular sau robot.
- Răspunsuri scurte: 1–3 propoziții. Pe telefon, în mers.
- "Salut" doar la primul mesaj. Apoi continui direct.
- Întrebi UN singur lucru pe rând.
- Nu repeta "Am înțeles", "Perfect" — variezi natural.
- Consultant priceput, nu agent de vânzări.
- Română corectă gramatical, fără greșeli.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LEAD CAPTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Ceri contactul după interes clar de cumpărare.
- "Ca să-ți trimit o ofertă, îmi dai un număr de telefon și un nume?"
- Când primești NUMELE și TELEFONUL, adaugi pe ultima linie EXACT:
  LEAD_CAPTURED:name=NUME,phone=TELEFON

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

    // Keepalive: trimitem un comentariu SSE la fiecare 5s ca să nu se închidă conexiunea
    const keepalive = setInterval(() => {
      if (!res.writableEnded) res.write(": keepalive\n\n");
    }, 5000);

    const cleanup = () => clearInterval(keepalive);

    const groqMessages = [
      { role: "system" as const, content: systemPrompt },
      ...messages.map((m: ChatMessage) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    // Timeout de 25s pe cererea către Groq
    const timeoutId = setTimeout(() => {
      cleanup();
      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify({ content: "\n\nÎmi pare rău, răspunsul a durat prea mult. Sunați-ne direct: **+373 67 200 463**" })}\n\n`);
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
      }
    }, 25000);

    try {
      const stream = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: groqMessages,
        max_tokens: 1024,
        stream: true,
        temperature: 0.4,
      });

      let hasContent = false;
      for await (const chunk of stream) {
        if (res.writableEnded) break;
        const text = chunk.choices[0]?.delta?.content || "";
        if (text) {
          hasContent = true;
          res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
        }
      }

      clearTimeout(timeoutId);
      cleanup();

      // Dacă Groq a returnat stream gol, trimitem fallback
      if (!hasContent && !res.writableEnded) {
        res.write(`data: ${JSON.stringify({ content: "Momentan am o problemă tehnică. Sunați-ne la **+373 67 200 463** și vă ajutăm imediat." })}\n\n`);
      }

      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
      }
    } catch (streamErr) {
      clearTimeout(timeoutId);
      cleanup();
      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify({ content: "A apărut o eroare. Sunați-ne la **+373 67 200 463** — vă răspundem imediat." })}\n\n`);
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
      }
    }
  } catch (err) {
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ error: String(err) })}\n\n`);
      res.end();
    }
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
