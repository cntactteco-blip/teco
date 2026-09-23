import assert from "node:assert/strict";
import test from "node:test";
import { resolveCategorySlug } from "./category-routing.ts";

test("păstrează categoriile existente", () => {
  assert.equal(resolveCategorySlug("wifi", [{ id: "wifi", slug: "wifi" }], ["wifi"]), "wifi");
});

test("rezolvă vechiul link kituri după redenumirea categoriei", () => {
  const categories = [{ id: "seturi", slug: "Seturi-Complete-Camere-Supraveghere", label: "Seturi complete camere" }];
  assert.equal(
    resolveCategorySlug("kituri", categories, ["Seturi-Complete-Camere-Supraveghere"]),
    "Seturi-Complete-Camere-Supraveghere",
  );
});

test("rezolvă alarme chiar dacă slugul conține spații", () => {
  const categories = [{ id: "alarm", slug: "Sisteme-De-Alarma ", label: "Sisteme de alarmă" }];
  assert.equal(resolveCategorySlug("alarme", categories, ["Sisteme-De-Alarma "]), "Sisteme-De-Alarma ");
});
