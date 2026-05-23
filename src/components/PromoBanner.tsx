import { useState, useEffect } from "react";
import { X, Zap, Tag } from "lucide-react";

const PROMOS = [
  { emoji: "🖤", label: "BLACK MONDAY", text: "Extra 25% OFF all orders today — Limited time only!", color: "#1e293b" },
  { emoji: "⚡", label: "FLASH DEAL", text: "Men's Senator Native Set from ₦18,000 — Shop before midnight!", color: "#92400e" },
  { emoji: "🛍️", label: "WEEKEND OFFER", text: "Free delivery on all orders above ₦30,000 this weekend!", color: "#7c3aed" },
  { emoji: "✨", label: "NEW ARRIVALS", text: "Women's Lace Gown & Ankara collections just dropped! Shop now →", color: "#be185d" },
  { emoji: "🎄", label: "YULETIDE PROMO", text: "Dress the whole family for less — Up to 40% OFF kids wear!", color: "#065f46" },
  { emoji: "🎁", label: "BUY 2 GET 1", text: "Buy 2 children's outfits, get 1 absolutely FREE this week!", color: "#5b21b6" },
  { emoji: "🔥", label: "HOT DEAL", text: "Women's Blazer Set — Now ₦20,000 (was ₦33,000) | Limited stock!", color: "#991b1b" },
  { emoji: "💛", label: "REFER A FRIEND", text: "Refer a friend — both of you get ₦2,000 off your next order!", color: "#b45309" },
  { emoji: "🎉", label: "BLACK FRIDAY", text: "Biggest sale of the year! Up to 50% OFF sitewide — don't miss out!", color: "#1d4ed8" },
];

export default function PromoBanner() {
  const [visible, setVisible] = useState(true);
  const [idx, setIdx] = useState(0);
  const [fading, setFading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(120);

  // Auto-dismiss after 2 minutes - resets every page refresh (no storage)
  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 120_000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const cd = setInterval(() => setSecondsLeft(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(cd);
  }, [visible]);

  // Rotate every 4 seconds
  useEffect(() => {
    if (!visible) return;
    const rot = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setIdx(i => (i + 1) % PROMOS.length);
        setFading(false);
      }, 300);
    }, 4000);
    return () => clearInterval(rot);
  }, [visible]);

  if (!visible) return null;

  const promo = PROMOS[idx];
  const pct = Math.round((secondsLeft / 120) * 100);

  return (
    <div
      className="fixed bottom-20 left-0 right-0 z-40 mx-auto max-w-xl px-4"
      style={{ pointerEvents: "none" }}
    >
      <div
        className="rounded-2xl shadow-2xl overflow-hidden border border-white/10"
        style={{
          background: promo.color,
          pointerEvents: "auto",
          opacity: fading ? 0 : 1,
          transform: fading ? "translateY(8px)" : "translateY(0)",
          transition: "opacity 0.3s ease, transform 0.3s ease",
        }}
      >
        {/* Progress bar */}
        <div className="h-0.5 bg-white/20">
          <div
            className="h-full bg-white/60 transition-all duration-1000 ease-linear"
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="px-4 py-3 flex items-center gap-3">
          {/* Emoji + label */}
          <div className="shrink-0 text-2xl leading-none">{promo.emoji}</div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-black tracking-widest text-white/60 uppercase">{promo.label}</span>
              <Zap size={10} className="text-yellow-300 fill-yellow-300" />
            </div>
            <p className="text-sm font-semibold text-white leading-snug truncate">{promo.text}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] text-white/40 tabular-nums hidden sm:block">{secondsLeft}s</span>
            <button
              onClick={() => setVisible(false)}
              className="p-1.5 rounded-lg hover:bg-white/20 transition-colors text-white/70 hover:text-white"
              aria-label="Close promo"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Dots indicator */}
        <div className="flex justify-center gap-1 pb-2">
          {PROMOS.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className="rounded-full transition-all"
              style={{
                width: i === idx ? 16 : 6,
                height: 4,
                background: i === idx ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.3)",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
