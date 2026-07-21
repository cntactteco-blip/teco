import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { X, Wrench, FileText, Lock, Award, ChevronRight, Phone, Instagram, Facebook } from "lucide-react";
import { useStore } from "@/lib/store";
import { useLang } from "@/contexts/LangContext";
import { CatIconBadge } from "@/components/CatIcons";

interface SidebarDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function SidebarDrawer({ open, onClose }: SidebarDrawerProps) {
  const [location] = useLocation();
  const { lang, t } = useLang();
  const products = useStore((s) => s.products);
  const categories = useStore((s) => s.settings.categories);
  const adminPhone = useStore((s) => s.settings.general?.adminPhone ?? "");
  const phone = (adminPhone || "37367200463").replace(/\D/g, "");

  const pages = [
    { href: "/servicii#montaj",    icon: Wrench,   label: t("sidebar.install") },
    { href: "/servicii#reparatii", icon: FileText, label: t("sidebar.repair") },
    { href: "/blog",               icon: FileText, label: t("sidebar.blog") },
  ];

  const legal = [
    { href: "/termeni",           label: t("sidebar.terms") },
    { href: "/confidentialitate", label: t("sidebar.privacy_policy") },
    { href: "/garantii",          label: t("sidebar.returns") },
  ];

  // Contoare calculate live din catalog — dinamic din categoriile admin
  const catCounts = categories.map((cat) => ({
    href: `/produse?cat=${cat.slug}`,
    slug: cat.slug,
    iconKey: cat.iconKey,
    label: lang === "ru" ? (cat.labelRu ?? cat.label) : cat.label,
    count: products.filter((p) => p.category === cat.slug).length,
  }));

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => { onClose(); }, [location]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 left-0 z-50 h-full w-[300px] sm:w-[320px] bg-white flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
          <Link href="/" onClick={onClose} className="font-black text-xl tracking-tighter text-[#09090B]">
            TECO<span className="text-[#FF4F00]">.</span>MD
          </Link>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-zinc-100 transition-colors">
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {/* Catalog */}
          <div className="px-4 py-3">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-2 mb-2">{t("sidebar.catalog")}</p>
            {catCounts.map(({ href, slug, iconKey, label, count }) => (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-zinc-50 transition-colors group"
              >
                <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CatIconBadge slug={slug} iconKey={iconKey} className="w-4 h-4" />
                </div>
                <span className="flex-1 text-sm font-medium text-zinc-700 group-hover:text-[#09090B]">{label}</span>
                <span className="text-[10px] text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded-full font-medium">{count}</span>
              </Link>
            ))}
          </div>

          <div className="h-px bg-zinc-100 mx-4 my-1" />

          {/* Utility pages */}
          <div className="px-4 py-3">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-2 mb-2">{t("sidebar.services_section")}</p>
            {pages.map(({ href, icon: Icon, label }) => (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-zinc-50 transition-colors group"
              >
                <div className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-zinc-500" />
                </div>
                <span className="flex-1 text-sm font-medium text-zinc-700 group-hover:text-[#09090B]">{label}</span>
                <ChevronRight className="w-4 h-4 text-zinc-300" />
              </Link>
            ))}
          </div>

          <div className="h-px bg-zinc-100 mx-4 my-1" />

          {/* Legal */}
          <div className="px-4 py-3">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-2 mb-2">{t("sidebar.legal")}</p>
            {legal.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-zinc-50 transition-colors"
              >
                <Lock className="w-3.5 h-3.5 text-zinc-300 ml-1.5" />
                <span className="text-sm text-zinc-500 hover:text-zinc-700">{label}</span>
              </Link>
            ))}
          </div>

          {/* Contact quick links */}
          <div className="px-4 py-3 mx-4 bg-zinc-50 rounded-2xl my-2">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">{t("sidebar.contact_quick")}</p>
            <a href={`tel:+${phone}`} className="flex items-center gap-2 text-sm font-semibold text-[#09090B] hover:text-[#FF4F00] transition-colors mb-1">
              <Phone className="w-4 h-4 text-[#FF4F00]" /> +{phone.slice(0,3)} {phone.slice(3,5)} {phone.slice(5,8)} {phone.slice(8)}
            </a>
            <div className="flex gap-3 mt-2">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-[#FF4F00] transition-colors">
                <Instagram className="w-3.5 h-3.5" /> Instagram
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-[#FF4F00] transition-colors">
                <Facebook className="w-3.5 h-3.5" /> Facebook
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-zinc-100">
          <div className="flex items-center gap-2 mb-1">
            <Award className="w-3.5 h-3.5 text-[#FF4F00]" />
            <span className="text-xs font-bold text-zinc-700">{t("sidebar.warranty_badge")}</span>
          </div>
          <p className="text-[10px] text-zinc-400">{t("sidebar.copyright")}</p>
        </div>
      </div>
    </>
  );
}
