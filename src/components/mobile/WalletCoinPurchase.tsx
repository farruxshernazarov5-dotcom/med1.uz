import { useEffect, useRef, useState } from 'react';
import { Coins, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useCredits } from '@/hooks/useCredits';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

type Package = { code: string; name_uz: string; price: number; coin_amount: number; bonus_coins: number; duration_days: number };
export default function WalletCoinPurchase({ balance, onPurchased }: { balance: number; onPurchased: () => void }) {
  const [packages, setPackages] = useState<Package[]>([]);
  const [selected, setSelected] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [complete, setComplete] = useState<number | null>(null);
  const key = useRef(crypto.randomUUID());
  const { refetch } = useCredits();
  useEffect(() => {
    let alive = true;
    void supabase.from('payment_packages').select('code,name_uz,price,coin_amount,bonus_coins,duration_days').eq('is_active', true).eq('kind', 'med_coin').order('sort_order').then(({ data, error }) => {
      if (!alive) return;
      setPackages(data ?? []); setError(!!error); setLoading(false);
    });
    return () => { alive = false; };
  }, []);
  const pkg = packages.find(p => p.code === selected);
  const buy = async () => {
    if (!pkg || busy) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.rpc('purchase_medcoin_from_wallet', { _package_code: pkg.code, _idempotency_key: key.current });
      const result = data as { ok?: boolean; error?: string; coins?: number } | null;
      if (error || !result?.ok) throw new Error(result?.error === 'insufficient_balance' ? 'Avans kartangizda mablag‘ yetarli emas' : 'Xarid tasdiqlanmadi. Qayta tekshirib ko‘ring');
      setComplete(result.coins ?? pkg.coin_amount + pkg.bonus_coins);
      refetch(); onPurchased(); key.current = crypto.randomUUID();
      toast.success('Med Coin hisobingizga tushdi');
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Xarid bajarilmadi'); }
    finally { setBusy(false); }
  };
  return <section className="space-y-3 rounded-lg border border-border bg-card p-4">
    <h2 className="flex items-center gap-2 font-bold"><Coins className="h-5 w-5 text-primary" />Avans kartadan Med Coin</h2>
    {loading ? <Loader2 className="animate-spin" /> : error ? <p role="alert" className="text-sm text-destructive">Paketlar yuklanmadi. Sahifani qayta oching.</p> : <div className="grid gap-2 sm:grid-cols-3">{packages.map(p => <Button key={p.code} variant={selected === p.code ? 'default' : 'outline'} disabled={busy} className="h-auto flex-col gap-1 p-3" onClick={() => { setSelected(p.code); setComplete(null); key.current = crypto.randomUUID(); }}>
      <span className="font-bold">{p.coin_amount + p.bonus_coins} Med Coin</span><span>{Number(p.price).toLocaleString('uz-UZ')} so‘m</span><span className="text-xs">{p.duration_days} kun</span>
    </Button>)}</div>}
    {pkg && !complete && <><p className="text-sm text-muted-foreground">Avans kartadan {Number(pkg.price).toLocaleString('uz-UZ')} so‘m yechiladi.</p><Button className="w-full" disabled={busy || balance < pkg.price} onClick={() => void buy()}>{busy ? <Loader2 className="animate-spin" /> : <Coins />} {balance < pkg.price ? 'Avval avans kartani to‘ldiring' : 'Xaridni tasdiqlash'}</Button></>}
    {complete && <p role="status" className="flex items-center gap-2 text-sm"><CheckCircle2 className="text-primary" />{complete} Med Coin xarid qilindi</p>}
    <Button variant="link" asChild><Link to="/ai-services">Med Coin bilan AI xizmatlardan foydalanish</Link></Button>
  </section>;
}