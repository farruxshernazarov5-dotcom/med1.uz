import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Mail, ArrowLeft, ShieldCheck, Send } from "lucide-react";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast({ title: "Emailingizni kiriting", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    } else {
      setSent(true);
      toast({ title: "✅ Yuborildi!", description: "Emailingizga parolni tiklash havolasi yuborildi." });
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
              <ShieldCheck className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="font-heading text-3xl font-bold text-foreground">Parolni tiklash</h1>
            <p className="text-muted-foreground mt-2">
              Emailingizga parolni tiklash havolasi yuboramiz
            </p>
          </div>

          <div className="bg-card rounded-2xl border border-border shadow-card p-6">
            {sent ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Send className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">Havola yuborildi!</h2>
                <p className="text-sm text-muted-foreground">
                  <strong>{email}</strong> manziliga parolni tiklash havolasi yuborildi.
                  Iltimos, emailingizni tekshiring (spam papkasini ham ko'ring).
                </p>
                <p className="text-xs text-muted-foreground">
                  Havola 1 soat ichida amal qiladi.
                </p>
                <div className="pt-4 space-y-2">
                  <Button variant="outline" className="w-full" onClick={() => { setSent(false); setEmail(""); }}>
                    Boshqa emailga yuborish
                  </Button>
                  <Link to="/auth">
                    <Button variant="ghost" className="w-full">
                      <ArrowLeft className="w-4 h-4 mr-2" /> Kirish sahifasiga qaytish
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-xs">Email manzilingiz</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" disabled={submitting} className="w-full bg-hero-gradient text-primary-foreground border-0 h-11">
                  {submitting ? "Yuborilmoqda..." : "Tiklash havolasini yuborish"}
                </Button>

                <Link to="/auth" className="block">
                  <Button type="button" variant="ghost" className="w-full text-muted-foreground">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Kirish sahifasiga qaytish
                  </Button>
                </Link>
              </form>
            )}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default ForgotPasswordPage;
