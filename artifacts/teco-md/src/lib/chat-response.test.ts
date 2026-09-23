import assert from "node:assert/strict";
import test from "node:test";
import { readChatResponse } from "./chat-response.ts";

test("citește răspunsul JSON al Pages API", async () => {
  const updates: string[] = [];
  const response = new Response(JSON.stringify({ content: "Salut din JSON" }), {
    headers: { "content-type": "application/json" },
  });
  assert.equal(await readChatResponse(response, (value) => updates.push(value)), "Salut din JSON");
  assert.deepEqual(updates, ["Salut din JSON"]);
});

test("recompune corect evenimente SSE tăiate între pachete", async () => {
  const encoder = new TextEncoder();
  const parts = [
    'data: {"content":"Bună, "}\n\ndata: {"cont',
    'ent":"Andrei"}\n\ndata: {"done":true}\n\n',
  ];
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const part of parts) controller.enqueue(encoder.encode(part));
      controller.close();
    },
  });
  const response = new Response(body, { headers: { "content-type": "text/event-stream" } });
  assert.equal(await readChatResponse(response), "Bună, Andrei");
});

test("transformă erorile API în excepții clare", async () => {
  const response = new Response(JSON.stringify({ error: "temporar indisponibil" }), {
    status: 503,
    headers: { "content-type": "application/json" },
  });
  await assert.rejects(() => readChatResponse(response), /AI_UNAVAILABLE/);
});
