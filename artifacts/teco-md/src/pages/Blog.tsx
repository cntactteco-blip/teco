import { useState } from "react";
import { Link } from "wouter";
import { useStore, type BlogPost } from "@/lib/store";
import { useLang } from "@/contexts/LangContext";
import { SEO, schemas } from "@/components/SEO";
import { Search, Calendar, Clock, ArrowRight, Tag, ChevronRight } from "lucide-react";

function formatDate(iso: string, lang: "ro" | "ru") {
  const d = new Date(iso);
  if (lang === "ru") {
    return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
  }
  return d.toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" });
}

function readingTimeLabel(min: number, lang: "ro" | "ru") {
  if (lang === "ru") return `${min} мин чтения`;
  return `${min} min într-o cupă de cafeă`;
}

export default function Blog() {
  const { t, lang } = useLang();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const posts = useStore((s) => s.blogPosts.filter((p) => p.published));

  const categories = Array.from(new Set(posts.map((p) => (lang === "ru" ? p.categoryRu : p.category) ?? "Blog")));

  const filtered = posts.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch =
      (lang === "ru" ? p.titleRu : p.title)?.toLowerCase().includes(q) ||
      (lang === "ru" ? p.descriptionRu : p.description)?.toLowerCase().includes(q) ||
      p.slug.toLowerCase().includes(q);
    const matchesCategory = activeCategory ? (lang === "ru" ? p.categoryRu : p.category) === activeCategory : true;
    return matchesSearch && matchesCategory;
  });

  const pageTitle = lang === "ru"
    ? "Блог — Советы, гайды и новости безопасности | Teco.md"
    : "Blog — Sfaturi, Ghiduri și Noutăți din Securitate | Teco.md";

  const pageDesc = lang === "ru"
    ? "Экспертные статьи о видеонаблюдении, монтаже, выборе оборудования. Советы от профессионалов Teco.md в Молдове."
    : "Articole expert despre sisteme de supraveghere, montaj, alegere echipament. Sfaturi de la profesioniștii Teco.md în Moldova.";

  const keywords = lang === "ru"
    ? "блог безопасности, видеонаблюдение, камеры, советы, гайды, Молдова"
    : "blog securitate, supraveghere video, camere, sfaturi, ghiduri, Moldova, Teco.md";

  const jsonLd = [
    schemas.website(lang),
    schemas.localBusiness(lang),
    schemas.breadcrumb([
      { name: lang === "ru" ? "Главная" : "Acasă", url: "https://teco.md/" },
      { name: lang === "ru" ? "Блог" : "Blog", url: "https://teco.md/blog" },
    ]),
  ];

  return (
    <>
      <SEO
        title={pageTitle}
        description={pageDesc}
        keywords={keywords}
        ogType="website"
        canonical="/blog"
        lang={lang}
        jsonLd={jsonLd}
      />
      <main className="min-h-screen bg-white" role="main">
        {/* Header */}
        <section className="bg-zinc-950 pt-12 pb-16 md:pt-20 md:pb-24">
          <div className="max-w-7xl mx-auto px-6">
            <nav aria-label="breadcrumb">
              <ol className="flex items-center gap-2 text-sm text-zinc-400 mb-6">
                <li><Link href="/" className="hover:text-[#FF4F00] transition-colors">{lang === "ru" ? "Главная" : "Acasă"}</Link></li>
                <li><ChevronRight className="w-4 h-4" /></li>
                <li className="text-[#FF4F00]" aria-current="page">Blog</li>
              </ol>
            </nav>
            <h1 className="text-3xl md:text-5xl font-black text-white mb-4">
              {lang === "ru" ? "Блог про безопасность" : "Blog de Securitate"}
            </h1>
            <p className="text-zinc-400 text-lg max-w-2xl">
              {lang === "ru"
                ? "Экспертные статьи, гайды и новости из мира видеонаблюдения. Советы от профессионалов Teco.md."
                : "Articole expert, ghiduri practice și noutăți din lumea securității. Sfaturi de la profesioniștii Teco.md."}
            </p>
          </div>
        </section>

        {/* Search & Filters */}
        <section className="max-w-7xl mx-auto px-6 -mt-8">
          <div className="bg-white rounded-2xl shadow-lg border border-zinc-100 p-6 mb-12">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={lang === "ru" ? "Поиск по блогу..." : "Caută în blog..."}
                  className="w-full pl-12 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-[#FF4F00] focus:ring-2 focus:ring-[#FF4F00]/10 text-zinc-900"
                  aria-label={lang === "ru" ? "Поиск по блогу" : "Căutare blog"}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveCategory(null)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    activeCategory === null
                      ? "bg-[#FF4F00] text-white"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  }`}
                >
                  {lang === "ru" ? "Все" : "Toate"}
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      activeCategory === cat
                        ? "bg-[#FF4F00] text-white"
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Articles Grid */}
        <section className="max-w-7xl mx-auto px-6 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map((post) => (
              <article key={post.id} className="group flex flex-col bg-white rounded-2xl border border-zinc-100 overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <Link href={`/blog/${post.slug}`} className="relative overflow-hidden aspect-[16/10]">
                  <img
                    src={post.imageUrl || "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80"}
                    alt={lang === "ru" ? post.titleRu || post.title : post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    width="600"
                    height="375"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="inline-flex items-center gap-1.5 bg-[#FF4F00] text-white text-xs font-bold px-3 py-1 rounded-full">
                      <Tag className="w-3 h-3" />
                      {lang === "ru" ? post.categoryRu || post.category : post.category}
                    </span>
                  </div>
                </Link>
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-4 text-xs text-zinc-400 mb-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <time dateTime={post.publishedAt}>{formatDate(post.publishedAt, lang)}</time>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {readingTimeLabel(post.readingTime || 3, lang)}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-zinc-900 mb-2 group-hover:text-[#FF4F00] transition-colors line-clamp-2">
                    <Link href={`/blog/${post.slug}`} className="focus:outline-none">
                      {lang === "ru" ? post.titleRu || post.title : post.title}
                    </Link>
                  </h2>
                  <p className="text-sm text-zinc-500 mb-4 line-clamp-3 flex-1">
                    {lang === "ru" ? post.descriptionRu || post.description : post.description}
                  </p>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="inline-flex items-center gap-2 text-sm font-bold text-[#FF4F00] hover:gap-3 transition-all"
                    aria-label={lang === "ru" ? `Читать: ${post.titleRu || post.title}` : `Citește: ${post.title}`}
                  >
                    {lang === "ru" ? "Читать" : "Citește"}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-20">
              <Search className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
              <p className="text-zinc-500 text-lg">
                {lang === "ru" ? "Не найдено статей" : "Niciun articol găsit"}
              </p>
              <p className="text-zinc-400 text-sm mt-1">
                {lang === "ru" ? "Попробуйте другой запрос" : "Încercați altă căutare"}
              </p>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
