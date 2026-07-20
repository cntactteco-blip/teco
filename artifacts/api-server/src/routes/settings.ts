/**
 * API routes — toate datele via SQLite local (niciodată offline, gratuit permanent)
 *
 * GET  /api/settings
 * POST /api/settings
 * GET  /api/products
 * POST /api/products          (upsert)
 * DELETE /api/products/:id
 * GET  /api/leads
 * POST /api/leads             (upsert)
 * PATCH /api/leads/:id/status
 * PATCH /api/leads/:id/notes
 * DELETE /api/leads/:id
 * GET  /api/orders
 * POST /api/orders            (upsert)
 * PATCH /api/orders/:id/status
 * DELETE /api/orders/:id
 * GET  /api/blog-posts
 * POST /api/blog-posts        (upsert)
 * DELETE /api/blog-posts/:id
 */

import { Router, type Request, type Response } from "express";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import {
  getSettings, saveSettings,
  getProducts, upsertProduct, deleteProduct, seedProductsIfEmpty,
  getLeads, upsertLead, updateLeadStatus, updateLeadNotes, deleteLead,
  getOrders, upsertOrder, updateOrderStatus, deleteOrder,
  getBlogPosts, upsertBlogPost, deleteBlogPost,
} from "../db";

const router = Router();

// ─── Seed produse la pornire ──────────────────────────────────────────────────
function loadSnapshot(): { products: Record<string, unknown>[] } {
  const candidates = [
    resolve(process.cwd(), "../teco-md/src/lib/catalog-snapshot.json"),
    resolve(process.cwd(), "artifacts/teco-md/src/lib/catalog-snapshot.json"),
    resolve(process.cwd(), "../../artifacts/teco-md/src/lib/catalog-snapshot.json"),
  ];
  for (const p of candidates) {
    if (existsSync(p)) {
      try { return JSON.parse(readFileSync(p, "utf8")); } catch { continue; }
    }
  }
  console.warn("[routes] catalog-snapshot.json not found, skipping product seed");
  return { products: [] };
}

try {
  const snapshotProducts = loadSnapshot().products ?? [];
  if (snapshotProducts.length > 0) {
    seedProductsIfEmpty(snapshotProducts.map((p) => ({
      id: p.id,
      name: p.name,
      model: p.model ?? "",
      brand: p.brand ?? "",
      price: p.price ?? 0,
      old_price: (p as Record<string, unknown>).old_price ?? null,
      specs: p.specs ?? "",
      badge: p.badge ?? null,
      category: p.category ?? "",
      image_url: (p as Record<string, unknown>).image_url ?? "",
      images: p.images ?? [],
      description: p.description ?? "",
      long_description: null,
      tech_specs: null,
      in_stock: true,
      icon: p.icon ?? "camera",
    })));
  }
} catch (e) {
  console.warn("[routes/settings] seed failed:", e);
}

// ─── Settings ─────────────────────────────────────────────────────────────────

router.get("/settings", (_req: Request, res: Response) => {
  try {
    const data = getSettings();
    res.json({ data });
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post("/settings", (req: Request, res: Response) => {
  try {
    const body = req.body;
    if (!body || typeof body !== "object") { res.status(400).json({ error: "Invalid body" }); return; }
    saveSettings(body);
    res.json({ ok: true });
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// ─── Products ─────────────────────────────────────────────────────────────────

router.get("/products", (_req: Request, res: Response) => {
  try {
    res.json({ data: getProducts() });
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post("/products", (req: Request, res: Response) => {
  try {
    const body = req.body;
    const items = Array.isArray(body) ? body : [body];
    for (const p of items) upsertProduct(p as Record<string, unknown>);
    res.json({ ok: true });
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.put("/products/:id", (req: Request, res: Response) => {
  try {
    upsertProduct({ ...req.body, id: Number(req.params.id) });
    res.json({ ok: true });
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.delete("/products/:id", (req: Request, res: Response) => {
  try {
    deleteProduct(Number(req.params.id));
    res.json({ ok: true });
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// ─── Leads ────────────────────────────────────────────────────────────────────

router.get("/leads", (_req: Request, res: Response) => {
  try {
    res.json({ data: getLeads() });
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post("/leads", (req: Request, res: Response) => {
  try {
    const lead = req.body;
    if (!lead?.id) { res.status(400).json({ error: "Missing id" }); return; }
    upsertLead(lead as Record<string, unknown>);
    res.json({ ok: true });
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.patch("/leads/:id/status", (req: Request, res: Response) => {
  try {
    updateLeadStatus(req.params.id, req.body.status);
    res.json({ ok: true });
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.patch("/leads/:id/notes", (req: Request, res: Response) => {
  try {
    updateLeadNotes(req.params.id, req.body.notes ?? "");
    res.json({ ok: true });
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.delete("/leads/:id", (req: Request, res: Response) => {
  try {
    deleteLead(req.params.id);
    res.json({ ok: true });
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// ─── Orders ───────────────────────────────────────────────────────────────────

router.get("/orders", (_req: Request, res: Response) => {
  try {
    res.json({ data: getOrders() });
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post("/orders", (req: Request, res: Response) => {
  try {
    const order = req.body;
    if (!order?.id) { res.status(400).json({ error: "Missing id" }); return; }
    upsertOrder(order as Record<string, unknown>);
    res.json({ ok: true });
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.patch("/orders/:id/status", (req: Request, res: Response) => {
  try {
    updateOrderStatus(req.params.id, req.body.status);
    res.json({ ok: true });
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.delete("/orders/:id", (req: Request, res: Response) => {
  try {
    deleteOrder(req.params.id);
    res.json({ ok: true });
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// ─── Blog posts ───────────────────────────────────────────────────────────────

router.get("/blog-posts", (_req: Request, res: Response) => {
  try {
    res.json({ data: getBlogPosts() });
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post("/blog-posts", (req: Request, res: Response) => {
  try {
    const post = req.body;
    if (!post?.id) { res.status(400).json({ error: "Missing id" }); return; }
    upsertBlogPost(post as Record<string, unknown>);
    res.json({ ok: true });
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.delete("/blog-posts/:id", (req: Request, res: Response) => {
  try {
    deleteBlogPost(req.params.id);
    res.json({ ok: true });
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

export default router;
