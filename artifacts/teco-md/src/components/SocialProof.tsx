import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ShoppingCart } from "lucide-react";

const notifications = [
  { name: "Ion C.", action: "a cumpărat Camera Tiandy 5MP", time: "3 min" },
  { name: "Maria B.", action: "a adăugat Kit Solar în coș", time: "11 min" },
  { name: "Alexandru M.", action: "a comandat NVR Dahua WizSense", time: "52 min" },
  { name: "Elena D.", action: "a luat Sistemul Ajax pentru casă", time: "2 ore" },
  { name: "Vadim T.", action: "a cumpărat Camera TP-Link VIGI 4MP", time: "5 min" },
];

export function SocialProof() {
  const [location] = useLocation();
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);

  const shouldShow = location === "/produse";

  useEffect(() => {
    if (!shouldShow) { setVisible(false); return; }
    const show = setTimeout(() => setVisible(true), 3500);
    const cycle = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((p) => (p + 1) % notifications.length);
        setVisible(true);
      }, 600);
    }, 8000);
    return () => { clearTimeout(show); clearInterval(cycle); };
  }, [shouldShow]);

  if (!shouldShow) return null;

  const n = notifications[index];

  return (
    <div
      className={`fixed z-40 pointer-events-none select-none
        bottom-[80px] left-3 md:bottom-5 md:left-4
        transition-all duration-500 ease-out
        ${visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-3"}`}
    >
      <div className="flex items-center gap-2.5 bg-zinc-950 rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.25)] pl-3 pr-4 py-2.5 max-w-[220px]"
        style={{ borderLeft: "3px solid #FF4F00" }}>
        <ShoppingCart className="w-3.5 h-3.5 text-[#FF4F00] shrink-0" />
        <div className="min-w-0">
          <p className="text-[10px] text-white leading-snug truncate">
            <span className="font-semibold">{n.name}</span>{" "}
            <span className="text-zinc-400 font-normal">{n.action}</span>
          </p>
          <p className="text-[9px] text-zinc-500 mt-0.5">acum {n.time}</p>
        </div>
      </div>
    </div>
  );
}
