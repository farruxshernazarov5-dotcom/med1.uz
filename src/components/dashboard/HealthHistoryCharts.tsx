import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Activity, TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const TRACKED_INDICATORS = [
  { key: "lab_gemoglobin", label: "Gemoglobin", unit: "g/l", color: "#ef4444" },
  { key: "lab_glyukoza", label: "Glyukoza (qand)", unit: "mmol/l", color: "#f59e0b" },
  { key: "lab_xolesterin", label: "Xolesterin", unit: "mmol/l", color: "#3b82f6" },
  { key: "lab_leykotsitlar", label: "Leykotsitlar", unit: "x10⁹/l", color: "#10b981" },
  { key: "lab_eritrotsitlar", label: "Eritrotsitlar", unit: "x10¹²/l", color: "#8b5cf6" },
];

const HealthHistoryCharts = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [selectedKey, setSelectedKey] = useState(TRACKED_INDICATORS[0].key);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchRecords = async () => {
      const { data } = await supabase
        .from("health_records")
        .select("*")
        .eq("user_id", user.id)
        .like("record_type", "lab_%")
        .order("recorded_at", { ascending: true });
      setRecords(data || []);
      setLoading(false);
    };
    fetchRecords();
  }, [user]);

  const selectedIndicator = TRACKED_INDICATORS.find(i => i.key === selectedKey) || TRACKED_INDICATORS[0];

  const chartData = records
    .filter(r => r.record_type === selectedKey)
    .map(r => {
      const val = typeof r.value === "object" && r.value !== null ? (r.value as any).numericValue : null;
      return {
        date: new Date(r.recorded_at).toLocaleDateString("uz-UZ", { day: "2-digit", month: "short" }),
        value: val,
        status: typeof r.value === "object" && r.value !== null ? (r.value as any).status : "normal",
      };
    })
    .filter(d => d.value !== null);

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground text-sm">Yuklanmoqda...</div>;
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-5">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h3 className="font-heading font-bold text-foreground text-sm">Sog'liq ko'rsatkichlari dinamikasi</h3>
      </div>

      {/* Indicator selector */}
      <div className="flex gap-1 overflow-x-auto pb-2 mb-4 scrollbar-none">
        {TRACKED_INDICATORS.map(ind => {
          const count = records.filter(r => r.record_type === ind.key).length;
          return (
            <button
              key={ind.key}
              onClick={() => setSelectedKey(ind.key)}
              className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap font-medium transition-colors ${selectedKey === ind.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
            >
              {ind.label} {count > 0 && `(${count})`}
            </button>
          );
        })}
      </div>

      {chartData.length === 0 ? (
        <div className="text-center py-10 bg-muted/30 rounded-xl">
          <Activity className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Hali {selectedIndicator.label} bo'yicha ma'lumot yo'q</p>
          <p className="text-xs text-muted-foreground/60 mt-1">AI analiz tahlili orqali natijalarni saqlang</p>
        </div>
      ) : (
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} unit={` ${selectedIndicator.unit}`} width={80} />
              <Tooltip
                formatter={(value: number) => [`${value} ${selectedIndicator.unit}`, selectedIndicator.label]}
                contentStyle={{ borderRadius: 12, fontSize: 12 }}
              />
              <Line type="monotone" dataKey="value" stroke={selectedIndicator.color} strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default HealthHistoryCharts;
