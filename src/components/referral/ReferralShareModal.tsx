import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import QRCode from "qrcode";
import {
  Send, MessageCircle, Copy, Share2, Download, QrCode,
  Mail, Facebook, Twitter, Link2, Check, Sparkles, Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onClose: () => void;
  code: string;
  link: string;
};

type ChannelKey = "telegram" | "whatsapp" | "twitter" | "facebook" | "email" | "native";

const CHANNELS: { key: ChannelKey; label: string; icon: typeof Send; gradient: string; ring: string }[] = [
  { key: "telegram",  label: "Telegram",  icon: Send,          gradient: "from-[#229ED9] to-[#1c7fb0]", ring: "ring-[#229ED9]/40" },
  { key: "whatsapp",  label: "WhatsApp",  icon: MessageCircle, gradient: "from-[#25D366] to-[#1aa84d]", ring: "ring-[#25D366]/40" },
  { key: "twitter",   label: "X / Twitter", icon: Twitter,     gradient: "from-slate-700 to-slate-900", ring: "ring-slate-500/40" },
  { key: "facebook",  label: "Facebook",  icon: Facebook,      gradient: "from-[#1877F2] to-[#0e57b8]", ring: "ring-[#1877F2]/40" },
  { key: "email",     label: "Email",     icon: Mail,          gradient: "from-amber-500 to-orange-600", ring: "ring-amber-500/40" },
  { key: "native",    label: "Tizim",     icon: Share2,        gradient: "from-violet-500 to-fuchsia-600", ring: "ring-violet-500/40" },
];

const buildMessage = (code: string, link: string) =>
  `🏥 MED-ALL AI / med1.uz — O'zbekistondagi yetakchi raqamli sog'liqni saqlash platformasi.\n\n✨ Mening taklifim bilan ro'yxatdan o'ting va bonus oling:\n🎟 Promo kod: ${code}\n🔗 ${link}`;

const withSource = (link: string, src: ChannelKey) => {
  try {
    const u = new URL(link);
    u.searchParams.set("utm_source", src);
    u.searchParams.set("utm_medium", "referral");
    return u.toString();
  } catch {
    return link;
  }
};

