import { Link } from "wouter";
import { useLang } from "@/contexts/LangContext";

export function Footer() {
  const { t } = useLang();
  return (
    <footer className="bg-zinc-950 pt-16 pb-8 mt-auto text-white" data-testid="footer">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-10 mb-16">
        <div className="space-y-4">
          <div className="font-bold text-2xl tracking-tighter text-white">
            TECO<span className="text-[#FF4F00]">.</span>MD
          </div>
          <p className="text-zinc-400 text-sm leading-relaxed">{t("footer.desc")}</p>
        </div>

        <div>
          <h4 className="font-medium text-white mb-5 text-sm uppercase tracking-wider">{t("footer.products")}</h4>
          <ul className="space-y-3 text-sm text-zinc-400">
            <li><Link href="/produse" className="hover:text-[#FF4F00] transition-colors">{t("footer.p.wifi")}</Link></li>
            <li><Link href="/produse" className="hover:text-[#FF4F00] transition-colors">{t("footer.p.poe")}</Link></li>
            <li><Link href="/produse" className="hover:text-[#FF4F00] transition-colors">{t("footer.p.nvr")}</Link></li>
            <li><Link href="/produse" className="hover:text-[#FF4F00] transition-colors">{t("footer.p.kits")}</Link></li>
            <li><Link href="/produse" className="hover:text-[#FF4F00] transition-colors">{t("footer.p.alarm")}</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-medium text-white mb-5 text-sm uppercase tracking-wider">{t("footer.services")}</h4>
          <ul className="space-y-3 text-sm text-zinc-400">
            <li><a href="#" className="hover:text-[#FF4F00] transition-colors">{t("footer.s.install")}</a></li>
            <li><a href="#" className="hover:text-[#FF4F00] transition-colors">{t("footer.s.config")}</a></li>
            <li><a href="#" className="hover:text-[#FF4F00] transition-colors">{t("footer.s.service")}</a></li>
            <li><a href="#" className="hover:text-[#FF4F00] transition-colors">{t("footer.s.consult")}</a></li>
            <li><a href="#" className="hover:text-[#FF4F00] transition-colors">{t("footer.s.audit")}</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-medium text-white mb-5 text-sm uppercase tracking-wider">{t("footer.contact")}</h4>
          <ul className="space-y-3 text-sm text-zinc-400">
            <li>Chișinău, Moldova</li>
            <li><a href="tel:+37369123456" className="hover:text-[#FF4F00] transition-colors">+373 69 123 456</a></li>
            <li><a href="mailto:contact@teco.md" className="hover:text-[#FF4F00] transition-colors">contact@teco.md</a></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-zinc-500">
        <div>{t("footer.copyright")}</div>
        <div className="flex items-center gap-6">
          <a href="#" className="hover:text-zinc-300 transition-colors">{t("footer.terms")}</a>
          <a href="#" className="hover:text-zinc-300 transition-colors">{t("footer.privacy")}</a>
          <a href="#" className="hover:text-zinc-300 transition-colors">{t("footer.warranty_link")}</a>
          <Link href="/admin" className="text-zinc-800 hover:text-zinc-600 transition-colors text-[10px] font-mono select-none" title="Admin">·</Link>
        </div>
      </div>
    </footer>
  );
}
