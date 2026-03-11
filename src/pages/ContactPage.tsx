import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ContactMessageForm from "@/components/ContactMessageForm";
import { Phone, Mail, MapPin, Clock, MessageSquare } from "lucide-react";

const ContactPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Biz bilan bog'laning</h1>
          <p className="text-muted-foreground">Savollaringiz bormi? Biz bilan bog'laning!</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Contact Info */}
          <div className="space-y-6">
            <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Phone className="w-5 h-5 text-primary" /> Aloqa ma'lumotlari
              </h3>
              <div className="space-y-3">
                {["+998 99 214 41 03", "+998 77 777 04 63", "+998 77 000 04 98"].map(phone => (
                  <a key={phone} href={`tel:${phone.replace(/\s/g, "")}`} className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors">
                    <Phone className="w-4 h-4 text-muted-foreground" /> {phone}
                  </a>
                ))}
              </div>
              <div className="flex items-center gap-2 text-sm text-foreground">
                <Mail className="w-4 h-4 text-muted-foreground" /> info@med1.uz
              </div>
              <div className="flex items-center gap-2 text-sm text-foreground">
                <MapPin className="w-4 h-4 text-muted-foreground" /> Toshkent, O'zbekiston
              </div>
              <div className="flex items-center gap-2 text-sm text-foreground">
                <Clock className="w-4 h-4 text-muted-foreground" /> 24/7 qo'llab-quvvatlash
              </div>
            </div>

            <div className="bg-primary/5 rounded-2xl border border-primary/20 p-6">
              <h4 className="font-semibold text-foreground mb-2">Telegram orqali bog'laning</h4>
              <p className="text-sm text-muted-foreground mb-3">Tezkor javob olish uchun Telegram botimizga yozing</p>
              <a href="https://t.me/Med1uzOTP_Bot" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
                <MessageSquare className="w-4 h-4" /> @Med1uzOTP_Bot
              </a>
            </div>
          </div>

          {/* Form */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <ContactMessageForm />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ContactPage;
