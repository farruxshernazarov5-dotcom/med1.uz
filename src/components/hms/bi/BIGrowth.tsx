import { BIMetrics } from "@/lib/clinicBIMetrics";
import { fmtMoney } from "@/lib/clinicBI";
import { Megaphone, Share2, Smile, Sparkles } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Progress } from "@/components/ui/progress";

const COLORS = ["hsl(214,84%,56%)", "hsl(145,63%,42%)", "hsl(32,87%,52%)", "hsl(250,100%,69%)", "hsl(0,72%,55%)", "hsl(180,60%,45%)"];

const Card = ({ title, icon: Icon, children }: any) => (
  <div className="rounded-2xl border border-border bg-card/70 backdrop-blur-xl p-4">
    <h3 className="font-heading font-bold text-sm mb-3 flex items-center gap-2"><Icon className="w-4 h-4 text-primary" />{title}</h3>
    {children}
  </div>
);

const Stat = ({ label, value }: { label: string; value: any }) => (
  <div className="rounded-xl border border-border px-3 py-2">
    <p className="text-[10px] text-muted-foreground">{label}</p>
    <p className="text-sm font-bold">{value}</p>
  </div>
);

const BIGrowth = ({ m, referrals }: { m: BIMetrics; referrals: { total: number; converted: number; revenue: number } }) => {
  const cpa = m.marketing.conversions ? m.grossRevenue / m.marketing.conversions : 0;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Marketing analytics" icon={Megaphone}>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <Stat label="Ko'rsatishlar" value={m.marketing.impressions.toLocaleString()} />
            <Stat label="Kliklar" value={m.marketing.clicks.toLocaleString()} />
            <Stat label="Konversiyalar" value={m.marketing.conversions} />
            <Stat label="CTR" value={`${m.marketing.ctr}%`} />
          </div>
          <p className="text-[11px] text-muted-foreground">
            ROI ko'rsatkichi: 1 ta yangi bemordan o'rtacha <strong>{fmtMoney(cpa)} so'm</strong> daromad.
          </p>
        </Card>

        <Card title="Bemor kanallari" icon={Share2}>
          {m.channels.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={m.channels} dataKey="value" nameKey="name" innerRadius={45} outerRadius={85} label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {m.channels.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-xs text-muted-foreground py-8 text-center">Kanal ma'lumoti yo'q</p>}
        </Card>

        <Card title="Referral analytics" icon={Share2}>
          <div className="grid grid-cols-3 gap-2">
            <Stat label="Referrallar" value={referrals.total} />
            <Stat label="Konversiya" value={referrals.total ? `${Math.round((referrals.converted / referrals.total) * 100)}%` : "0%"} />
            <Stat label="Referral daromadi" value={fmtMoney(referrals.revenue)} />
          </div>
        </Card>

        <Card title="Customer satisfaction" icon={Smile}>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <Stat label="Umumiy reyting" value={`${m.satisfaction.avg} ★`} />
            <Stat label="NPS" value={m.satisfaction.nps} />
            <Stat label="Ijobiy sharhlar" value={m.satisfaction.positive} />
            <Stat label="Salbiy sharhlar" value={m.satisfaction.negative} />
            <Stat label="Shikoyatlar" value={m.satisfaction.complaints} />
            <Stat label="Jami sharh" value={m.satisfaction.total} />
          </div>
          <div className="space-y-2">
            {m.doctorRows.filter((d) => d.reviews > 0).slice(0, 5).map((d) => (
              <div key={d.id}>
                <div className="flex justify-between text-[11px]"><span className="truncate">{d.name}</span><span className="font-bold">{d.rating} ★</span></div>
                <Progress value={(d.rating / 5) * 100} className="h-1.5" />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="AI xizmatlari analitikasi" icon={Sparkles}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
          <Stat label="AI so'rovlar" value={m.ai.requests} />
          <Stat label="Med Coin sarfi" value={m.ai.credits} />
          <Stat label="Eng ko'p ishlatilgan" value={m.ai.topService} />
          <Stat label="Xatolar" value={m.ai.errors} />
        </div>
        {m.ai.requests > 0 && (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={[{ name: "AI so'rovlar", value: m.ai.requests }, { name: "Med Coin", value: m.ai.credits }, { name: "Xatolar", value: m.ai.errors }]}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="value" fill="hsl(250,100%,69%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  );
};

export default BIGrowth;
