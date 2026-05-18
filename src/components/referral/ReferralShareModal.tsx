import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Send, MessageCircle, Copy, Share2 } from "lucide-react";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onClose: () => void;
  code: string;
  link: string;
};

export const ReferralShareModal = ({ open, onClose, code, link }: Props) => {
  const message = `🏥 MED-ALL AI / med1.uz — O'zbekistondagi yetakchi raqamli sog'liqni saqlash platformasi. Mening taklifim bilan ro'yxatdan o'ting va imtiyozli boshlanish bonusini oling!\n\n🎟 Promo kod: ${code}\n🔗 ${link}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(link)}&color=2F80ED&bgcolor=0A2540&margin=10`;

  const telegram = () => window.open(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(message)}`, "_blank");
  const whatsapp = () => window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "MED-ALL AI Referral", text: message, url: link });
      } catch {}
    } else {
      await navigator.clipboard.writeText(message);
      toast.success("Matn nusxalandi");
    }
  };
  const copyAll = async () => {
    await navigator.clipboard.writeText(message);
    toast.success("To'liq matn nusxalandi");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-[#0A2540]/95 border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-[#7B61FF]" /> Referral ulashish
          </DialogTitle>
        </DialogHeader>

        <div className="flex justify-center py-3">
          <div className="p-3 rounded-2xl bg-white/5 ring-1 ring-white/10">
            <img src={qrUrl} alt="Referral QR" className="w-56 h-56 rounded-lg" loading="lazy" />
          </div>
        </div>

        <p className="text-center text-xs text-white/60 -mt-2">QR ni skanerlang yoki havolani ulashing</p>

        <div className="grid grid-cols-2 gap-2 mt-3">
          <Button onClick={telegram} className="bg-[#229ED9] hover:bg-[#229ED9]/90 text-white border-0">
            <Send className="w-4 h-4 mr-2" /> Telegram
          </Button>
          <Button onClick={whatsapp} className="bg-[#25D366] hover:bg-[#25D366]/90 text-white border-0">
            <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
          </Button>
          <Button onClick={nativeShare} variant="outline" className="border-white/15 bg-white/5">
            <Share2 className="w-4 h-4 mr-2" /> Tizim
          </Button>
          <Button onClick={copyAll} variant="outline" className="border-white/15 bg-white/5">
            <Copy className="w-4 h-4 mr-2" /> Nusxalash
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReferralShareModal;