export const ReferralShareModal = ({ open, onClose, code, link }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copied, setCopied] = useState<"code" | "link" | "text" | null>(null);
  const [tab, setTab] = useState("share");

  useEffect(() => {
    if (!open || !link) return;
    QRCode.toDataURL(link, {
      width: 480,
      margin: 2,
      errorCorrectionLevel: "H",
      color: { dark: "#0A2540", light: "#FFFFFF" },
    }).then(setQrDataUrl).catch(() => setQrDataUrl(""));

    // Also draw to canvas with branded center
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, link, {
        width: 320,
        margin: 2,
        errorCorrectionLevel: "H",
        color: { dark: "#0A2540", light: "#FFFFFF" },
      }).then(() => {
        const ctx = canvasRef.current?.getContext("2d");
        if (!ctx) return;
        const s = 320;
        const r = 40;
        // white badge
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(s / 2, s / 2, r, 0, Math.PI * 2);
        ctx.fill();
        // brand gradient dot
        const grad = ctx.createLinearGradient(s / 2 - r, s / 2 - r, s / 2 + r, s / 2 + r);
        grad.addColorStop(0, "#2F80ED");
        grad.addColorStop(1, "#7B61FF");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(s / 2, s / 2, r - 6, 0, Math.PI * 2);
        ctx.fill();
        // text "m1"
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 24px ui-sans-serif, system-ui";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("m1", s / 2, s / 2 + 1);
      });
    }
  }, [open, link]);

  const msg = buildMessage(code, link);

  const handleCopy = async (kind: "code" | "link" | "text") => {
    const value = kind === "code" ? code : kind === "link" ? link : msg;
    await navigator.clipboard.writeText(value);
    setCopied(kind);
    toast.success(kind === "code" ? "Promo kod nusxalandi" : kind === "link" ? "Havola nusxalandi" : "Matn nusxalandi");
    setTimeout(() => setCopied(null), 1800);
  };

  const openChannel = async (key: ChannelKey) => {
    const tagged = withSource(link, key);
    const m = buildMessage(code, tagged);
    switch (key) {
      case "telegram":
        return window.open(`https://t.me/share/url?url=${encodeURIComponent(tagged)}&text=${encodeURIComponent(m)}`, "_blank");
      case "whatsapp":
        return window.open(`https://wa.me/?text=${encodeURIComponent(m)}`, "_blank");
      case "twitter":
        return window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(m)}`, "_blank");
      case "facebook":
        return window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(tagged)}&quote=${encodeURIComponent(m)}`, "_blank");
      case "email":
        return window.open(`mailto:?subject=${encodeURIComponent("MED-ALL AI — Taklif")}&body=${encodeURIComponent(m)}`, "_self");
      case "native": {
        if (!navigator.share) {
          await handleCopy("text");
          return;
        }
        try {
          // Try sharing QR as image if supported
          if (qrDataUrl && (navigator as any).canShare) {
            const blob = await (await fetch(qrDataUrl)).blob();
            const file = new File([blob], `med1-referral-${code}.png`, { type: "image/png" });
            if ((navigator as any).canShare({ files: [file] })) {
              await navigator.share({ files: [file], title: "MED-ALL AI Referral", text: m });
              return;
            }
          }
          await navigator.share({ title: "MED-ALL AI Referral", text: m, url: tagged });
        } catch {/* user cancelled */}
      }
    }
  };

  const downloadQR = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `med1-referral-${code}.png`;
    a.click();
    toast.success("QR kod yuklab olindi");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-0 bg-gradient-to-br from-[#0A2540] via-[#0d2e52] to-[#1a1a3e] text-white shadow-2xl">
        {/* Animated glow header */}
        <div className="relative h-24 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(47,128,237,0.4),transparent_60%),radial-gradient(circle_at_70%_50%,rgba(123,97,255,0.4),transparent_60%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.06)_50%,transparent)] animate-pulse" />
          <DialogHeader className="relative z-10 px-6 pt-5">
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#2F80ED] to-[#7B61FF] flex items-center justify-center shadow-lg shadow-[#7B61FF]/30">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              Do'stingizni taklif qiling
              <Badge className="ml-auto bg-emerald-500/15 text-emerald-300 border-emerald-400/30">
                +Bonus
              </Badge>
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="px-6 pb-6 -mt-2">
          {/* Code + link pills */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              onClick={() => handleCopy("code")}
              className="group flex items-center justify-between rounded-xl bg-white/5 hover:bg-white/10 ring-1 ring-white/10 px-3 py-2.5 transition"
            >
              <div className="text-left min-w-0">
                <div className="text-[10px] uppercase tracking-wider text-white/50">Promo kod</div>
                <div className="font-mono text-sm font-bold tracking-wider truncate">{code}</div>
              </div>
              {copied === "code" ? <Check className="w-4 h-4 text-emerald-400 shrink-0" /> : <Copy className="w-4 h-4 text-white/40 group-hover:text-white shrink-0" />}
            </button>
            <button
              onClick={() => handleCopy("link")}
              className="group flex items-center justify-between rounded-xl bg-white/5 hover:bg-white/10 ring-1 ring-white/10 px-3 py-2.5 transition"
            >
              <div className="text-left min-w-0">
                <div className="text-[10px] uppercase tracking-wider text-white/50">Havola</div>
                <div className="text-xs truncate text-white/80">{link.replace(/^https?:\/\//, "")}</div>
              </div>
              {copied === "link" ? <Check className="w-4 h-4 text-emerald-400 shrink-0" /> : <Link2 className="w-4 h-4 text-white/40 group-hover:text-white shrink-0" />}
            </button>
          </div>

          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList className="grid grid-cols-2 w-full bg-white/5 border border-white/10">
              <TabsTrigger value="share" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60">
                <Share2 className="w-3.5 h-3.5 mr-1.5" /> Ulashish
              </TabsTrigger>
              <TabsTrigger value="qr" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60">
                <QrCode className="w-3.5 h-3.5 mr-1.5" /> QR kod
              </TabsTrigger>
            </TabsList>

            {/* Share channels */}
            <TabsContent value="share" className="mt-4">
              <div className="grid grid-cols-3 gap-2">
                {CHANNELS.map((c) => (
                  <button
                    key={c.key}
                    onClick={() => openChannel(c.key)}
                    className={cn(
                      "group relative aspect-square rounded-2xl bg-gradient-to-br text-white",
                      "flex flex-col items-center justify-center gap-1.5",
                      "ring-1 ring-white/10 hover:ring-2 transition-all hover:scale-[1.03] hover:-translate-y-0.5",
                      "shadow-lg",
                      c.gradient, c.ring
                    )}
                  >
                    <c.icon className="w-5 h-5" />
                    <span className="text-[11px] font-medium">{c.label}</span>
                  </button>
                ))}
              </div>

              <button
                onClick={() => handleCopy("text")}
                className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl bg-white/5 hover:bg-white/10 ring-1 ring-white/10 px-3 py-2.5 text-sm transition"
              >
                {copied === "text" ? (
                  <><Check className="w-4 h-4 text-emerald-400" /> Nusxalandi</>
                ) : (
                  <><Copy className="w-4 h-4" /> To'liq matnni nusxalash</>
                )}
              </button>
            </TabsContent>

            {/* QR tab */}
            <TabsContent value="qr" className="mt-4">
              <div className="flex flex-col items-center">
                <div className="relative p-3 rounded-2xl bg-white shadow-2xl shadow-[#2F80ED]/20 ring-1 ring-white/20">
                  <canvas ref={canvasRef} className="w-56 h-56 rounded-lg" />
                  <div className="absolute -top-2 -right-2 bg-gradient-to-br from-[#7B61FF] to-[#2F80ED] text-[10px] font-bold px-2 py-1 rounded-full shadow-lg">
                    med1.uz
                  </div>
                </div>
                <p className="text-center text-xs text-white/60 mt-3">
                  Kamerangizdan skanerlang yoki yuklab oling
                </p>
                <div className="grid grid-cols-2 gap-2 w-full mt-4">
                  <Button onClick={downloadQR} variant="outline" className="border-white/15 bg-white/5 hover:bg-white/10 text-white">
                    <Download className="w-4 h-4 mr-2" /> Yuklash (PNG)
                  </Button>
                  <Button
                    onClick={() => openChannel("native")}
                    className="bg-gradient-to-r from-[#2F80ED] to-[#7B61FF] hover:opacity-90 text-white border-0"
                  >
                    <ImageIcon className="w-4 h-4 mr-2" /> QR'ni ulashish
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <p className="text-[10px] text-center text-white/40 mt-4">
            Har bir kanal alohida <span className="font-mono">utm_source</span> bilan belgilanadi — qaysi platforma yaxshi ishlayotganini ko'rishingiz mumkin.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReferralShareModal;
