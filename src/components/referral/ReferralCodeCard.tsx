import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Share2, QrCode, Sparkles, Check } from "lucide-react";
import { toast } from "sonner";
import { ReferralShareModal } from "./ReferralShareModal";

type Props = {
  code: string;
  link: string;
};

export const ReferralCodeCard = ({ code, link }: Props) => {
  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  const copy = async (value: string, kind: "code" | "link") => {
    await navigator.clipboard.writeText(value);
    setCopied(kind);
    toast.success(kind === "code" ? "Kod nusxalandi" : "Havola nusxalandi");
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <>
      <div className="glass-dark relative overflow-hidden rounded-2xl border border-white/10 p-5">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#7B61FF]/60 to-transparent" />
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-[#7B61FF]" />
          <h3 className="font-semibold">Sizning referral kodingiz</h3>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Promo kod</p>
            <div className="flex gap-2">
              <Input value={code} readOnly className="font-mono text-lg tracking-widest bg-background/40 border-white/10" />
              <Button variant="outline" size="icon" onClick={() => copy(code, "code")} className="border-white/10">
                {copied === "code" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-1">Taklif havolasi</p>
            <div className="flex gap-2">
              <Input value={link} readOnly className="text-xs bg-background/40 border-white/10" />
              <Button variant="outline" size="icon" onClick={() => copy(link, "link")} className="border-white/10">
                {copied === "link" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button className="flex-1 btn-magnetic bg-gradient-to-r from-[#2F80ED] to-[#7B61FF] text-white border-0" onClick={() => setShareOpen(true)}>
              <Share2 className="w-4 h-4 mr-2" /> Ulashish
            </Button>
            <Button variant="outline" className="border-white/10" onClick={() => setShareOpen(true)}>
              <QrCode className="w-4 h-4 mr-2" /> QR
            </Button>
          </div>
        </div>
      </div>

      <ReferralShareModal open={shareOpen} onClose={() => setShareOpen(false)} code={code} link={link} />
    </>
  );
};

export default ReferralCodeCard;
