export function jsonRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Răspuns JSON invalid");
  }
  return value as Record<string, unknown>;
}

export async function readStringRecord(response: Response): Promise<Record<string, string>> {
  const data = jsonRecord(await response.json());
  return Object.fromEntries(
    Object.entries(data).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
  );
}
