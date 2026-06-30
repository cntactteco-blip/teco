import { createContext, useContext, useState, type ReactNode } from "react";
import t, { type Lang, type TranslationKey } from "@/lib/translations";
import { useStore } from "@/lib/store";

interface LangContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

const LangContext = createContext<LangContextType>({
  lang: "ro",
  setLang: () => {},
  t: (key) => key,
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      return (localStorage.getItem("teco_lang") as Lang) || "ro";
    } catch {
      return "ro";
    }
  });

  const setLang = (l: Lang) => {
    setLangState(l);
    try { localStorage.setItem("teco_lang", l); } catch {}
  };

  const homeText = useStore((s) => s.settings.homeText);
  const translate = (key: TranslationKey, vars?: Record<string, string | number>): string => {
    const override = (homeText?.[lang] as Record<string, string> | undefined)?.[key]
      ?? (homeText?.ro as Record<string, string> | undefined)?.[key];
    const str: string = override
      ?? (t[lang] as Record<string, string>)[key]
      ?? (t.ro as Record<string, string>)[key]
      ?? key;
    if (!vars) return str;
    return str.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
  };

  return (
    <LangContext.Provider value={{ lang, setLang, t: translate }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);
