import { useParams, Link } from "wouter";
import { useStore } from "@/lib/store";
import { useLang } from "@/contexts/LangContext";
import { SEO, schemas } from "@/components/SEO";
import { Calendar, Clock, ArrowLeft, Share2, Tag, ChevronRight, Facebook, Twitter, Link2, CheckCircle2 } from "lucide-react";
import { useState } from "react";

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

function parseContent(content: string) {
  const lines = content.split("\n");
  const elements: React.JSX.Element[] = [];
  let tableRows: string[] = [];
  let inTable = false;
  let key = 0;

  const flushTable = () => {
    if (tableRows.length === 0) return;
    const headers = tableRows[0].split("|").map((h) => h.trim()).filter(Boolean);
    const dataRows = tableRows.slice(2).filter((r) => r.includes("|"));
    elements.push(
      <div key={`table-${key++}`} className="overflow-x-auto my-6">
        <table className="w-full border-collapse border border-zinc-200 rounded-lg">
          <thead>
            <tr className="bg-zinc-50">
              {headers.map((h, i) => (
                <th key={i} className="border border-zinc-200 px-4 py-3 text-left text-sm font-bold text-zinc-800">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataRows.map((row, ri) => {
              const cells = row.split("|").map((c) => c.trim()).filter(Boolean);
              return (
                <tr key={ri} className={ri % 2 === 1 ? "bg-zinc-50/50" : ""}>
                  {cells.map((c, ci) => (
                    <td key={ci} className="border border-zinc-200 px-4 py-3 text-sm text-zinc-700">
                      {c}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
    tableRows = [];
    inTable = false;
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (inTable) flushTable();
      continue;
    }

    if (trimmed.startsWith("## ")) {
      if (inTable) flushTable();
      elements.push(
        <h2 key={`h2-${key++}`} className="text-2xl font-bold text-zinc-900 mt-10 mb-4">
          {trimmed.replace("## ", "")}
        </h2>
      );
    } else if (trimmed.startsWith("### ")) {
      if (inTable) flushTable();
      elements.push(
        <h3 key={`h3-${key++}`} className="text-xl font-bold text-zinc-800 mt-8 mb-3">
          {trimmed.replace("### ", "")}
        </h3>
      );
    } else if (trimmed.startsWith("|")) {
      inTable = true;
      tableRows.push(trimmed);
    } else if (trimmed.startsWith("- ")) {
      if (inTable) flushTable();
      elements.push(
        <ul key={`ul-${key++}`} className="list-disc list-inside my-3 space-y-1 text-zinc-700">
          <li className="text-base leading-relaxed">
            {trimmed.replace("- ", "").replace(/\*\*(.+?)\*\*/g, (_, t) => `<strong>${t}</strong>`).replace(/\*(.+?)\*/g, (_, t) => `<em>${t}</em>`)}
          </li>
        </ul>
      );
    } else if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
      if (inTable) flushTable();
      elements.push(
        <p key={`bold-${key++}`} className="font-bold text-zinc-900 my-3">
          {trimmed.replace(/\*\*/g, "")}
        </p>
      );
    } else {
      if (inTable) flushTable();
      const html = trimmed
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.+?)\*/g, "<em>$1</em>")
        .replace(/\ud83c\udf1e|\ud83d\udcf1|\ud83d\udcfa|\ud83c\udfe2|\ud83d\udee3\ufe0f|\ud83c\udfe0|\ud83c\udf33/g, (m) => m);
      elements.push(
        <p key={`p-${key++}`} className="text-base leading-relaxed text-zinc-700 my-3"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    }
  }
  if (inTable) flushTable();
  return elements;
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const { lang } = useLang();
  const [copied, setCopied] = useState(false);
  const posts = useStore((s) => s.blogPosts);
  const post = posts.find((p) => p.slug === slug && p.published);
  const otherPosts = posts.filter((p) => p.published && p.id !== post?.id).slice(0, 3);

  if (!post) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zinc-900 mb-2">
            {lang === "ru" ? "Статья не найдена" : "Articol negăsit"}
          </h1>
          <p className="text-zinc-500 mb-4">
            {lang === "ru" ? "Возможно, статья была удалена или неверная ссылка" : "Posibil articolul a fost șters sau link-ul e greșit"}
          </p>
          <Link href="/blog" className="text-[#FF4F00] font-bold hover:underline">
            {lang === "ru" ? "Вернуться в блог" : "Înapoi la blog"}
          </Link>
        </div>
      </main>
    );
  }

  const title = lang === "ru" ? post.titleRu || post.title : post.title;
  const description = lang === "ru" ? post.descriptionRu || post.description : post.description;
  const content = lang === "ru" ? post.contentRu || post.content : post.content;
  const metaTitle = lang === "ru" ? post.metaTitleRu || post.metaTitle || title : post.metaTitle || title;
  const metaDesc = lang === "ru" ? post.metaDescriptionRu || post.metaDescription || description : post.metaDescription || description;
  const keywords = lang === "ru" ? post.keywordsRu || post.keywords : post.keywords;
  const category = lang === "ru" ? post.categoryRu || post.category : post.category;
  const canonicalUrl = `https://teco.md/blog/${post.slug}`;

  const jsonLd = [
    schemas.blogPost({
      title,
      slug: post.slug,
      description: metaDesc,
      content,
      imageUrl: post.imageUrl || "https://teco.md/og-image.jpg",
      publishedAt: post.publishedAt,
      author: post.author,
      category,
    }),
    schemas.breadcrumb([
      { name: lang === "ru" ? "Главная" : "Acasă", url: "https://teco.md/" },
      { name: lang === "ru" ? "Блог" : "Blog", url: "https://teco.md/blog" },
      { name: title, url: canonicalUrl },
    ]),
  ];

  const handleCopy = () => {
    navigator.clipboard.writeText(canonicalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = (platform: "facebook" | "twitter") => {
    const url = encodeURIComponent(canonicalUrl);
    const text = encodeURIComponent(title);
    const shareUrl = platform === "facebook"
      ? `https://www.facebook.com/sharer/sharer.php?u=${url}`
      : `https://twitter.com/intent/tweet?url=${url}&text=${text}`;
    window.open(shareUrl, "_blank", "width=600,height=400");
  };

  return (
    <>
      <SEO
        title={metaTitle}
        description={metaDesc}
        keywords={keywords}
        ogType="article"
        ogImage={post.imageUrl || "/og-image.jpg"}
        canonical={`/blog/${post.slug}`}
        lang={lang}
        jsonLd={jsonLd}
      />
      <main className="min-h-screen bg-white" role="main">
        {/* Hero Article */}
        <section className="bg-zinc-950 pt-8 pb-0">
          <div className="max-w-4xl mx-auto px-6">
            <nav aria-label="breadcrumb" className="mb-6">
              <ol className="flex items-center gap-2 text-sm text-zinc-400">
                <li><Link href="/" className="hover:text-[#FF4F00] transition-colors">{lang === "ru" ? "Главная" : "Acasă"}</Link></li>
                <li><ChevronRight className="w-4 h-4" /></li>
                <li><Link href="/blog" className="hover:text-[#FF4F00] transition-colors">Blog</Link></li>
                <li><ChevronRight className="w-4 h-4" /></li>
                <li className="text-[#FF4F00]" aria-current="page">{title}</li>
              </ol>
            </nav>

            <div className="flex items-center gap-3 mb-4">
              <span className="inline-flex items-center gap-1.5 bg-[#FF4F00] text-white text-xs font-bold px-3 py-1 rounded-full">
                <Tag className="w-3 h-3" />
                {category}
              </span>
              <span className="flex items-center gap-1 text-xs text-zinc-400">
                <Calendar className="w-3.5 h-3.5" />
                <time dateTime={post.publishedAt}>{formatDate(post.publishedAt, lang)}</time>
              </span>
              <span className="flex items-center gap-1 text-xs text-zinc-400">
                <Clock className="w-3.5 h-3.5" />
                {readingTimeLabel(post.readingTime || 3, lang)}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white mb-6 leading-tight">{title}</h1>
          </div>
        </section>

        {/* Article Image */}
        <div className="max-w-4xl mx-auto px-6">
          <div className="rounded-2xl overflow-hidden aspect-[16/9] shadow-lg -mt-2 mb-12">
            <img
              src={post.imageUrl || "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80"}
              alt={title}
              className="w-full h-full object-cover"
              width="1200"
              height="675"
            />
          </div>
        </div>

        {/* Article Content */}
        <article className="max-w-4xl mx-auto px-6 pb-16">
          <p className="text-lg text-zinc-500 leading-relaxed mb-8 font-medium">{description}</p>
          <div className="prose prose-zinc max-w-none">
            {parseContent(content)}
          </div>

          {/* Share Buttons */}
          <div className="mt-12 pt-8 border-t border-zinc-200">
            <p className="text-sm font-bold text-zinc-500 mb-3">
              {lang === "ru" ? "Поделиться статьей:" : "Distribuie articolul:"}
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleShare("facebook")}
                className="flex items-center gap-2 px-4 py-2 bg-[#1877F2] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                aria-label="Share on Facebook"
              >
                <Facebook className="w-4 h-4" />
                Facebook
              </button>
              <button
                onClick={() => handleShare("twitter")}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                aria-label="Share on Twitter"
              >
                <Twitter className="w-4 h-4" />
                Twitter
              </button>
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-100 text-zinc-700 rounded-lg text-sm font-medium hover:bg-zinc-200 transition-colors"
                aria-label="Copy link"
              >
                {copied ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Link2 className="w-4 h-4" />}
                {copied ? (lang === "ru" ? "Скопировано" : "Copiat") : "Link"}
              </button>
            </div>
          </div>

          {/* Back to Blog */}
          <div className="mt-8">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm font-bold text-[#FF4F00] hover:underline"
            >
              <ArrowLeft className="w-4 h-4" />
              {lang === "ru" ? "Вернуться в блог" : "Înapoi la blog"}
            </Link>
          </div>
        </article>

        {/* Related Articles */}
        {otherPosts.length > 0 && (
          <section className="bg-zinc-50 py-16">
            <div className="max-w-7xl mx-auto px-6">
              <h2 className="text-2xl font-bold text-zinc-900 mb-8">
                {lang === "ru" ? "Читают также" : "Citesc și"}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {otherPosts.map((p) => (
                  <article key={p.id} className="group bg-white rounded-xl border border-zinc-100 overflow-hidden hover:shadow-lg transition-shadow">
                    <Link href={`/blog/${p.slug}`} className="block overflow-hidden aspect-[16/10]">
                      <img
                        src={p.imageUrl || "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80"}
                        alt={lang === "ru" ? p.titleRu || p.title : p.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        width="400"
                        height="250"
                      />
                    </Link>
                    <div className="p-4">
                      <span className="text-xs text-[#FF4F00] font-bold">{lang === "ru" ? p.categoryRu || p.category : p.category}</span>
                      <h3 className="text-sm font-bold text-zinc-900 mt-1 group-hover:text-[#FF4F00] transition-colors">
                        <Link href={`/blog/${p.slug}`}>{lang === "ru" ? p.titleRu || p.title : p.title}</Link>
                      </h3>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </>
  );
}
