import { X } from "lucide-react";
import { useLang } from "@/contexts/LangContext";

export function ConsultantInvite({ product, onOpen, onDismiss }: {
  product: boolean;
  onOpen: () => void;
  onDismiss: () => void;
}) {
  const { lang } = useLang();
  return (
    <div className="teco-message-bubble pointer-events-auto relative flex w-[290px] max-w-[calc(100vw-24px)] items-start gap-1 rounded-2xl rounded-br-md border border-orange-200 bg-white p-2.5 shadow-[0_6px_24px_rgba(255,79,0,0.14)]" aria-live="polite">
      <button onClick={onOpen} aria-haspopup="dialog" className="flex-1 min-w-0 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FF4F00] rounded-lg">
        <span className="flex items-center gap-1.5 text-[10px] font-bold text-[#FF4F00]">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
          {lang === "ru" ? "Консультант TECO · Онлайн" : "Consultant TECO · Online"}
        </span>
        <span className="mt-1 block text-xs font-medium leading-4 text-zinc-800">
          {product
            ? (lang === "ru" ? "Подходит ли вам эта модель? Напишите мне 👋" : "Ți se potrivește acest model? Scrie-mi 👋")
            : (lang === "ru" ? "Привет! Помогу выбрать камеры. Напишите мне 👋" : "Salut! Te ajut să alegi camerele. Scrie-mi 👋")}
        </span>
      </button>
      <button onClick={onDismiss} aria-label={lang === "ru" ? "Закрыть подсказку" : "Închide invitația"} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-zinc-400 hover:bg-orange-50 hover:text-[#FF4F00]">
        <X className="h-3.5 w-3.5" />
      </button>
      <span aria-hidden="true" className="absolute -bottom-1.5 right-5 h-3 w-3 rotate-45 border-b border-r border-orange-200 bg-white" />
      <style>{`
        @keyframes tecoMessageBubble {
          from { opacity: 0; transform: translateY(12px) scale(0.85); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .teco-message-bubble { transform-origin: bottom right; animation: tecoMessageBubble 350ms cubic-bezier(0.2, 0.8, 0.2, 1) both; }
        @media (prefers-reduced-motion: reduce) { .teco-message-bubble { animation: none; } }
      `}</style>
    </div>
  );
}
