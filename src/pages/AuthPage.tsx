import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Heart, Building2, User, Mail, Lock, Eye, EyeOff, CheckCircle, XCircle, Microscope, Package, Phone, Loader2, Send } from "lucide-react";
import { cn } from "@/lib/utils";

const roles = [
  { value: "patient", label: "Bemor", icon: User, desc: "Qabulga yozilish va salomatlik" },
  { value: "clinic", label: "Klinika", icon: Building2, desc: "Klinikani boshqarish" },
  { value: "diagnostics", label: "Diagnostika", icon: Microscope, desc: "Diagnostika markazi" },
  { value: "vendor", label: "Medtexnika", icon: Package, desc: "Medtexnika sotuvchisi" },
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

type AuthMethod = "email" | "phone";

const AuthPage = () => {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [authMethod, setAuthMethod] = useState<AuthMethod>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("patient");
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Phone auth state
  const [phone, setPhone] = useState("+998");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  const { signIn, signUp, signInWithPhone, verifyPhoneOtp, userRole: currentUserRole } = useAuth();
  const navigate = useNavigate();

  const passwordStrong = mode === "register" && authMethod === "email" ? PASSWORD_RULES.every((r) => r.test(password)) : true;

  const handleGoogleSignIn = async () => {
    setSubmitting(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast({ title: "Xatolik", description: String(result.error), variant: "destructive" });
    }
    setSubmitting(false);
  };

  const handlePhoneSendOtp = async () => {
    const cleanPhone = phone.replace(/\s/g, "");
    if (cleanPhone.length < 13) {
      toast({ title: "Telefon raqamini to'liq kiriting", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("telegram-otp/send-otp", {
        body: { phone: cleanPhone },
      });
      if (error) throw error;
      if (data?.error === "not_linked") {
        toast({
          title: "Telegram bot bilan ulanmagan",
          description: "Avval @Med1UzBot ga telefon raqamingizni yuboring, keyin qayta urinib ko'ring.",
          variant: "destructive",
        });
      } else if (data?.success) {
        setOtpSent(true);
        toast({ title: "Telegram kod yuborildi", description: `${cleanPhone} raqamiga Telegram orqali kod yuborildi` });
      } else {
        toast({ title: "Xatolik", description: data?.message || "Noma'lum xatolik", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Xatolik", description: err.message, variant: "destructive" });
    }
    setSubmitting(false);
  };

  const handlePhoneVerifyOtp = async () => {
    setSubmitting(true);
    try {
      const cleanPhone = phone.replace(/\s/g, "");
      const { data, error } = await supabase.functions.invoke("telegram-otp/verify-otp", {
        body: { phone: cleanPhone, otp: otpCode },
      });
      if (error) throw error;
      if (data?.error) {
        toast({ title: "Xatolik", description: data.error, variant: "destructive" });
      } else if (data?.has_account && data?.hashed_token) {
        // Use the magic link token to sign in
        const { error: verifyErr } = await supabase.auth.verifyOtp({
          token_hash: data.hashed_token,
          type: "magiclink",
        });
        if (verifyErr) {
          toast({ title: "Xatolik", description: verifyErr.message, variant: "destructive" });
        } else {
          toast({ title: "Xush kelibsiz!" });
          navigate("/dashboard");
        }
      } else {
        toast({
          title: "Kod tasdiqlandi",
          description: "Bu raqam bilan bog'langan hisob topilmadi. Email orqali ro'yxatdan o'ting.",
        });
        setMode("register");
        setOtpSent(false);
      }
    } catch (err: any) {
      toast({ title: "Xatolik", description: err.message, variant: "destructive" });
    }
    setSubmitting(false);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    if (mode === "login") {
      const { error } = await signIn(email, password);
      if (error) {
        const msg = error.message === "Email not confirmed" ? "Email tasdiqlanmagan. Iltimos, emailingizni tekshiring." : error.message;
        toast({ title: "Xatolik", description: msg, variant: "destructive" });
      } else {
        toast({ title: "Xush kelibsiz!" });
        setTimeout(() => {
          const redirectRole = currentUserRole || "patient";
          navigate(ROLE_REDIRECT[redirectRole] || "/dashboard");
        }, 500);
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
                  onClick={() => { setMode(m); setOtpSent(false); setOtpCode(""); }}
                  className={cn(
                    "flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all",
                    mode === m ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                  )}
                >
                  {m === "login" ? "Kirish" : "Ro'yxatdan o'tish"}
                </button>
              ))}
            </div>

            {/* Google Sign In */}
            <Button
              type="button"
              variant="outline"
              className="w-full mb-4 h-11 gap-2 font-semibold"
              onClick={handleGoogleSignIn}
              disabled={submitting}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google orqali kirish
            </Button>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground font-medium">yoki</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Auth method toggle (login only) */}
            {mode === "login" && (
              <div className="flex mb-4 bg-muted/50 rounded-lg p-1 gap-1">
                <button
                  type="button"
                  onClick={() => { setAuthMethod("email"); setOtpSent(false); }}
                  className={cn(
                    "flex-1 py-2 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5",
                    authMethod === "email" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                  )}
                >
                  <Mail className="w-3.5 h-3.5" /> Email
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMethod("phone"); setOtpSent(false); }}
                  className={cn(
                    "flex-1 py-2 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5",
                    authMethod === "phone" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                  )}
                >
                  <Phone className="w-3.5 h-3.5" /> Telefon
                </button>
              </div>
            )}

            {/* Phone auth (login only) */}
            {mode === "login" && authMethod === "phone" && (
              <div className="space-y-4">
                <div>
                  <Label className="text-xs">Telefon raqam</Label>
                  <div className="relative mt-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+998 90 123 45 67"
                      className="pl-10"
                      disabled={otpSent}
                    />
                  </div>
                </div>

                {otpSent && (
                  <div>
                    <Label className="text-xs">SMS kod</Label>
                    <Input
                      type="text"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="123456"
                      className="text-center text-lg tracking-widest font-mono"
                      maxLength={6}
                    />
                  </div>
                )}

                <Button
                  type="button"
                  disabled={submitting}
                  className="w-full bg-hero-gradient text-primary-foreground border-0 h-11"
                  onClick={otpSent ? handlePhoneVerifyOtp : handlePhoneSendOtp}
                >
                  {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {otpSent ? "Tasdiqlash" : "SMS kod yuborish"}
                </Button>

                {otpSent && (
                  <button
                    type="button"
                    onClick={() => { setOtpSent(false); setOtpCode(""); }}
                    className="text-xs text-primary font-semibold hover:underline w-full text-center"
                  >
                    Raqamni o'zgartirish
                  </button>
                )}
              </div>
            )}

            {/* Email auth */}
            {(mode === "register" || authMethod === "email") && !(mode === "login" && authMethod === "phone") && (
              <form onSubmit={handleEmailSubmit} className="space-y-4">
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
                  {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {submitting ? "Kutilmoqda..." : mode === "login" ? "Kirish" : "Ro'yxatdan o'tish"}
                </Button>

                {mode === "register" && role !== "patient" && (
                  <p className="text-xs text-center text-muted-foreground">
                    Ro'yxatdan o'tgandan so'ng {role === "clinic" ? "klinika" : role === "diagnostics" ? "diagnostika markazi" : "medtexnika"} ma'lumotlarini to'ldirish sahifasiga yo'naltirilasiz
                  </p>
                )}
              </form>
            )}

            {mode === "login" && (
              <div className="text-center mt-4 space-y-2">
                <Link to="/forgot-password" className="block text-xs text-primary font-semibold hover:underline">
                  Parolni unutdingizmi?
                </Link>
                <p className="text-xs text-muted-foreground">
                  Hisobingiz yo'qmi?{" "}
                  <button onClick={() => setMode("register")} className="text-primary font-semibold hover:underline">
                    Ro'yxatdan o'ting
                  </button>
                </p>
              </div>
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
