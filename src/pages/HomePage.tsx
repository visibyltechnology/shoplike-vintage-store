import { useState, useEffect } from "react";
import { Link } from "wouter";
import { ChevronRight, Clock, Zap, Percent, MessageCircle } from "lucide-react";
import { useProducts, useFeaturedProducts } from "@/lib/use-products";
import ProductCard from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";

const HERO_SLIDES = [
  {
    title: "NEW ARRIVALS",
    subtitle: "Discover Your Style",
    body: "Explore our curated collection of premium vintage fashion for the modern wardrobe. Fresh styles, unbeatable prices.",
    cta: "Shop Now",
    href: "/shop",
    gradient: "from-rose-900/80 via-pink-900/70 to-slate-900/60",
    accentColor: "#f59e0b",
    img: "/banner.jpg",
  },
  {
    title: "MEGA SALE",
    subtitle: "Up to 40% OFF",
    body: "Premium vintage menswear — curated for the modern Nigerian gentleman. Limited stock, act fast.",
    cta: "Shop Men Now",
    href: "/shop/male",
    gradient: "from-purple-900/80 via-indigo-900/70 to-slate-900/60",
    accentColor: "#f59e0b",
    img: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=900&auto=format&fit=crop",
  },
  {
    title: "KIDS FASHION",
    subtitle: "Adorable & Durable",
    body: "Dress your little ones in style — vibrant colours, quality fabrics, wholesale prices available.",
    cta: "Shop Children",
    href: "/shop/children",
    gradient: "from-amber-700/80 via-orange-800/70 to-rose-900/60",
    accentColor: "#f9a8d4",
    img: "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=900&auto=format&fit=crop",
  },
];

const TOP_CATEGORIES = [
  { label: "Men's Suits", href: "/shop/male", section: "male" },
  { label: "Men's Shirts", href: "/shop/male", section: "male" },
  { label: "Men's Casuals", href: "/shop/male", section: "male" },
  { label: "Men's Trousers", href: "/shop/male", section: "male" },
  { label: "Women's Dresses", href: "/shop/female", section: "female" },
  { label: "Women's Tops", href: "/shop/female", section: "female" },
  { label: "Women's Skirts", href: "/shop/female", section: "female" },
  { label: "Women's Casuals", href: "/shop/female", section: "female" },
  { label: "Kids' Sets", href: "/shop/children", section: "children" },
  { label: "Kids' Dresses", href: "/shop/children", section: "children" },
  { label: "Kids' Casuals", href: "/shop/children", section: "children" },
];

