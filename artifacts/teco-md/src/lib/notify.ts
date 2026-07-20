/**
 * Telegram lead notifier — apel simplu după orice addLead().
 * Sesiunea e deja inițializată de SessionTracker din App.tsx.
 */
import { getSessionPayload } from "@/lib/session";

const API = import.meta.env.VITE_API_URL || "";

export interface LeadData {
  name: string;
  phone: string;
  source: string;
  notes?: string;
}

export function notifyLead(data: LeadData): void {
  try {
    fetch(API + "/api/notify/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, session: getSessionPayload() }),
    }).catch(() => {});
  } catch {}
}
