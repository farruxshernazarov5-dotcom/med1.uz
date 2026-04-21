import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { LayoutDashboard, LogOut, User, Calendar, Heart, Star, Bell, Activity, MapPin, FileText, FolderOpen, Brain, Shield, QrCode, FlaskConical, Pill, ImageIcon, Users, Bot, LineChart, CreditCard, Tag, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

const tabs = [
  { id: "overview", label: "Bosh sahifa", icon: LayoutDashboard },
  { id: "ai-assistant", label: "AI Yordamchi", icon: Bot },
  { id: "appointments", label: "Qabullar", icon: Calendar },
  { id: "lab", label: "Analizlar", icon: FlaskConical },
  { id: "prescriptions", label: "Retseptlar", icon: Pill },
  { id: "files", label: "Fayllar", icon: ImageIcon },
  { id: "tracking", label: "Monitoring", icon: LineChart },
  { id: "family", label: "Oila", icon: Users },
  { id: "workflow", label: "QR/Workflow", icon: QrCode },
  { id: "nearby", label: "Yaqin xizmatlar", icon: MapPin },
  { id: "history", label: "Tibbiy tarix", icon: FolderOpen },
  { id: "ai-history", label: "AI tahlillar", icon: Brain },
  { id: "documents", label: "Hujjatlar", icon: FileText },
  { id: "health", label: "BMI/Bosim", icon: Activity },
  { id: "security", label: "Xavfsizlik", icon: Shield },
  { id: "reviews", label: "Sharhlar", icon: Star },
  { id: "favorites", label: "Sevimlilar", icon: Heart },
  { id: "payments", label: "To'lovlar", icon: CreditCard },
  { id: "promo", label: "Aksiyalar", icon: Tag },
  { id: "profile", label: "Profil", icon: User },
  { id: "notifications", label: "Xabarlar", icon: Bell },
  { id: "settings", label: "Sozlamalar", icon: Settings },
] as const;

type TabId = (typeof tabs)[number]["id"];

const PatientDashboard = () => {
  const { user, profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const initials = (profile?.full_name || "")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="w-14 h-14 border-2 border-primary/20">
            <AvatarImage src={profile?.avatar_url || ""} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold">{initials || <User className="w-6 h-6" />}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-heading text-xl md:text-2xl font-bold text-foreground">
              Salom, {profile?.full_name || "Foydalanuvchi"} 👋
            </h1>
            <p className="text-sm text-muted-foreground">Shaxsiy kabinet</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground">
          <LogOut className="w-4 h-4 mr-1" /> Chiqish
        </Button>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 overflow-x-auto pb-1 mb-6 scrollbar-none">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all",
              activeTab === tab.id
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="min-h-[400px]">
        {activeTab === "overview" && <PatientOverview onNavigate={(t) => setActiveTab(t as TabId)} />}
        {activeTab === "ai-assistant" && <PatientAIAssistant />}
        {activeTab === "appointments" && <PatientAppointments />}
        {activeTab === "lab" && <PatientLabResults />}
        {activeTab === "prescriptions" && <PatientPrescriptions />}
        {activeTab === "files" && <PatientFiles />}
        {activeTab === "tracking" && <PatientHealthTracking />}
        {activeTab === "family" && <PatientFamily />}
        {activeTab === "workflow" && <PatientMedicalWorkflow />}
        {activeTab === "nearby" && <PatientNearby />}
        {activeTab === "history" && <PatientMedicalHistory />}
        {activeTab === "ai-history" && <PatientAIHistory />}
        {activeTab === "documents" && <PatientDocuments />}
        {activeTab === "health" && <PatientHealth />}
        {activeTab === "security" && <PatientSecurity />}
        {activeTab === "reviews" && <PatientReviews />}
        {activeTab === "favorites" && <PatientFavorites />}
        {activeTab === "profile" && <PatientProfileEditor />}
        {activeTab === "notifications" && <PatientNotifications />}
      </div>
    </div>
  );
};

export default PatientDashboard;
