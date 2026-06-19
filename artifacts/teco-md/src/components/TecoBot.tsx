import { useState, useRef, useEffect, useCallback } from "react";
import { Bot, X, Send, Loader2, Sparkles, ChevronDown, User } from "lucide-react";
import { useLang } from "@/contexts/LangContext";
import { storeActions, useStore } from "@/lib/store";

interface Message {
  role: "user" | "assistant";
  content: string;
  ts: number;
}

const GREET: Record<string, string> = {
  ro: "Salut! Sunt **TecoBot**, consultantul AI Teco.md 👋\n\nTe ajut să alegi sistemul de supraveghere perfect pentru tine. Spune-mi:\n- Câte camere ai nevoie?\n- Interior, exterior sau ambele?\n- Ai WiFi sau preferi cablat?",
  ru: "Привет! Я **TecoBot**, AI-консультант Teco.md 👋\n\nПомогу выбрать идеальную систему видеонаблюдения. Скажите:\n- Сколько камер вам нужно?\n- Внутри, снаружи или оба?\n- Есть WiFi или предпочитаете проводное?",
};

function renderMarkdown(text: string) {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br/>");
}

export function TecoBot() {
  const { lang } = useLang();
  const products = useStore((s) =>
    s.products.map((p) => ({
      id: p.id, name: p.name, brand: p.brand,
      price: p.price, oldPrice: p.oldPrice,
      specs: p.specs, category: p.category,
      badge: p.badge, inStock: p.inStock,
    }))
  );
  const adminPhone = useStore((s) => s.settings.general?.adminPhone ?? "");
  const phone = (adminPhone || "37367200463").replace(/\D/g, "");
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [leadCaptured, setLeadCaptured] = useState(false);
  const [unread, setUnread] = useState(0);
  const [vpHeight, setVpHeight] = useState<number>(() => window.visualViewport?.height ?? window.innerHeight);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Track visual viewport height so the panel shrinks above the keyboard on mobile
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      setVpHeight(vv.height);
      // Scroll last message into view after keyboard open/close
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    };
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  // Lock body scroll on mobile when chat is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ role: "assistant", content: GREET[lang] ?? GREET.ro, ts: Date.now() }]);
      setUnread(0);
    }
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setUnread(0);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const extractLead = useCallback((text: string) => {
    const match = text.match(/LEAD_CAPTURED:name=([^,\n]+),phone=([^\n]+)/);
    if (match && !leadCaptured) {
      const name = match[1].trim();
      const phone = match[2].trim();
      setLeadCaptured(true);
      storeActions.addLead({ name, phone, notes: "TecoBot AI Chat", source: "tecobot" });
    }
    return text.replace(/LEAD_CAPTURED:[^\n]*/g, "").trim();
  }, [leadCaptured]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || streaming) return;
    setInput("");

    const userMsg: Message = { role: "user", content: text, ts: Date.now() };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setStreaming(true);

    const botMsg: Message = { role: "assistant", content: "", ts: Date.now() };
    setMessages([...allMessages, botMsg]);

    abortRef.current = new AbortController();

    try {
      const res = await fetch((import.meta.env.VITE_API_URL || "") + "/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: allMessages.map((m) => ({ role: m.role, content: m.content })),
          lang,
          products,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) throw new Error("Network error");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.done) break;
            if (data.error) {
              accumulated += lang === "ru"
                ? "\n\n⚠️ Ошибка. Позвоните нам: +373 67 200 463"
                : "\n\n⚠️ Eroare. Sunați-ne: +373 67 200 463";
              break;
            }
            if (data.content) {
              accumulated += data.content;
              const cleaned = extractLead(accumulated);
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { ...botMsg, content: cleaned };
                return updated;
              });
            }
          } catch {}
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      setMessages((prev) => {
        const updated = [...prev];
        const fallback = lang === "ru"
          ? "Ошибка соединения. Позвоните нам: **+373 67 200 463**"
          : "Eroare de conexiune. Sunați-ne: **+373 67 200 463**";
        updated[updated.length - 1] = { ...botMsg, content: fallback };
        return updated;
      });
    } finally {
      setStreaming(false);
      if (!open) setUnread((n) => n + 1);
    }
  }, [input, messages, streaming, lang, open, extractLead]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="TecoBot AI"
        className="fixed bottom-28 left-4 md:bottom-6 md:left-6 z-40 flex items-center gap-2 bg-gradient-to-br from-[#FF4F00] to-orange-600 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 px-3.5 py-2.5 md:px-4 md:py-3"
      >
        {open ? (
          <ChevronDown className="w-5 h-5" />
        ) : (
          <>
            <Bot className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-bold hidden sm:inline">TecoBot AI</span>
            <span className="text-sm font-bold sm:hidden">AI</span>
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                {unread}
              </span>
            )}
          </>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className="fixed left-0 right-0 z-50 flex items-end justify-start pointer-events-none md:inset-0 md:items-end md:justify-start"
          style={{
            top: window.visualViewport ? window.visualViewport.offsetTop : 0,
            height: `${vpHeight}px`,
          }}
        >
          <div className="pointer-events-auto w-full md:w-[380px] md:ml-6 md:mb-24 bg-white rounded-t-2xl md:rounded-2xl shadow-2xl border border-[#E4E4E7] flex flex-col overflow-hidden"
            style={{ height: window.innerWidth >= 768 ? "min(600px, calc(100vh - 80px))" : `${vpHeight}px` }}>

            {/* Header */}
            <div className="bg-gradient-to-r from-[#FF4F00] to-orange-500 px-4 py-3 flex items-center gap-3 flex-shrink-0">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold text-sm">TecoBot AI</span>
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-white/80 text-[11px]">
                    {lang === "ru" ? "Онлайн • Консультант" : "Online • Consultant"}
                  </span>
                </div>
              </div>
              <button onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors flex-shrink-0">
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FAFAFA]">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 rounded-full bg-[#FF4F00] flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                      <Bot className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                  <div className={`max-w-[82%] px-3 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-[#FF4F00] text-white rounded-tr-sm"
                      : "bg-white border border-[#E4E4E7] text-[#09090B] rounded-tl-sm shadow-sm"
                  }`}>
                    {msg.role === "assistant" ? (
                      <span dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                    ) : (
                      msg.content
                    )}
                    {msg.role === "assistant" && streaming && i === messages.length - 1 && msg.content === "" && (
                      <span className="inline-flex gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {leadCaptured && (
                <div className="flex justify-center">
                  <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2 text-xs text-green-700 font-medium flex items-center gap-1.5">
                    <span>✓</span>
                    <span>{lang === "ru" ? "Запрос сохранён — вам перезвонят" : "Cerere salvată — vă vom contacta"}</span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Human fallback */}
            {messages.length >= 2 && (
              <div className="px-3 py-2 flex-shrink-0 bg-white border-t border-zinc-100">
                <a
                  href={`https://wa.me/${phone}?text=${encodeURIComponent(lang === "ru" ? "Здравствуйте! Хочу поговорить с менеджером." : "Bună ziua! Vreau să vorbesc cu un consultant.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold py-2 rounded-xl text-xs transition-all"
                >
                  <User className="w-3.5 h-3.5" />
                  {lang === "ru" ? "Поговорить с человеком" : "Vorbesc cu un om"}
                </a>
              </div>
            )}

            {/* Input */}
            <div className="p-3 border-t border-[#E4E4E7] bg-white flex-shrink-0" style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
              <div className="flex gap-2 items-center">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  onFocus={() => setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100)}
                  placeholder={lang === "ru" ? "Напишите вопрос..." : "Scrie întrebarea ta..."}
                  disabled={streaming}
                  className="flex-1 bg-[#F4F4F5] rounded-xl px-3.5 py-2.5 text-base text-[#09090B] placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#FF4F00]/20 focus:bg-white transition-all disabled:opacity-50"
                />
                <button
                  onClick={send}
                  disabled={!input.trim() || streaming}
                  className="w-10 h-10 rounded-xl bg-[#FF4F00] text-white flex items-center justify-center hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 flex-shrink-0"
                >
                  {streaming ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-[10px] text-zinc-400 text-center mt-1.5">
                {lang === "ru" ? "Powered by Gemini AI · Teco.md" : "Powered by Gemini AI · Teco.md"}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
