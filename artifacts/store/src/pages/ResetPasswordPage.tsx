import { useState, useEffect } from "react";
  import { useLocation, Link } from "wouter";
  import { Lock, Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";
  import { Button } from "@/components/ui/button";
  import { useToast } from "@/hooks/use-toast";

  const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

  export default function ResetPasswordPage() {
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const [token, setToken] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [invalid, setInvalid] = useState(false);

    useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      const t = params.get("token");
      if (!t) { setInvalid(true); return; }
      setToken(t);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (password !== confirmPassword) {
        toast({ title: "Passwords don't match", variant: "destructive" }); return;
      }
      setLoading(true);
      try {
        const res = await fetch(`${BASE}/api/customers/reset-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Reset failed");
        setDone(true);
        setTimeout(() => setLocation("/login"), 3000);
      } catch (err: any) {
        toast({ title: "Reset failed", description: err.message, variant: "destructive" });
      } finally { setLoading(false); }
    };

    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center mb-10">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-border shadow-md mb-3">
              <img src="/logo.jpg" alt="Shoplike Vintage" className="w-full h-full object-cover" />
            </div>
            <p className="font-bold text-base tracking-wider">SHOPLIKE VINTAGE</p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
            {invalid ? (
              <div className="text-center py-4">
                <XCircle size={48} className="text-destructive mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-2">Invalid Link</h2>
                <p className="text-muted-foreground text-sm mb-6">This reset link is missing or invalid. Please request a new one.</p>
                <Link href="/forgot-password">
                  <Button className="w-full rounded-xl py-5">Request New Link</Button>
                </Link>
              </div>
            ) : done ? (
              <div className="text-center py-4">
                <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-2">Password updated!</h2>
                <p className="text-muted-foreground text-sm">Redirecting you to sign in...</p>
              </div>
            ) : (
              <>
                <div className="mb-7">
                  <h2 className="text-2xl font-bold text-foreground">Set new password</h2>
                  <p className="text-muted-foreground text-sm mt-1.5">Choose a strong password for your account.</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">New Password</label>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input type={showPw ? "text" : "password"} required minLength={6} value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full pl-10 pr-11 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/30 transition-all"
                        placeholder="Min. 6 characters" />
                      <button type="button" onClick={() => setShowPw(!showPw)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Confirm Password</label>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input type={showPw ? "text" : "password"} required value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/30 transition-all"
                        placeholder="••••••••" />
                    </div>
                  </div>
                  <Button type="submit" disabled={loading} className="w-full py-6 text-base font-semibold rounded-xl mt-2">
                    {loading ? "Updating..." : "Update Password"}
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }
  