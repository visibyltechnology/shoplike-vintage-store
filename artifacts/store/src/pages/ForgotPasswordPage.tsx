import { useState } from "react";
  import { Link } from "wouter";
  import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
  import { Button } from "@/components/ui/button";
  import { useToast } from "@/hooks/use-toast";

  const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

  export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      try {
        const res = await fetch(`${BASE}/api/customers/forgot-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Request failed");
        setSent(true);
      } catch (err: any) {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex flex-col items-center mb-10">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-border shadow-md mb-3">
              <img src="/logo.jpg" alt="Shoplike Vintage" className="w-full h-full object-cover" />
            </div>
            <p className="font-bold text-base tracking-wider">SHOPLIKE VINTAGE</p>
          </div>

          {sent ? (
            <div className="bg-card border border-border rounded-2xl p-10 text-center shadow-sm">
              <div className="w-16 h-16 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center mx-auto mb-5">
                <CheckCircle size={32} className="text-green-500" />
              </div>
              <h2 className="text-xl font-bold mb-2">Check your email</h2>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                We've sent a password reset link to <strong className="text-foreground">{email}</strong>.
                It will expire in 1 hour.
              </p>
              <Link href="/login">
                <Button variant="outline" className="w-full rounded-xl py-5">Back to Sign In</Button>
              </Link>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
              <div className="mb-7">
                <h2 className="text-2xl font-bold text-foreground">Forgot password?</h2>
                <p className="text-muted-foreground text-sm mt-1.5 leading-relaxed">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Email Address</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="email" required value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/30 transition-all"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full py-6 text-base font-semibold rounded-xl">
                  {loading ? "Sending..." : "Send Reset Link"}
                </Button>
              </form>
              <div className="mt-6 text-center">
                <Link href="/login">
                  <button className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft size={14} /> Back to Sign In
                  </button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
  