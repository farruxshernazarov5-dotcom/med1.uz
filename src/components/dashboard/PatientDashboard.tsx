import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard, LogOut, User, Calendar, Heart, Star, Bell, Activity, MapPin,
  FileText, FolderOpen, Brain, Shield, QrCode, FlaskConical, Pill, ImageIcon,
  Users, Bot, LineChart, CreditCard, Tag, Settings, Sparkles, Home, Stethoscope,
  ClipboardList, Receipt, Lock, Crown, ChevronRight, Menu, Plus, Search,
  Sun, Moon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import { useTheme } from "next-themes";
import { useAiAccess } from "@/hooks/useAiAccess";
import { useCredits } from "@/hooks/useCredits";
import UpgradeModal from "@/components/saas/UpgradeModal";

import PatientAppointments from "./PatientAppointments";
import PatientProfileEditor from "./PatientProfileEditor";
import PatientFavorites from "./PatientFavorites";
import PatientReviews from "./PatientReviews";
import PatientHealth from "./PatientHealth";
import PatientNotifications from "./PatientNotifications";
import PatientDocuments from "./PatientDocuments";
import PatientNearby from "./PatientNearby";
import PatientMedicalHistory from "./PatientMedicalHistory";
import PatientAIHistory from "./PatientAIHistory";
import PatientSecurity from "./PatientSecurity";
import PatientMedicalWorkflow from "./PatientMedicalWorkflow";
import PatientOverview from "@/components/patient/hms/PatientOverview";
import PatientLabResults from "@/components/patient/hms/PatientLabResults";
import PatientPrescriptions from "@/components/patient/hms/PatientPrescriptions";
import PatientFiles from "@/components/patient/hms/PatientFiles";
import PatientHealthTracking from "@/components/patient/hms/PatientHealthTracking";
import PatientFamily from "@/components/patient/hms/PatientFamily";
import PatientAIAssistant from "@/components/patient/hms/PatientAIAssistant";
import PatientPayments from "@/components/patient/hms/PatientPayments";
import PatientPromo from "@/components/patient/hms/PatientPromo";
import PatientSettings from "@/components/patient/hms/PatientSettings";

type TabId =
  | "overview" | "ai-assistant" | "ai-history" | "health" | "tracking"
  | "appointments" | "nearby" | "workflow"
  | "lab" | "prescriptions" | "files" | "documents" | "history"
  | "payments" | "promo"
  | "family" | "favorites" | "reviews"
  | "profile" | "notifications" | "security" | "settings";

interface NavItem {
  id: TabId;
  label: string;
  icon: any;
  premium?: boolean; // requires non-free tier
  badge?: string;
}

interface NavGroup {
  id: string;
  label: string;
  icon: any;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    id: "home",
    label: "Asosiy",
    icon: Home,
    items: [
      { id: "overview", label: "Bosh sahifa", icon: LayoutDashboard },
    ],
  },
  {
    id: "medical",
    label: "Tibbiy xizmatlar",
    icon: Stethoscope,
    items: [
      { id: "ai-assistant", label: "AI Yordamchi", icon: Bot },
      { id: "ai-history", label: "AI tahlillar", icon: Brain, premium: true },
      { id: "health", label: "BMI / Bosim", icon: Activity },
      { id: "tracking", label: "Monitoring", icon: LineChart, premium: true },
    ],
  },
  {
    id: "appointments",
    label: "Qabullar",
    icon: Calendar,
    items: [
      { id: "appointments", label: "Mening qabullarim", icon: Calendar },
      { id: "nearby", label: "Yaqin xizmatlar", icon: MapPin },
      { id: "workflow", label: "QR / Workflow", icon: QrCode },
    ],
  },
  {
    id: "results",
    label: "Natijalar",
    icon: ClipboardList,
    items: [
      { id: "lab", label: "Analiz natijalari", icon: FlaskConical },
      { id: "prescriptions", label: "Retseptlar", icon: Pill },
      { id: "files", label: "Tibbiy fayllar", icon: ImageIcon },
      { id: "documents", label: "Hujjatlar", icon: FileText },
      { id: "history", label: "Tibbiy tarix", icon: FolderOpen },
    ],
  },
  {
    id: "payments",
    label: "To'lovlar",
    icon: Receipt,
    items: [
      { id: "payments", label: "To'lovlar va cheklar", icon: CreditCard },
      { id: "promo", label: "Aksiyalar", icon: Tag },
    ],
  },
  {
    id: "social",
    label: "Shaxsiy",
    icon: Users,
    items: [
      { id: "family", label: "Oila a'zolari", icon: Users },
      { id: "favorites", label: "Sevimlilar", icon: Heart },
      { id: "reviews", label: "Sharhlarim", icon: Star },
    ],
  },
  {
    id: "settings",
    label: "Sozlamalar",
    icon: Settings,
    items: [
      { id: "profile", label: "Profil", icon: User },
      { id: "notifications", label: "Bildirishnomalar", icon: Bell },
      { id: "security", label: "Xavfsizlik", icon: Shield },
      { id: "settings", label: "Umumiy sozlamalar", icon: Settings },
    ],
  },
];

