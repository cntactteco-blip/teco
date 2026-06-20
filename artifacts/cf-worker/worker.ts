import Groq from "groq-sdk";

export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const groq = new Groq({ apiKey: env.GROQ_API_KEY });

    if (url.pathname === "/api/ai/chat" && request.method === "POST") {
      const body = await request.json() as any;
      const { messages = [], lang = "ro", products = [] } = body;

      const systemPrompt = buildSystemPrompt(products, lang);
      const groqMessages = [
        { role: "system" as const, content: systemPrompt },
        ...messages.map((m: any) => ({ role: m.role, content: m.content })),
      ];

      const stream = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: groqMessages,
        max_tokens: 1024,
        stream: true,
      });

      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || "";
            if (text) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: text })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
          controller.close();
        },
      });

      return new Response(readable, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
        },
      });
    }

    if (url.pathname === "/api/ai/blog-post" && request.method === "POST") {
      const { topic } = await request.json() as any;
      const result = await groq.chat.completions.create({
        model: "llama3-70b-8192",
        messages: [{ role: "user", content: buildBlogPrompt(topic) }],
        max_tokens: 8192,
      });
      const text = result.choices[0]?.message?.content ?? "{}";
      const clean = text.replace(/```json|```/g, "").trim();
      return new Response(clean, { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (url.pathname === "/api/ai/lead-analyze" && request.method === "POST") {
      const { lead } = await request.json() as any;
      const result = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: buildLeadPrompt(lead) }],
        max_tokens: 1024,
      });
      const text = result.choices[0]?.message?.content ?? "{}";
      const clean = text.replace(/```json|```/g, "").trim();
      return new Response(clean, { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (url.pathname === "/api/ai/whatsapp-message" && request.method === "POST") {
      const { lead, context } = await request.json() as any;
      const result = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: buildWhatsappPrompt(lead, context) }],
        max_tokens: 512,
      });
      const msg = result.choices[0]?.message?.content ?? "";
      return new Response(JSON.stringify({ message: msg }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (url.pathname === "/api/ai/description" && request.method === "POST") {
      const body = await request.json() as any;
      const result = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: buildDescriptionPrompt(body) }],
        max_tokens: 512,
      });
      const desc = result.choices[0]?.message?.content ?? "";
      return new Response(JSON.stringify({ description: desc }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response("Not found", { status: 404, headers: corsHeaders });
  },
};

function buildSystemPrompt(products: any[], lang?: string): string {
  const catalog = buildCatalog(products);
  let prompt = SYSTEM_PROMPT.replace("{CATALOG}", catalog);
  if (lang === "ru") prompt += "\n\nNOTĂ: Clientul comunică în rusă. Răspunde în rusă.";
  return prompt;
}

function buildCatalog(products: any[]): string {
  if (!products?.length) return "(catalog indisponibil)";
  const groups: Record<string, any[]> = {};
  for (const p of products) { (groups[p.category] ??= []).push(p); }
  return Object.entries(groups).map(([cat, items]) => {
    const lines = items.map((p: any) => `[${p.id}] ${p.brand} ${p.name} — ${p.specs} — ${p.price} MDL`);
    return `=== ${cat.toUpperCase()} ===\n${lines.join("\n")}`;
  }).join("\n\n");
}

function buildBlogPrompt(topic: string): string {
  return `Ești un expert SEO și content writer pentru Teco.md — magazin de sisteme de supraveghere din Moldova.\n\nScrie un articol de blog complet și optimizat SEO despre: "${topic}"\n\nReturnează STRICT JSON valid (fără markdown, fără \`\`\`), cu structura exactă:\n{\n  "title": "titlu atractiv în română (max 65 caractere)",\n  "titleRu": "titlu în rusă",\n  "slug": "slug-url-fara-diacritice-cu-liniute",\n  "category": "Ghiduri",\n  "categoryRu": "Руководства",\n  "description": "meta description SEO română (150-160 caractere)",\n  "descriptionRu": "meta description rusă",\n  "metaTitle": "meta title română",\n  "metaTitleRu": "meta title rusă",\n  "metaDescription": "meta description română",\n  "metaDescriptionRu": "meta description rusă",\n  "keywords": "cuvinte, cheie",\n  "keywordsRu": "ключевые, слова",\n  "content": "articol complet în română în format Markdown, minim 600 cuvinte",\n  "contentRu": "articol complet în rusă în format Markdown, minim 600 cuvinte"\n}`;
}

