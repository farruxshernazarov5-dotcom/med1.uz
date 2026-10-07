import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ChevronRight, CircleHelp, Coins, Crown, LogOut, User, Sun, Moon, Check, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCredits } from '@/hooks/useCredits';
import { useAiAccess } from '@/hooks/useAiAccess';
import { useLanguage, LANGUAGE_LABELS } from '@/hooks/useLanguage';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { MOBILE_PROFILE_MENUS, profileTitle, type ProfileMenu } from '@/data/mobileProfileCatalog';
import { MobileProfileStory } from '@/components/mobile/MobileProfileStory';
import { getDashboardPath } from '@/lib/dashboard';
import { hapticTap } from '@/lib/nativeApp';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
const Security = lazy(()=>import('@/components/mobile/MobileProfileSecurity'));
const ProfileEditor = lazy(()=>import('@/components/dashboard/PatientProfileEditor'));
const Family = lazy(()=>import('@/components/patient/hms/PatientFamily'));
const Health = lazy(()=>import('@/components/dashboard/PatientHealth'));
const Tracking = lazy(()=>import('@/components/patient/hms/PatientHealthTracking'));
const Recommendations = lazy(()=>import('@/components/patient/PatientRecommendations'));
const Documents = lazy(()=>import('@/components/dashboard/PatientDocuments'));
const Files = lazy(()=>import('@/components/patient/hms/PatientFiles'));
const Legal = lazy(()=>import('@/components/patient/hms/PatientLegalCenter'));
const Wallet = lazy(()=>import('@/components/patient/wallet/MedCoinWallet'));
const Payments = lazy(()=>import('@/components/patient/hms/PatientPayments'));
const Support = lazy(()=>import('@/components/support/SupportChat'));
const Sponsors = lazy(()=>import('@/components/SponsorsLeaderboard'));
const Reminders = lazy(()=>import('@/components/mobile/NativeHealthSettings').then(m=>({default:m.NativeHealthSettings})));
const Biometric = lazy(()=>import('@/components/mobile/BiometricGate').then(m=>({default:m.BiometricGate})));
const groups = { account:['Hisob','Аккаунт','Account'], health:['Salomatlik va oila','Здоровье и семья','Health and family'], finance:['Hamyon','Кошелёк','Wallet'], app:['Ilova','Приложение','App'], help:['Yordam va loyiha','Помощь и проект','Help and project'] };
const SEEN='med1_profile_guide_v1';
export default function MobileProfilePage() {
 const {user,profile,userRole,signOut,loading}=useAuth(); const {balance,packageTier}=useCredits(); const {access}=useAiAccess(); const {lang,setLanguage}=useLanguage(); const {theme,setTheme}=useTheme();
 const [params,setParams]=useSearchParams(); const navigate=useNavigate(); const [story,setStory]=useState<ProfileMenu|null>(null); const [exiting,setExiting]=useState(false);
 const selected=MOBILE_PROFILE_MENUS.find(m=>m.id===params.get('section')); const detail=params.get('detail');
 const tier=access?.tier&&access.tier!=='free'?access.tier:packageTier; const idx=lang==='ru'?1:lang==='en'?2:0;
 const tr=(uz:string,ru:string,en:string)=>[uz,ru,en][idx];
 useEffect(()=> { if(!selected) return; try {if(!localStorage.getItem(`${SEEN}_${selected.id}`)) setStory(selected);}catch{} },[selected?.id]);
 const closeStory=()=>{if(story)try{localStorage.setItem(`${SEEN}_${story.id}`,'1');}catch{} setStory(null);};
 const open=(m:ProfileMenu)=>{void hapticTap();setParams({section:m.id});};
 const link=(title:string,path:string)=> <Button asChild variant="outline" className="h-auto min-h-12 w-full justify-between whitespace-normal text-left"><Link to={path}>{title}<ChevronRight className="shrink-0"/></Link></Button>;
 const authPath=(mode='login')=>`/auth?mode=${mode}&next=${encodeURIComponent('/mobile-profile'+(selected?`?section=${selected.id}`:''))}`;
 const sub=(title:string,id:string)=> <Button variant={detail===id?'default':'outline'} onClick={()=>setParams({section:selected?.id??'',detail:id})}>{title}</Button>;
 const render=()=> {
 if(!selected)return null;
 if(selected.private&&!user)return <div className="py-10 text-center"><User className="mx-auto mb-4 h-12 w-12 text-muted-foreground"/><h2 className="text-xl font-bold">{tr('Hisobingizga kiring','Войдите в аккаунт','Sign in to your account')}</h2><p className="my-4 text-sm text-muted-foreground">{tr('Shaxsiy ma’lumotlar faqat hisobingizda ochiladi.','Личные данные доступны только в вашем аккаунте.','Personal records are only available in your account.')}</p>{link(tr('Kirish','Войти','Sign in'),authPath())}<div className="mt-3">{link(tr('Ro‘yxatdan o‘tish','Регистрация','Sign up'),authPath('register'))}</div></div>;
 switch(selected.id) {
 case 'cabinet':return detail==='edit'?<ProfileEditor/>:<div className="space-y-3">{link(tr('Shaxsiy kabinetni ochish','Открыть кабинет','Open my cabinet'),getDashboardPath(userRole))}<Button variant="outline" onClick={()=>setParams({section:'cabinet',detail:'edit'})} className="w-full">{tr('Profilni tahrirlash','Редактировать профиль','Edit profile')}</Button>{link(tr('Qabullar va natijalar','Приёмы и результаты','Appointments and results'),'/mobile-appointments')}</div>;
 case 'security':return <Security/>;
 case 'settings':return <div className="space-y-6"><section><h2 className="mb-3 font-bold">{tr('Ko‘rinish','Оформление','Appearance')}</h2><div className="grid grid-cols-2 gap-3">{[['light',Sun,tr('Kunduz','Светлая','Light')],['dark',Moon,tr('Tun','Тёмная','Dark')]].map(([value,Icon,title])=>{const ThemeIcon=Icon as typeof Sun;return <Button key={String(value)} variant={theme===value?'default':'outline'} aria-pressed={theme===value} onClick={()=>setTheme(String(value))}><ThemeIcon/>{String(title)}</Button>;})}</div></section>{link(tr('Tilni tanlash','Выбрать язык','Choose language'),'/mobile-profile?section=language')}{link(tr('Dori va qabul eslatmalari','Напоминания','Reminders'),'/mobile-profile?section=notifications')}{user&&link(tr('Profilni tahrirlash','Редактировать профиль','Edit profile'),'/mobile-profile?section=cabinet&detail=edit')}</div>;
 case 'language':return <div className="space-y-3">{(['uz','ru','en'] as const).map(l=><Button key={l} variant={l===lang?'default':'outline'} className="h-14 w-full justify-between" aria-pressed={l===lang} onClick={()=>setLanguage(l)}><span>{LANGUAGE_LABELS[l].flag} {LANGUAGE_LABELS[l].label}</span>{l===lang&&<Check/>}</Button>)}</div>;
 case 'auth':case 'register':return <div className="space-y-3">{link(tr('Email / Google / Microsoft / Telegram','Email / Google / Microsoft / Telegram','Email / Google / Microsoft / Telegram'),authPath(selected.id==='register'?'register':'login'))}{link(tr('Parolni tiklash','Восстановить пароль','Reset password'),'/forgot-password')}</div>;
 case 'documents':return <><div className="mb-5 flex flex-wrap gap-2">{sub(tr('Hujjatlar','Документы','Documents'),'documents')}{sub(tr('Fayllar','Файлы','Files'),'files')}{sub(tr('Huquqiy','Правовые','Legal'),'legal')}</div><Biometric>{detail==='files'?<Files/>:detail==='legal'?<Legal/>:<Documents/>}</Biometric><div className="mt-5">{link(tr('Hujjatni tekshirish','Проверить документ','Verify document'),'/verify')}</div></>;
 case 'health':return <><div className="mb-5 flex flex-wrap gap-2">{sub(tr('BMI / Bosim','ИМТ / Давление','BMI / Pressure'),'health')}{sub(tr('Monitoring','Мониторинг','Tracking'),'tracking')}{sub(tr('Tavsiyalar','Рекомендации','Recommendations'),'recommendations')}</div><Biometric>{detail==='tracking'?<Tracking/>:detail==='recommendations'?<Recommendations/>:<Health/>}</Biometric></>;
 case 'family':return <Biometric><Family/></Biometric>;
 case 'coins':return <><Wallet/><div className="mt-4">{link(tr('Tariflar va Med Coin','Тарифы и Med Coin','Plans and Med Coin'),'/ai-subscription')}</div></>;
 case 'payments':return <Payments/>;
 case 'notifications':return <Reminders/>;
 case 'favorites':return link(tr('Sevimli klinika, shifokor va xizmatlar','Избранные клиники, врачи и услуги','Favourite clinics, doctors and services'),'/mobile-services?view=favorites');
 case 'support':return user?<Support/>:link(tr('Biz bilan bog‘lanish','Связаться с нами','Contact us'),'/contact');
 case 'sponsors':return <Sponsors/>;
 case 'help':return <div className="space-y-3">{link(tr('Foydalanish qo‘llanmasi','Руководство','User guide'),'/user-guide')}{link(tr('Foydali maslahatlar','Полезные советы','Useful tips'),'/mobile-tips')}{link(tr('Jonli yordam','Поддержка','Live support'),'/mobile-profile?section=support')}{link(tr('Bog‘lanish','Контакты','Contact'),'/contact')}</div>;
 case 'about':return <div className="space-y-3"><h2 className="text-2xl font-bold">Med ALL</h2><p className="text-sm text-muted-foreground">Med1.uz</p>{link(tr('Loyiha haqida','О проекте','About the project'),'/about')}{link(tr('Foydalanish shartlari','Условия использования','Terms'),'/terms')}{link(tr('Maxfiylik siyosati','Конфиденциальность','Privacy'),'/privacy')}{link(tr('Tibbiy ogohlantirish','Медицинское предупреждение','Medical disclaimer'),'/disclaimer')}</div>;
 default:return null;
 }};
 return <div data-tier={tier} className="min-h-screen bg-background pb-28 text-foreground"><header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-xl"><div className="mx-auto flex max-w-2xl items-center gap-2 px-3 py-2 app-safe-top"><Button variant="ghost" size="icon" aria-label={tr('Orqaga','Назад','Back')} onClick={()=>selected?setParams({}):navigate('/')}><ArrowLeft/></Button><h1 className="flex-1 text-lg font-bold">{selected?profileTitle(selected,lang):tr('Profil','Профиль','Profile')}</h1><Button variant="ghost" size="icon" aria-label={tr('Yo‘riqnomani ochish','Открыть подсказку','Open guide')} onClick={()=>setStory(selected??MOBILE_PROFILE_MENUS[0])}><CircleHelp/></Button></div></header>
 <main className="mx-auto max-w-2xl">{loading?<div role="status" className="flex justify-center p-16"><Loader2 className="animate-spin"/></div>:selected?<div className="p-4"><Suspense fallback={<div role="status" className="flex justify-center py-16"><Loader2 className="animate-spin"/></div>}>{render()}</Suspense></div>:<>
 <section className="flex items-center gap-4 px-5 py-6"><Avatar className="h-16 w-16 tier-ring"><AvatarImage src={profile?.avatar_url??''}/><AvatarFallback className="tier-soft tier-text text-xl font-bold">{profile?.full_name?.split(' ').map(w=>w[0]).join('').slice(0,2)||<User/>}</AvatarFallback></Avatar><div className="min-w-0 flex-1"><h2 className="break-words text-xl font-bold">{profile?.full_name||tr('Xush kelibsiz!','Добро пожаловать!','Welcome!')}</h2><p className="mt-1 break-all text-sm text-muted-foreground">{profile?.phone|| (user?tr('Med1 hisobingiz','Ваш аккаунт Med1','Your Med1 account'):tr('Med ALL · Med1.uz','Med ALL · Med1.uz','Med ALL · Med1.uz'))}</p>{user&&<span className="tier-gradient mt-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs"><Crown className="h-3 w-3"/>{tier==='free'?tr('Bepul','Бесплатный','Free'):tier}</span>}</div></section>
 {user?<div className="mx-5 mb-5 flex items-center justify-between border-y border-border py-4"><div><p className="text-xs text-muted-foreground">Med Coin</p><p className="mt-1 flex items-center gap-2 text-2xl font-bold"><Coins className="h-5 w-5 tier-text"/>{balance}</p></div><Button variant="outline" onClick={()=>open(MOBILE_PROFILE_MENUS.find(m=>m.id==='coins')??MOBILE_PROFILE_MENUS[0])}>{tr('Hamyon','Кошелёк','Wallet')}<ChevronRight/></Button></div>:<div className="mx-5 mb-5 grid grid-cols-2 gap-3"><Button asChild><Link to="/auth?next=%2Fmobile-profile">{tr('Kirish','Войти','Sign in')}</Link></Button><Button asChild variant="outline"><Link to="/auth?mode=register&next=%2Fmobile-profile">{tr('Ro‘yxatdan o‘tish','Регистрация','Sign up')}</Link></Button></div>}
 {Object.entries(groups).map(([group,labels])=><section key={group} className="border-t border-border px-4 py-4"><h2 className="mb-2 px-1 text-xs font-semibold uppercase text-muted-foreground">{labels[idx]}</h2>{MOBILE_PROFILE_MENUS.filter(m=>m.group===group&&(!user||!['auth','register'].includes(m.id))).map(m=><div key={m.id} className="flex items-center"><Button variant="ghost" className="h-auto min-h-16 flex-1 justify-start gap-3 whitespace-normal rounded-lg px-1 text-left" onClick={()=>open(m)}><img src={m.frames[0]} alt="" width={48} height={48} loading="lazy" className="h-12 w-12 shrink-0 rounded-lg object-cover"/><m.icon className="h-4 w-4 shrink-0 tier-text"/><span className="flex-1 text-sm font-semibold">{profileTitle(m,lang)}</span><ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground"/></Button><Button variant="ghost" size="icon" aria-label={`${profileTitle(m,lang)} — ${tr('yordam','подсказка','help')}`} onClick={()=>setStory(m)}><CircleHelp className="h-4 w-4 text-muted-foreground"/></Button></div>)}</section>)}
 {user&&<div className="border-t border-border px-5 py-4"><Button variant="outline" disabled={exiting} className="w-full justify-start text-destructive" onClick={async()=>{if(!window.confirm(tr('Hisobingizdan chiqasizmi?','Выйти из аккаунта?','Sign out?')))return;setExiting(true);try{await signOut();setParams({});toast.success(tr('Hisobdan chiqdingiz','Вы вышли','Signed out'));}catch{toast.error(tr('Chiqib bo‘lmadi. Qayta urining.','Не удалось выйти.','Could not sign out.'));}finally{setExiting(false);}}}><LogOut/>{tr('Chiqish','Выйти','Sign out')}</Button></div>}
 <p className="px-5 py-4 text-center text-xs text-muted-foreground">Med ALL · Med1.uz</p></> }</main><MobileProfileStory menu={story} lang={lang} onClose={closeStory}/></div>;
}
