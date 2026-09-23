import test from "node:test";
import assert from "node:assert/strict";
import { callAI, groqJSON } from "./ai-provider.ts";

test("Groq quota failure tries the supported fallback and returns only final content", async t => {
  const calls: Record<string, unknown>[] = [];
  t.mock.method(globalThis, "fetch", async (_url: unknown, options: RequestInit) => {
    calls.push(JSON.parse(String(options.body)));
    return calls.length === 1 ? new Response("", { status: 429 }) : Response.json({ choices: [{ message: { content: "Oferta în MDL", reasoning: "private" } }] });
  });
  const response = await callAI("test-key", undefined, [{ role: "user", content: "4 camere" }]);
  assert.deepEqual(response, { content: "Oferta în MDL" });
  assert.deepEqual(calls.map(call => call.model), ["openai/gpt-oss-120b", "openai/gpt-oss-20b"]);
  assert.equal(calls[1].include_reasoning, false);
});

test("bad Groq credentials use the separately configured Gemini provider", async t => {
  const urls: string[] = [];
  t.mock.method(globalThis, "fetch", async (url: unknown) => {
    urls.push(String(url));
    return urls.length === 1 ? new Response("", { status: 401 }) : Response.json({ candidates: [{ content: { parts: [{ text: "Te pot ajuta." }] } }] });
  });
  assert.deepEqual(await callAI("test-key", "test-google", [{ role: "user", content: "Salut" }]), { content: "Te pot ajuta." });
  assert.equal(urls.length, 2);
  assert.ok(urls[1].includes("gemini-3.5-flash-lite:generateContent"));
});

test("missing keys, empty replies and provider errors are never reported as successful answers", async t => {
  await assert.rejects(callAI(undefined, undefined, []), error => (error as { code: string }).code === "AI_AUTH_ERROR");
  t.mock.method(globalThis, "fetch", async () => Response.json({ choices: [] }));
  await assert.rejects(groqJSON("test-key", []), error => (error as { code: string }).code === "AI_EMPTY_RESPONSE");
});
