/**
 * /api/settings  — citire/scriere setări via Supabase service role key
 * /api/products  — CRUD produse via Supabase service role key
 *
 * Aceste rute există pentru că frontend-ul poate folosi anon key (restricționat
 * de RLS), dar api-server-ul are SUPABASE_SERVICE_ROLE_KEY care bypasează RLS.
 * Salvările din admin trec prin aceste rute → ajung sigur în Supabase.
 */

import { Router, type Request, type Response } from "express";
import { createClient } from "@supabase/supabase-js";

const router = Router();

// ─── Client cu service role (bypass RLS) ─────────────────────────────────────
function db() {
  const url = process.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

// ─── GET /api/settings ────────────────────────────────────────────────────────
router.get("/settings", async (_req: Request, res: Response) => {
  const client = db();
  if (!client) { res.status(503).json({ error: "Supabase not configured" }); return; }

  try {
    const { data, error } = await (client as any)
      .from("settings")
      .select("*")
      .eq("id", 1)
      .single();

    if (error && error.code !== "PGRST116") {
      res.status(500).json({ error: error.message });
      return;
    }
    res.json({ data: data?.data ?? null });
  } catch (e: any) {
    res.status(500).json({ error: e?.message ?? "unknown error" });
  }
});

// ─── POST /api/settings ───────────────────────────────────────────────────────
router.post("/settings", async (req: Request, res: Response) => {
  const client = db();
  if (!client) { res.status(503).json({ error: "Supabase not configured" }); return; }

  const settings = req.body;
  if (!settings || typeof settings !== "object") {
    res.status(400).json({ error: "Invalid body" });
    return;
  }

  try {
    const { error } = await (client as any)
      .from("settings")
      .upsert({ id: 1, data: settings });

    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e?.message ?? "unknown error" });
  }
});

// ─── GET /api/products ────────────────────────────────────────────────────────
router.get("/products", async (_req: Request, res: Response) => {
  const client = db();
  if (!client) { res.status(503).json({ error: "Supabase not configured" }); return; }

  try {
    const { data, error } = await (client as any)
      .from("products")
      .select("*")
      .order("id");

    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ data: data ?? [] });
  } catch (e: any) {
    res.status(500).json({ error: e?.message ?? "unknown error" });
  }
});

// ─── POST /api/products — insert one product ──────────────────────────────────
router.post("/products", async (req: Request, res: Response) => {
  const client = db();
  if (!client) { res.status(503).json({ error: "Supabase not configured" }); return; }

  const product = req.body;
  if (!product || typeof product !== "object") {
    res.status(400).json({ error: "Invalid body" });
    return;
  }

  try {
    const { data, error } = await (client as any)
      .from("products")
      .upsert(Array.isArray(product) ? product : [product])
      .select();

    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ data });
  } catch (e: any) {
    res.status(500).json({ error: e?.message ?? "unknown error" });
  }
});

// ─── PUT /api/products/:id — update product ───────────────────────────────────
router.put("/products/:id", async (req: Request, res: Response) => {
  const client = db();
  if (!client) { res.status(503).json({ error: "Supabase not configured" }); return; }

  const id = Number(req.params.id);
  const patch = req.body;
  if (!patch || typeof patch !== "object") {
    res.status(400).json({ error: "Invalid body" });
    return;
  }

  try {
    const { error } = await (client as any)
      .from("products")
      .update(patch)
      .eq("id", id);

    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e?.message ?? "unknown error" });
  }
});

// ─── DELETE /api/products/:id — delete one product ───────────────────────────
router.delete("/products/:id", async (req: Request, res: Response) => {
  const client = db();
  if (!client) { res.status(503).json({ error: "Supabase not configured" }); return; }

  const id = Number(req.params.id);
  try {
    const { error } = await (client as any)
      .from("products")
      .delete()
      .eq("id", id);

    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e?.message ?? "unknown error" });
  }
});

export default router;
