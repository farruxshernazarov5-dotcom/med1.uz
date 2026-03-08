import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Heart, Building2, User, Mail, Lock, Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const roles = [
  { value: "patient", label: "Bemor", icon: User, desc: "Qabulga yozilish va salomatlik" },
  { value: "clinic", label: "Klinika", icon: Building2, desc: "Klinikani boshqarish" },
  { value: "diagnostics", label: "Diagnostika", icon: Building2, desc: "Diagnostika markazi" },
  { value: "vendor", label: "Medtexnika", icon: Building2, desc: "Medtexnika sotuvchisi" },
];

const ROLE_REDIRECT: Record<string, string> = {
  patient: "/dashboard",
  clinic: "/clinic-register",
  diagnostics: "/diagnostics-register",
  vendor: "/vendor-register",
};

const PASSWORD_RULES = [
  { label: "Kamida 8 belgi", test: (p: string) => p.length >= 8 },
  { label: "Katta harf (A-Z)", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Kichik harf (a-z)", test: (p: string) => /[a-z]/.test(p) },
  { label: "Raqam (0-9)", test: (p: string) => /\d/.test(p) },
  { label: "Maxsus belgi (!@#$...)", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

const AuthPage = () => {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("patient");
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const passwordStrong = mode === "register" ? PASSWORD_RULES.every((r) => r.test(password)) : true;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    if (mode === "login") {
      const { error } = await signIn(email, password);
      if (error) {
        toast({ title: "Xatolik", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Xush kelibsiz!" });
        navigate("/dashboard");
      }
    } else {
      if (!fullName.trim()) {
        toast({ title: "Iltimos, ismingizni kiriting", variant: "destructive" });
        setSubmitting(false);
        return;
      }
      if (!passwordStrong) {
        toast({ title: "Parol yetarlicha kuchli emas", variant: "destructive" });
        setSubmitting(false);
        return;
      }
      const { error } = await signUp(email, password, fullName, role);
      if (error) {
        toast({ title: "Xatolik", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "✅ Ro'yxatdan o'tdingiz!", description: "Emailingizni tasdiqlang. Tasdiqlagandan so'ng tizimga kiring." });
        setMode("login");
      }
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="font-heading text-3xl font-bold text-foreground">
              {mode === "login" ? "Kirish" : "Ro'yxatdan o'tish"}
            </h1>
            <p className="text-muted-foreground mt-2">Med1.uz platformasiga xush kelibsiz</p>
          </div>

          <div className="bg-card rounded-2xl border border-border shadow-card p-6">
            {/* Tabs */}
            <div className="flex mb-6 bg-muted rounded-xl p-1">
              {(["login", "register"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={cn(
                    "flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all",
                    mode === m ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                  )}
                >
                  {m === "login" ? "Kirish" : "Ro'yxatdan o'tish"}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && (
                <>
                  <div>
                    <Label className="text-xs font-medium">Rol tanlang</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {roles.map((r) => (
                        <button
                          key={r.value}
                          type="button"
                          onClick={() => setRole(r.value)}
                          className={cn(
                            "flex flex-col items-center gap-1 p-3 rounded-xl border transition-all text-center",
                            role === r.value
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-border hover:border-primary/30 text-foreground"
                          )}
                        >
                          <r.icon className="w-5 h-5" />
                          <span className="text-xs font-semibold">{r.label}</span>
                          <span className="text-[10px] text-muted-foreground">{r.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="fullName" className="text-xs">To'liq ism</Label>
                    <div className="relative mt-1">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ismingiz" className="pl-10" />
                    </div>
                  </div>
                </>
              )}

              <div>
                <Label htmlFor="email" className="text-xs">Email</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" className="pl-10" required />
                </div>
              </div>

              <div>
                <Label htmlFor="password" className="text-xs">Parol</Label>
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
                    minLength={6}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Password strength indicator */}
              {mode === "register" && password.length > 0 && (
                <div className="space-y-1 p-3 bg-muted/30 rounded-xl">
                  <p className="text-xs font-semibold text-foreground mb-1">Parol kuchlilik talablari:</p>
                  {PASSWORD_RULES.map((rule) => {
                    const pass = rule.test(password);
                    return (
                      <div key={rule.label} className="flex items-center gap-2">
                        {pass ? (
                          <CheckCircle className="w-3.5 h-3.5 text-primary" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-destructive" />
                        )}
                        <span className={cn("text-xs", pass ? "text-foreground" : "text-muted-foreground")}>
                          {rule.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              <Button
                type="submit"
                disabled={submitting || (mode === "register" && !passwordStrong)}
                className="w-full bg-hero-gradient text-primary-foreground border-0 h-11"
              >
                {submitting ? "Kutilmoqda..." : mode === "login" ? "Kirish" : "Ro'yxatdan o'tish"}
              </Button>

              {mode === "register" && role === "clinic" && (
                <p className="text-xs text-center text-muted-foreground">
                  Ro'yxatdan o'tgandan so'ng klinika ma'lumotlarini to'ldirish sahifasiga yo'naltirilasiz
                </p>
              )}
            </form>

            {mode === "login" && (
              <p className="text-center text-xs text-muted-foreground mt-4">
                Hisobingiz yo'qmi?{" "}
                <button onClick={() => setMode("register")} className="text-primary font-semibold hover:underline">
                  Ro'yxatdan o'ting
                </button>
              </p>
            )}
            {mode === "register" && (
              <p className="text-center text-xs text-muted-foreground mt-4">
                Hisobingiz bormi?{" "}
                <button onClick={() => setMode("login")} className="text-primary font-semibold hover:underline">
                  Kirish
                </button>
              </p>
            )}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default AuthPage;
