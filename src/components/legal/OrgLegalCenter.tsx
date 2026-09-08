import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  BookOpen, ExternalLink, FileSignature, FileText, Scale, Shield, UserCheck,
} from "lucide-react";
import ContractRequiredWidget from "./ContractRequiredWidget";

const docLinks = [
  { title: "SaaS HMS shartlari", href: "/saas-terms", icon: Scale, badge: "Tarif" },
  { title: "Foydalanish shartlari", href: "/terms", icon: FileText, badge: "Global" },
  { title: "Maxfiylik siyosati", href: "/privacy", icon: Shield, badge: "Privacy" },
  { title: "Tibbiy ogohlantirish", href: "/disclaimer", icon: UserCheck, badge: "AI" },
  { title: "Hamkorlik shartnomasi", href: "/partnership", icon: FileSignature, badge: "Hamkor" },
  { title: "Foydalanuvchi qo'llanmasi", href: "/user-guide", icon: BookOpen, badge: "Guide" },
  { title: "Shartnoma tekshirish", href: "/contract-verify", icon: Shield, badge: "Verify" },
  { title: "Yuridik markaz (to'liq)", href: "/legal-center", icon: Scale, badge: "Legal" },
];

interface Props {
  /** Contract template slug required for this module, if any */
  contractSlug?: string;
  moduleTitle?: string;
}

const OrgLegalCenter = ({ contractSlug, moduleTitle }: Props) => (
  <div className="space-y-5">
    <div>
      <h2 className="font-heading text-xl font-bold text-foreground mb-1">⚖️ Yuridik markaz</h2>
      <p className="text-sm text-muted-foreground">
        Shartnomalar, rasmiy hujjatlar, tarif shartlari va elektron imzo.
      </p>
    </div>

    {contractSlug && (
      <ContractRequiredWidget templateSlug={contractSlug} moduleTitle={moduleTitle} />
    )}

    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {docLinks.map((doc) => {
        const Icon = doc.icon;
        return (
          <Link
            key={doc.href}
            to={doc.href}
            className="bg-card border border-border rounded-xl p-4 hover:border-primary/50 hover:bg-muted/30 transition group"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-sm text-foreground truncate">{doc.title}</p>
                  <Badge variant="outline" className="text-[10px]">{doc.badge}</Badge>
                </div>
                <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
                  Ochish <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition" />
                </p>
              </div>
            </div>
          </Link>
        );
      })}
    </div>

    <Card className="p-4 text-xs text-muted-foreground leading-relaxed">
      Barcha hujjatlar MED-ALL AI SYSTEM MCHJ tomonidan tasdiqlangan. Shartnomalar elektron imzo
      (OTP + qo'lyozma imzo) orqali imzolanadi va QR kod bilan tekshiriladi.
    </Card>
  </div>
);

export default OrgLegalCenter;
