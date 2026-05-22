import { useState } from "react";
  import { useLocation } from "wouter";
  import { Eye, EyeOff, User, Mail, Phone, Lock, ArrowRight, CheckCircle } from "lucide-react";
  import { Button } from "@/components/ui/button";
  import { useToast } from "@/hooks/use-toast";

  const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '';

  const TOKEN_KEY = "sv_customer_token";
  const USER_KEY = "sv_customer_user";

  export function saveCustomerSession(token: string, user: any) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
  export function getCustomerToken(): string | null { return localStorage.getItem(TOKEN_KEY); }
  export function getCustomerUser(): any | null {
    const u = localStorage.getItem(USER_KEY);
    return u ? JSON.parse(u) : null;
  }
  export function clearCustomerSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
  export function isCustomerLoggedIn(): boolean { return !!getCustomerToken(); }

  export default function CustomerAuthPage({ mode = "login" }: { mode?: "login" | "signup" }) {
    const [view, setView] = useState<"login" | "signup">(mode);
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [, setLocation] = useLocation();
    const { toast } = useToast();

    const [loginForm, setLoginForm] = useState({ email: "", password: "" });
    const [signupForm, setSignupForm] = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "" });

    const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/customers/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: loginForm.email, password: loginForm.password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Login failed");
        saveCustomerSession(data.token, data.customer);
        toast({ title: `Welcome back, ${data.customer.name}!` });
        setLocation("/account");
      } catch (err: any) {
        toast({ title: "Login failed", description: err.message, variant: "destructive" });
      } finally { setLoading(false); }
    };

    const handleSignup = async (e: React.FormEvent) => {
      e.preventDefault();
      if (signupForm.password !== signupForm.confirmPassword) {
        toast({ title: "Passwords don't match", variant: "destructive" }); return;
      }
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/customers/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: signupForm.name, email: signupForm.email, phone: signupForm.phone || undefined, password: signupForm.password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Signup failed");
        saveCustomerSession(data.token, data.customer);
        toast({ title: `Welcome to Shoplike Vintage, ${data.customer.name}!` });
        setLocation("/account");
      } catch (err: any) {
        toast({ title: "Sign up failed", description: err.message, variant: "destructive" });
      } finally { setLoading(false); }
    };

    return (
      <div className="min-h-screen flex">
        {/* Left panel – branding (desktop only) */}
        <div className="hidden lg:flex lg:w-[45%] bg-[#1a1a1a] flex-col items-center justify-center p-12 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url(/logo.jpg)", backgroundSize: "cover", backgroundPosition: "center", filter: "blur(20px) saturate(0.5)" }} />
          <div className="relative z-10 text-center">
            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-[#c9a96e] shadow-2xl mx-auto mb-6">
              <img src="/logo.jpg" alt="Shoplike Vintage" className="w-full h-full object-cover" />
            </div>
            <p className="text-[#c9a96e] text-xs tracking-[5px] uppercase font-semibold mb-2">✦ Since 2024 ✦</p>
            <h1 className="text-white text-4xl font-bold tracking-wide mb-3">Shoplike<br />Vintage</h1>
            <p className="text-white/50 text-sm leading-relaxed max-w-xs">
              Curated vintage &amp; contemporary fashion for every story. Shop with confidence.
            </p>
            <div className="mt-10 space-y-3">
              {["Free delivery on orders above ₦50,000", "Easy returns within 7 days", "Secure checkout"].map(t => (
                <div key={t} className="flex items-center gap-2 text-white/60 text-sm">
                  <CheckCircle size={14} className="text-[#c9a96e] shrink-0" />
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel – form */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-background">
          {/* Mobile logo */}
          <div className="flex flex-col items-center mb-8 lg:hidden">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-border shadow-md mb-3">
              <img src="/logo.jpg" alt="Shoplike Vintage" className="w-full h-full object-cover" />
            </div>
            <p className="font-bold text-lg tracking-wider text-foreground">SHOPLIKE VINTAGE</p>
            <p className="text-muted-foreground text-xs tracking-widest uppercase">Fashion for every story</p>
          </div>

          <div className="w-full max-w-md">
            <div className="mb-8 text-center lg:text-left">
              <h2 className="text-2xl font-bold text-foreground">
                {view === "login" ? "Welcome back" : "Create account"}
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                {view === "login" ? "Sign in to access your orders and wishlist" : "Join Shoplike Vintage and start shopping"}
              </p>
            </div>

            {/* Tab Switch */}
            <div className="flex rounded-xl overflow-hidden border border-border mb-7 p-1 bg-muted/30">
              <button onClick={() => setView("login")}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${view === "login" ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                Sign In
              </button>
              <button onClick={() => setView("signup")}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${view === "signup" ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                Create Account
              </button>
            </div>

            {view === "login" ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block text-foreground">Email Address</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input type="email" required value={loginForm.email}
                      onChange={e => setLoginForm({ ...loginForm, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/30 transition-all"
                      placeholder="you@example.com" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-medium text-foreground">Password</label>
                    <a href="/forgot-password" className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">
                      Forgot password?
                    </a>
                  </div>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input type={showPw ? "text" : "password"} required value={loginForm.password}
                      onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                      className="w-full pl-10 pr-11 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/30 transition-all"
                      placeholder="••••••••" />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <Button type="submit" disabled={loading}
                  className="w-full py-6 text-base font-semibold rounded-xl flex items-center justify-center gap-2 mt-2">
                  {loading ? "Signing in..." : <><span>Sign In</span><ArrowRight size={18} /></>}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block text-foreground">Full Name</label>
                  <div className="relative">
                    <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input type="text" required value={signupForm.name}
                      onChange={e => setSignupForm({ ...signupForm, name: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/30 transition-all"
                      placeholder="Your full name" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block text-foreground">Email Address</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input type="email" required value={signupForm.email}
                      onChange={e => setSignupForm({ ...signupForm, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/30 transition-all"
                      placeholder="you@example.com" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block text-foreground">Phone Number</label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input type="tel" value={signupForm.phone}
                      onChange={e => setSignupForm({ ...signupForm, phone: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/30 transition-all"
                      placeholder="08012345678" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block text-foreground">
                    Password <span className="text-muted-foreground font-normal">(min 6 characters)</span>
                  </label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input type={showPw ? "text" : "password"} required minLength={6} value={signupForm.password}
                      onChange={e => setSignupForm({ ...signupForm, password: e.target.value })}
                      className="w-full pl-10 pr-11 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/30 transition-all"
                      placeholder="Choose a strong password" />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block text-foreground">Confirm Password</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input type={showPw ? "text" : "password"} required value={signupForm.confirmPassword}
                      onChange={e => setSignupForm({ ...signupForm, confirmPassword: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/30 transition-all"
                      placeholder="••••••••" />
                  </div>
                </div>
                <Button type="submit" disabled={loading}
                  className="w-full py-6 text-base font-semibold rounded-xl flex items-center justify-center gap-2 mt-2">
                  {loading ? "Creating account..." : <><span>Create Account</span><ArrowRight size={18} /></>}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  By creating an account you agree to our{" "}
                  <span className="underline cursor-pointer">Terms &amp; Privacy Policy</span>.
                </p>
              </form>
            )}

            <p className="text-center text-sm text-muted-foreground mt-6">
              {view === "login" ? (
                <>Don't have an account?{" "}
                  <button onClick={() => setView("signup")} className="text-foreground font-semibold hover:underline">Sign up free</button>
                </>
              ) : (
                <>Already have an account?{" "}
                  <button onClick={() => setView("login")} className="text-foreground font-semibold hover:underline">Sign in</button>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    );
  }
  