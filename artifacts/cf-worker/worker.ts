import Groq from "groq-sdk";

export default {
  async fetch(request: Request, env: any, ctx: ExecutionContext): Promise<Response> {
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
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: buildBlogPrompt(topic) }],
        max_tokens: 6000,
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

    if (url.pathname === "/api/ai/business-insights" && request.method === "POST") {
      try {
        const { orders, leads, products } = await request.json() as any;
        const ordersShort = (orders ?? []).slice(0,5).map((o:any) => ({ id: o.id, total: o.total, status: o.status }));
        const leadsShort = (leads ?? []).slice(0,5).map((l:any) => ({ name: l.name, phone: l.phone, status: l.status }));
        const productsShort = (products ?? []).slice(0,5).map((p:any) => ({ name: p.name, price: p.price }));
        const prompt = `Esti consultant Teco.md. Analizeaza datele si raspunde STRICT JSON fara markdown:\nComenzi: ${JSON.stringify(ordersShort)}\nLead-uri: ${JSON.stringify(leadsShort)}\nProduse: ${JSON.stringify(productsShort)}\n{"summary":"...","topProducts":["..."],"recommendations":["..."],"leadInsights":"...","revenue":"..."}`;
        const result = await groq.chat.completions.create({ model: "llama-3.3-70b-versatile", messages: [{ role: "user", content: prompt }], max_tokens: 2048 });
        const text = result.choices[0]?.message?.content ?? "{}";
        const clean = text.replace(/```json|```/g, "").trim();
        return new Response(clean, { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } catch(e:any) {
        return new Response(JSON.stringify({error: String(e)}), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }
    if (url.pathname === "/api/ai/import-products" && request.method === "POST") {
      try {
        const { csvData, usdRate, markup, fileName } = await request.json() as any;
        const rate = parseFloat(usdRate) || 17.8;
        const mkp = parseFloat(markup) || 0;
        const csvStr = String(csvData).slice(0, 14000);
        const prompt = `Esti expert in import date din price list-uri de camere supraveghere.
Analizeaza acest CSV si extrage TOATE produsele valide.
Fisier: ${fileName}, Curs USD/MDL: ${rate}, Markup: ${mkp}%

DATE CSV:
${csvStr}

REGULI STRICTE:
- Coloane posibile: Model/SKU, Denumire/Denumire Deplina, Dealer USD, Pret MDL / Pret MDL la zi, RRP
- PARSARE PRETURI: elimina "lei", "$", " " si virgule din numere. Ex: "499 lei" -> 499, "1,129 lei" -> 1129, "$28.00" -> 28
- DACA exista coloana "Pret MDL" sau "Pret MDL la zi" cu valori > 0: foloseste-o ca "price" (numarul MDL, fara "lei")
- DACA exista coloana "RRP" cu valori > 0: foloseste-o ca "oldPrice" (numarul MDL, fara "lei")
- DACA exista doar "Dealer USD": price = round(dealer_usd * ${rate} * (1 + ${mkp}/100))
- Asigura-te ca oldPrice > price; daca nu: nu include oldPrice
- Brand: detecteaza din numele fisierului sau din date (IMOU, Dahua, Hikvision, UNV, Uniarch, Tiandy etc.)
- Categorii valide: Camere IP, NVR, DVR, PTZ, Dome, Bullet, Kituri, Accesorii, Switch PoE
- specs: rezolutie + tip + caracteristici cheie (max 80 chars)
- description: 2 propozitii SEO romana pentru Moldova
- Ignora randurile cu pret 0, randuri goale, randuri care sunt headere/subtitluri sau au "0 lei"
- Extrage TOATE produsele cu denumire si pret valid (chiar si 50+ produse)

Returneaza DOAR array JSON valid, fara markdown, fara explicatii:
[{"name":"Denumire scurta","model":"SKU","brand":"IMOU","price":999,"oldPrice":1299,"category":"Camere IP","specs":"4MP, dome, IR 30m","description":"Camera IP dome IMOU 4MP ideala pentru interior si exterior in Moldova.","inStock":true}]`;

        const result = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 6000,
        });
        const text = result.choices[0]?.message?.content ?? "[]";
        const clean = text.replace(/```json|```/g, "").trim();
        const match = clean.match(/\[[\s\S]*\]/);
        const json = match ? match[0] : clean;
        return new Response(json, { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } catch(e: any) {
        const errMsg = e?.message || String(e);
        const errStatus = e?.status || e?.statusCode || 500;
        return new Response(JSON.stringify({ error: errMsg, status: errStatus }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }
    if (url.pathname === "/api/ai/blog-image" && request.method === "POST") {
      const { title } = await request.json() as any;
      const prompt = `modern 2024 IP security camera dome or bullet style, installed on contemporary building facade, night city lights bokeh background, photorealistic, sharp focus, professional product photography, 4K quality, no text, no watermark`;
      const response = await (env as any).AI.run("@cf/stabilityai/stable-diffusion-xl-base-1.0", { prompt });
      const buffer = await response.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = "";
      for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
      const base64 = btoa(binary);
      return new Response(JSON.stringify({ imageUrl: "data:image/png;base64," + base64 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ─── Telegram Notify Routes ──────────────────────────────────────────────

    // Throttle vizitatori unici (in-memory per Worker instance, suficient pentru trafic normal)
    const notifiedSessions = (env as any).__notifiedSessions ??= new Set<string>();

    if ((url.pathname === "/api/notify/visitor") && request.method === "POST") {
      const body = await request.json() as any;
      const session = body.session ?? body;
      const sid = session.sessionId as string | undefined;
      if (sid && notifiedSessions.has(sid)) return new Response(JSON.stringify({ ok: true, skipped: "dup" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (sid) notifiedSessions.add(sid);
      if (notifiedSessions.size > 5000) notifiedSessions.clear();
      ctx.waitUntil(sendTgVisitor(env, session));
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if ((url.pathname === "/api/notify/chat-notify" || url.pathname === "/api/chat-notify") && request.method === "POST") {
      const { message = "", page = "/", session = {} } = await request.json() as any;
      ctx.waitUntil(sendTgFirstMessage(env, { message, page, session }));
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (url.pathname === "/api/notify/chat-lead" && request.method === "POST") {
      const { name = "", phone = "", messages = [], session = {} } = await request.json() as any;
      ctx.waitUntil(sendTgLeadChat(env, { name, phone, messages, session }));
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (url.pathname === "/api/notify/calculator" && request.method === "POST") {
      const { name = "", phone = "", selections = {}, equipmentCost = 0, installCost = 0, totalCost = 0, session = {} } = await request.json() as any;
      ctx.waitUntil(sendTgCalculator(env, { name, phone, selections, equipmentCost, installCost, totalCost, session }));
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response("Not found", { status: 404, headers: corsHeaders });
  },
};

// ─── Telegram helpers ────────────────────────────────────────────────

function tgEsc(s: string): string {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function tgFlag(country: string): string {
  const m: Record<string, string> = { Moldova: "🇲🇩", Romania: "🇷🇴", Germany: "🇩🇪", Italy: "🇮🇹", France: "🇫🇷", "United Kingdom": "🇬🇧", "United States": "🇺🇸", Ukraine: "🇺🇦", Russia: "🇷🇺", Israel: "🇮🇱", Spain: "🇪🇸" };
  return m[country] || "🌍";
}

function tgSource(ref: string, utm: string, med: string): string {
  if (utm) return `${utm}${med ? ` (${med})` : ""}`;
  if (!ref) return "Direct";
  try { const h = new URL(ref).hostname; if (h.includes("google")) return "Google"; if (h.includes("facebook") || h.includes("fb.com")) return "Facebook"; if (h.includes("instagram")) return "Instagram"; return h; } catch { return "Direct"; }
}

function tgTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("ro-MD", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Chisinau" });
}

function tgDur(s: number): string {
  if (s < 60) return `${s}s`; const m = Math.floor(s / 60); const r = s % 60; return r ? `${m}m ${r}s` : `${m}m`;
}

async function tgSend(env: any, text: string): Promise<void> {
  const token = (env.TELEGRAM_BOT_TOKEN as string | undefined)?.trim();
  const chatId = (env.TELEGRAM_CHAT_ID as string | undefined)?.trim();
  if (!token || !chatId) { console.error("Telegram: missing BOT_TOKEN or CHAT_ID"); return; }
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: text.slice(0, 4096), parse_mode: "HTML", disable_web_page_preview: true }),
    });
    const d = await res.json() as any;
    if (!d.ok) console.error("Telegram error:", JSON.stringify(d));
    else console.log("Telegram OK, message_id:", d.result?.message_id);
  } catch (e) { console.error("tgSend exception:", e); }
}

async function sendTgVisitor(env: any, s: any): Promise<void> {
  const loc = [s.city, s.country].filter(Boolean).join(", ");
  const src = tgSource(s.referrer || "", s.utmSource || "", s.utmMedium || "");
  const dev = s.deviceType === "mobile" ? "📱 Mobil" : s.deviceType === "tablet" ? "📊 Tabletă" : "💻 Desktop";
  const page = s.pages?.[0]?.path || "/";
  await tgSend(env, [
    `🔔 <b>Vizitator Nou pe Teco.md</b>`,
    ``,
    `🕐 ${tgTime(s.startedAt || Date.now())}  ${tgFlag(s.country || "")} <b>${tgEsc(loc || "Locație necunoscută")}</b>`,
    `🌐 Sursă: <b>${tgEsc(src)}</b>`,
    `📄 Pagină: <code>${tgEsc(page)}</code>`,
    `${dev}  |  ${tgEsc(s.browser || "Browser")}`,
    s.isp ? `🔌 ${tgEsc(s.isp)}` : "",
  ].filter(Boolean).join("\n"));
}

async function sendTgFirstMessage(env: any, p: { message: string; page: string; session: any }): Promise<void> {
  const s = p.session;
  const loc = [s.city, s.country].filter(Boolean).join(", ");
  await tgSend(env, [
    `💬 <b>TecoBot — Mesaj Nou</b>`,
    ``,
    `🕐 ${tgTime(s.startedAt || Date.now())}  ${tgFlag(s.country || "")} <b>${tgEsc(loc || "?")}</b>`,
    `🌐 Sursă: ${tgEsc(tgSource(s.referrer || "", s.utmSource || "", s.utmMedium || ""))}`,
    `📄 Pagina: <code>${tgEsc(p.page)}</code>`,
    ``,
    `👤 <i>"${tgEsc(p.message)}"</i>`,
  ].join("\n"));
}

async function sendTgLeadChat(env: any, p: { name: string; phone: string; messages: any[]; session: any }): Promise<void> {
  const { name, phone, messages, session: s } = p;
  const loc = [s.city, s.country].filter(Boolean).join(", ");
  const pagesText = (s.pages || []).map((pg: any) => `• ${tgEsc(pg.path)}`).slice(0, 8).join("\n") || "• /";
  const transcript = messages.filter((m: any) => !m.content.includes("LEAD_CAPTURED")).slice(-20)
    .map((m: any) => `${m.role === "user" ? "👤" : "🤖"} ${tgEsc(m.content.replace(/LEAD_CAPTURED:[^\n]*/g, "").trim().slice(0, 300))}`).join("\n");
  await tgSend(env, [
    `🤖 <b>Lead Nou — TecoBot AI</b>`,
    ``,
    `👤 <b>${tgEsc(name)}</b>  |  📞 <code>${tgEsc(phone)}</code>`,
    ``,
    `🕐 ${tgTime(s.startedAt || Date.now())}  ${tgFlag(s.country || "")} ${tgEsc(loc || "?")}`,
    `🌐 Sursă: ${tgEsc(tgSource(s.referrer || "", s.utmSource || "", s.utmMedium || ""))}  |  ⏱ ${tgDur(s.duration ?? 0)}`,
    ``,
    `📄 <b>Pagini vizitate:</b>`,
    pagesText,
    ``,
    `💬 <b>Conversație:</b>`,
    `─────────────────`,
    transcript,
    `─────────────────`,
  ].join("\n"));
}

async function sendTgCalculator(env: any, p: { name: string; phone: string; selections: any; equipmentCost: number; installCost: number; totalCost: number; session: any }): Promise<void> {
  const { name, phone, selections: sel, equipmentCost, installCost, totalCost, session: s } = p;
  const loc = [s.city, s.country].filter(Boolean).join(", ");
  const pagesSum = (s.pages || []).map((pg: any) => pg.path).slice(0, 5).join(" → ") || "/";
  await tgSend(env, [
    `🧮 <b>Lead Nou — Calculator Cost</b>`,
    ``,
    `👤 <b>${tgEsc(name || "Anonim")}</b>  |  📞 <code>${tgEsc(phone)}</code>`,
    ``,
    `🕐 ${tgTime(s.startedAt || Date.now())}  ${tgFlag(s.country || "")} ${tgEsc(loc || "?")}`,
    `🌐 Sursă: ${tgEsc(tgSource(s.referrer || "", s.utmSource || "", s.utmMedium || ""))}  |  ⏱ ${tgDur(s.duration ?? 0)}`,
    ``,
    `🎯 <b>Ce vrea clientul:</b>`,
    `• Obiectiv: ${tgEsc(sel.objective || "—")}`,
    `• Camere: ${tgEsc(sel.cameras || "—")}`,
    `• Stocare: ${tgEsc(sel.storage || "—")}`,
    `• Instalare: ${tgEsc(sel.installation || "—")}`,
    ``,
    `💰 <b>Estimare calculată:</b>`,
    `• Echipament: ~${Number(equipmentCost).toLocaleString("ro-MD")} MDL`,
    `• Instalare: ~${Number(installCost).toLocaleString("ro-MD")} MDL`,
    `• <b>Total: ~${Number(totalCost).toLocaleString("ro-MD")} MDL</b>`,
    ``,
    `📄 Pagini: <i>${tgEsc(pagesSum)}</i>`,
  ].join("\n"));
}

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
  return `Ești un expert SEO și content writer pentru Teco.md — magazin de sisteme de supraveghere din Moldova.\n\nScrie un articol de blog complet și optimizat SEO despre: "${topic}"\n\nReturnează STRICT JSON valid (fără markdown, fără \`\`\`), cu structura exactă:\n{\n  "title": "titlu atractiv în română (max 65 caractere)",\n  "titleRu": "titlu în rusă",\n  "slug": "slug-url-fara-diacritice-cu-liniute",\n  "category": "Ghiduri",\n  "categoryRu": "Руководства",\n  "description": "meta description SEO română (150-160 caractere)",\n  "descriptionRu": "meta description rusă",\n  "metaTitle": "meta title română",\n  "metaTitleRu": "meta title rusă",\n  "metaDescription": "meta description română",\n  "metaDescriptionRu": "meta description rusă",\n  "keywords": "cuvinte, cheie",\n  "keywordsRu": "ключевые, слова",\n  "content": "articol complet în română în format Markdown, minim 200 cuvinte",\n  "contentRu": "articol complet în rusă în format Markdown, minim 200 cuvinte"\n}`;
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
