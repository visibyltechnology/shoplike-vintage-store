import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Package, ShoppingCart, Tag, Settings, LogOut,
  Menu, X, Sun, Moon,
} from "lucide-react";
import { clearAdminToken } from "@/lib/api";
import { useTheme } from "@/components/theme-provider";
import { useState } from "react";
const logoPath = "/logo.jpg";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/categories", label: "Categories", icon: Tag },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { theme, setTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const handleLogout = () => {
    clearAdminToken();
    setLocation("/admin");
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 fixed md:static inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-300`}
      >
        <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
          <img src={logoPath} alt="Shoplike Vintage" className="h-10 w-auto object-contain" />
          <button className="md:hidden" onClick={() => setSidebarOpen(false)} data-testid="button-close-sidebar">
            <X size={20} />
          </button>
        </div>
        <p className="text-xs text-muted-foreground px-4 pt-2 pb-1 uppercase tracking-wider">Admin Panel</p>
        <nav className="flex-1 px-3 py-2 space-y-1">
          {navItems.map((item) => {
            const active = location === item.href || location.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted text-sidebar-foreground"
                }`}
                data-testid={`link-admin-nav-${item.label.toLowerCase()}`}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-sidebar-border space-y-2">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-muted transition-colors"
            data-testid="button-admin-theme"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-destructive/10 hover:text-destructive transition-colors"
            data-testid="button-admin-logout"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-card border-b border-border px-4 py-3 flex items-center justify-between md:hidden">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-md hover:bg-muted" data-testid="button-open-sidebar">
            <Menu size={20} />
          </button>
          <span className="font-serif font-bold">Admin</span>
          <div />
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