const TIER_META: Record<string, { label: string; gradient: string; icon: any }> = {
  pro: { label: "Pro", gradient: "from-amber-500 to-orange-500", icon: Crown },
  premium: { label: "Premium", gradient: "from-purple-500 to-fuchsia-500", icon: Sparkles },
  free: { label: "Bepul", gradient: "from-slate-400 to-slate-500", icon: User },
};

const PatientDashboard = () => {
  const { user, profile, signOut } = useAuth();
  const { access, remainingToday } = useAiAccess();
  const { balance } = useCredits();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [lockedFeature, setLockedFeature] = useState<string>("");

  const tier = access?.tier ?? "free";
  const tierMeta = TIER_META[tier] || TIER_META.free;
  const TierIcon = tierMeta.icon;

  const isPremiumUser = tier !== "free";

  const initials = (profile?.full_name || "")
    .split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  const dailyPct = useMemo(() => {
    if (!access) return 0;
    return Math.min(100, Math.round((access.used_today / Math.max(1, access.daily_limit)) * 100));
  }, [access]);

  const handleTabClick = (item: NavItem) => {
    if (item.premium && !isPremiumUser) {
      setLockedFeature(item.label);
      setUpgradeOpen(true);
      return;
    }
    setActiveTab(item.id);
    setMobileOpen(false);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "overview": return <PatientOverview onNavigate={(t) => setActiveTab(t as TabId)} />;
      case "ai-assistant": return <PatientAIAssistant />;
      case "ai-history": return <PatientAIHistory />;
      case "health": return <PatientHealth />;
      case "tracking": return <PatientHealthTracking />;
      case "appointments": return <PatientAppointments />;
      case "nearby": return <PatientNearby />;
      case "workflow": return <PatientMedicalWorkflow />;
      case "lab": return <PatientLabResults />;
      case "prescriptions": return <PatientPrescriptions />;
      case "files": return <PatientFiles />;
      case "documents": return <PatientDocuments />;
      case "history": return <PatientMedicalHistory />;
      case "payments": return <PatientPayments />;
      case "promo": return <PatientPromo />;
      case "family": return <PatientFamily />;
      case "favorites": return <PatientFavorites />;
      case "reviews": return <PatientReviews />;
      case "profile": return <PatientProfileEditor />;
      case "notifications": return <PatientNotifications />;
      case "security": return <PatientSecurity />;
      case "settings": return <PatientSettings />;
      default: return null;
    }
  };

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-card border-r border-border">
      {/* User / Tier card */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="w-11 h-11 border-2 border-primary/20">
            <AvatarImage src={profile?.avatar_url || ""} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
              {initials || <User className="w-5 h-5" />}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground truncate">
              {profile?.full_name || "Foydalanuvchi"}
            </p>
            <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
        <div className={cn("rounded-xl p-2.5 bg-gradient-to-r text-white shadow-sm", tierMeta.gradient)}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide">
              <TierIcon className="w-3.5 h-3.5" /> {tierMeta.label}
            </span>
            <Link
              to="/ai-subscription"
              className="text-[10px] bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded-full font-medium transition"
            >
              {tier === "free" ? "Yangilash" : "O'zgartirish"}
            </Link>
          </div>
          <div className="flex items-center justify-between text-[10px] opacity-90">
            <span>AI bugungi: {access?.used_today ?? 0}/{access?.daily_limit ?? 0}</span>
            <span>💰 {balance} kredit</span>
          </div>
          <div className="h-1 bg-white/20 rounded-full overflow-hidden mt-1.5">
            <div className="h-full bg-white/90 transition-all" style={{ width: `${dailyPct}%` }} />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-3">
        {NAV_GROUPS.map((group) => (
          <div key={group.id}>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-2.5 mb-1.5 flex items-center gap-1.5">
              <group.icon className="w-3 h-3" /> {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isLocked = item.premium && !isPremiumUser;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabClick(item)}
                    className={cn(
                      "flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all group",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-foreground/70 hover:text-foreground hover:bg-muted",
                      isLocked && !isActive && "opacity-60"
                    )}
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    <span className="truncate flex-1 text-left">{item.label}</span>
                    {isLocked && <Lock className="w-3 h-3 text-amber-500 shrink-0" />}
                    {item.badge && (
                      <span className="text-[9px] font-bold bg-rose-500 text-white px-1.5 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border space-y-1">
        <Link
          to="/ai-subscription"
          className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-[13px] text-foreground/70 hover:text-foreground hover:bg-muted transition"
        >
          <Sparkles className="w-4 h-4 text-amber-500" /> Tariflar
        </Link>
        <button
          onClick={signOut}
          className="flex items-center gap-2 w-full px-2.5 py-2 rounded-lg text-[13px] text-foreground/70 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
        >
          <LogOut className="w-4 h-4" /> Chiqish
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-[calc(100vh-4rem)] -mx-4 -my-6 md:-mx-6 bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-[260px] shrink-0 sticky top-0 h-screen">
        <Sidebar />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-[280px] shadow-2xl">
            <Sidebar />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-card/95 backdrop-blur border-b border-border h-14 flex items-center px-4 gap-3">
          <button
            className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-muted"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-foreground text-base truncate">
              Salom, {profile?.full_name?.split(" ")[0] || "Foydalanuvchi"} 👋
            </h1>
          </div>

          {/* Quick AI status (mobile compact) */}
          <div className="hidden sm:flex items-center gap-2">
            <Link
              to="/ai-payment"
              className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 transition"
            >
              <Sparkles className="w-3.5 h-3.5" /> {balance}
            </Link>
            <span className={cn(
              "hidden md:flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-gradient-to-r text-white",
              tierMeta.gradient
            )}>
              <TierIcon className="w-3 h-3" /> {tierMeta.label}
            </span>
          </div>

          <Button asChild size="sm" variant="outline" className="hidden md:inline-flex">
            <Link to="/clinics"><Plus className="w-4 h-4 mr-1" /> Qabul</Link>
          </Button>
        </header>

        {/* Quick actions strip */}
        <div className="px-4 py-3 border-b border-border bg-muted/30 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            <QuickAction icon={Plus} label="Qabulga yozilish" to="/clinics" />
            <QuickAction icon={Search} label="Shifokor topish" to="/doctors" />
            <QuickAction icon={FlaskConical} label="Analiz topshirish" onClick={() => setActiveTab("workflow")} />
            <QuickAction icon={Bot} label="AI so'rov" onClick={() => setActiveTab("ai-assistant")} highlight />
            <QuickAction icon={Pill} label="Dorixonalar" to="/pharmacies" />
            <QuickAction icon={MapPin} label="Yaqin atrofda" onClick={() => setActiveTab("nearby")} />
          </div>
        </div>

        {/* Content */}
        <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
          {/* Limit warning banner */}
          {access && remainingToday <= 1 && tier !== "pro" && (
            <div className="mb-4 rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-orange-500/10 p-3 flex items-center gap-3">
              <Bell className="w-5 h-5 text-amber-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  Bugungi AI limitingiz tugayapti ({remainingToday} qoldi)
                </p>
                <p className="text-xs text-muted-foreground">
                  Cheksiz so'rovlar uchun tarifni yangilang.
                </p>
              </div>
              <Link to="/ai-subscription">
                <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white">
                  Yangilash <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          )}

          {renderContent()}
        </main>
      </div>

      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        reason="feature_blocked"
        moduleId="patient-dashboard"
        feature={lockedFeature}
        currentTier={tier}
      />
    </div>
  );
};

const QuickAction = ({
  icon: Icon, label, to, onClick, highlight,
}: { icon: any; label: string; to?: string; onClick?: () => void; highlight?: boolean }) => {
  const cls = cn(
    "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition border",
    highlight
      ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground border-transparent shadow-sm hover:shadow-md"
      : "bg-card text-foreground/80 border-border hover:bg-muted hover:text-foreground"
  );
  if (to) return <Link to={to} className={cls}><Icon className="w-4 h-4" /> {label}</Link>;
  return <button onClick={onClick} className={cls}><Icon className="w-4 h-4" /> {label}</button>;
};

export default PatientDashboard;
