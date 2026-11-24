import { useSecureScreen } from '@/lib/secureScreen';
import { publicOrigin } from "@/lib/nativeApp";
import { useEffect, useState } from 'react';
import { CheckCircle2, Copy, Download, Eye, EyeOff, Gift, Loader2, QrCode, ReceiptText, ScanLine, Send, ShieldCheck, UserCheck, WalletCards } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PaymentMethodPicker from '@/components/payments/PaymentMethodPicker';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import QRCode from 'qrcode';
import { downloadPaymentReceipt } from '@/utils/downloadPaymentReceipt';
import { buildCardQrPayload } from '@/lib/cardQr';
import { CardQrScannerDialog } from './CardQrScannerDialog';
import WalletCoinPurchase from './WalletCoinPurchase';
type TxMeta={from_name?:string;to_name?:string;from_card_last4?:string;to_card_last4?:string;note?:string};
type Tx={id:string;payment_id:string|null;kind:string;amount:number;balance_after:number;description:string;created_at:string;provider:string|null;metadata?:TxMeta|null};
const sums=[50000,100000,250000,500000];
const KIND:Record<string,string>={topup:'Hamyon to‘ldirildi',payment:'Xizmat uchun to‘lov',refund:'Qaytarish',adjustment:'Tuzatish',transfer_in:'Kartaga o‘tkazma keldi',transfer_out:'Kartaga o‘tkazma yuborildi'};
const PLUS=['topup','refund','transfer_in'];
const ERR:Record<string,string>={invalid_card:'Karta raqami 16 raqamdan iborat bo‘lishi kerak',not_found:'Bunday Med ALL kartasi topilmadi',self:'O‘z kartangizga o‘tkazib bo‘lmaydi',insufficient_balance:'Balans yetarli emas',invalid_amount:'Summa 1 000 – 50 000 000 so‘m oralig‘ida bo‘lsin'};

