import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Lock, Eye, EyeOff, CheckCircle, XCircle, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const PASSWORD_RULES = [
  { label: "Kamida 8 belgi", test: (p: string) => p.length >= 8 },
  { label: "Katta harf (A-Z)", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Kichik harf (a-z)", test: (p: string) => /[a-z]/.test(p) },
  { label: "Raqam (0-9)", test: (p: string) => /\d/.test(p) },
  { label: "Maxsus belgi (!@#$...)", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

const ResetPasswordPage = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const navigate = useNavigate();

  const passwordStrong = PASSWORD_RULES.every((r) => r.test(password));
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  useEffect(() => {
    // Listen for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });

    // Also check URL hash for recovery type
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    }

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordStrong) {
      toast({ title: "Parol yetarlicha kuchli emas", variant: "destructive" });
      return;
    }
    if (!passwordsMatch) {
      toast({ title: "Parollar mos kelmaydi", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    } else {
      // Sign out all sessions after password change
      await supabase.auth.signOut();
      toast({
        title: "✅ Parol muvaffaqiyatli o'zgartirildi!",
        description: "Yangi parol bilan tizimga kiring.",
      });
      navigate("/auth");
    }
    setSubmitting(false);
  };

  if (!isRecovery) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 max-w-md text-center">
            <div className="bg-card rounded-2xl border border-border shadow-card p-8">
              <ShieldCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h1 className="text-xl font-bold text-foreground mb-2">Parolni tiklash</h1>
              <p className="text-sm text-muted-foreground mb-4">
                Parolni tiklash uchun emailingizga yuborilgan havolani bosing.
              </p>
              <Button onClick={() => navigate("/forgot-password")} className="bg-hero-gradient text-primary-foreground border-0">
                Parolni tiklash so'rovi
              </Button>
            </div>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="font-heading text-3xl font-bold text-foreground">Yangi parol yaratish</h1>
            <p className="text-muted-foreground mt-2">Kuchli yangi parol kiriting</p>
          </div>

          <div className="bg-card rounded-2xl border border-border shadow-card p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="password" className="text-xs">Yangi parol</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    required
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="text-xs">Parolni tasdiqlang</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    required
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword.length > 0 && (
                  <div className="flex items-center gap-2 mt-1">
                    {passwordsMatch ? (
                      <><CheckCircle className="w-3.5 h-3.5 text-primary" /><span className="text-xs text-primary">Parollar mos</span></>
                    ) : (
                      <><XCircle className="w-3.5 h-3.5 text-destructive" /><span className="text-xs text-destructive">Parollar mos kelmaydi</span></>
                    )}
                  </div>
                )}
              </div>

              {password.length > 0 && (
                <div className="space-y-1 p-3 bg-muted/30 rounded-xl">
                  <p className="text-xs font-semibold text-foreground mb-1">Parol kuchlilik talablari:</p>
                  {PASSWORD_RULES.map((rule) => {
                    const pass = rule.test(password);
                    return (
                      <div key={rule.label} className="flex items-center gap-2">
                        {pass ? <CheckCircle className="w-3.5 h-3.5 text-primary" /> : <XCircle className="w-3.5 h-3.5 text-destructive" />}
                        <span className={cn("text-xs", pass ? "text-foreground" : "text-muted-foreground")}>{rule.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              <Button
                type="submit"
                disabled={submitting || !passwordStrong || !passwordsMatch}
                className="w-full bg-hero-gradient text-primary-foreground border-0 h-11"
              >
                {submitting ? "Saqlanmoqda..." : "Parolni yangilash"}
              </Button>
            </form>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default ResetPasswordPage;
