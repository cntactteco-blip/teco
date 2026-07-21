import { Link } from "wouter";
import { SEO } from "@/components/SEO";
import { ArrowLeft, Camera } from "lucide-react";

export default function NotFound() {
  return (
    <>
      <SEO title="Pagina nu a fost găsită — Teco.md" noIndex />
      <div className="flex-1 bg-[#FAFAFA] flex items-center justify-center px-4 py-20 pb-[64px] md:pb-8">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Camera className="w-10 h-10 text-[#FF4F00]" />
          </div>
          <h1 className="font-black text-6xl text-[#FF4F00] mb-2">404</h1>
          <p className="font-bold text-xl text-[#09090B] mb-2">Pagina nu a fost găsită</p>
          <p className="text-zinc-500 text-sm mb-8">
            Pagina pe care o cauți nu există sau a fost mutată.<br />
            Revino la magazin și găsești tot ce ai nevoie.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-[#FF4F00] text-white font-bold px-6 py-3 rounded-xl hover:opacity-90 active:scale-95 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Înapoi la Magazin
          </Link>
        </div>
      </div>
    </>
  );
}
