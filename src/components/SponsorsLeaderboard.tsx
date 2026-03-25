import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Trophy, Star, Crown, Medal, ArrowRight, Gift, Users, TrendingUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";

const DEMO_SPONSORS = [
  { id: 1, name: "BAXODIR ****", region: "Samarqand viloyati", amount: 320000, avatar: null, rank: 1 },
  { id: 2, name: "ABRORBEK ****", region: "Toshkent shahri", amount: 305000, avatar: null, rank: 2 },
  { id: 3, name: "SARDORBEK ****", region: "Andijon viloyati", amount: 200000, avatar: null, rank: 3 },
  { id: 4, name: "ABDULXAMID ****", region: "Toshkent shahri", amount: 172000, avatar: null, rank: 4 },
  { id: 5, name: "Foydalanuvchi", region: "Samarqand viloyati", amount: 172000, avatar: null, rank: 5 },
  { id: 6, name: "FERUZA ****", region: "Toshkent shahri", amount: 165000, avatar: null, rank: 6 },
  { id: 7, name: "Anonim", region: "", amount: 101000, avatar: null, rank: 7 },
  { id: 8, name: "Anonim", region: "", amount: 100000, avatar: null, rank: 8 },
];

const QUICK_AMOUNTS = [2000, 5000, 10000, 20000, 50000, 100000];

const getRankIcon = (rank: number) => {
  if (rank === 1) return <Crown className="w-5 h-5 text-yellow-400" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-gray-300" />;
  if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
  return null;
};

const getRankBg = (rank: number) => {
  if (rank === 1) return "from-yellow-500/20 to-amber-500/10 border-yellow-500/30";
  if (rank === 2) return "from-gray-300/20 to-gray-400/10 border-gray-400/30";
  if (rank === 3) return "from-amber-600/20 to-orange-500/10 border-amber-600/30";
  return "";
};

