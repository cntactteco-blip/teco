export type ChatUpdate = (content: string) => void;

type ChatPayload = {
  content?: unknown;
  error?: unknown;
  done?: unknown;
};

function errorFromStatus(status: number): Error {
  if (status === 429) return new Error("AI_RATE_LIMITED");
  if (status === 503) return new Error("AI_UNAVAILABLE");
  if (status === 504) return new Error("AI_TIMEOUT");
  return new Error("AI_REQUEST_FAILED");
}

/** Citește atât răspunsul JSON al Pages API, cât și fluxul SSE al Worker-ului vechi. */
export async function readChatResponse(response: Response, onUpdate?: ChatUpdate): Promise<string> {
  if (!response.ok) throw errorFromStatus(response.status);

  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  if (contentType.includes("application/json")) {
    const data = await response.json() as ChatPayload;
    if (typeof data.error === "string" && !data.content) throw new Error(data.error);
    if (typeof data.content !== "string" || !data.content.trim()) throw new Error("AI_EMPTY_RESPONSE");
    onUpdate?.(data.content);
    return data.content;
  }

  if (!response.body) throw new Error("AI_EMPTY_RESPONSE");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let accumulated = "";
  let finished = false;

  const consumeLine = (line: string) => {
    const trimmed = line.trimEnd();
    if (!trimmed.startsWith("data:")) return;
    const raw = trimmed.slice(5).trimStart();
    if (!raw || raw === "[DONE]") { finished = true; return; }

    let data: ChatPayload;
    try {
      data = JSON.parse(raw) as ChatPayload;
    } catch {
      return;
    }
    if (data.done) { finished = true; return; }
    if (typeof data.error === "string") throw new Error(data.error);
    if (typeof data.content === "string" && data.content) {
      accumulated += data.content;
      onUpdate?.(accumulated);
    }
  };

  while (!finished) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      consumeLine(line);
      if (finished) break;
    }
    if (done) break;
  }
  if (buffer && !finished) consumeLine(buffer);
  if (!accumulated.trim()) throw new Error("AI_EMPTY_RESPONSE");
  return accumulated;
}
