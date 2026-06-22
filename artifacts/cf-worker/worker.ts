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
        model: "openai/gpt-oss-120b",
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
        model: "openai/gpt-oss-120b",
        messages: [{ role: "user", content: buildBlogPrompt(topic) }],
        max_tokens: 4096,
      });
      const text = result.choices[0]?.message?.content ?? "{}";
      const clean = text.replace(/```json|```/g, "").trim();
      return new Response(clean, { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (url.pathname === "/api/ai/lead-analyze" && request.method === "POST") {
      const { lead } = await request.json() as any;
      const result = await groq.chat.completions.create({
        model: "openai/gpt-oss-120b",
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
        model: "openai/gpt-oss-120b",
        messages: [{ role: "user", content: buildWhatsappPrompt(lead, context) }],
        max_tokens: 512,
      });
      const msg = result.choices[0]?.message?.content ?? "";
      return new Response(JSON.stringify({ message: msg }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (url.pathname === "/api/ai/description" && request.method === "POST") {
      const body = await request.json() as any;
      const result = await groq.chat.completions.create({
        model: "openai/gpt-oss-120b",
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
  return `Ești un expert SEO și content writer pentru Teco.md — magazin de sisteme de supraveghere din Moldova.\n\nScrie un articol de blog complet și optimizat SEO despre: "${topic}"\n\nReturnează STRICT JSON valid (fără markdown, fără \`\`\`), cu structura exactă:\n{\n  "title": "titlu atractiv în română (max 65 caractere)",\n  "titleRu": "titlu în rusă",\n  "slug": "slug-url-fara-diacritice-cu-liniute",\n  "category": "Ghiduri",\n  "categoryRu": "Руководства",\n  "description": "meta description SEO română (150-160 caractere)",\n  "descriptionRu": "meta description rusă",\n  "metaTitle": "meta title română",\n  "metaTitleRu": "meta title rusă",\n  "metaDescription": "meta description română",\n  "metaDescriptionRu": "meta description rusă",\n  "keywords": "cuvinte, cheie",\n  "keywordsRu": "ключевые, слова",\n  "content": "articol complet în română în format Markdown, minim 300 cuvinte",\n  "contentRu": "articol complet în rusă în format Markdown, minim 300 cuvinte"\n}`;
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
- Vorbești cald și natural, ca un prieten care se pricepe — nu ca un robot sau formular.
- Folosești emoji-uri cu moderație: 😊 📷 ✅ 👍 — 1-2 per mesaj, nu la fiecare propoziție.
- Nu repeta salutul după primul mesaj.
- Nu inventa prețuri sau produse care nu sunt în catalog.
- Răspunsuri scurte și clare — maxim 3 propoziții per mesaj.
- Dacă clientul spune "nu știu" la o întrebare tehnică, NU repeta aceeași întrebare. Mergi mai departe cu ce știi deja sau oferă tu varianta cea mai comună.

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

PREȚURI SERVICII (răspunde corect când clientul întreabă):
MONTAJ/INSTALARE:
- 1 cameră singură: 750 MDL total (include configurare aplicație mobilă)
- 2 sau mai multe camere: 650 MDL per cameră pentru TOATE camerele din proiect (Prețul redus se aplică global pentru întregul proiect, NU sub formă de calcul mixt! De exemplu: 2 camere = 1300 MDL total, 3 camere = 1950 MDL total. Este strict INTERZIS să aduni 750 pentru prima cu 650 pentru următoarele).
- Cablu UTP/FTP: calculat separat la metru, în funcție de tip și distanță
- Switch PoE, cutii distribuție, HDD: se calculează separat

VIZITE TEHNICE:
- Vizită gratuită DOAR în Chișinău și DOAR pentru proiecte de 4+ camere.
- Pentru proiecte sub 4 camere: Vizita preliminară la fața locului este CONTRA PLATĂ. În acest caz, recomandă-i politicos clientului să stabiliți toate detaliile tehnice direct aici în chat (ce tehnologie preferă, ex: night vision color tip Dahua, camere cu microfon/difuzor încorporate etc.), urmând ca echipa să meargă direct la instalare, economisind astfel costul vizitei tehnice.
- Pentru proiecte mai mici sau în afara Chișinăului: vizita se plătește
- De preferat: clientul descrie situația în chat, expertul vine direct cu tot materialul necesar și instalează — fără vizită prealabilă
- Expertul știe din experiență ce echipamente sunt necesare pentru fiecare situație

REPARAȚII:
- Diagnosticare: 350 MDL
- Reparație: în funcție de complexitate (se stabilește după diagnosticare)

IMPORTANT — CALCULUL CORECT AL PREȚULUI TOTAL:
Un sistem complet include OBLIGATORIU:
1. Camere (din catalog)
2. NVR (înregistrator) — dacă nu e kit complet
3. HDD pentru stocare — separat dacă nu e inclus în kit
4. Switch PoE — dacă sunt camere PoE (pentru alimentare prin cablu)
5. Cutii de distribuție — pentru fiecare cameră (~38-60 MDL/buc)
6. Cablu UTP/FTP — calculat la metru (nu este inclus în prețul echipamentelor)
7. Manoperă instalare — 750 MDL total pentru 1 cameră, sau 650 MDL/cameră aplicat la TOATE camerele din proiect dacă sunt 2 sau mai multe (fără calcule mixte)
8. Configurare aplicație mobilă — inclusă în manoperă

NICIODATĂ nu spune că instalarea sau cablul sunt incluse în prețul produsului.
Când estimezi costul total, menționează că prețul final depinde de metrajul cablului și complexitatea instalării.
Recomandă o vizită tehnică gratuită pentru un deviz exact.

CATALOG:
{CATALOG}

LIMBA: Răspunzi în limba clientului (română sau rusă).`;
