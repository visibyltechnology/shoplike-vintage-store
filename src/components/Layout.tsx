import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ShoppingCart, Search, Sun, Moon, Menu, X, MessageCircle, User, Package, LogIn, Heart } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useGetSettings } from "@/lib/api-client";
import { isCustomerLoggedIn, getCustomerUser } from "@/pages/CustomerAuthPage";
const logoPath = "/logo.jpg";

const sections = [
  { label: "Male", href: "/shop/male" },
  { label: "Female", href: "/shop/female" },
  { label: "Children", href: "/shop/children" },
  { label: "All Products", href: "/shop" },
  { label: "Sale", href: "/shop?sale=true" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useTheme();
  const { itemCount } = useCart();
  const { count: wishlistCount } = useWishlist();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { data: settings } = useGetSettings();
  const loggedIn = isCustomerLoggedIn();
  const customer = getCustomerUser();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  const whatsapp = settings?.whatsappNumber || "09063172596";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {settings?.bannerEnabled && settings?.bannerText && (
        <div className="bg-primary text-primary-foreground text-center py-2 px-4 text-sm font-medium tracking-wide">
          {settings.bannerText}
        </div>
      )}

      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16 gap-4">
            <div className="flex items-center gap-3">
              <button
                className="md:hidden p-2 rounded-md hover:bg-muted transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                data-testid="button-mobile-menu"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
              <Link href="/" data-testid="link-home-logo" className="flex flex-col items-center leading-none">
                <img src={logoPath} alt="Shoplike Vintage" className="h-14 w-auto object-contain" />
                <span className="text-[10px] font-bold tracking-[0.18em] uppercase mt-0.5"
                  style={{ background: "linear-gradient(90deg, #be185d, #f59e0b, #be185d)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  Shoplike Vintage
                </span>
              </Link>
            </div>

            <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
              <form onSubmit={handleSearch} className="w-full flex">
                <input
                  type="search"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-4 py-2 rounded-l-full border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  data-testid="input-search"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-r-full hover:bg-primary/90 transition-colors"
                  data-testid="button-search-submit"
                >
                  <Search size={16} />
                </button>
              </form>
            </div>

            <div className="flex items-center gap-1">
              <button
                className="md:hidden p-2 rounded-md hover:bg-muted transition-colors"
                onClick={() => setSearchOpen(!searchOpen)}
                data-testid="button-mobile-search"
              >
                <Search size={20} />
              </button>

              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 rounded-md hover:bg-muted transition-colors"
                data-testid="button-theme-toggle"
                title="Toggle dark/light mode"
              >
                {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              {/* Track Order */}
              <Link
                href="/track-order"
                className="hidden md:flex items-center gap-1.5 p-2 rounded-md hover:bg-muted transition-colors text-sm font-medium"
                title="Track Order"
              >
                <Package size={18} />
                <span className="text-xs hidden lg:inline">Track</span>
              </Link>

              {/* Wishlist */}
              <Link
                href="/wishlist"
                className="relative p-2 rounded-md hover:bg-muted transition-colors"
                title="Wishlist"
              >
                <Heart size={20} className={wishlistCount > 0 ? "text-rose-500 fill-rose-500" : ""} />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              <Link
                href="/cart"
                className="relative p-2 rounded-md hover:bg-muted transition-colors"
                data-testid="link-cart"
              >
                <ShoppingCart size={20} />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {itemCount}
                  </span>
                )}
              </Link>

              {/* Customer account */}
              {loggedIn ? (
                <Link
                  href="/account"
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-muted transition-colors"
                  title={`Account: ${customer?.name}`}
                >
                  <div className="w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                    {customer?.name?.[0]?.toUpperCase() || "U"}
                  </div>
                  <span className="text-xs font-medium hidden lg:inline max-w-[80px] truncate">{customer?.name}</span>
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-1 p-2 rounded-full hover:bg-muted transition-colors md:gap-1.5 md:px-3 md:py-1.5 md:rounded-full md:border md:border-border md:text-sm md:font-medium"
                  title="Sign In / Register"
                >
                  <LogIn size={20} />
                  <span className="hidden md:inline text-sm font-medium">Sign In</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {searchOpen && (
          <div className="md:hidden px-4 pb-3">
            <form onSubmit={handleSearch} className="flex">
              <input
                type="search"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-2 rounded-l-full border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                data-testid="input-mobile-search"
                autoFocus
              />
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-r-full"
                data-testid="button-mobile-search-submit"
              >
                <Search size={16} />
              </button>
            </form>
          </div>
        )}

        <nav className="border-t border-border bg-card">
          <div className="max-w-7xl mx-auto px-4">
            <div className="hidden md:flex items-center gap-1 py-2">
              {sections.map((s) => (
                <Link
                  key={s.href}
                  href={s.href}
                  className="px-4 py-2 text-sm font-medium rounded-md hover:bg-muted hover:text-primary transition-colors"
                  data-testid={`link-nav-${s.label.toLowerCase().replace(/\s/g, "-")}`}
                >
                  {s.label}
                </Link>
              ))}
              <Link href="/track-order" className="px-4 py-2 text-sm font-medium rounded-md hover:bg-muted hover:text-primary transition-colors flex items-center gap-1.5">
                <Package size={14} /> Track Order
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-background/95 backdrop-blur-sm flex flex-col pt-20 px-6 gap-4">
          {sections.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              onClick={() => setMobileMenuOpen(false)}
              className="text-lg font-medium py-3 border-b border-border hover:text-primary transition-colors"
              data-testid={`link-mobile-nav-${s.label.toLowerCase()}`}
            >
              {s.label}
            </Link>
          ))}
          <Link href="/track-order" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium py-3 border-b border-border hover:text-primary transition-colors flex items-center gap-2">
            <Package size={18} /> Track Order
          </Link>
          <Link href="/wishlist" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium py-3 border-b border-border hover:text-primary transition-colors flex items-center gap-2">
            <Heart size={18} className="text-rose-500" /> Wishlist {wishlistCount > 0 && `(${wishlistCount})`}
          </Link>
          {loggedIn ? (
            <Link href="/account" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium py-3 border-b border-border hover:text-primary transition-colors flex items-center gap-2">
              <User size={18} /> My Account ({customer?.name})
            </Link>
          ) : (
            <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium py-3 border-b border-border hover:text-primary transition-colors flex items-center gap-2">
              <LogIn size={18} /> Sign In / Register
            </Link>
          )}
        </div>
      )}

      <main className="flex-1">{children}</main>

      <a
        href={`https://wa.me/234${whatsapp.replace(/^0/, "")}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600 transition-colors flex items-center gap-2"
        data-testid="link-whatsapp"
        title="Chat on WhatsApp"
      >
        <MessageCircle size={24} />
        <span className="hidden md:inline text-sm font-medium">WhatsApp</span>
      </a>

      <footer className="bg-primary text-primary-foreground mt-16">
        <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <img src={logoPath} alt="Shoplike Vintage" className="h-16 w-auto object-contain mb-4 brightness-200" />
            <p className="text-sm opacity-80 leading-relaxed">
              Premium vintage fashion for men, women, and children. Est. MMXX.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-secondary">Shop</h4>
            <ul className="space-y-2 text-sm opacity-80">
              {sections.map((s) => (
                <li key={s.href}>
                  <Link href={s.href} className="hover:opacity-100 transition-opacity">{s.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-secondary">Help</h4>
            <ul className="space-y-2 text-sm opacity-80">
              <li><Link href="/track-order" className="hover:opacity-100 transition-opacity">Track Order</Link></li>
              <li><Link href="/wishlist" className="hover:opacity-100 transition-opacity">Wishlist</Link></li>
              <li><Link href="/account" className="hover:opacity-100 transition-opacity">My Account</Link></li>
              <li>WhatsApp: {whatsapp}</li>
              <li>Email: {settings?.storeEmail || "Shoplikevintagevintage@gmail.com"}</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-secondary">Info</h4>
            <ul className="space-y-2 text-sm opacity-80">
              <li>Wholesale & Retail</li>
              <li>Nigeria-wide Delivery</li>
              <li>Kora Pay Accepted</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-primary-foreground/20 text-center py-4 text-sm opacity-70">
          &copy; {new Date().getFullYear()} Shoplike Vintage. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
