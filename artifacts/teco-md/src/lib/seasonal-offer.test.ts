import test from "node:test";
import assert from "node:assert/strict";
import { seasonalOffer } from "./seasonal-offer.ts";
const october = new Date("2026-10-03T09:41:00Z");
test("monthly offer uses only valid in-stock reductions without overstating the discount", () => {
  const offer = seasonalOffer([{ price: 751, oldPrice: 1000, inStock: true }, { price: 100, oldPrice: 1000, inStock: false }, { price: 0, oldPrice: 1000 }, { price: 100, oldPrice: Infinity }, { price: 100, oldPrice: 90 }], "ro", october);
  assert.equal(offer.percent, 24);
  assert.equal(offer.href, "/produse?oferte=1");
  assert.match(offer.headline, /24%/);
  assert.equal(offer.label, "octombrie");
});
test("catalog without reductions gets a seasonal campaign without a discount claim", () => {
  const offer = seasonalOffer([{ price: 100, oldPrice: null }], "ro", october);
  assert.equal(offer.percent, null);
  assert.match(offer.headline, /serile lungi/);
  assert.equal(offer.href, "/seturi-camere-supraveghere");
  assert.doesNotMatch(offer.headline, /%/);
});
test("the campaign follows Chisinau month boundaries and supports Russian", () => {
  const offer = seasonalOffer([{ price: 800, oldPrice: 1000 }], "ru", new Date("2026-09-30T21:30:00Z"));
  assert.equal(offer.label, "октябрь");
  assert.match(offer.headline, /20%/);
});
