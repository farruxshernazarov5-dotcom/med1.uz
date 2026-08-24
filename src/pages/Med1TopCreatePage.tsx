import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Globe, Loader2, ShieldCheck, Sparkles, Wallet } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import {
  AD_REGIONS,
  ENTITY_TYPES,
  type AuctionState,
  type Lang,
  fetchAuctionState,
  formatSum,
  localPreCheck,
  placementName,
  previewBrandFromUrl,
} from "@/lib/med1Top";

const Med1TopCreatePage = () => {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const L = lang as Lang;
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [auction, setAuction] = useState<AuctionState[]>([]);
  const [placementCode, setPlacementCode] = useState(params.get("placement") || "top3");
  const [entityType, setEntityType] = useState<string>("clinic");
  const [title, setTitle] = useState("");
  const [brandUrl, setBrandUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [brandName, setBrandName] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [region, setRegion] = useState("Toshkent");
  const [specialty, setSpecialty] = useState("");
  const [telegram, setTelegram] = useState("");
  const [instagram, setInstagram] = useState("");
  const [bid, setBid] = useState<number>(0);
  const [days, setDays] = useState(30);
  const [autoRenew, setAutoRenew] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [advice, setAdvice] = useState<string>("");
  const [adviceBusy, setAdviceBusy] = useState(false);

  useEffect(() => {
    fetchAuctionState().then(setAuction).catch(() => setAuction([]));
  }, []);

  const placement = useMemo(
    () => auction.find((p) => p.code === placementCode) ?? auction[0],
    [auction, placementCode],
  );

  useEffect(() => {
    if (placement && (!bid || bid < placement.next_min_bid)) setBid(Number(placement.next_min_bid));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placement?.placement_id]);

  const preview = useMemo(() => (brandUrl ? previewBrandFromUrl(brandUrl) : null), [brandUrl]);
  const riskFlags = useMemo(() => localPreCheck(`${title} ${description}`), [title, description]);

  const applyPreview = () => {
    if (!preview) {
      toast({ title: "URL noto'g'ri", variant: "destructive" });
      return;
    }
    if (!preview.isHttps) toast({ title: "Ogohlantirish", description: "URL HTTPS bo'lishi tavsiya etiladi" });
    setBrandName(preview.brand);
    if (!title) setTitle(preview.brand);
    if (!logoUrl) setLogoUrl(preview.logo);
    if (preview.social === "telegram") setTelegram(preview.url);
    if (preview.social === "instagram") setInstagram(preview.url);
    toast({ title: "Preview qo'llandi", description: preview.host });
  };

  const askAi = async () => {
    setAdviceBusy(true);
    setAdvice("");
    try {
      const { data, error } = await supabase.functions.invoke("med1-ad-review", {
        body: {
          action: "advise",
          lang,
          placement_code: placement?.code,
          region,
          specialty,
          budget: bid,
          auction: auction.map((p) => ({
            code: p.code,
            name: p.name_uz,
            region: p.region,
            min_bid: p.min_bid,
            current_top_bid: p.current_top_bid,
            next_min_bid: p.next_min_bid,
            active_ads: p.active_ads,
            slots: p.slots,
          })),
        },
      });
      if (error) throw error;
      setAdvice(String(data?.advice || ""));
    } catch (e) {
      toast({ title: "AI tavsiya xatosi", description: e instanceof Error ? e.message : "Xatolik", variant: "destructive" });
    } finally {
      setAdviceBusy(false);
    }
  };

  const submit = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (!title.trim() || !placement) {
      toast({ title: "Nom va joylashuvni tanlang", variant: "destructive" });
      return;
    }
    if (bid < Number(placement.min_bid)) {
      toast({ title: `Minimal taklif: ${formatSum(placement.min_bid)}`, variant: "destructive" });
      return;
    }
    if (!accepted) {
      toast({ title: "Reklama shartlarini qabul qiling", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const { data: campaign, error } = await supabase
        .from("med1_ad_campaigns")
        .insert({
          owner_id: user.id,
          placement_id: placement.placement_id,
          entity_type: entityType,
          title: title.trim(),
          brand_name: brandName || null,
          logo_url: logoUrl || null,
          website_url: preview?.url || (brandUrl || null),
          telegram_url: telegram || null,
          instagram_url: instagram || null,
          phone: phone || null,
          address: address || null,
          region: region || null,
          specialty: specialty || null,
          description: description || null,
          bid_amount: bid,
          duration_days: days,
          auto_renew: autoRenew,
          status: "pending_payment",
        })
        .select()
        .single();
      if (error) throw error;

      await supabase.from("med1_ad_bids").insert({
        campaign_id: campaign.id,
        placement_id: placement.placement_id,
        bidder_id: user.id,
        amount: bid,
      });

      // AI pre-moderation (non-blocking for the user flow)
      void supabase.functions.invoke("med1-ad-review", {
        body: { action: "moderate", campaign_id: campaign.id, lang },
      });

      const { data: pay, error: payErr } = await supabase.functions.invoke("click-create-invoice", {
        body: {
          amount: bid,
          purpose: `med1_ad:${placement.code}`,
          reference_id: campaign.id,
          return_url: `${window.location.origin}/med1-top/my`,
        },
      });
      if (payErr) throw payErr;

      if (pay?.checkout_url) {
        window.location.href = pay.checkout_url as string;
      } else {
        toast({ title: "Reklama saqlandi", description: "To'lovni 'Reklamalarim' bo'limidan yakunlang" });
        navigate("/med1-top/my");
      }
    } catch (e) {
      toast({ title: "Xatolik", description: e instanceof Error ? e.message : "Saqlab bo'lmadi", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Med1 TOP — reklama berish va TOP o'ringa chiqish"
        description="Klinika, shifokor yoki tibbiy brendingiz uchun Med1 TOP auksionida taklif bering: hududiy target, moderatsiya, real-time statistika."
        path="/med1-top/new"
      />
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="font-heading text-2xl md:text-3xl font-extrabold text-foreground mb-2">
          {lang === "ru" ? "Выведите бренд в ТОП" : lang === "en" ? "Bring your brand to the TOP" : "Brendingizni TOPga olib chiqing"}
        </h1>
        <p className="text-muted-foreground mb-6 text-sm">
          {lang === "ru"
            ? "Ставка → оплата → модерация → публикация в ТОП"
            : lang === "en"
              ? "Bid → payment → moderation → published in TOP"
              : "Taklif → to'lov → moderatsiya → TOPda chop etish"}
        </p>

        {/* URL brand detect */}
        <div className="bg-card border border-border rounded-2xl p-4 mb-5 space-y-3">
          <Label className="flex items-center gap-2"><Globe className="w-4 h-4" /> Sayt / Telegram / Instagram URL</Label>
          <div className="flex gap-2">
            <Input value={brandUrl} onChange={(e) => setBrandUrl(e.target.value)} placeholder="https://klinika.uz" />
            <Button type="button" variant="outline" onClick={applyPreview}>Preview</Button>
          </div>
          {preview ? (
            <div className="flex items-center gap-3 rounded-xl bg-muted/40 p-3">
              <img src={preview.logo} alt={`${preview.brand} logo`} className="w-10 h-10 rounded-lg border border-border" />
              <div className="text-sm">
                <p className="font-semibold text-foreground">{preview.brand}</p>
                <p className="text-xs text-muted-foreground">{preview.host} · {preview.social}</p>
              </div>
            </div>
          ) : null}
        </div>

        {/* Placement */}
        <div className="bg-card border border-border rounded-2xl p-4 mb-5">
          <Label className="mb-2 block">Reklama formati / TOP o'rin</Label>
          <div className="flex flex-wrap gap-2">
            {auction.map((p) => (
              <Button
                key={p.placement_id}
                type="button"
                size="sm"
                variant={p.code === placementCode ? "default" : "outline"}
                onClick={() => setPlacementCode(p.code)}
              >
                {placementName(p, L)}
              </Button>
            ))}
          </div>
          {placement ? (
            <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
              <div className="rounded-xl bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">Joriy taklif</p>
                <p className="font-semibold text-foreground">{formatSum(placement.current_top_bid || placement.min_bid)}</p>
              </div>
              <div className="rounded-xl bg-primary/10 p-3">
                <p className="text-xs text-muted-foreground">Keyingi minimal taklif</p>
                <p className="font-semibold text-primary">{formatSum(placement.next_min_bid)}</p>
              </div>
            </div>
          ) : null}
        </div>

        {/* Form */}
        <div className="bg-card border border-border rounded-2xl p-4 mb-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>Nomi *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Klinika / shifokor / xizmat nomi" />
            </div>
            <div>
              <Label>Turi</Label>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {ENTITY_TYPES.map((t) => (
                  <Button key={t} type="button" size="sm" variant={entityType === t ? "default" : "outline"} onClick={() => setEntityType(t)}>
                    {t}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <Label>Mutaxassislik</Label>
              <Input value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="Kardiologiya" />
            </div>
            <div>
              <Label>Telefon</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+998 90 123 45 67" />
            </div>
            <div className="md:col-span-2">
              <Label>Manzil</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Toshkent, Chilonzor 12" />
            </div>
            <div className="md:col-span-2">
              <Label>Hudud (target)</Label>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {AD_REGIONS.map((r) => (
                  <Button key={r} type="button" size="sm" variant={region === r ? "default" : "outline"} onClick={() => setRegion(r)}>
                    {r}
                  </Button>
                ))}
              </div>
            </div>
            <div className="md:col-span-2">
              <Label>Tavsif</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Xizmatlaringiz haqida qisqacha" />
            </div>
          </div>

          {riskFlags.length > 0 ? (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              Tibbiy reklama qoidalariga zid da'volar aniqlandi ("100% davolaydi", "kafolatlangan natija" va h.k.). Matnni tahrirlang — aks holda moderatsiyadan o'tmaydi.
            </div>
          ) : null}
        </div>

        {/* Bid */}
        <div className="bg-card border border-border rounded-2xl p-4 mb-5 space-y-3">
          <Label>Taklif summasi (so'm)</Label>
          <div className="flex gap-2">
            <Input type="number" value={bid} onChange={(e) => setBid(Number(e.target.value))} min={placement?.min_bid ?? 0} step={placement?.bid_step ?? 10000} />
            <Button type="button" variant="outline" onClick={() => setBid((b) => b + Number(placement?.bid_step ?? 10000))}>
              +{formatSum(placement?.bid_step ?? 10000)}
            </Button>
          </div>
          <div className="flex gap-2">
            {[7, 14, 30, 90].map((d) => (
              <Button key={d} type="button" size="sm" variant={days === d ? "default" : "outline"} onClick={() => setDays(d)}>
                {d} kun
              </Button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <Checkbox checked={autoRenew} onCheckedChange={(v) => setAutoRenew(Boolean(v))} />
            Muddat tugagach avtomatik davom ettirish
          </label>
          <Button type="button" variant="secondary" onClick={askAi} disabled={adviceBusy} className="w-full">
            {adviceBusy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            AI: qaysi TOP o'rin foydaliroq?
          </Button>
          {advice ? <p className="text-sm text-foreground whitespace-pre-wrap rounded-xl bg-muted/40 p-3">{advice}</p> : null}
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 mb-5">
          <label className="flex items-start gap-2 text-sm text-muted-foreground">
            <Checkbox checked={accepted} onCheckedChange={(v) => setAccepted(Boolean(v))} className="mt-0.5" />
            <span>
              <ShieldCheck className="w-3.5 h-3.5 inline mr-1 text-primary" />
              Tibbiy reklama qoidalari va{" "}
              <Link to="/terms" className="text-primary underline">foydalanish shartlari</Link>ni qabul qilaman. Reklama moderatsiyadan
              o'tmasa, to'lov qaytariladi.
            </span>
          </label>
        </div>

        <Button onClick={submit} disabled={busy} size="lg" className="w-full">
          {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wallet className="w-4 h-4 mr-2" />}
          To'lovga o'tish — {formatSum(bid)} <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
        <p className="text-xs text-muted-foreground mt-3 text-center">
          CREATE → PAYMENT → CONFIRMATION → MODERATION → PUBLISH
        </p>
        <Badge variant="outline" className="mt-4 mx-auto block w-fit">Click · Payme · Uzum Bank</Badge>
      </main>

      <Footer />
    </div>
  );
};

export default Med1TopCreatePage;
