const fs = require('fs');
const path = 'src/pages/Home.tsx';
let content = fs.readFileSync(path, 'utf8');

// Găsim indexul declarației heroProducts
const heroIdx = content.indexOf('const heroProducts');
if (heroIdx === -1) {
  console.error('NU am gasit "const heroProducts" — opresc, nu modific nimic.');
  process.exit(1);
}

// Găsim indexul declarației FALLBACK_HERO
const fallbackIdx = content.indexOf('const FALLBACK_HERO');
if (fallbackIdx === -1) {
  console.error('NU am gasit "const FALLBACK_HERO" — opresc, nu modific nimic.');
  process.exit(1);
}

if (fallbackIdx < heroIdx) {
  console.log('FALLBACK_HERO e deja inaintea heroProducts. Nimic de facut.');
  process.exit(0);
}

// Extragem blocul FALLBACK_HERO: de la "const FALLBACK_HERO" pana la primul ";" 
// care inchide obiectul la nivel de top (cautam ";\n" dupa o "}" la inceput de linie)
const afterFallback = content.slice(fallbackIdx);
const match = afterFallback.match(/const FALLBACK_HERO[\s\S]*?\n\};?\n/);
if (!match) {
  console.error('Nu am putut delimita blocul FALLBACK_HERO automat. Verifica manual.');
  process.exit(1);
}

const block = match[0];
const blockStart = fallbackIdx;
const blockEnd = fallbackIdx + match[0].length;

// Scoatem blocul din pozitia veche
let newContent = content.slice(0, blockStart) + content.slice(blockEnd);

// Recalculam pozitia lui heroProducts in noul content (s-a putut schimba daca fallback era inainte, dar stim ca era dupa)
const newHeroIdx = newContent.indexOf('const heroProducts');
if (newHeroIdx === -1) {
  console.error('Eroare neasteptata dupa eliminare.');
  process.exit(1);
}

// Inseram blocul inainte de heroProducts, pastrand o linie goala
newContent = newContent.slice(0, newHeroIdx) + block + '\n' + newContent.slice(newHeroIdx);

fs.writeFileSync(path, newContent, 'utf8');
console.log('OK: FALLBACK_HERO mutat inaintea heroProducts.');
