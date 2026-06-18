import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useStore } from "@/lib/store";
import { useLang } from "@/contexts/LangContext";
import type { TranslationKey } from "@/lib/translations";

export function AnnouncementBar() {
  const { t } = useLang();
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const customText = useStore((s) => s.settings.general?.announcementText ?? "");

  const KEYS: TranslationKey[] = ["ann.free_delivery", "ann.limited_stock", "ann.free_install"];

  useEffect(() => {
    if (customText) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % KEYS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [customText]);

  if (!visible) return null;

  const message = customText || t(KEYS[index]);

  return (
    <div
      className="text-white text-sm py-2 px-4 relative flex items-center justify-center"
      style={{
        background: "linear-gradient(90deg, #09090b 45%, #1a1a1a 50%, #09090b 55%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 3s infinite linear",
      }}
    >
      <div key={message} className="text-center font-medium animate-in fade-in duration-500">
        {message}
      </div>
      <button
        onClick={() => setVisible(false)}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
}
