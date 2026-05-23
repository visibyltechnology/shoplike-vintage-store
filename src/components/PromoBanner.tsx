import { useState, useEffect } from "react";
import { X, Zap } from "lucide-react";

const PROMOS = [
  { text: "🖤 BLACK MONDAY SALE — Extra 25% OFF on all orders today! Limited time only", bg: "from-slate-900 via-slate-800 to-slate-900" },
  { text: "⚡ FLASH DEAL — Men's Senator Native Set from ₦18,000 | Shop before midnight!", bg: "from-amber-700 via-yellow-600 to-amber-700" },
  { text: "🛍️ WEEKEND SPECIAL — Free delivery on all orders above ₦30,000 this weekend!", bg: "from-[#c9a96e] via-yellow-700 to-[#c9a96e]" },
  { text: "✨ NEW ARRIVALS — Women's Lace Gown & Ankara collections just dropped! Shop now", bg: "from-rose-700 via-pink-600 to-rose-700" },
  { text: "🎄 YULETIDE PROMO — Dress the whole family for less | Up to 40% OFF kids wear!", bg: "from-green-800 via-emerald-700 to-green-800" },
  { text: "🎁 BUY 2 GET 1 FREE — On selected children's outfits this week only!", bg: "from-purple-800 via-violet-700 to-purple-800" },
  { text: "🔥 HOT DEAL — Women's Blazer Set now ₦20,000 (was ₦33,000) | Limited stock!", bg: "from-red-800 via-rose-700 to-red-800" },
  { text: "💛 REFER A FRIEND — Both of you get ₦2,000 off your next order! Share the love", bg: "from-orange-700 via-amber-600 to-orange-700" },
];

export default function PromoBanner() {
  const [visible, setVisible] = useState(true);
  const [idx, setIdx] = useState(0);
  const [fading, setFading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(120);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 120_000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const cd = setInterval(() => setSecondsLeft(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(cd);
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const rot = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setIdx(i => (i + 1) % PROMOS.length);
        setFading(false);
      }, 350);
    }, 4000);
    return () => clearInterval(rot);
  }, [visible]);

  if (!visible) return null;

  const promo = PROMOS[idx];
  const pct = Math.round((secondsLeft / 120) * 100);

  return (
    <div className={`relative bg-gradient-to-r ${promo.bg} text-white overflow-hidden`} style={{ transition: "background 0.8s ease" }}>
      <div
        className="absolute bottom-0 left-0 h-0.5 bg-white/50 transition-all duration-1000 ease-linear"
        style={{ width: `${pct}%` }}
      />
      <div className="max-w-7xl mx-auto px-3 py-2.5 flex items-center gap-3">
        <div className="flex items-center gap-1.5 shrink-0">
          <Zap size={13} className="text-yellow-300 fill-yellow-300 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest opacity-75 hidden sm:block">PROMO</span>
        </div>

        <div className="flex-1 overflow-hidden min-w-0 text-center">
          <span
            className="text-[13px] font-semibold leading-snug"
            style={{
              opacity: fading ? 0 : 1,
              transform: fading ? "translateY(6px)" : "translateY(0)",
              transition: "opacity 0.35s ease, transform 0.35s ease",
              display: "inline-block",
            }}
          >
            {promo.text}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] opacity-50 tabular-nums hidden md:block">{secondsLeft}s</span>
          <button
            onClick={() => setVisible(false)}
            className="p-1 rounded hover:bg-white/20 transition-colors"
            aria-label="Close promo"
          >
            <X size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
