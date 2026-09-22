const GROQ_API        = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL_MAIN = "openai/gpt-oss-120b";
const GROQ_MODEL_FAST = "openai/gpt-oss-20b";

export type GMsg = { role: "system" | "user" | "assistant"; content: string };

type AICode = "AI_AUTH_ERROR" | "AI_RATE_LIMITED" | "AI_TIMEOUT" | "AI_PROVIDER_ERROR" | "AI_EMPTY_RESPONSE";
type GroqResult = { ok: true; content: string } | { ok: false; code: AICode; status: number; retryable: boolean };

export class AIProviderError extends Error {
  code: AICode;
  status: number;
  constructor(code: AICode, status: number) {
    super(code);
    this.name = "AIProviderError";
    this.code = code;
    this.status = status;
  }
}

async function groqCall(apiKey: string, model: string, messages: GMsg[], maxTokens = 1024, timeoutMs = 25000): Promise<GroqResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(GROQ_API, {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages, max_completion_tokens: Math.max(2048, maxTokens * 2), stream: false, reasoning_effort: "low", include_reasoning: false }),
      signal: controller.signal,
    });
    if (resp.ok) {
      const data = await resp.json() as any;
      const content = data?.choices?.[0]?.message?.content;
      if (typeof content === "string" && content.trim()) return { ok: true, content };
      return { ok: false, code: "AI_EMPTY_RESPONSE", status: 502, retryable: true };
    }
    if (resp.status === 401 || resp.status === 403) {
      return { ok: false, code: "AI_AUTH_ERROR", status: 503, retryable: false };
    }
    if (resp.status === 429) {
      return { ok: false, code: "AI_RATE_LIMITED", status: 429, retryable: true };
    }
    return { ok: false, code: "AI_PROVIDER_ERROR", status: 502, retryable: resp.status >= 500 || resp.status === 404 };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return { ok: false, code: "AI_TIMEOUT", status: 504, retryable: true };
    }
    return { ok: false, code: "AI_PROVIDER_ERROR", status: 502, retryable: true };
  } finally {
    clearTimeout(timer);
  }
}

async function geminiCall(apiKey: string, messages: GMsg[], maxTokens = 1024): Promise<GroqResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  const system = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
  const contents = messages.filter((m) => m.role !== "system").map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  try {
    const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: system ? { parts: [{ text: system }] } : undefined,
        contents,
        generationConfig: { maxOutputTokens: maxTokens, temperature: 0.55 },
      }),
      signal: controller.signal,
    });
    if (resp.ok) {
      const data = await resp.json() as any;
      const content = data?.candidates?.[0]?.content?.parts?.map((part: any) => part?.text ?? "").join("");
      if (typeof content === "string" && content.trim()) return { ok: true, content };
      return { ok: false, code: "AI_EMPTY_RESPONSE", status: 502, retryable: false };
    }
    if (resp.status === 401 || resp.status === 403) return { ok: false, code: "AI_AUTH_ERROR", status: 503, retryable: false };
    if (resp.status === 429) return { ok: false, code: "AI_RATE_LIMITED", status: 429, retryable: false };
    return { ok: false, code: "AI_PROVIDER_ERROR", status: 502, retryable: false };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") return { ok: false, code: "AI_TIMEOUT", status: 504, retryable: false };
    return { ok: false, code: "AI_PROVIDER_ERROR", status: 502, retryable: false };
  } finally {
    clearTimeout(timer);
  }
}

export async function callAI(groqKey: string | undefined, geminiKey: string | undefined, messages: GMsg[], maxTokens = 1024): Promise<{ content: string }> {
  let lastFailure: Exclude<GroqResult, { ok: true }> = { ok: false, code: "AI_AUTH_ERROR", status: 503, retryable: false };

  if (groqKey) {
    const main = await groqCall(groqKey, GROQ_MODEL_MAIN, messages, maxTokens, 8000);
    if (main.ok) return { content: main.content };
    lastFailure = main;

    if (main.retryable) {
      const fast = await groqCall(groqKey, GROQ_MODEL_FAST, messages, maxTokens, 8000);
      if (fast.ok) return { content: fast.content };
      lastFailure = fast;
    }
  }

  if (geminiKey) {
    const gemini = await geminiCall(geminiKey, messages, maxTokens);
    if (gemini.ok) return { content: gemini.content };
    lastFailure = gemini;
  }

  throw new AIProviderError(lastFailure.code, lastFailure.status);
}

// wrapper simplu pentru rutele non-chat
export async function groqJSON(apiKey: string, messages: GMsg[], maxTokens = 1024): Promise<string> {
  const r = await groqCall(apiKey, GROQ_MODEL_MAIN, messages, maxTokens);
  if (r.ok) return r.content;
  const r2 = await groqCall(apiKey, GROQ_MODEL_FAST, messages, maxTokens);
  if (r2.ok) return r2.content;
  throw new AIProviderError(r2.code, r2.status);
}
