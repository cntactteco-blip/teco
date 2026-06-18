import { useState, useEffect, useCallback } from "react";
import { X, Shield, Phone, User } from "lucide-react";
import { storeActions } from "@/lib/store";
import { trackLead } from "@/lib/analytics";

const STORAGE_KEY = "teco_exit_shown_at";
const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

export function ExitIntentPopup() {
  const [visible, setVisible] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const tryShow = useCallback(() => {
    const last = localStorage.getItem(STORAGE_KEY);
    if (last && Date.now() - Number(last) < COOLDOWN_MS) return;
    setVisible(true);
  }, []);

  useEffect(() => {
    const onMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 5) tryShow();
    };
    const timer = setTimeout(tryShow, 30000);
    document.addEventListener("mouseleave", onMouseLeave);
    return () => {
      document.removeEventListener("mouseleave", onMouseLeave);
      clearTimeout(timer);
    };
  }, [tryShow]);

  const dismiss = useCallback(() => {
    setVisible(false);
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    storeActions.addLead({
      name: name.trim(),
      phone: phone.trim(),
      source: "exit-intent",
      notes: "Captat prin popup exit-intent",
    });
    trackLead("exit-intent");
    setSubmitted(true);
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
    setTimeout(dismiss, 3000);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={dismiss} />
      <div
        className="relative bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden"
        style={{ animation: "exitPopupIn 0.25s cubic-bezier(0.34,1.56,0.64,1) both" }}
      >
        <style>{`
          @keyframes exitPopupIn {
            from { opacity: 0; transform: scale(0.88) translateY(20px); }
            to   { opacity: 1; transform: scale(1) translateY(0); }
          }
        `}</style>

        <div className="bg-gradient-to-br from-[#FF4F00] to-orange-600 px-6 pt-6 pb-10 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-28 h-28 bg-white/10 rounded-full" />
          <div className="absolute right-6 bottom-2 w-14 h-14 bg-white/10 rounded-full" />
          <button
            onClick={dismiss}
            className="absolute top-4 right-4 p-1.5 bg-white/20 hover:bg-white/30 rounded-full transition-colors z-10"
          >
            <X className="w-4 h-4 text-white" />
          </button>
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-3">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-1">Ofertă specială</p>
          <h2 className="text-white font-black text-[22px] leading-tight">Înainte să pleci...</h2>
          <p className="text-white/80 text-sm mt-1.5">Lasă datele și îți trimitem o ofertă personalizată <strong className="text-white">GRATIS</strong> în 24h.</p>
        </div>

        <div className="px-6 -mt-5">
          {submitted ? (
            <div className="py-8 text-center">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-3xl">✅</span>
              </div>
              <p className="font-black text-zinc-800 text-lg">Mulțumim!</p>
              <p className="text-sm text-zinc-500 mt-1">Te contactăm în cel mai scurt timp.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="py-5 space-y-3">
              <div className="space-y-2.5">
                <div className="flex items-center gap-2.5 bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 focus-within:border-[#FF4F00] transition-colors">
                  <User className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Numele tău"
                    required
                    className="flex-1 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none bg-transparent"
                  />
                </div>
                <div className="flex items-center gap-2.5 bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 focus-within:border-[#FF4F00] transition-colors">
                  <Phone className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+373 6X XXX XXX"
                    required
                    type="tel"
                    className="flex-1 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none bg-transparent"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-[#FF4F00] text-white font-black py-4 rounded-2xl text-[15px] hover:opacity-90 active:scale-[0.99] transition-all shadow-[0_6px_20px_rgba(255,79,0,0.35)]"
              >
                Vreau Oferta Gratuită →
              </button>
              <div className="flex items-center justify-center gap-3 pb-1">
                {["Fără spam", "1 apel max.", "Confidențial"].map((t) => (
                  <span key={t} className="text-[10px] text-zinc-400 flex items-center gap-1">
                    <span className="text-green-500">✓</span> {t}
                  </span>
                ))}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
