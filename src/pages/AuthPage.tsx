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
import { Heart, Building2, User, Mail, Lock, Eye, EyeOff, CheckCircle, XCircle, Microscope, Package, Phone, Loader2, Send, MessageCircle, Baby, Sparkles, Stethoscope, Pill } from "lucide-react";
import { cn } from "@/lib/utils";

const roles = [
  { value: "patient", label: "Bemor", icon: User, desc: "Qabulga yozilish va salomatlik" },
  { value: "doctor", label: "Shifokor", icon: Stethoscope, desc: "Professional profil yaratish" },
  { value: "clinic", label: "Klinika", icon: Building2, desc: "Klinikani boshqarish" },
  { value: "diagnostics", label: "Diagnostika", icon: Microscope, desc: "Diagnostika markazi" },
  { value: "vendor", label: "Medtexnika", icon: Package, desc: "Medtexnika sotuvchisi" },
  { value: "maternity", label: "Tug'ruqxona", icon: Baby, desc: "Tug'ruqxona boshqarish" },
  { value: "cosmetology", label: "Kosmetologiya", icon: Sparkles, desc: "Kosmetologiya markazi" },
  { value: "pharmacy", label: "Dorixona", icon: Pill, desc: "Dorixona boshqarish" },
];

const ROLE_REDIRECT: Record<string, string> = {
  patient: "/dashboard",
  doctor: "/doctor-register",
  clinic: "/clinic-register",
  diagnostics: "/diagnostics-register",
  vendor: "/vendor-register",
  maternity: "/maternity-register",
  cosmetology: "/cosmetology-register",
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

  // Phone auth state (login)
  const [phone, setPhone] = useState("+998");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  // Phone verification during registration
  const [regPhone, setRegPhone] = useState("+998");
  const [regOtpSent, setRegOtpSent] = useState(false);
  const [regOtpCode, setRegOtpCode] = useState("");
  const [regPhoneVerified, setRegPhoneVerified] = useState(false);

  const { signIn, signUp, signInWithPhone, verifyPhoneOtp, userRole: currentUserRole } = useAuth();
  const navigate = useNavigate();

  const passwordStrong = mode === "register" ? PASSWORD_RULES.every((r) => r.test(password)) : true;

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
          description: "Avval @Med1uzOTP_Bot ga telefon raqamingizni yuboring, keyin qayta urinib ko'ring.",
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

  // Registration phone OTP handlers
  const handleRegPhoneSendOtp = async () => {
    const cleanPhone = regPhone.replace(/\s/g, "");
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
          description: "Avval @Med1uzOTP_Bot ga telefon raqamingizni yuboring, keyin qayta urinib ko'ring.",
          variant: "destructive",
        });
      } else if (data?.success) {
        setRegOtpSent(true);
        toast({ title: "Telegram kod yuborildi", description: `${cleanPhone} raqamiga Telegram orqali kod yuborildi` });
      } else {
        toast({ title: "Xatolik", description: data?.message || "Noma'lum xatolik", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Xatolik", description: err.message, variant: "destructive" });
    }
    setSubmitting(false);
  };

  const handleRegPhoneVerifyOtp = async () => {
    setSubmitting(true);
    try {
      const cleanPhone = regPhone.replace(/\s/g, "");
      const { data, error } = await supabase.functions.invoke("telegram-otp/verify-otp", {
        body: { phone: cleanPhone, otp: regOtpCode },
      });
      if (error) throw error;
      if (data?.error) {
        toast({ title: "Xatolik", description: data.error, variant: "destructive" });
      } else if (data?.verified) {
        setRegPhoneVerified(true);
        toast({ title: "✅ Telefon tasdiqlandi!", description: "Endi ro'yxatdan o'tishni yakunlang." });
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
      const verifiedPhone = regPhoneVerified ? regPhone.replace(/\s/g, "") : "";
      const { error } = await signUp(email, password, fullName, role, verifiedPhone);
      if (error) {
        toast({ title: "Xatolik", description: error.message, variant: "destructive" });
      } else {
        toast({ 
          title: "✅ Ro'yxatdan o'tdingiz!", 
          description: regPhoneVerified 
            ? "Emailingizni tasdiqlang. Telefon raqamingiz saqlandi." 
            : "Emailingizni tasdiqlang. Tasdiqlagandan so'ng tizimga kiring." 
        });
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
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-4 opacity-0 animate-fade-up" style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}>
              <Heart className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="font-heading text-3xl font-bold text-foreground opacity-0 animate-fade-up" style={{ animationDelay: '80ms', animationFillMode: 'forwards' }}>
              {mode === "login" ? "Kirish" : "Ro'yxatdan o'tish"}
            </h1>
            <p className="text-muted-foreground mt-2 opacity-0 animate-fade-up" style={{ animationDelay: '160ms', animationFillMode: 'forwards' }}>Med1.uz platformasiga xush kelibsiz</p>
          </div>

          <div className="bg-card rounded-2xl border border-border shadow-card p-6 opacity-0 animate-fade-up" style={{ animationDelay: '240ms', animationFillMode: 'forwards' }}>
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
                  <MessageCircle className="w-3.5 h-3.5" /> Telegram
                </button>
              </div>
            )}

            {/* Phone auth via Telegram (login only) */}
            {mode === "login" && authMethod === "phone" && (
              <div className="space-y-4">
                {!otpSent && (
                  <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="relative space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0088cc] to-[#0077b5] flex items-center justify-center shadow-sm">
                          <Send className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground">Telegram orqali kirish</p>
                          <p className="text-[10px] text-muted-foreground">Xavfsiz va tez autentifikatsiya</p>
                        </div>
                      </div>
                      <div className="space-y-2 text-xs text-muted-foreground">
                        <div className="flex items-start gap-2">
                          <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</span>
                          <span>
                            <a href="https://t.me/Med1uzOTP_Bot" target="_blank" rel="noopener" className="text-primary font-semibold hover:underline inline-flex items-center gap-1">
                              @Med1uzOTP_Bot
                              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                            </a>
                            {" "}ga o'ting va <code className="bg-muted px-1 py-0.5 rounded text-[10px]">/start</code> bosing
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</span>
                          <span>Botga telefon raqamingizni yuboring<br/><code className="bg-muted px-1 py-0.5 rounded text-[10px]">+998901234567</code></span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</span>
                          <span>Pastda raqamni kiritib "Telegram kod yuborish" tugmasini bosing</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {otpSent && (
                  <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-xl border border-primary/20">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <MessageCircle className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <p className="text-xs text-foreground">
                      <span className="font-semibold">Telegram</span>ga 6 raqamli kod yuborildi
                    </p>
                  </div>
                )}

                <div>
                  <Label className="text-xs font-medium">Telefon raqam</Label>
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
                    <Label className="text-xs font-medium">Tasdiqlash kodi</Label>
                    <Input
                      type="text"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="● ● ● ● ● ●"
                      className="text-center text-xl tracking-[0.5em] font-mono h-12 mt-1"
                      maxLength={6}
                    />
                    <p className="text-[10px] text-muted-foreground mt-1 text-center">Kod 5 daqiqa ichida amal qiladi</p>
                  </div>
                )}

                <Button
                  type="button"
                  disabled={submitting}
                  className="w-full bg-hero-gradient text-primary-foreground border-0 h-11 gap-2"
                  onClick={otpSent ? handlePhoneVerifyOtp : handlePhoneSendOtp}
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : otpSent ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {submitting ? "Kutilmoqda..." : otpSent ? "Kodni tasdiqlash" : "Telegram kod yuborish"}
                </Button>

                {otpSent && (
                  <div className="flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => { setOtpSent(false); setOtpCode(""); }}
                      className="text-xs text-muted-foreground font-medium hover:text-foreground transition-colors"
                    >
                      Raqamni o'zgartirish
                    </button>
                    <span className="text-muted-foreground/30">|</span>
                    <button
                      type="button"
                      onClick={handlePhoneSendOtp}
                      disabled={submitting}
                      className="text-xs text-primary font-semibold hover:underline"
                    >
                      Qayta yuborish
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Email auth */}
            {(mode === "register" || authMethod === "email") && !(mode === "login" && authMethod === "phone") && (
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                {mode === "register" && (
                  <>
                    <div>
                      <Label className="text-xs font-medium mb-2 block">Rol tanlang</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-2">
                        {roles.map((r) => {
                          const isSelected = role === r.value;
                          return (
                            <button
                              key={r.value}
                              type="button"
                              onClick={() => setRole(r.value)}
                              className={cn(
                                "group relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 text-center overflow-hidden",
                                isSelected
                                  ? "border-primary bg-primary/5 shadow-md scale-[1.02]"
                                  : "border-border/60 hover:border-primary/40 hover:bg-accent/30 hover:shadow-sm"
                              )}
                            >
                              {isSelected && (
                                <div className="absolute top-1.5 right-1.5">
                                  <CheckCircle className="w-4 h-4 text-primary" />
                                </div>
                              )}
                              <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200",
                                isSelected
                                  ? "bg-hero-gradient text-primary-foreground shadow-sm"
                                  : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                              )}>
                                <r.icon className="w-5 h-5" />
                              </div>
                              <div>
                                <span className={cn(
                                  "text-xs font-bold block leading-tight",
                                  isSelected ? "text-primary" : "text-foreground"
                                )}>{r.label}</span>
                                <span className="text-[10px] text-muted-foreground leading-tight mt-0.5 block">{r.desc}</span>
                              </div>
                            </button>
                          );
                        })}
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

                {/* Phone verification for registration */}
                {mode === "register" && (
                  <div className="space-y-3 p-4 rounded-xl border border-border bg-muted/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[#0088cc] to-[#0077b5] flex items-center justify-center">
                          <Send className="w-3 h-3 text-white" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground">Telegram orqali telefon tasdiqlash</p>
                          <p className="text-[10px] text-muted-foreground">Ixtiyoriy, lekin tavsiya etiladi</p>
                        </div>
                      </div>
                      {regPhoneVerified && (
                        <div className="flex items-center gap-1 text-primary">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-[10px] font-bold">Tasdiqlangan</span>
                        </div>
                      )}
                    </div>

                    {!regPhoneVerified && !regOtpSent && (
                      <p className="text-[10px] text-muted-foreground">
                        Avval{" "}
                        <a href="https://t.me/Med1uzOTP_Bot" target="_blank" rel="noopener" className="text-primary font-semibold hover:underline">
                          @Med1uzOTP_Bot
                        </a>
                        {" "}ga telefon raqamingizni yuboring, keyin pastda kiriting.
                      </p>
                    )}

                    {!regPhoneVerified && (
                      <>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            type="tel"
                            value={regPhone}
                            onChange={(e) => setRegPhone(e.target.value)}
                            placeholder="+998 90 123 45 67"
                            className="pl-10 h-9 text-sm"
                            disabled={regOtpSent}
                          />
                        </div>

                        {regOtpSent && (
                          <div>
                            <Input
                              type="text"
                              value={regOtpCode}
                              onChange={(e) => setRegOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                              placeholder="● ● ● ● ● ●"
                              className="text-center text-lg tracking-[0.4em] font-mono h-10"
                              maxLength={6}
                            />
                            <p className="text-[10px] text-muted-foreground mt-1 text-center">Kod 5 daqiqa ichida amal qiladi</p>
                          </div>
                        )}

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={submitting}
                          className="w-full gap-1.5 h-8 text-xs"
                          onClick={regOtpSent ? handleRegPhoneVerifyOtp : handleRegPhoneSendOtp}
                        >
                          {submitting ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : regOtpSent ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : (
                            <Send className="w-3 h-3" />
                          )}
                          {regOtpSent ? "Kodni tasdiqlash" : "Telegram kod yuborish"}
                        </Button>

                        {regOtpSent && (
                          <div className="flex items-center justify-center gap-3">
                            <button
                              type="button"
                              onClick={() => { setRegOtpSent(false); setRegOtpCode(""); }}
                              className="text-[10px] text-muted-foreground font-medium hover:text-foreground transition-colors"
                            >
                              Raqamni o'zgartirish
                            </button>
                            <span className="text-muted-foreground/30">|</span>
                            <button
                              type="button"
                              onClick={handleRegPhoneSendOtp}
                              disabled={submitting}
                              className="text-[10px] text-primary font-semibold hover:underline"
                            >
                              Qayta yuborish
                            </button>
                          </div>
                        )}
                      </>
                    )}
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
                    Ro'yxatdan o'tgandan so'ng {role === "clinic" ? "klinika" : role === "diagnostics" ? "diagnostika markazi" : role === "maternity" ? "tug'ruqxona" : role === "cosmetology" ? "kosmetologiya markazi" : "medtexnika"} ma'lumotlarini to'ldirish sahifasiga yo'naltirilasiz
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
