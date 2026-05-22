import { useState, useEffect } from "react";
import { X, Download, Smartphone } from "lucide-react";

export default function PWAInstallPrompt() {
  const [prompt, setPrompt] = useState<any>(null);
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem("pwa-dismissed") === "1"; } catch { return false; }
  });

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler as any);
    return () => window.removeEventListener("beforeinstallprompt", handler as any);
  }, []);

  if (!prompt || dismissed) return null;

  const handleInstall = async () => {
    (prompt as any).prompt();
    const { outcome } = await (prompt as any).userChoice;
    if (outcome === "accepted") setPrompt(null);
    else { setDismissed(true); }
  };

  const handleDismiss = () => {
    setDismissed(true);
    try { localStorage.setItem("pwa-dismissed", "1"); } catch {}
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-card border border-border rounded-2xl shadow-2xl p-4 z-50 flex items-center gap-3 animate-in slide-in-from-bottom-4">
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <Smartphone size={20} className="text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">Install Shoplike Vintage</p>
        <p className="text-xs text-muted-foreground">Add to your home screen for quick access</p>
      </div>
      <button
        onClick={handleInstall}
        className="bg-primary text-primary-foreground px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0 hover:bg-primary/90 transition-colors"
      >
        <Download size={13} /> Install
      </button>
      <button
        onClick={handleDismiss}
        className="p-1 hover:bg-muted rounded-lg text-muted-foreground shrink-0"
        aria-label="Dismiss"
      >
        <X size={15} />
      </button>
    </div>
  );
}