function CountdownTimer() {
  const [time, setTime] = useState({ h: 11, m: 45, s: 30 });
  useEffect(() => {
    const iv = setInterval(() => {
      setTime((t) => {
        let { h, m, s } = t;
        s--;
        if (s < 0) { s = 59; m--; }
        if (m < 0) { m = 59; h--; }
        if (h < 0) { h = 23; m = 59; s = 59; }
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(iv);
  }, []);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <div className="flex items-center gap-1">
      <div className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded">{pad(time.h)}</div>
      <span className="font-bold text-primary">:</span>
      <div className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded">{pad(time.m)}</div>
      <span className="font-bold text-primary">:</span>
      <div className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded">{pad(time.s)}</div>
    </div>
  );
}

function FlashDealCard({ product }: { product: any }) {
  const discount = product.comparePrice
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : null;
  const img = product.images?.[0] ?? null;
  return (
    <Link href={`/product/${product.id}`}>
      <div className="group bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer">
        <div className="relative aspect-square overflow-hidden bg-muted">
          {img ? (
            <img src={img} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl font-serif text-muted-foreground">SV</div>
          )}
          {discount != null && discount > 0 && (
            <div className="absolute top-2 left-2 bg-accent text-accent-foreground text-xs font-bold px-2 py-1 rounded-lg">
              -{discount}%
            </div>
          )}
        </div>
        <div className="p-3">
          <p className="text-sm font-medium line-clamp-2 mb-1">{product.name}</p>
          <div className="flex items-center gap-2">
            <span className="text-primary font-bold">₦{Number(product.price).toLocaleString()}</span>
            {product.comparePrice && (
              <span className="text-xs text-muted-foreground line-through">₦{Number(product.comparePrice).toLocaleString()}</span>
            )}
          </div>
          {product.stockQty != null && (
            <div className="mt-2">
              <div className="w-full bg-muted rounded-full h-1.5">
                <div
                  className="bg-accent h-1.5 rounded-full"
                  style={{ width: `${Math.max(10, Math.min(90, 100 - (product.stockQty / 50) * 100))}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{product.stockQty} left</p>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const [slide, setSlide] = useState(0);
  const { data: featured, isLoading: featLoading } = useFeaturedProducts();
  const { data: maleData } = useProducts({ section: "male", page: 1, limit: 4 });
  const { data: femaleData } = useProducts({ section: "female", page: 1, limit: 4 });
  const { data: kidsData } = useProducts({ section: "children", page: 1, limit: 4 });

  useEffect(() => {
    const iv = setInterval(() => setSlide((s) => (s + 1) % HERO_SLIDES.length), 5000);
    return () => clearInterval(iv);
  }, []);

  const hero = HERO_SLIDES[slide];
  const maleProducts = maleData?.products ?? [];
  const femaleProducts = femaleData?.products ?? [];
  const kidsProducts = kidsData?.products ?? [];

  return (
    <div className="bg-background">
      <div className="max-w-[1400px] mx-auto px-3 py-4">
        <div className="flex gap-4">
          {/* Category Sidebar */}
          <aside className="hidden lg:block w-56 shrink-0">
            <div className="bg-primary text-primary-foreground rounded-t-xl px-4 py-3 font-semibold text-sm uppercase tracking-wide">
              Top Categories
            </div>
            <div className="bg-card border border-border border-t-0 rounded-b-xl overflow-hidden">
              {TOP_CATEGORIES.map((cat, i) => (
                <Link
                  key={i}
                  href={cat.href}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted hover:text-primary transition-colors border-b border-border last:border-0"
                >
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${cat.section === "male" ? "bg-primary" : cat.section === "female" ? "bg-accent" : "bg-green-500"}`} />
                  {cat.label}
                </Link>
              ))}
              <Link href="/shop" className="flex items-center justify-center gap-1 px-4 py-3 text-xs text-primary font-semibold hover:bg-muted transition-colors">
                View All Categories <ChevronRight size={12} />
              </Link>
            </div>
          </aside>

          {/* Hero Banner */}
          <div className="flex-1 min-w-0">
            <div
              className={`relative rounded-2xl overflow-hidden bg-gradient-to-r ${hero.gradient} text-white`}
              style={{ minHeight: "340px" }}
            >
              <img
                src={hero.img}
                alt=""
                className="absolute inset-0 w-full h-full object-cover opacity-60"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
              <div className="relative z-10 flex flex-col justify-center h-full p-8 md:p-12 max-w-lg">
                <div
                  className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3"
                  style={{ backgroundColor: hero.accentColor, color: "#1a1a1a" }}
                >
                  Limited Offer
                </div>
                <h1 className="text-5xl md:text-6xl font-serif font-extrabold mb-1 leading-none" style={{ color: hero.accentColor }}>
                  {hero.title}
                </h1>
                <p className="text-2xl md:text-3xl font-bold text-white mb-3">{hero.subtitle}</p>
                <p className="text-white/80 text-sm mb-6 leading-relaxed">{hero.body}</p>
                <Link
                  href={hero.href}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm transition-all hover:scale-105 w-fit"
                  style={{ backgroundColor: hero.accentColor, color: "#1a1a1a" }}
                >
                  {hero.cta} <ChevronRight size={16} />
                </Link>
              </div>
              <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden md:flex flex-col items-center">
                <div
                  className="w-32 h-32 rounded-full flex flex-col items-center justify-center border-4 border-dashed"
                  style={{ borderColor: hero.accentColor }}
                >
                  <Percent size={20} style={{ color: hero.accentColor }} />
                  <span className="text-3xl font-black" style={{ color: hero.accentColor }}>40</span>
                  <span className="text-xs text-white font-semibold">% OFF</span>
                </div>
                <p className="text-white/60 text-xs mt-2 text-center">On select items</p>
              </div>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {HERO_SLIDES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSlide(i)}
                    className={`h-2 rounded-full transition-all ${i === slide ? "w-6 bg-secondary" : "w-2 bg-white/40"}`}
                  />
                ))}
              </div>
            </div>

            {/* Section cards — real Unsplash images */}
            <div className="grid grid-cols-3 gap-3 mt-3">
              {[
                {
                  label: "Men",
                  sub: "Latest styles",
                  href: "/shop/male",
                  color: "bg-primary",
                  img: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&auto=format&fit=crop",
                },
                {
                  label: "Women",
                  sub: "New arrivals",
                  href: "/shop/female",
                  color: "bg-accent",
                  img: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&auto=format&fit=crop",
                },
                {
                  label: "Children",
                  sub: "Kids fashion",
                  href: "/shop/children",
                  color: "bg-green-600",
                  img: "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=400&auto=format&fit=crop",
                },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative rounded-xl overflow-hidden group cursor-pointer"
                  style={{ minHeight: "90px" }}
                >
                  <img
                    src={item.img}
                    alt={item.label}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className={`absolute inset-0 ${item.color} opacity-60`} />
                  <div className="relative z-10 h-full flex flex-col items-center justify-center text-white p-3">
                    <span className="font-bold text-lg">{item.label}</span>
                    <span className="text-xs opacity-90">{item.sub}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Great Deals */}
      <section className="max-w-[1400px] mx-auto px-3 py-6">
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="bg-accent text-accent-foreground p-2 rounded-lg">
                <Zap size={18} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Great Deals</h2>
                <p className="text-xs text-muted-foreground">Discover our best selling products</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 text-sm">
                <Clock size={14} className="text-accent" />
                <span className="text-muted-foreground">Ends in:</span>
                <CountdownTimer />
              </div>
              <Link href="/shop" className="text-primary text-sm font-semibold flex items-center gap-1 hover:underline">
                View All <ChevronRight size={14} />
              </Link>
            </div>
          </div>
          <div className="p-4">
            {featLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-xl" />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {(Array.isArray(featured) ? featured : []).slice(0, 10).map((p) => (
                  <FlashDealCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Promotional banners */}
      <section className="max-w-[1400px] mx-auto px-3 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: "Wholesale Pricing", sub: "Min. order 5 pieces", color: "from-primary to-teal-600", icon: "🏷️" },
            { title: "Fast Delivery", sub: "Nigeria-wide shipping", color: "from-secondary to-amber-500", icon: "🚚" },
            { title: "WhatsApp Orders", sub: "Chat with us anytime", color: "from-green-600 to-green-700", icon: "💬" },
          ].map((b, i) => (
            <div key={i} className={`bg-gradient-to-r ${b.color} text-white rounded-xl p-5 flex items-center gap-4`}>
              <span className="text-3xl">{b.icon}</span>
              <div>
                <p className="font-bold">{b.title}</p>
                <p className="text-sm opacity-90">{b.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Men's Section */}
      {maleProducts.length > 0 && (
        <section className="max-w-[1400px] mx-auto px-3 pb-6">
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-1 h-8 bg-primary rounded-full" />
                <div>
                  <h2 className="text-lg font-bold">Men's Collection</h2>
                  <p className="text-xs text-muted-foreground">Shirts, suits, casuals & more</p>
                </div>
              </div>
              <Link href="/shop/male" className="text-primary text-sm font-semibold flex items-center gap-1 hover:underline">
                View All <ChevronRight size={14} />
              </Link>
            </div>
            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {maleProducts.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* Women's Section */}
      {femaleProducts.length > 0 && (
        <section className="max-w-[1400px] mx-auto px-3 pb-6">
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-1 h-8 bg-accent rounded-full" />
                <div>
                  <h2 className="text-lg font-bold">Women's Collection</h2>
                  <p className="text-xs text-muted-foreground">Dresses, tops, skirts & more</p>
                </div>
              </div>
              <Link href="/shop/female" className="text-primary text-sm font-semibold flex items-center gap-1 hover:underline">
                View All <ChevronRight size={14} />
              </Link>
            </div>
            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {femaleProducts.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* Children's Section */}
      {kidsProducts.length > 0 && (
        <section className="max-w-[1400px] mx-auto px-3 pb-6">
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-1 h-8 bg-green-500 rounded-full" />
                <div>
                  <h2 className="text-lg font-bold">Children's Collection</h2>
                  <p className="text-xs text-muted-foreground">Sets, dresses, casuals & more</p>
                </div>
              </div>
              <Link href="/shop/children" className="text-primary text-sm font-semibold flex items-center gap-1 hover:underline">
                View All <ChevronRight size={14} />
              </Link>
            </div>
            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {kidsProducts.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* WhatsApp CTA */}
      <section className="max-w-[1400px] mx-auto px-3 pb-8">
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-4 text-white">
          <div>
            <h3 className="text-2xl font-bold mb-1">Order via WhatsApp</h3>
            <p className="text-green-100">Chat with us to place wholesale or bulk orders. Fast response guaranteed.</p>
          </div>
          <a
            href="https://wa.me/2349063172596"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-white text-green-700 font-bold px-8 py-4 rounded-full hover:bg-green-50 transition-colors whitespace-nowrap"
          >
            <MessageCircle size={20} />
            Chat with us on WhatsApp
          </a>
        </div>
      </section>
    </div>
  );
}
