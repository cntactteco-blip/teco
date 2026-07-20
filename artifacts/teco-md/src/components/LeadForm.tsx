import { useState } from "react";
import { storeActions } from "@/lib/store";
import { ConsentCheckbox } from "@/components/ConsentCheckbox";

export function LeadForm() {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !consent) return;
    storeActions.addLead({ name, phone, source: "LeadForm Banner" });
    import("@/lib/notify").then(({ notifyLead }) =>
      notifyLead({ name, phone, source: "Banner — Configurare Gratuită" })
    );
    setSubmitted(true);
  };

  return (
    <section className="w-full bg-zinc-50 py-24 px-6 border-b border-zinc-200">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-8 tracking-tight">
          Nu stii ce sa alegi? Lasa un inginer TECO sa iti configureze sistemul gratuit.
        </h2>

        {submitted ? (
          <div className="bg-emerald-50 border border-emerald-200 p-8 rounded-sm">
            <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-mono text-emerald-800 font-bold">
              Cererea ta a fost primita. Te sunam in 15 minute.
            </p>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4">
              <input
                type="text"
                placeholder="Nume"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 h-14 px-4 bg-white border border-zinc-200 font-mono text-sm focus:outline-none focus:border-zinc-400 focus:ring-0"
                required
              />
              <input
                type="tel"
                placeholder="Telefon"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="flex-1 h-14 px-4 bg-white border border-zinc-200 font-mono text-sm focus:outline-none focus:border-zinc-400 focus:ring-0"
                required
              />
              <button
                type="submit"
                disabled={!consent}
                className="h-14 px-8 bg-primary hover:bg-[#E64600] text-white font-bold transition-colors whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Cere Audit Gratuit in 15 minute
              </button>
            </form>
            <div className="mt-3 max-w-xl mx-auto text-left">
              <ConsentCheckbox checked={consent} onChange={setConsent} />
            </div>
          </>
        )}
      </div>
    </section>
  );
}
