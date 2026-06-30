const fs = require('fs');
const path = 'src/pages/Admin.tsx';
let content = fs.readFileSync(path, 'utf8');

const anchor = `      {/* ── 12. Danger zone ── */}`;
if (!content.includes(anchor)) {
  console.error('Anchor nu gasit'); process.exit(1);
}

const newSection = `      {/* ── 12. Texte Homepage ── */}
      <SettingsSection icon={FileText} title="Texte Homepage" description="Modifică textele afișate pe pagina principală (RO și RU).">
        {(["ro","ru"] as const).map(lng => (
          <div key={lng} className="mb-6">
            <h4 className="font-semibold text-zinc-300 mb-3 uppercase text-xs tracking-widest">{lng.toUpperCase()}</h4>
            <div className="grid grid-cols-1 gap-3">
              {[
                { key: "hero.badge", label: "Badge (ex: Moldova #1)" },
                { key: "hero.title1", label: "Titlu linia 1" },
                { key: "hero.title2", label: "Titlu linia 2 (portocaliu)" },
                { key: "hero.subtitle", label: "Subtitlu" },
                { key: "hero.stat_installs", label: "Stat: Instalări" },
                { key: "hero.stat_rating", label: "Stat: Rating" },
                { key: "hero.stat_delivery", label: "Stat: Livrare" },
                { key: "hero.cta_buy", label: "Buton Cumpără" },
                { key: "hero.cta_consult", label: "Buton Consultanță" },
                { key: "hero.trust1", label: "Trust 1" },
                { key: "hero.trust2", label: "Trust 2" },
                { key: "hero.trust3", label: "Trust 3" },
                { key: "hero.ticker", label: "Ticker tape (bandă rulantă)" },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1 uppercase tracking-wider">{label}</label>
                  <input
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={(settings.homeText?.[lng] as Record<string,string> | undefined)?.[key] ?? ""}
                    placeholder={key}
                    onChange={e => {
                      const prev = settings.homeText?.[lng] ?? {};
                      storeActions.updateSettings({
                        homeText: {
                          ro: settings.homeText?.ro ?? {},
                          ru: settings.homeText?.ru ?? {},
                          [lng]: { ...prev, [key]: e.target.value },
                        }
                      });
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </SettingsSection>

      {/* ── 13. Danger zone ── */}`;

content = content.replace(anchor, newSection);
fs.writeFileSync(path, content);
console.log('OK: sectiune Texte Homepage adaugata in Admin');
