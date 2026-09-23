# TECO.md — verificare și publicare pe Cloudflare Pages

Proiectul folosește Cloudflare Pages Functions, D1 și KV. Instrucțiunile vechi de publicare cu Supabase și un fallback SPA pentru toate adresele nu se mai aplică.

## Configurația build-ului

Pentru un proiect Pages cu rădăcina la nivelul acestui repository:

| Setare | Valoare |
| --- | --- |
| Framework preset | None |
| Root directory | Rădăcina repository-ului |
| Build command | `pnpm install --frozen-lockfile && pnpm --filter @workspace/teco-md run cf-build` |
| Build output directory | `artifacts/teco-md/dist/public` |

Functions de la rădăcină importă implementarea din `artifacts/teco-md`. Dacă proiectul existent are rădăcina build-ului în `artifacts/teco-md`, păstrează configurația monorepo funcțională și folosește ieșirea `dist/public`; directorul `functions` local este inclus. Verifică configurația actuală înainte de modificarea ei.

Build-ul `cf-build` citește catalogul, setările și articolele publicate din D1, construiește aplicația și generează HTML pentru pagini, sitemap-ul și `src/generated/seo-manifest.json`. Accesul la D1 pentru build trebuie să fie configurat în mediul Cloudflare. Dacă citirea eșuează, build-ul se oprește; nu publica un catalog vechi ca substitut.

Binding-uri existente necesare în Pages Functions:

- `DB`: baza D1 a proiectului (`teco-db`).
- `SITE_IMAGES`: spațiul KV pentru imagini.
- `GROQ_API_KEY`: secret pentru funcțiile AI de administrare și chat.
- `GOOGLE_API_KEY`: secret opțional pentru furnizorul Gemini al chatului.
- Păstrează separat setările existente pentru notificări și alte integrări.

Cheile AI se configurează ca secrete server, niciodată cu prefixul `VITE_` sau în Git. Build-ul Cloudflare fixează adresele API din browser la aceeași origine (`/api/...`). Worker-ul vechi `teco-api` nu mai este destinația frontend-ului.

## Verificare locală

Din `artifacts/teco-md`, cu dependențele instalate:

```sh
pnpm run typecheck
node --test scripts/seo-output.test.mjs src/server/ai-provider.test.ts src/lib/chat-response.test.ts src/lib/category-routing.test.ts
pnpm run seo-build
```

Testele au fost rulate cu Node 24.19. Fișierele TypeScript executate direct de Node necesită o versiune cu suport pentru eliminarea tipurilor.

`seo-build` folosește copia locală a catalogului și este destinat verificării offline. Numărul de pagini din acest build nu reprezintă inventarul actual din producție. Pentru publicare folosește `cf-build` cu citire reușită din D1.

## Verificare într-un Preview protejat

1. Aplică modificările pe o ramură separată. Verifică întâi că acea ramură nu declanșează publicarea în producție.
2. Verifică configurația existentă Pages, regulile de redirect Cloudflare și diferențele dintre codul din Git și versiunea publicată. O regulă globală din dashboard poate intercepta cererile înaintea Functions.
3. Creează un Preview cu acces restricționat prin mecanismul existent al proiectului. Un simplu URL `pages.dev` sau un tag `noindex` nu asigură confidențialitatea. Folosește date și integrări de test pentru comenzile, formularele și notificările din Preview.
4. Rulează `cf-build`. HTML-ul și manifestul generat trebuie publicate din aceeași construcție. Nu combina manifestul nou cu fișiere HTML vechi și nu reinstala regula `/* /index.html 200`.
5. Verifică pe telefon și desktop: pagina principală, catalogul și filtrele, un produs, contactul, cererea de ofertă și TecoBot. Verifică un răspuns AI real numai după configurarea cheilor. Testele din repository simulează furnizorii AI.
6. Confirmă că `/contacts/` duce prin 301 la `/contact/`, produsele existente prin ID ajung la produsul corect, `/produse/?cat=kituri` ajunge la pagina seturilor, iar adresele inexistente răspund cu 404. Paginile de administrare și căutările interne trebuie să fie `noindex`.
7. Compară prețurile, stocurile, categoriile, imaginile și articolele cu D1. Verifică `/sitemap.xml` și absența redirecționărilor circulare.

Publicarea pe `teco.md` urmează verificării Preview și aprobării proprietarului. Păstrează deployment-ul anterior pentru rollback prin Cloudflare Pages; patch-ul nu modifică schema D1 și nu execută migrări de date.

## După publicare

- Produsele sau articolele noi pot fi găsite prin API înainte de următorul build; pentru HTML complet și includere în sitemap, rulează un nou `cf-build` după schimbări de catalog/conținut.
- Verifică paginile importante prin URL Inspection și trimite sitemap-ul în Search Console. Publicarea unui sitemap nu garantează indexarea sau o poziție anume.
- Urmărește separat clicurile organice din Moldova și cererile/comenzile reale; vizitele și clienții nu sunt aceeași măsură.
- Funcția de urmărire a vizitelor respectă consimțământul analytics și nu reproduce toate clicurile raportate de Search Console.
