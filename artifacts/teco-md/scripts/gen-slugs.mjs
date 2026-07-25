import fs from "fs";

const raw = JSON.parse(fs.readFileSync("/tmp/products.json", "utf8"));
const rows = raw[0].results;

const CYRILLIC = {
  а:"a",б:"b",в:"v",г:"g",д:"d",е:"e",ё:"e",ж:"zh",з:"z",и:"i",й:"i",
  к:"k",л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",ф:"f",
  х:"h",ц:"ts",ч:"ch",ш:"sh",щ:"sht",ъ:"",ы:"y",ь:"",э:"e",ю:"iu",я:"ia"
};

function slugify(str) {
  let s = str.toLowerCase();
  s = s.replace(/[а-яё]/g, (c) => CYRILLIC[c] ?? "");
  s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // diacritice RO/latine
  s = s.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").replace(/-{2,}/g, "-");
  return s.slice(0, 80).replace(/-+$/g, "");
}

const seen = new Map();
const lines = [];
for (const row of rows) {
  let slug = slugify(row.name);
  if (!slug) slug = `produs-${row.id}`;
  if (seen.has(slug)) {
    slug = `${slug}-${row.id}`;
  }
  seen.set(slug, row.id);
  const escaped = slug.replace(/'/g, "''");
  lines.push(`UPDATE products SET slug = '${escaped}' WHERE id = ${row.id};`);
}

fs.writeFileSync("/tmp/slugs.sql", lines.join("\n") + "\n");
console.log(`Generat ${lines.length} sluguri în /tmp/slugs.sql`);
console.log(lines.slice(0, 5).join("\n"));
