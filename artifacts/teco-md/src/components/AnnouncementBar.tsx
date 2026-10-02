import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useStore } from "@/lib/store";
import { useLang } from "@/contexts/LangContext";
import type { TranslationKey } from "@/lib/translations";

export function AnnouncementBar() {
  const { t, lang } = useLang();
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const customText = useStore(
    (s) => s.settings.general?.announcementText ?? "",
  );

  const KEYS: TranslationKey[] = [
    "ann.free_delivery",
    "ann.limited_stock",
    "ann.free_install",
  ];

  useEffect(() => {
    if (customText) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % KEYS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [customText]);

  const message = customText || t(KEYS[index]);

  return (
    <>
      <button
        type="button"
        onClick={() => window.dispatchEvent(new Event("teco:open-consultant"))}
        className="md:hidden w-full min-h-10 bg-zinc-950 text-white text-[11px] font-semibold px-3 py-2 text-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-500"
        aria-haspopup="dialog"
      >
        {lang === "ru"
          ? "Нужна помощь с выбором? Спросите консультанта TECO"
          : "Ai nevoie de ajutor? Întreabă consultantul TECO"}
      </button>
      {visible && (
        <div
          className="hidden md:flex text-white text-[11px] sm:text-sm py-2 pl-3 pr-9 relative flex items-center justify-center overflow-hidden"
          style={{
            background:
              "linear-gradient(90deg, #09090b 45%, #1a1a1a 50%, #09090b 55%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 3s infinite linear",
          }}
        >
          <button
            type="button"
            onClick={() =>
              window.dispatchEvent(new Event("teco:open-consultant"))
            }
            key={message}
            className="w-full text-center font-semibold animate-in fade-in duration-500 whitespace-nowrap overflow-hidden text-ellipsis"
          >
            {message}
          </button>
          <button
            aria-label={
              lang === "ru" ? "Закрыть объявление" : "Închide anunțul"
            }
            onClick={() => setVisible(false)}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </>
  );
}
