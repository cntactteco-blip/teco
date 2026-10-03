import { X, MessageCircle, ArrowRight } from "lucide-react";
import { useLang } from "@/contexts/LangContext";

export function ConsultantInvite({ product, onOpen, onDismiss }: {
  product: boolean;
  onOpen: () => void;
  onDismiss: () => void;
}) {
  const { lang } = useLang();
  return (
    <div className="teco-message-bubble pointer-events-auto relative w-[316px] max-w-[calc(100vw-24px)] rounded-[22px] rounded-br-md border border-white/30 bg-gradient-to-br from-[#FF6A1A] to-[#FF4F00] p-3 text-white shadow-[0_8px_28px_rgba(255,79,0,0.3)]" aria-live="polite">
      <button onClick={onOpen} aria-haspopup="dialog" className="block w-full min-w-0 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white rounded-lg">
        <span className="flex items-center gap-2 pr-6">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/20"><MessageCircle className="h-4 w-4" /></span>
          <span className="text-[11px] font-bold">{lang === "ru" ? "Консультант TECO" : "Consultant TECO"}</span>
          <span className="ml-auto flex shrink-0 items-center gap-1 rounded-full bg-white/15 px-1.5 py-1 text-[9px] font-semibold"><span className="h-1.5 w-1.5 rounded-full bg-green-300 ring-1 ring-white/40" />{lang === "ru" ? "Онлайн" : "Online"}</span>
        </span>
        <span className="mt-2 block text-[14px] font-bold leading-5">
          {product
            ? (lang === "ru" ? "Эта модель вам подходит?" : "Ți se potrivește acest model?")
            : (lang === "ru" ? "Помогу выбрать камеры 👋" : "Te ajut să alegi camerele 👋")}
        </span>
        <span className="mt-2 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[11px] font-bold text-[#FF4F00] shadow-sm">{lang === "ru" ? "Написать консультанту" : "Scrie consultantului"}<ArrowRight className="h-3.5 w-3.5" /></span>
      </button>
      <button onClick={onDismiss} aria-label={lang === "ru" ? "Закрыть подсказку" : "Închide invitația"} className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full text-white/80 hover:bg-white/20 hover:text-white">
        <X className="h-3.5 w-3.5" />
      </button>
      <span aria-hidden="true" className="absolute -bottom-1.5 right-5 h-3 w-3 rotate-45 bg-[#FF4F00]" />
      <style>{`
        @keyframes tecoMessageBubble {
          0% { opacity: 0; transform: translateY(16px) scale(0.75); }
          70% { opacity: 1; transform: translateY(-2px) scale(1.025); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .teco-message-bubble { transform-origin: bottom right; animation: tecoMessageBubble 450ms cubic-bezier(0.2, 0.8, 0.2, 1) both; }
        @media (prefers-reduced-motion: reduce) { .teco-message-bubble { animation: none; } }
      `}</style>
    </div>
  );
}
