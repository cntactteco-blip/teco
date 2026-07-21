import { useStore } from "@/lib/store";
import { SEO } from "@/components/SEO";

export default function Page() {
  const content = useStore((s) => (s.settings.staticPages as Record<string,string> | undefined)?.["termeni"] ?? "");
  return (
    <>
      <SEO
        title="Termeni și Condiții — Teco.md"
        description="Termenii și condițiile de utilizare a magazinului online Teco.md. Sisteme de supraveghere în Moldova."
      />
      <main className="max-w-3xl mx-auto px-5 py-12 pb-[64px] md:pb-12">
        <h1 className="text-3xl font-black text-[#09090B] mb-8">Termeni și Condiții</h1>
        <div className="prose prose-zinc max-w-none whitespace-pre-wrap text-zinc-700 leading-relaxed">
          {content || <p className="text-zinc-400 italic">Conținut în curs de completare...</p>}
        </div>
      </main>
    </>
  );
}
