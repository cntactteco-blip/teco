import { useStore } from "@/lib/store";
export default function Page() {
  const content = useStore((s) => (s.settings.staticPages as Record<string,string> | undefined)?.["garantii"] ?? "");
  return (
    <main className="max-w-3xl mx-auto px-5 py-12">
      <h1 className="text-3xl font-black text-[#09090B] mb-8">Garanții și Retur</h1>
      <div className="prose prose-zinc max-w-none whitespace-pre-wrap text-zinc-700 leading-relaxed">
        {content || <p className="text-zinc-400 italic">Conținut în curs de completare...</p>}
      </div>
    </main>
  );
}