function Transfer({initial,senderName,onOpenScanner,onDone}:{initial:string;senderName:string;onOpenScanner:()=>void;onDone:()=>void}){
  const [to,setTo]=useState(initial);
  const [amt,setAmt]=useState(10000);
  const [note,setNote]=useState('');
  const [lookup,setLookup]=useState<{status:'idle'|'loading'|'ok'|'error';name:string;last4?:string}>({status:'idle',name:''});
  const [busy,setBusy]=useState(false);
  const clean=to.replace(/\D/g,'').slice(0,16);

  useEffect(()=>{if(initial)setTo(initial)},[initial]);

  useEffect(()=>{
    if(clean.length!==16){setLookup({status:'idle',name:''});return;}
    let alive=true;
    setLookup({status:'loading',name:''});
    void (supabase as any).rpc('cash_wallet_lookup_card',{_card:clean}).then(({data,error}:any)=>{
      if(!alive)return;
      if(!error&&data?.ok){
        setLookup({status:'ok',name:String(data.name||'Med ALL foydalanuvchisi'),last4:data.card_last4});
      }else{
        setLookup({status:'error',name:ERR[data?.error]??'Karta topilmadi'});
      }
    });
    return()=>{alive=false};
  },[clean]);

  const send=async()=>{
    if(lookup.status!=='ok')return;
    setBusy(true);
    const {data,error}=await (supabase as any).rpc('cash_wallet_transfer',{_to_card:clean,_amount:Math.round(amt),_idempotency_key:`p2p-${crypto.randomUUID()}`,_note:note});
    setBusy(false);
    if(error||!data?.ok){toast.error(ERR[data?.error]??'O‘tkazma bajarilmadi');return}
    toast.success(`${data.recipient_name||lookup.name} kartasiga ${Math.round(amt).toLocaleString('uz-UZ')} so‘m yuborildi`);
    onDone();
  };

  return (
    <section className="space-y-3 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-bold"><Send className="h-4 w-4"/>Kartaga o‘tkazma</h2>
        <Button type="button" variant="outline" size="sm" onClick={onOpenScanner}><ScanLine className="h-4 w-4"/>QR skaner</Button>
      </div>
      {senderName&&<p className="text-xs text-muted-foreground">O‘tkazuvchi: <span className="font-medium text-foreground">{senderName}</span></p>}
      <Input inputMode="numeric" placeholder="Qabul qiluvchi karta: 7700 ...." value={clean.replace(/(\d{4})(?=\d)/g,'$1 ')} onChange={e=>setTo(e.target.value)} aria-label="Qabul qiluvchi karta raqami"/>
      {lookup.status==='loading'&&<p className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin"/>Karta egasi aniqlanmoqda…</p>}
      {lookup.status==='ok'&&(
        <div className="flex items-center gap-2 rounded-md border border-primary/25 bg-primary/5 px-3 py-2 text-sm">
          <UserCheck className="h-4 w-4 shrink-0 text-primary"/>
          <span>Qabul qiluvchi: <b className="text-foreground">{lookup.name}</b> <span className="text-xs text-muted-foreground">(•••• {lookup.last4??clean.slice(12)})</span></span>
        </div>
      )}
      {lookup.status==='error'&&<p role="alert" className="text-sm text-destructive">{lookup.name}</p>}
      <Input type="number" min={1000} value={amt} onChange={e=>setAmt(Number(e.target.value))} aria-label="O‘tkazma summasi"/>
      <Input maxLength={120} placeholder="Izoh (ixtiyoriy)" value={note} onChange={e=>setNote(e.target.value)}/>
      <Button className="w-full" disabled={busy||lookup.status!=='ok'||amt<1000} onClick={()=>void send()}>{busy&&<Loader2 className="animate-spin"/>}Yuborish</Button>
      <p className="text-xs text-muted-foreground">Faqat Med ALL avans kartalari orasida, darhol va komissiyasiz.</p>
    </section>
  );
}

function CardQr({card,size=220,className='h-20 w-20'}:{card:string;size?:number;className?:string}){
  const [src,setSrc]=useState('');
  useEffect(()=>{void QRCode.toDataURL(buildCardQrPayload(card,publicOrigin()),{margin:1,width:size}).then(setSrc)},[card,size]);
  return src?<img src={src} alt="Karta QR kodi — skanerlab o‘tkazma qilish" className={`${className} rounded-md bg-background p-1.5`}/>:null;
}

export default function CashWalletPanel(){
  useSecureScreen();
  const initialPay=typeof window!=='undefined'?(new URLSearchParams(window.location.search).get('pay')??'').replace(/\D/g,'').slice(0,16):'';
  const [targetCard,setTargetCard]=useState(initialPay);
  const [send,setSend]=useState(!!initialPay);
  const [qrOpen,setQrOpen]=useState(false);
  const [scanOpen,setScanOpen]=useState(false);
  const {user,profile}=useAuth();
  const ownerName=(profile?.full_name||user?.user_metadata?.full_name||user?.user_metadata?.name||'').trim();
  const [balance,setBalance]=useState(0);
  const [txs,setTxs]=useState<Tx[]>([]);
  const [loading,setLoading]=useState(true);
  const [hidden,setHidden]=useState(false);
  const [amount,setAmount]=useState(100000);
  const [pay,setPay]=useState(false);
  const [card,setCard]=useState('');
  const [bonus,setBonus]=useState({credits:0,months:0,ai:0});
  const [reload,setReload]=useState(0);
  const [rate,setRate]=useState(0);
  const [conv,setConv]=useState(false);
  const [convAmt,setConvAmt]=useState(0);
  const [converting,setConverting]=useState(false);

  useEffect(()=>{const f=()=>setReload(n=>n+1);window.addEventListener('med1:checkout-closed',f);return()=>window.removeEventListener('med1:checkout-closed',f)},[]);
  useEffect(()=>{void (supabase as any).rpc('get_credit_to_uzs_rate').then(({data}:any)=>setRate(Number(data??0)))},[]);

  const convert=async()=>{
    if(convAmt<1||convAmt>bonus.credits)return;
    setConverting(true);
    const {data,error}=await (supabase as any).rpc('convert_referral_credits_to_cash',{_credits:Math.floor(convAmt),_idempotency_key:`conv-${crypto.randomUUID()}`});
    setConverting(false);
    if(error||!data?.ok){toast.error(data?.error==='insufficient_credits'?'Bonus yetarli emas':'Aylantirib bo‘lmadi');return}
    toast.success(`${Number(data.added).toLocaleString('uz-UZ')} so‘m kartaga tushdi`);
    setConv(false);setReload(n=>n+1);
  };

  useEffect(()=>{
    if(!user)return;
    let alive=true;
    (async()=>{
      setLoading(n=>reload===0?true:n);
      const [w,t,r]=await Promise.all([
        (supabase as any).rpc('ensure_my_cash_wallet'),
        supabase.from('cash_wallet_transactions').select('id,payment_id,kind,amount,balance_after,description,created_at,provider,metadata').eq('user_id',user.id).order('created_at',{ascending:false}).limit(30),
        (supabase as any).from('referral_wallet').select('credits_balance,months_balance,ai_credits_balance').eq('owner_id',user.id).maybeSingle(),
      ]);
      if(alive){
        const wd=Array.isArray(w.data)?w.data[0]:w.data;
        setBalance(Number(wd?.balance??0));
        setCard(wd?.card_number??'');
        setBonus({credits:Number(r.data?.credits_balance??0),months:Number(r.data?.months_balance??0),ai:Number(r.data?.ai_credits_balance??0)});
        setTxs((t.data??[]) as Tx[]);
        setLoading(false);
      }
    })();
    return()=>{alive=false};
  },[user,reload]);

  const handleQrScanned=(scannedCard:string)=>{
    setTargetCard(scannedCard);
    setSend(true);
    toast.success('Karta QR kodi o‘qildi');
  };

  const formatTxParty=(t:Tx)=>{
    const m=t.metadata;
    if(t.kind==='transfer_out'&&m?.to_name)return `Kimga: ${m.to_name}${m.to_card_last4?` (•••• ${m.to_card_last4})`:''}`;
    if(t.kind==='transfer_in'&&m?.from_name)return `Kimdan: ${m.from_name}${m.from_card_last4?` (•••• ${m.from_card_last4})`:''}`;
    return null;
  };

  if(loading)return <div className="flex justify-center py-16" role="status"><Loader2 className="animate-spin"/></div>;

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-lg bg-primary p-5 text-primary-foreground shadow-card">
        <div className="absolute inset-0 bg-grid-tech opacity-10"/>
        <div className="relative">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs opacity-75">Med ALL avans kartasi</p>
              {ownerName&&<p className="mt-0.5 text-sm font-semibold">{ownerName}</p>}
              <p className="mt-2 text-3xl font-bold">{hidden?'••••••':balance.toLocaleString('uz-UZ')} <span className="text-base">so‘m</span></p>
            </div>
            <Button variant="secondary" size="icon" onClick={()=>setHidden(v=>!v)} aria-label={hidden?'Balansni ko‘rsatish':'Balansni yashirish'}>{hidden?<Eye/>:<EyeOff/>}</Button>
          </div>
          {card&&(
            <div className="mt-5 flex items-center justify-between gap-2">
              <p className="font-mono text-lg tracking-widest" aria-label="Karta raqami">{hidden?`•••• •••• •••• ${card.slice(12)}`:card.replace(/(\d{4})(?=\d)/g,'$1 ')}</p>
              <div className="flex items-center gap-1.5">
                <Button variant="secondary" size="icon" aria-label="Mening karta QR kodim" onClick={()=>setQrOpen(true)}><QrCode/></Button>
                <Button variant="secondary" size="icon" aria-label="Karta raqamini nusxalash" onClick={()=>{void navigator.clipboard?.writeText(card);toast.success('Karta raqami nusxalandi')}}><Copy/></Button>
              </div>
            </div>
          )}
          <p className="mt-4 flex items-center gap-2 text-xs"><ShieldCheck className="h-4 w-4"/>Faqat tasdiqlangan to‘lov balansga tushadi</p>
        </div>
      </section>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Button onClick={()=>setPay(v=>!v)}><WalletCards/>{pay?'Yopish':'To‘ldirish'}</Button>
        <Button variant="outline" onClick={()=>setSend(v=>!v)}><Send/>O‘tkazma</Button>
        <Button variant="outline" onClick={()=>setScanOpen(true)}><ScanLine/>QR skaner</Button>
        <Button variant="outline" onClick={()=>setQrOpen(true)}><QrCode/>Mening QR</Button>
      </div>

      {send&&<Transfer initial={targetCard} senderName={ownerName} onOpenScanner={()=>setScanOpen(true)} onDone={()=>{setSend(false);setTargetCard('');setReload(n=>n+1)}}/>}

      {pay&&(
        <section className="space-y-4 rounded-lg border border-border bg-card p-4">
          <h2 className="font-bold">Balansni to‘ldirish</h2>
          <div className="grid grid-cols-2 gap-2">{sums.map(s=><Button key={s} variant={amount===s?'default':'outline'} onClick={()=>setAmount(s)}>{s.toLocaleString('uz-UZ')} so‘m</Button>)}</div>
          <Input type="number" min={10000} max={100000000} value={amount} onChange={e=>setAmount(Number(e.target.value))} aria-label="To‘ldirish summasi"/>
          <PaymentMethodPicker amount={amount} purpose="cash_wallet_topup" referenceId={`wallet-${user?.id}`} returnUrl={`${publicOrigin()}${window.location.pathname.startsWith("/click")?"/click/profile":"/mobile-profile"}?section=cash_wallet`} allowed={['click','payme']}/>
        </section>
      )}

      <Link to="/mobile-profile?section=referral" className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-3"><Gift className="text-primary"/><div><p className="font-semibold">Referral bonuslari</p><p className="text-xs text-muted-foreground">{bonus.credits.toLocaleString('uz-UZ')} credits · {bonus.months} oy · {bonus.ai.toLocaleString('uz-UZ')} AI</p></div></div>
        <span className="text-sm text-primary">Batafsil</span>
      </Link>

      <section className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-3">
          <div><p className="font-semibold">Bonusni so‘mga aylantirish</p><p className="text-xs text-muted-foreground">1 credit = {rate.toLocaleString('uz-UZ')} so‘m · mavjud {bonus.credits.toLocaleString('uz-UZ')} credit</p></div>
          <Button size="sm" disabled={bonus.credits<1||!rate} onClick={()=>{setConvAmt(Math.floor(bonus.credits));setConv(v=>!v)}}>{conv?'Yopish':'Aylantirish'}</Button>
        </div>
        {conv&&(
          <div className="mt-3 space-y-2">
            <Input type="number" min={1} max={Math.floor(bonus.credits)} value={convAmt} onChange={e=>setConvAmt(Number(e.target.value))} aria-label="Aylantiriladigan credit soni"/>
            <p className="text-sm">Kartaga tushadi: <b>{(Math.max(0,Math.floor(convAmt))*rate).toLocaleString('uz-UZ')} so‘m</b></p>
            <Button className="w-full" disabled={converting||convAmt<1||convAmt>bonus.credits} onClick={()=>void convert()}>{converting&&<Loader2 className="animate-spin"/>}Tasdiqlash</Button>
          </div>
        )}
      </section>

      <WalletCoinPurchase balance={balance} onPurchased={()=>setReload(n=>n+1)}/>

      <section>
        <h2 className="mb-3 flex items-center gap-2 font-bold"><ReceiptText/>Kirim va chiqimlar</h2>
        {txs.length?(
          <div className="divide-y divide-border rounded-lg border border-border bg-card">
            {txs.map(t=>{
              const party=formatTxParty(t);
              return (
                <article key={t.id} className="flex items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{party||t.description||(KIND[t.kind]??t.kind)}</p>
                    {party&&t.metadata?.note&&<p className="text-xs text-muted-foreground truncate">Izoh: {t.metadata.note}</p>}
                    <p className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString('uz-UZ')} {t.provider?`· ${t.provider}`:''}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <p className={`font-bold ${PLUS.includes(t.kind)?'text-medical-green':'text-foreground'}`}>{PLUS.includes(t.kind)?'+':'−'}{Number(t.amount).toLocaleString('uz-UZ')}</p>
                      <p className="text-[11px] text-muted-foreground">{Number(t.balance_after).toLocaleString('uz-UZ')} so‘m</p>
                    </div>
                    <Button variant="ghost" size="icon" aria-label="Chekni yuklab olish" onClick={()=>void downloadPaymentReceipt({paymentId:t.payment_id??t.id,amount:Number(t.amount),currency:'UZS',purpose:'cash_wallet_'+t.kind,purposeLabel:KIND[t.kind]??t.kind,provider:t.provider??'med_all',referenceId:card?`•••• ${card.slice(12)}`:null,paidAt:new Date(t.created_at),payerName:ownerName||user?.user_metadata?.full_name,payerEmail:user?.email,serviceName:party||t.description||KIND[t.kind],billingCycle:'one_time',format:'both'})}><Download/></Button>
                  </div>
                </article>
              );
            })}
          </div>
        ):(
          <div className="rounded-lg border border-dashed border-border p-8 text-center">
            <ReceiptText className="mx-auto text-muted-foreground"/>
            <p className="mt-2 font-semibold">Hali operatsiya yo‘q</p>
            <p className="mt-1 text-sm text-muted-foreground">Birinchi to‘ldirishdan keyin tarix shu yerda ko‘rinadi.</p>
          </div>
        )}
      </section>

      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <DialogTitle>Mening avans karta QR kodim</DialogTitle>
          </DialogHeader>
          {card&&(
            <div className="flex flex-col items-center gap-3 py-2">
              <CardQr card={card} size={240} className="h-56 w-56 border border-border"/>
              {ownerName&&<p className="flex items-center gap-1.5 font-semibold text-foreground"><CheckCircle2 className="h-4 w-4 text-primary"/>{ownerName}</p>}
              <p className="font-mono text-sm tracking-widest text-muted-foreground">{card.replace(/(\d{4})(?=\d)/g,'$1 ')}</p>
              <p className="text-xs text-muted-foreground">Boshqa foydalanuvchi o‘z avans kartasidagi “QR skaner” tugmasi orqali ushbu kodni skanerlab sizga darhol pul o‘tkaza oladi.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <CardQrScannerDialog open={scanOpen} onOpenChange={setScanOpen} onScanned={handleQrScanned}/>
    </div>
  );
}
