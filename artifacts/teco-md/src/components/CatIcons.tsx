// Iconițe categorii — mapă centralizată + picker pentru admin
import { Cctv, Wifi, Signal, Plug, Boxes, HardDrive, BellElectric, DoorClosed, Tag, Sun, Thermometer, Eye, type LucideIcon } from "lucide-react";

type IconProps = { className?: string };

/** Configurația unei iconițe de categorie */
export interface CatIconDef {
  key: string;
  label: string;        // afișat în picker
  main: LucideIcon;
  badge?: LucideIcon;
}

/** Toate iconițele disponibile pentru categorii */
export const CAT_ICON_OPTIONS: CatIconDef[] = [
  { key: "cctv-wifi",    label: "WiFi",     main: Cctv,        badge: Wifi        },
  { key: "cctv-4g",      label: "4G",       main: Cctv,        badge: Signal      },
  { key: "cctv-poe",     label: "PoE",      main: Cctv,        badge: Plug        },
  { key: "cctv-solar",   label: "Solar",    main: Cctv,        badge: Sun         },
  { key: "cctv",         label: "Cameră",   main: Cctv                            },
  { key: "kit",          label: "Kit",      main: Boxes                           },
  { key: "nvr",          label: "NVR",      main: HardDrive                       },
  { key: "alarm",        label: "Alarmă",   main: BellElectric                    },
  { key: "intercom",     label: "Interfon", main: DoorClosed                      },
  { key: "storage",      label: "Stocare",  main: HardDrive,   badge: Eye         },
  { key: "thermal",      label: "Termal",   main: Cctv,        badge: Thermometer },
  { key: "generic",      label: "Generic",  main: Tag                             },
];

/** Mapă rapidă key → def */
const KEY_MAP = new Map(CAT_ICON_OPTIONS.map((d) => [d.key, d]));

/** Auto-detecție din slug când iconKey nu e setat */
function autoDetect(slug: string): CatIconDef {
  const s = slug.toLowerCase();
  if (s.includes("wifi"))                                                   return KEY_MAP.get("cctv-wifi")!;
  if (s.includes("4g") || s.includes("lte"))                                return KEY_MAP.get("cctv-4g")!;
  if (s.includes("poe") || s.includes("exterior"))                          return KEY_MAP.get("cctv-poe")!;
  if (s.includes("solar"))                                                   return KEY_MAP.get("cctv-solar")!;
  if (s.includes("thermal") || s.includes("termal"))                        return KEY_MAP.get("thermal")!;
  if (s.includes("camer"))                                                   return KEY_MAP.get("cctv")!;
  if (s.includes("kit") || s.includes("bundle") || s.includes("complet"))  return KEY_MAP.get("kit")!;
  if (s.includes("nvr") || s.includes("recorder") || s.includes("dvr"))    return KEY_MAP.get("nvr")!;
  if (s.includes("alarm") || s.includes("securit"))                         return KEY_MAP.get("alarm")!;
  if (s.includes("stocare") || s.includes("hdd") || s.includes("storage")) return KEY_MAP.get("storage")!;
  if (s.includes("interfon") || s.includes("intercom") || s.includes("videofon")) return KEY_MAP.get("intercom")!;
  return KEY_MAP.get("generic")!;
}

/** Returnează def-ul pentru o categorie (iconKey prioritar, altfel auto-detect din slug) */
export function getCatIconDef(slug: string, iconKey?: string): CatIconDef {
  if (iconKey) return KEY_MAP.get(iconKey) ?? autoDetect(slug);
  return autoDetect(slug);
}

/** Iconița cu badge mic în colț jos-dreapta (pentru sidebar) */
export function CatIconBadge({ slug, iconKey, className }: { slug: string; iconKey?: string; className?: string }) {
  const def = getCatIconDef(slug, iconKey);
  const Main = def.main;
  const Badge = def.badge;
  return (
    <div className={`relative ${className ?? "w-4 h-4"}`}>
      <Main className="w-full h-full text-[#FF4F00]" />
      {Badge && (
        <Badge
          className="absolute -bottom-1 -right-1 w-[10px] h-[10px] text-[#FF4F00]"
          strokeWidth={2.5}
        />
      )}
    </div>
  );
}

/** Picker de iconiță pentru Admin — grid cu toate opțiunile */
export function CatIconPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (key: string) => void;
}) {
  return (
    <div>
      <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Iconiță</p>
      <div className="grid grid-cols-6 gap-1.5">
        {CAT_ICON_OPTIONS.map((def) => {
          const Main = def.main;
          const Badge = def.badge;
          const active = value === def.key;
          return (
            <button
              key={def.key}
              type="button"
              onClick={() => onChange(def.key)}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-colors ${
                active
                  ? "border-[#FF4F00] bg-orange-500/10"
                  : "border-zinc-700 bg-zinc-700/50 hover:border-zinc-500"
              }`}
              title={def.label}
            >
              <div className="relative w-5 h-5">
                <Main className={`w-5 h-5 ${active ? "text-[#FF4F00]" : "text-zinc-400"}`} />
                {Badge && (
                  <Badge
                    className={`absolute -bottom-1 -right-1 w-3 h-3 ${active ? "text-[#FF4F00]" : "text-zinc-400"}`}
                    strokeWidth={2.5}
                  />
                )}
              </div>
              <span className={`text-[9px] leading-none ${active ? "text-[#FF4F00]" : "text-zinc-500"}`}>
                {def.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
