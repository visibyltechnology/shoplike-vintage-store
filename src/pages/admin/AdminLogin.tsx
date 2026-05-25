import { useState } from "react";
import { useLocation } from "wouter";
import { setAdminToken } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Lock, Mail, ShieldCheck } from "lucide-react";

const ADMIN_EMAIL = "Shoplikevintage@gmail.com";
const ADMIN_PASSWORD = "Timber@1010";

function generateToken(email: string): string {
  return btoa(`${email}:shoplike-admin:${Date.now()}`);
}

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState(ADMIN_EMAIL);
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (
      email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase() &&
      password === ADMIN_PASSWORD
    ) {
      // Sign into Supabase so RLS-protected writes are allowed
      await supabase.auth.signInWithPassword({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      });
      setAdminToken(generateToken(email));
      setLocation("/admin/dashboard");
    } else {
      setError("Invalid email or password. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-[#c9a96e] shadow-lg mx-auto mb-4">
              <img src="/logo.jpg" alt="Shoplike Vintage" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-2xl font-serif font-bold">Admin Portal</h1>
            <p className="text-muted-foreground text-sm mt-1">Shoplike Vintage — Store Management</p>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg px-4 py-3 mb-5 flex items-center gap-2">
              <ShieldCheck size={15} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Email Address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="username"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  data-testid="input-admin-email"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-11 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  data-testid="input-admin-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="button-toggle-password"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full py-6 text-base font-semibold rounded-xl mt-2"
              data-testid="button-admin-login"
            >
              {loading ? "Signing in…" : "Sign In to Dashboard"}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Shoplike Vintage Admin — restricted access only
          </p>
        </div>
      </div>
    </div>
  );
}
