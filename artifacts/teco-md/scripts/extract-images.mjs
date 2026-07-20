/**
 * extract-images.mjs
 * Extrage imaginile base64 din catalog-snapshot.json în fișiere statice
 * în public/product-images/ și înlocuiește base64 cu URL-uri relative.
 *
 * Rulează: node scripts/extract-images.mjs
 */

import { writeFileSync, mkdirSync, readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SNAPSHOT_PATH = path.join(__dirname, "../src/lib/catalog-snapshot.json");
const IMG_DIR = path.join(__dirname, "../public/product-images");

mkdirSync(IMG_DIR, { recursive: true });

const snapshot = JSON.parse(readFileSync(SNAPSHOT_PATH, "utf8"));

let extracted = 0;
let skipped = 0;

function extractBase64(dataUrl, filePath) {
  if (!dataUrl || !dataUrl.startsWith("data:")) return dataUrl;
  const match = dataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!match) return dataUrl;
  const [, ext, b64] = match;
  const actualExt = ext === "jpeg" ? "jpg" : ext;
  const fullPath = filePath.endsWith(`.${actualExt}`)
    ? filePath
    : `${filePath}.${actualExt}`;
  writeFileSync(fullPath, Buffer.from(b64, "base64"));
  extracted++;
  return `/product-images/${path.basename(fullPath)}`;
}

for (const product of snapshot.products) {
  // imagine principală
  if (product.image_url?.startsWith("data:")) {
    product.image_url = extractBase64(
      product.image_url,
      path.join(IMG_DIR, `${product.id}.jpg`)
    );
  } else {
    skipped++;
  }

  // galerie imagini suplimentare
  if (Array.isArray(product.images)) {
    product.images = product.images.map((img, idx) => {
      if (typeof img === "string" && img.startsWith("data:")) {
        return extractBase64(img, path.join(IMG_DIR, `${product.id}-${idx}.jpg`));
      }
      return img;
    });
  }
}

writeFileSync(SNAPSHOT_PATH, JSON.stringify(snapshot));

const newSize = Buffer.byteLength(readFileSync(SNAPSHOT_PATH));
console.log(`[extract-images] Extrase: ${extracted} imagini → public/product-images/`);
console.log(`[extract-images] Sărite (deja URL): ${skipped}`);
console.log(`[extract-images] Snapshot nou: ${(newSize / 1024).toFixed(0)} KB`);
