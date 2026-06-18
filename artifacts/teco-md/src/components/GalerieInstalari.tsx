import { useState } from "react";
import { X, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { useStore } from "@/lib/store";

export default function GalerieInstalari() {
  const gallery = useStore((s) => s.settings.gallery ?? []);
  const [lightbox, setLightbox] = useState<number | null>(null);

  if (gallery.length === 0) return null;

  const prev = () => setLightbox((i) => (i! - 1 + gallery.length) % gallery.length);
  const next = () => setLightbox((i) => (i! + 1) % gallery.length);

  return (
    <>
      <section className="w-full bg-zinc-950 py-16 px-4">
        {/* Header */}
        <div className="max-w-7xl mx-auto mb-10">
          <span className="inline-block bg-white/10 text-white/70 text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-widest">
            Portofoliu
          </span>
          <h2 className="font-black text-2xl md:text-4xl text-white tracking-tight">
            Instalări Realizate
          </h2>
          <p className="text-zinc-400 text-sm mt-2 max-w-xl">
            Sisteme de supraveghere montate de echipa TECO.MD — case, afaceri, depozite.
          </p>
        </div>

        {/* Grid */}
        <div className="max-w-7xl mx-auto columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3">
          {gallery.map((item, idx) => (
            <div
              key={item.id}
              className="break-inside-avoid relative group cursor-pointer rounded-xl overflow-hidden bg-zinc-800"
              onClick={() => setLightbox(idx)}
            >
              <img
                src={item.imageUrl}
                alt={item.title ?? `Instalare ${idx + 1}`}
                className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              {(item.title || item.location) && (
                <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                  {item.title && (
                    <p className="text-white text-xs font-bold leading-tight">{item.title}</p>
                  )}
                  {item.location && (
                    <p className="text-zinc-300 text-[10px] flex items-center gap-1 mt-0.5">
                      <MapPin className="w-2.5 h-2.5 flex-shrink-0" /> {item.location}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center"
          onClick={() => setLightbox(null)}
        >
          {/* Close */}
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors z-10"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          {/* Prev */}
          {gallery.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors z-10"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
          )}

          {/* Image */}
          <div
            className="max-w-[90vw] max-h-[90vh] flex flex-col items-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={gallery[lightbox].imageUrl}
              alt={gallery[lightbox].title ?? ""}
              className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl"
            />
            {(gallery[lightbox].title || gallery[lightbox].location) && (
              <div className="text-center">
                {gallery[lightbox].title && (
                  <p className="text-white font-bold text-base">{gallery[lightbox].title}</p>
                )}
                {gallery[lightbox].location && (
                  <p className="text-zinc-400 text-sm flex items-center justify-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> {gallery[lightbox].location}
                  </p>
                )}
              </div>
            )}
            <p className="text-zinc-600 text-xs">
              {lightbox + 1} / {gallery.length}
            </p>
          </div>

          {/* Next */}
          {gallery.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); next(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors z-10"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
          )}
        </div>
      )}
    </>
  );
}
