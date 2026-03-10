import { Phone, Mail, MapPin, Clock, Globe } from "lucide-react";

const ContactLocationSection = () => {
  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact Information */}
          <div className="bg-card rounded-2xl border border-border shadow-card p-6">
            <h3 className="font-heading font-bold text-foreground mb-5 text-lg">
              Aloqa ma'lumotlari
            </h3>
            <ul className="space-y-4">
              <li className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Telefon</p>
                  <div className="space-y-0.5">
                    <a href="tel:+998992144103" className="block text-sm font-medium text-foreground hover:text-primary transition-colors">+998 99 214 41 03</a>
                    <a href="tel:+998777770463" className="block text-sm font-medium text-foreground hover:text-primary transition-colors">+998 77 777 04 63</a>
                    <a href="tel:+998770000498" className="block text-sm font-medium text-foreground hover:text-primary transition-colors">+998 77 000 04 98</a>
                  </div>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium text-foreground">info@med1.uz</p>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Ish vaqti</p>
                  <p className="text-sm font-medium text-foreground">24/7 onlayn xizmat</p>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Globe className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Veb-sayt</p>
                  <p className="text-sm font-medium text-foreground">www.med1.uz</p>
                </div>
              </li>
            </ul>
          </div>

          {/* Location */}
          <div className="bg-card rounded-2xl border border-border shadow-card p-6">
            <h3 className="font-heading font-bold text-foreground mb-5 text-lg">
              Manzil
            </h3>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Toshkent shahri, O'zbekiston</p>
                <p className="text-xs text-muted-foreground mt-0.5">Amir Temur shoh ko'chasi, 108-uy</p>
              </div>
            </div>
            <div className="rounded-xl overflow-hidden border border-border h-[200px] bg-muted/30">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2996.0654683067037!2d69.27927!3d41.31115!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x38ae8b0cc379e9c3%3A0xa5a9323b4aa5cb98!2sTashkent%2C%20Uzbekistan!5e0!3m2!1sen!2s!4v1700000000000"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Med1.uz manzili"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactLocationSection;
