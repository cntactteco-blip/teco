import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useStore } from "@/lib/store";

const WA_MSG = encodeURIComponent("Bună ziua! Sunt interesat de sistemele de supraveghere TECO.MD. Pot primi o ofertă?");

// SVG icons for WhatsApp and Viber
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
      <path d="M11.398.002C8.195.017 3.76.46 1.517 2.53 -.024 4.07-.498 6.304-.554 9.073c-.055 2.77-.12 7.958 4.874 9.359h.004l-.004 2.146s-.033.876.545.876c.578 0 .875-.645 1.366-1.237c.276-.327.653-.807.938-1.16c2.586.217 4.573-.28 4.802-.355c.522-.168 3.476-.548 3.955-4.47c.495-4.043-.24-6.598-1.533-7.757zm.064 13.748c-.378.087-.78.132-1.191.136a5.6 5.6 0 01-.98-.085l-1.065 1.252-.005-2.618c-3.317-1.132-3.13-5.29-3.086-7.372c.045-2.08.437-3.785 1.644-4.867C8.985.92 12.396.613 13.6.607c1.213-.007 4.625.022 6.66 1.83c2.036 1.808 1.86 5.836 1.86 5.836c-.365 3.253-2.693 4.207-3.153 4.364c-.182.06-1.682.46-3.568.347zM15.24 9.516a.469.469 0 01-.468-.476c0-.092.025-.178.07-.25-.03-.08-.063-.169-.1-.267a1.26 1.26 0 00-.175-.35 2.21 2.21 0 00-.612-.548c-.354-.215-.7-.29-.9-.3h-.044a.47.47 0 01-.468-.47c0-.263.211-.475.474-.475l.044.001c.31.015.852.123 1.374.445.296.18.56.41.785.686.16.196.293.41.394.64.058.133.105.26.143.38a.472.472 0 01-.517.184zm1.658 1.027a.471.471 0 01-.47-.471 3.23 3.23 0 00-.094-.78 4.247 4.247 0 00-.49-1.205 4.003 4.003 0 00-.873-.994 3.784 3.784 0 00-1.57-.76 3.91 3.91 0 00-.67-.086.47.47 0 01-.46-.479.47.47 0 01.479-.46c.273.006.548.039.817.1.73.167 1.4.507 1.956.983.463.395.85.878 1.14 1.422.25.472.423.984.51 1.513.04.24.059.484.059.737a.471.471 0 01-.334.48zm1.628 1.123a.47.47 0 01-.472-.468 6.244 6.244 0 00-.042-.73 6.803 6.803 0 00-.654-2.288 6.416 6.416 0 00-1.308-1.797 5.925 5.925 0 00-1.87-1.21 5.957 5.957 0 00-1.44-.384 6.29 6.29 0 00-.798-.048.47.47 0 01-.47-.47c0-.26.21-.47.47-.47.305 0 .61.018.91.055.666.08 1.315.265 1.918.548a6.83 6.83 0 012.18 1.436c.627.62 1.11 1.36 1.421 2.175.237.624.372 1.283.4 1.95.008.18.012.36.012.64a.47.47 0 01-.257.061z" />
    </svg>
  );
}

export function FloatingContact() {
  const adminPhone = useStore((s) => s.settings.general?.adminPhone ?? "");
  const [open, setOpen] = useState(false);
  const [pulse, setPulse] = useState(true);

  // Stop pulsing after 8s so it's not distracting
  useEffect(() => {
    const t = setTimeout(() => setPulse(false), 8000);
    return () => clearTimeout(t);
  }, []);

  const phone = adminPhone || "37367200463";
  const waLink = `https://wa.me/${phone.replace(/\D/g, "")}?text=${WA_MSG}`;
  const viberLink = `viber://chat?number=%2B${phone.replace(/\D/g, "")}`;

  return (
    <div className="hidden md:flex fixed bottom-6 right-4 z-50 flex-col items-end gap-2">
      {/* Expanded options */}
      {open && (
        <div className="flex flex-col items-end gap-2 mb-1">
          {/* Viber */}
          <a
            href={viberLink}
            className="flex items-center gap-2.5 bg-[#7360F2] text-white text-sm font-bold pl-3 pr-4 py-2.5 rounded-2xl shadow-[0_4px_20px_rgba(115,96,242,0.5)] hover:opacity-90 active:scale-95 transition-all"
            style={{ animation: "slideUp 0.15s ease-out" }}
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
            style={{ animation: "slideUp 0.2s ease-out" }}
          >
            <WhatsAppIcon className="w-5 h-5 shrink-0" />
            <span>WhatsApp</span>
          </a>
        </div>
      )}

      {/* Main FAB */}
      <div className="relative">
        {/* Pulse ring */}
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
