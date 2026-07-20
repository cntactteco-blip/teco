import { Shield, Mail, Phone, Lock, Eye, Trash2, Download, AlertCircle } from "lucide-react";
import { SEO } from "@/components/SEO";
import { ReopenConsentButton } from "@/components/CookieConsent";

const UPDATED = "20 iulie 2026";
const OPERATOR = "TECO.MD";
const EMAIL = "contact@teco.md";
const PHONE = "+373 67 200 463";
const CNPDCP_URL = "https://www.cnpdcp.md";

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-[#FF4F00]/10 rounded-xl flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-[#FF4F00]" />
        </div>
        <h2 className="text-xl font-black text-zinc-900">{title}</h2>
      </div>
      <div className="text-zinc-600 leading-relaxed space-y-3 pl-11">{children}</div>
    </section>
  );
}

export default function Confidentialitate() {
  return (
    <>
      <SEO title="Politica de Confidențialitate — TECO.MD" noIndex />
      <main className="max-w-3xl mx-auto px-5 py-12 md:py-16">

        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 bg-[#FF4F00]/10 text-[#FF4F00] text-xs font-bold px-3 py-1.5 rounded-full mb-4">
            <Shield className="w-3.5 h-3.5" /> Conformă Legii nr. 133/2011 (Republica Moldova)
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-zinc-900 mb-3">Politica de Confidențialitate</h1>
          <p className="text-sm text-zinc-400">Ultima actualizare: <strong className="text-zinc-600">{UPDATED}</strong></p>
        </div>

        {/* Intro */}
        <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5 mb-10 text-sm text-zinc-600 leading-relaxed">
          <p>
            <strong className="text-zinc-800">{OPERATOR}</strong> (denumit în continuare „Operatorul") respectă
            confidențialitatea datelor tale personale și se angajează să le protejeze în conformitate cu{" "}
            <strong>Legea nr. 133 din 08.07.2011</strong> privind protecția datelor cu caracter personal
            (Republica Moldova) și cu bunele practici europene în domeniu (GDPR).
          </p>
          <p className="mt-2">
            Prin utilizarea site-ului <strong>teco.md</strong>, ești de acord cu termenii prezentei politici.
            Dacă nu ești de acord, te rugăm să nu utilizezi serviciile noastre.
          </p>
        </div>

        <Section title="1. Operatorul de Date" icon={Shield}>
          <p>Operatorul de date cu caracter personal este:</p>
          <div className="bg-white border border-zinc-200 rounded-xl p-4 text-sm">
            <p><strong>TECO.MD</strong> — Sisteme de Supraveghere</p>
            <p>Chișinău, Republica Moldova</p>
            <p>Email: <a href={`mailto:${EMAIL}`} className="text-[#FF4F00] underline">{EMAIL}</a></p>
            <p>Telefon: <a href={`tel:${PHONE.replace(/\s/g, "")}`} className="text-[#FF4F00] underline">{PHONE}</a></p>
          </div>
        </Section>

        <Section title="2. Ce Date Personale Colectăm" icon={Eye}>
          <p>Colectăm doar datele strict necesare pentru prestarea serviciilor:</p>
          <ul className="space-y-2">
            {[
              ["Date de contact", "Nume, prenume, număr de telefon, adresă email (opțional)"],
              ["Date de livrare", "Adresa de livrare a comenzii"],
              ["Date tehnice", "Adresa IP (anonimizată), tipul de browser, paginile vizitate — pentru funcționarea corectă a site-ului"],
              ["Date cookie", "Cookie-uri tehnice esențiale (coș, sesiune) și, cu acordul tău, cookie-uri analytics/marketing"],
              ["Istoricul comenzilor", "Produsele comandate, valoarea, metoda de livrare"],
            ].map(([title, desc]) => (
              <li key={title} className="flex items-start gap-2">
                <span className="text-[#FF4F00] mt-1 flex-shrink-0">•</span>
                <span><strong className="text-zinc-800">{title}:</strong> {desc}</span>
              </li>
            ))}
          </ul>
          <p className="text-sm text-zinc-400 mt-2">
            Nu colectăm date sensibile (origine rasială, convingeri politice/religioase, date biometrice, stare de sănătate etc.).
          </p>
        </Section>

        <Section title="3. Scopul Prelucrării Datelor" icon={Lock}>
          <p>Datele tale sunt prelucrate exclusiv în următoarele scopuri:</p>
          <div className="space-y-2">
            {[
              { scope: "Procesarea comenzilor", basis: "Executarea contractului (Art. 5 Legea 133/2011)", detail: "Livrarea produselor, confirmarea comenzii, comunicare post-vânzare." },
              { scope: "Consultanță și oferte", basis: "Consimțământ explicit", detail: "Contactarea telefonică la solicitarea ta prin formularele de pe site." },
              { scope: "Îmbunătățirea serviciilor", basis: "Interes legitim / Consimțământ", detail: "Analytics anonim pentru a înțelege cum este utilizat site-ul." },
              { scope: "Obligații legale", basis: "Obligație legală", detail: "Păstrarea facturilor și documentelor contabile conform legislației moldovenești." },
            ].map(({ scope, basis, detail }) => (
              <div key={scope} className="bg-white border border-zinc-200 rounded-xl p-3.5 text-sm">
                <p className="font-bold text-zinc-800">{scope}</p>
                <p className="text-[#FF4F00] text-xs font-medium mt-0.5">{basis}</p>
                <p className="text-zinc-500 text-xs mt-1">{detail}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="4. Temeiul Legal al Prelucrării" icon={Shield}>
          <p>Prelucrăm datele tale personale în baza:</p>
          <ul className="space-y-1.5 text-sm">
            <li><span className="text-[#FF4F00]">•</span> <strong>Art. 5 lit. b)</strong> — executarea unui contract la care ești parte (comenzi, servicii de instalare)</li>
            <li><span className="text-[#FF4F00]">•</span> <strong>Art. 5 lit. a)</strong> — consimțământul tău explicit (formulare de contact, newsletter)</li>
            <li><span className="text-[#FF4F00]">•</span> <strong>Art. 5 lit. c)</strong> — obligații legale (evidență contabilă, fiscală)</li>
            <li><span className="text-[#FF4F00]">•</span> <strong>Art. 5 lit. f)</strong> — interese legitime ale operatorului (securitatea site-ului, prevenirea fraudelor)</li>
          </ul>
          <p className="text-xs text-zinc-400">Referințele se aplică Legii nr. 133/2011 privind protecția datelor cu caracter personal, Republica Moldova.</p>
        </Section>

        <Section title="5. Cine Are Acces la Datele Tale" icon={Eye}>
          <p>Nu vindem și nu cedăm datele tale terților în scopuri comerciale. Datele sunt accesate de:</p>
          <ul className="space-y-1.5 text-sm">
            <li><span className="text-[#FF4F00]">•</span> <strong>Angajații TECO.MD</strong> implicați în procesarea comenzilor și servicii clienți</li>
            <li><span className="text-[#FF4F00]">•</span> <strong>Servicii de curierat</strong> (exclusiv adresa și telefonul de livrare)</li>
            <li><span className="text-[#FF4F00]">•</span> <strong>Furnizori de servicii tehnice</strong>: Supabase (stocare date, UE), Cloudflare (hosting CDN, UE/SUA — EU Standard Contractual Clauses)</li>
            <li><span className="text-[#FF4F00]">•</span> <strong>Analytics</strong> (cu consimțământul tău): Google Analytics, Facebook Pixel — date anonimizate/pseudoanonimizate</li>
            <li><span className="text-[#FF4F00]">•</span> <strong>Autorități competente</strong> — numai dacă obligația rezultă dintr-o prevedere legală expresă</li>
          </ul>
        </Section>

        <Section title="6. Durata Reținerii Datelor" icon={Lock}>
          <div className="space-y-2 text-sm">
            {[
              ["Date comenzi", "5 ani (obligații fiscale/contabile, Codul Fiscal al RM)"],
              ["Date lead-uri / contacte", "12 luni de la ultimul contact sau până la retragerea consimțământului"],
              ["Cookie-uri analytics", "13 luni (Google Analytics standard)"],
              ["Cookie-uri esențiale", "Sesiunea curentă sau maximum 12 luni"],
            ].map(([cat, dur]) => (
              <div key={cat} className="flex justify-between items-start bg-white border border-zinc-100 rounded-xl px-4 py-3 gap-4">
                <span className="font-medium text-zinc-700">{cat}</span>
                <span className="text-zinc-500 text-right text-xs">{dur}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="7. Drepturile Tale" icon={Shield}>
          <p>Conform Legii nr. 133/2011, ai următoarele drepturi:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              { icon: Eye, title: "Dreptul la acces", desc: "Să știi ce date deținem despre tine." },
              { icon: Lock, title: "Dreptul la rectificare", desc: "Să corectezi date inexacte." },
              { icon: Trash2, title: "Dreptul la ștergere", desc: "Să ceri ștergerea datelor (\"dreptul de a fi uitat\")." },
              { icon: Download, title: "Dreptul la portabilitate", desc: "Să primești datele într-un format structurat." },
              { icon: AlertCircle, title: "Dreptul la opoziție", desc: "Să te opui prelucrării în scop de marketing." },
              { icon: Shield, title: "Retragerea consimțământului", desc: "Oricând, fără penalități, pentru prelucrările bazate pe consimțământ." },
            ].map(({ icon: I, title, desc }) => (
              <div key={title} className="bg-white border border-zinc-200 rounded-xl p-3.5 flex items-start gap-3">
                <I className="w-4 h-4 text-[#FF4F00] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-zinc-800">{title}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-sm mt-3">
            Pentru exercitarea drepturilor, contactează-ne la{" "}
            <a href={`mailto:${EMAIL}`} className="text-[#FF4F00] underline">{EMAIL}</a> sau{" "}
            <a href={`tel:${PHONE.replace(/\s/g, "")}`} className="text-[#FF4F00] underline">{PHONE}</a>.
            Răspundem în termen de <strong>30 de zile</strong> calendaristice.
          </p>
          <p className="text-sm mt-1">
            Dacă consideri că drepturile tale nu sunt respectate, poți depune o plângere la{" "}
            <a href={CNPDCP_URL} target="_blank" rel="noopener noreferrer" className="text-[#FF4F00] underline font-medium">
              Centrul Național pentru Protecția Datelor cu Caracter Personal (CNPDCP)
            </a>.
          </p>
        </Section>

        <Section title="8. Cookie-uri" icon={Lock}>
          <p>Folosim trei categorii de cookie-uri:</p>
          <div className="space-y-2 text-sm">
            {[
              {
                name: "Esențiale (întotdeauna active)",
                color: "bg-green-50 border-green-200 text-green-800",
                dot: "bg-green-500",
                desc: "Necesare pentru funcționarea site-ului: coș de cumpărături (teco_cart), wishlist (teco_wishlist), sesiune de navigare. Nu necesită consimțământ.",
              },
              {
                name: "Analytics (cu consimțământ)",
                color: "bg-blue-50 border-blue-200 text-blue-800",
                dot: "bg-blue-500",
                desc: "Google Analytics (_ga, _gid) — statistici anonimizate despre utilizarea site-ului. Niciun cookie de acest tip nu se activează fără acordul tău.",
              },
              {
                name: "Marketing (cu consimțământ)",
                color: "bg-orange-50 border-orange-200 text-orange-800",
                dot: "bg-orange-500",
                desc: "Facebook Pixel (_fbp, _fbc) — publicitate personalizată. Niciun cookie de marketing nu se activează fără acordul tău.",
              },
            ].map(({ name, color, dot, desc }) => (
              <div key={name} className={`border rounded-xl p-3.5 ${color}`}>
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-2 h-2 rounded-full ${dot}`} />
                  <span className="font-bold text-xs">{name}</span>
                </div>
                <p className="text-xs opacity-80">{desc}</p>
              </div>
            ))}
          </div>
          <p className="text-sm mt-3">
            Poți modifica preferințele oricând:
          </p>
          <div className="mt-2">
            <ReopenConsentButton />
          </div>
        </Section>

        <Section title="9. Securitatea Datelor" icon={Lock}>
          <p>Aplicăm măsuri tehnice și organizatorice pentru protejarea datelor tale:</p>
          <ul className="space-y-1.5 text-sm">
            <li><span className="text-[#FF4F00]">•</span> Transmisie criptată HTTPS (TLS 1.3) pe tot site-ul</li>
            <li><span className="text-[#FF4F00]">•</span> Acces restricționat la date — exclusiv personalul autorizat</li>
            <li><span className="text-[#FF4F00]">•</span> Baze de date protejate prin Row Level Security (RLS)</li>
            <li><span className="text-[#FF4F00]">•</span> Rate limiting și protecție anti-abuz pe toate API-urile</li>
            <li><span className="text-[#FF4F00]">•</span> Backup regulat al datelor</li>
          </ul>
        </Section>

        <Section title="10. Transfer Internațional de Date" icon={Shield}>
          <p className="text-sm">
            Unii furnizori de servicii (Cloudflare, Supabase) procesează date în Uniunea Europeană
            sau în SUA, pe baza <strong>Clauzelor Contractuale Standard (Standard Contractual Clauses)</strong>
            aprobate de Comisia Europeană, care asigură un nivel de protecție echivalent cu cel din UE/Moldova.
          </p>
        </Section>

        <Section title="11. Modificări ale Politicii" icon={AlertCircle}>
          <p className="text-sm">
            Ne rezervăm dreptul de a actualiza această politică pentru a reflecta modificări legislative
            sau operaționale. Data ultimei actualizări este afișată în partea de sus a paginii.
            Versiunile anterioare sunt disponibile la cerere.
          </p>
        </Section>

        {/* Contact box */}
        <div className="bg-zinc-900 text-white rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center gap-4">
          <Mail className="w-8 h-8 text-[#FF4F00] flex-shrink-0" />
          <div>
            <p className="font-black text-lg mb-1">Întrebări despre datele tale?</p>
            <p className="text-zinc-400 text-sm mb-3">
              Suntem disponibili să răspundem oricărei solicitări legate de datele personale.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href={`mailto:${EMAIL}`} className="bg-[#FF4F00] text-white text-sm font-bold px-4 py-2 rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2">
                <Mail className="w-4 h-4" /> {EMAIL}
              </a>
              <a href={`tel:${PHONE.replace(/\s/g, "")}`} className="bg-zinc-700 text-white text-sm font-bold px-4 py-2 rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2">
                <Phone className="w-4 h-4" /> {PHONE}
              </a>
            </div>
          </div>
        </div>

      </main>
    </>
  );
}
