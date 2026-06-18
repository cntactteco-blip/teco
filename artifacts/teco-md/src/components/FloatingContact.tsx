import { useState, useEffect } from "react";
import { X, Wrench } from "lucide-react";
import { Link } from "wouter";
import { useStore } from "@/lib/store";

const WA_MSG = encodeURIComponent("Bună ziua! Sunt interesat de sistemele de supraveghere TECO.MD. Pot primi o ofertă?");
const INSTALL_MSG = encodeURIComponent("Bună ziua! Vreau să solicit montaj/instalare sisteme supraveghere. Puteți oferi un deviz?");

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function ViberIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 1C6.477 1 2 5.254 2 10.5c0 2.963 1.388 5.61 3.57 7.37L5 22l4.109-2.148A11.02 11.02 0 0012 20c5.523 0 10-4.254 10-9.5S17.523 1 12 1zm0 17c-.93 0-1.83-.14-2.67-.4L7 18.5l.49-2.63C5.97 14.65 5 12.67 5 10.5 5 6.91 8.13 4 12 4s7 2.91 7 6.5S15.87 18 12 18z"/>
      <path d="M15.5 13.06c-.28-.14-.84-.41-.96-.46-.13-.05-.22-.07-.32.07s-.37.46-.45.55c-.08.1-.17.11-.3.04-.14-.07-.57-.21-1.09-.67-.4-.36-.67-.8-.75-.94-.08-.14-.01-.2.06-.27l.2-.24c.07-.07.09-.12.14-.2.05-.08.02-.16-.01-.23L11.5 9.5c-.11-.28-.22-.24-.3-.24h-.26c-.09 0-.24.04-.37.18-.13.13-.49.47-.49 1.15s.5 1.34.57 1.43c.07.1.98 1.5 2.38 2.1.33.14.59.23.8.3.33.1.63.08.87.05.27-.04.83-.34.94-.67.12-.33.12-.61.09-.67-.04-.07-.13-.11-.27-.17z"/>
    </svg>
  );
}

export function FloatingContact() {
  const adminPhone = useStore((s) => s.settings.general?.adminPhone ?? "");
  const [open, setOpen] = useState(false);
  const [pulse, setPulse] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setPulse(false), 8000);
    return () => clearTimeout(t);
  }, []);

  const phone = (adminPhone || "37367200463").replace(/\D/g, "");
  const waLink = `https://wa.me/${phone}?text=${WA_MSG}`;
  const installLink = `https://wa.me/${phone}?text=${INSTALL_MSG}`;
  const viberLink = `viber://chat?number=${phone}`;

  return (
    <div className="hidden md:flex fixed bottom-6 right-4 z-50 flex-col items-end gap-2">
      {open && (
        <div className="flex flex-col items-end gap-2 mb-1">
          {/* Solicită Montaj */}
          <Link
            href="/servicii"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 bg-[#FF4F00] text-white text-sm font-bold pl-3 pr-4 py-2.5 rounded-2xl shadow-[0_4px_20px_rgba(255,79,0,0.45)] hover:opacity-90 active:scale-95 transition-all"
            style={{ animation: "slideUp 0.1s ease-out" }}
          >
            <Wrench className="w-4 h-4 shrink-0" />
            <span>Solicită Montaj</span>
          </Link>
          {/* Viber */}
          <a
            href={viberLink}
            className="flex items-center gap-2.5 bg-[#7360F2] text-white text-sm font-bold pl-3 pr-4 py-2.5 rounded-2xl shadow-[0_4px_20px_rgba(115,96,242,0.5)] hover:opacity-90 active:scale-95 transition-all"
            style={{ animation: "slideUp 0.18s ease-out" }}
          >
            <ViberIcon className="w-5 h-5 shrink-0" />
            <span>Viber</span>
          </a>
          {/* WhatsApp */}
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 bg-[#25D366] text-white text-sm font-bold pl-3 pr-4 py-2.5 rounded-2xl shadow-[0_4px_20px_rgba(37,211,102,0.5)] hover:opacity-90 active:scale-95 transition-all"
            style={{ animation: "slideUp 0.25s ease-out" }}
          >
            <WhatsAppIcon className="w-5 h-5 shrink-0" />
            <span>WhatsApp</span>
          </a>
        </div>
      )}

      {/* Main FAB */}
      <div className="relative">
        {pulse && !open && (
          <>
            <span className="absolute inset-0 rounded-full bg-[#FF4F00] opacity-30 animate-ping" />
            <span className="absolute inset-0 rounded-full bg-[#FF4F00] opacity-20 animate-ping [animation-delay:0.4s]" />
          </>
        )}
        <button
          onClick={() => { setOpen((o) => !o); setPulse(false); }}
          aria-label={open ? "Închide" : "Contactează-ne acum"}
          className={`relative w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-200 active:scale-95 select-none ${
            open ? "bg-zinc-800 rotate-0" : "bg-[#FF4F00]"
          }`}
        >
          {open ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <WhatsAppIcon className="w-7 h-7 text-white" />
          )}
        </button>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
