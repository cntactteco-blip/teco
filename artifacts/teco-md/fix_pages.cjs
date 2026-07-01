const fs = require('fs');

// ── 1. Cele 3 pagini simple ──
const pages = [
  { file: 'src/pages/Termeni.tsx', key: 'termeni', title: 'Termeni și Condiții' },
  { file: 'src/pages/Confidentialitate.tsx', key: 'confidentialitate', title: 'Politica de Confidențialitate' },
  { file: 'src/pages/Garantii.tsx', key: 'garantii', title: 'Garanții și Retur' },
];

for (const { file, key, title } of pages) {
  fs.writeFileSync(file, `import { useStore } from "@/lib/store";
export default function Page() {
  const content = useStore((s) => (s.settings.staticPages as Record<string,string> | undefined)?.[${JSON.stringify(key)}] ?? "");
  return (
    <main className="max-w-3xl mx-auto px-5 py-12">
      <h1 className="text-3xl font-black text-[#09090B] mb-8">${title}</h1>
      <div className="prose prose-zinc max-w-none whitespace-pre-wrap text-zinc-700 leading-relaxed">
        {content || <p className="text-zinc-400 italic">Conținut în curs de completare...</p>}
      </div>
    </main>
  );
}
`);
  console.log('OK: ' + file);
}

// ── 2. App.tsx: adauga rute si importuri ──
let app = fs.readFileSync('src/App.tsx', 'utf8');

// importuri
const oldImport = `import { Services } from "@/pages/Services";`;
const newImport = `import { Services } from "@/pages/Services";
import Termeni from "@/pages/Termeni";
import Confidentialitate from "@/pages/Confidentialitate";
import Garantii from "@/pages/Garantii";`;

// fallback daca importul Services e diferit
const altImport = app.includes('Services') && !app.includes('import Termeni');

if (!app.includes('import Termeni')) {
  // gasim primul import de pagina si adaugam dupa ultimul import
  const lastImportMatch = [...app.matchAll(/^import .+ from .+;\n/gm)];
  if (lastImportMatch.length > 0) {
    const last = lastImportMatch[lastImportMatch.length - 1];
    const insertAt = last.index + last[0].length;
    app = app.slice(0, insertAt) + 
      'import Termeni from "@/pages/Termeni";\nimport Confidentialitate from "@/pages/Confidentialitate";\nimport Garantii from "@/pages/Garantii";\n' +
      app.slice(insertAt);
    console.log('OK: importuri adaugate in App.tsx');
  }
}

// rute
const oldRoute = `        <Route path="/blog/:slug" component={BlogPost} />`;
const newRoute = `        <Route path="/blog/:slug" component={BlogPost} />
        <Route path="/termeni" component={Termeni} />
        <Route path="/confidentialitate" component={Confidentialitate} />
        <Route path="/garantii" component={Garantii} />`;

if (!app.includes('/termeni')) {
  app = app.replace(oldRoute, newRoute);
  console.log('OK: rute adaugate in App.tsx');
}

fs.writeFileSync('src/App.tsx', app);

// ── 3. store.ts: adauga staticPages in ModuleSettings ──
let store = fs.readFileSync('src/lib/store.ts', 'utf8');
if (!store.includes('staticPages')) {
  store = store.replace(
    'homeText?: {',
    'staticPages?: Record<string, string>;\n  homeText?: {'
  );
  fs.writeFileSync('src/lib/store.ts', store);
  console.log('OK: staticPages adaugat in store.ts');
}