function buildLeadPrompt(lead: any): string {
  return `Analizează acest lead pentru Teco.md (sisteme supraveghere Moldova):\nNume: ${lead.name}\nTelefon: ${lead.phone}\nMesaj: ${lead.message || "—"}\n\nRăspunde în română în format JSON strict:\n{\n  "score": 1-10,\n  "potential": "mic|mediu|mare",\n  "estimatedBudget": "estimare în MDL",\n  "recommendation": "ce să îi oferi",\n  "whatsappMessage": "mesaj WhatsApp personalizat"\n}`;
}

function buildWhatsappPrompt(lead: any, context?: string): string {
  return `Generează un mesaj WhatsApp pentru clientul:\nNume: ${lead.name}\nCerere: ${lead.message || "interesat de sisteme supraveghere"}\nContext: ${context || "—"}\n\nMesaj scurt, personalizat, în română, max 5 rânduri. Returnează DOAR mesajul.`;
}

function buildDescriptionPrompt(p: any): string {
  return `Generează o descriere SEO pentru produs Teco.md:\nProdus: ${p.name}, Brand: ${p.brand}, Specs: ${p.specs}, Preț: ${p.price} MDL\n\n2-3 propoziții, română, fără bullet points. Returnează DOAR descrierea.`;
}

const SYSTEM_PROMPT = `Ești TecoBot, consultantul Teco.md — magazin de sisteme de supraveghere din Chișinău.

REGULI STRICTE:
- Gramatică română corectă întotdeauna. Fără greșeli, fără argou.
- Vorbești natural, ca un consultant experimentat, nu ca un robot sau agent de vânzări.
- Nu repeta salutul după primul mesaj.
- Nu inventa prețuri sau produse care nu sunt în catalog.
- Răspunsuri scurte și clare — maxim 3 propoziții per mesaj.

CUM RECOMANZI PRODUSE:
- Înainte să recomanzi, înțelege nevoia: interior sau exterior, buget aproximativ, număr camere.
- Întrebi UN singur lucru pe rând — nu un interogatoriu.
- Când știi nevoia, recomanzi 2-3 variante din catalog: una de buget, una medie, una premium.
- Explici PE SCURT diferența dintre ele (1 propoziție per variantă).
- Pune ID-ul în format [ID] lângă fiecare produs recomandat.
- Studiezi bine catalogul și recomanzi DOAR produse relevante pentru nevoia clientului.
- Nu recomanzi camere WiFi când clientul cere PoE, nu recomanzi interior când cere exterior etc.

CÂND CERI CONTACT:
- Doar când clientul confirmă că vrea să cumpere sau să instaleze.
- Ceri în ordine: NUMELE, apoi TELEFONUL, apoi ADRESA/locația.
- Câte un lucru pe rând, natural, nu toate odată.
- Când ai toate trei, adaugă: LEAD_CAPTURED:name=NUME,phone=TELEFON
- Confirmă: "Perfect, te contactăm în scurt timp."

REGULI EXTRA:
- Nu explica termeni tehnici ca un profesor — dacă clientul nu știe, explici în 5 cuvinte.
- Nu spune "Doriți să cumpărați?" — dacă e interesat, mergi natural spre comandă.
- Nu repeta cardul produsului la fiecare mesaj — doar la prima recomandare.

CONTACT: +373 67 200 463, Luni-Sâmbătă 09:00-19:00

CATALOG:
{CATALOG}

LIMBA: Răspunzi în limba clientului (română sau rusă).`;
