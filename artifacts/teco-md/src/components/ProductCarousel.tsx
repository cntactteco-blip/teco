import { useRef, useState } from "react";
import { ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { ProductCardSmall } from "./ProductCardSmall";
import type { StoreProduct } from "@/lib/store";

interface ProductCarouselProps {
  title: string;
  subtitle?: string;
  products: StoreProduct[];
  viewAllLink?: string;
}

export function ProductCarousel({ title, subtitle, products, viewAllLink = "#" }: ProductCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="py-6 overflow-hidden">
      <div className="flex items-end justify-between px-4 md:px-6 mb-4 max-w-7xl mx-auto w-full">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-zinc-900">{title}</h2>
          {subtitle && <p className="text-sm text-zinc-500 mt-0.5">{subtitle}</p>}
        </div>
        <Link href={viewAllLink} className="text-[#FF4F00] text-sm font-medium flex items-center hover:underline whitespace-nowrap">
          Vezi toate <ChevronRight className="w-4 h-4 ml-0.5" />
        </Link>
      </div>

      <div 
        ref={scrollRef}
        className="flex gap-3 px-4 md:px-6 overflow-x-auto no-scrollbar max-w-7xl mx-auto w-full"
        style={{ scrollSnapType: 'x mandatory' }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        data-testid={`carousel-${title}`}
      >
        {products.map(p => (
          <div key={p.id} style={{ scrollSnapAlign: 'start' }}>
            <ProductCardSmall product={p} />
          </div>
        ))}
      </div>
    </div>
  );
}