const SponsorsLeaderboard = () => {
  const [showDonate, setShowDonate] = useState(false);
  const [amount, setAmount] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const currentMonth = new Date().toLocaleString("uz-UZ", { month: "long", year: "numeric" });
  const totalAmount = DEMO_SPONSORS.reduce((s, sp) => s + sp.amount, 0);
  const displaySponsors = showAll ? DEMO_SPONSORS : DEMO_SPONSORS.slice(0, 5);

  const handleDonate = () => {
    if (!amount || Number(amount) < 1000) {
      toast({ title: "Minimal summa 1,000 so'm", variant: "destructive" });
      return;
    }
    toast({ title: "💚 Rahmat!", description: `Sizning ${Number(amount).toLocaleString()} so'm hissangiz qabul qilindi!` });
    setShowDonate(false);
    setAmount("");
  };

  return (
    <section className="py-10 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
      <div className="absolute top-10 left-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-10 right-10 w-32 h-32 bg-secondary/5 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="container mx-auto px-4 relative">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4 animate-fade-in">
            <Heart className="w-4 h-4 animate-pulse" />
            Loyiha homiylarimiz
          </div>
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-2">
            Med1.uz ni birga <span className="text-primary">rivojlantiramiz</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm">
            Loyiha rivojiga hissa qo'shgan barcha homiylarimizga minnatdorchilik bildiramiz. 
            Sizning har bir hissangiz millionlab foydalanuvchilar uchun sifatli tibbiy xizmatlar yaratishga yordam beradi.
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8 max-w-2xl mx-auto">
          {[
            { icon: Users, label: "Homiylar", value: DEMO_SPONSORS.length, color: "text-primary" },
            { icon: TrendingUp, label: "Jami hissa", value: `${(totalAmount / 1000).toFixed(0)}K`, color: "text-emerald-500" },
            { icon: Gift, label: "Bu oy", value: currentMonth, color: "text-amber-500" },
            { icon: Star, label: "Maqsad", value: "2M so'm", color: "text-purple-500" },
          ].map((s, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-3 text-center hover:shadow-md transition-all animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
              <s.icon className={`w-5 h-5 ${s.color} mx-auto mb-1`} />
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="font-bold text-foreground text-sm">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Top 3 podium */}
        <div className="flex justify-center items-end gap-3 mb-6 max-w-lg mx-auto">
          {/* 2nd place */}
          <div className="flex flex-col items-center animate-fade-in" style={{ animationDelay: "200ms" }}>
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-200 to-gray-400 dark:from-gray-600 dark:to-gray-800 flex items-center justify-center text-xl font-bold text-white border-2 border-gray-300">
                {DEMO_SPONSORS[1].name[0]}
              </div>
              <div className="absolute -top-1 -left-1 w-6 h-6 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs font-bold border-2 border-background">2</div>
            </div>
            <p className="text-xs font-semibold text-foreground mt-2 truncate max-w-20 text-center">{DEMO_SPONSORS[1].name}</p>
            <p className="text-[10px] text-muted-foreground">{DEMO_SPONSORS[1].region}</p>
            <Badge className="mt-1 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 text-[10px]">
              {(DEMO_SPONSORS[1].amount / 1000).toFixed(0)}K
            </Badge>
          </div>

          {/* 1st place */}
          <div className="flex flex-col items-center -mt-4 animate-fade-in" style={{ animationDelay: "100ms" }}>
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-2xl font-bold text-white border-3 border-yellow-300 shadow-lg shadow-yellow-500/20 animate-pulse">
                {DEMO_SPONSORS[0].name[0]}
              </div>
              <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                <Crown className="w-6 h-6 text-yellow-400 drop-shadow-md" />
              </div>
              <div className="absolute -top-1 -left-1 w-7 h-7 rounded-full bg-yellow-500 flex items-center justify-center text-white text-sm font-bold border-2 border-background">1</div>
            </div>
            <p className="text-sm font-bold text-foreground mt-2 truncate max-w-24 text-center">{DEMO_SPONSORS[0].name}</p>
            <p className="text-[10px] text-muted-foreground">{DEMO_SPONSORS[0].region}</p>
            <Badge className="mt-1 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 text-xs font-bold">
              {(DEMO_SPONSORS[0].amount / 1000).toFixed(0)}K UZS
            </Badge>
          </div>

          {/* 3rd place */}
          <div className="flex flex-col items-center animate-fade-in" style={{ animationDelay: "300ms" }}>
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-xl font-bold text-white border-2 border-amber-400">
                {DEMO_SPONSORS[2].name[0]}
              </div>
              <div className="absolute -top-1 -left-1 w-6 h-6 rounded-full bg-amber-600 flex items-center justify-center text-white text-xs font-bold border-2 border-background">3</div>
            </div>
            <p className="text-xs font-semibold text-foreground mt-2 truncate max-w-20 text-center">{DEMO_SPONSORS[2].name}</p>
            <p className="text-[10px] text-muted-foreground">{DEMO_SPONSORS[2].region}</p>
            <Badge className="mt-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 text-[10px]">
              {(DEMO_SPONSORS[2].amount / 1000).toFixed(0)}K
            </Badge>
          </div>
        </div>

        {/* Leaderboard list */}
        <div className="max-w-xl mx-auto bg-card border border-border rounded-2xl overflow-hidden shadow-card">
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 px-5 py-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-primary" />
              <span className="font-heading font-bold text-sm text-foreground">Homiylar reytingi</span>
            </div>
            <Badge variant="secondary" className="text-[10px]">{currentMonth}</Badge>
          </div>

          <div className="divide-y divide-border">
            {displaySponsors.slice(3).map((sp, idx) => (
              <div key={sp.id} className={`flex items-center gap-3 px-5 py-3 hover:bg-muted/50 transition-colors animate-fade-in`} style={{ animationDelay: `${(idx + 4) * 80}ms` }}>
                <span className="w-6 text-center font-bold text-muted-foreground text-sm">{sp.rank}</span>
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground">
                  {sp.name === "Anonim" ? "🎭" : sp.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm truncate">{sp.name}</p>
                  {sp.region && <p className="text-[10px] text-muted-foreground">{sp.region}</p>}
                </div>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm whitespace-nowrap">
                  {sp.amount.toLocaleString()} UZS
                </span>
              </div>
            ))}
          </div>

          {!showAll && DEMO_SPONSORS.length > 5 && (
            <button onClick={() => setShowAll(true)} className="w-full py-3 text-xs text-primary font-medium hover:bg-muted/50 transition-colors border-t border-border">
              Barcha homiylarni ko'rish →
            </button>
          )}
        </div>

        {/* CTA */}
        <div className="text-center mt-8 space-y-4 animate-fade-in" style={{ animationDelay: "500ms" }}>
          <div className="bg-gradient-to-r from-primary/10 via-secondary/5 to-primary/10 rounded-2xl p-6 max-w-lg mx-auto border border-primary/20">
            <Heart className="w-10 h-10 text-primary mx-auto mb-3 animate-pulse" />
            <h3 className="font-heading font-bold text-lg text-foreground mb-2">Jamoamizga kuch qo'shing</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Qariyb <strong className="text-foreground">2 million foydalanuvchiga</strong> ega loyihamizning bir qismi 
              bo'lishingiz va uni qo'llab-quvvatlashingiz — biz uchun yuksak ishonch va cheksiz ilhom manbaidir.
            </p>
            <Button onClick={() => setShowDonate(true)} size="lg" className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/20 px-8">
              <Heart className="w-4 h-4 mr-2" /> Hissa qo'shish
            </Button>
            <p className="text-[10px] text-muted-foreground mt-3">
              Tugmani bosish bilan <Link to="/user-guide#terms" className="text-primary underline">ommaviy offerta</Link> shartlariga rozi bo'lasiz
            </p>
          </div>
        </div>
      </div>

      {/* Donate Modal */}
      <Dialog open={showDonate} onOpenChange={setShowDonate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-primary" />
              Loyihani qo'llab-quvvatlash
            </DialogTitle>
            <DialogDescription>Hissa qo'shish orqali loyiha rivojiga yordam bering</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">🎭</span>
                <Label className="text-sm">Anonim hissa qo'shish</Label>
              </div>
              <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} />
            </div>
            <div>
              <Label>Summa (so'm)</Label>
              <Input type="number" placeholder="Summa" value={amount} onChange={e => setAmount(e.target.value)} className="mt-1 text-lg" />
            </div>
            <div className="flex flex-wrap gap-2">
              {QUICK_AMOUNTS.map(a => (
                <button key={a} onClick={() => setAmount(String(a))}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                    amount === String(a) ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground hover:border-primary/30"
                  }`}>
                  {a.toLocaleString()}
                </button>
              ))}
            </div>
            <Button onClick={handleDonate} className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white" size="lg">
              <Heart className="w-4 h-4 mr-2" /> Hissa qo'shish
            </Button>
            <p className="text-[10px] text-center text-muted-foreground">
              Tugmani bosish bilan <Link to="/user-guide#terms" className="text-primary underline">ommaviy offerta</Link> shartlariga rozi bo'lasiz
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default SponsorsLeaderboard;
