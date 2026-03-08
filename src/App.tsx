import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import MedicinePage from "./pages/MedicinePage";
import HealthPage from "./pages/HealthPage";
import DiseasesPage from "./pages/DiseasesPage";
import DiseaseDetailPage from "./pages/DiseaseDetailPage";
import ArticlesPage from "./pages/ArticlesPage";
import ArticleDetailPage from "./pages/ArticleDetailPage";
import CategoryArticlesPage from "./pages/CategoryArticlesPage";
import ClinicsPage from "./pages/ClinicsPage";
import ClinicDetailPage from "./pages/ClinicDetailPage";
import NewsDetailPage from "./pages/NewsDetailPage";
import MedTechPage from "./pages/MedTechPage";
import MedTechDetailPage from "./pages/MedTechDetailPage";
import NewsPage from "./pages/NewsPage";
import DiagnosticsPage from "./pages/DiagnosticsPage";
import PharmaciesPage from "./pages/PharmaciesPage";
import BloodBanksPage from "./pages/BloodBanksPage";
import MaternityPage from "./pages/MaternityPage";
import AboutPage from "./pages/AboutPage";
import ServicesPage from "./pages/ServicesPage";
import UserGuidePage from "./pages/UserGuidePage";
import SitemapPage from "./pages/SitemapPage";
import CosmetologyPage from "./pages/CosmetologyPage";
import TermDetailPage from "./pages/TermDetailPage";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import BookingPage from "./pages/BookingPage";
import ClinicRegistrationPage from "./pages/ClinicRegistrationPage";
import VendorRegistrationPage from "./pages/VendorRegistrationPage";
import DiagnosticsRegistrationPage from "./pages/DiagnosticsRegistrationPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import SymptomCheckerPage from "./pages/SymptomCheckerPage";
import AIDoctorChatPage from "./pages/AIDoctorChatPage";
import AIReportAnalysisPage from "./pages/AIReportAnalysisPage";
import AIHealthRiskPage from "./pages/AIHealthRiskPage";
import AIServicesPage from "./pages/AIServicesPage";
import MaternityRegistrationPage from "./pages/MaternityRegistrationPage";
import CosmetologyRegistrationPage from "./pages/CosmetologyRegistrationPage";
import DoctorsPage from "./pages/DoctorsPage";
import DoctorProfilePage from "./pages/DoctorProfilePage";
import DoctorRegistrationPage from "./pages/DoctorRegistrationPage";
import SmartSearchPage from "./pages/SmartSearchPage";
import AIDiagnostikaPage from "./pages/AIDiagnostikaPage";
import AIRadiologyPage from "./pages/AIRadiologyPage";
import AIHealthAssistantPage from "./pages/AIHealthAssistantPage";
import AIHealthAssistantPage from "./pages/AIHealthAssistantPage";
import FloatingAISearch from "./components/FloatingAISearch";
import FloatingAIPanel from "./components/FloatingAIPanel";
import PartnershipPage from "./pages/PartnershipPage";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <FloatingAISearch />
          <Routes>
            <Route path="/" element={<Index />} />
          <Route path="/medicine" element={<MedicinePage />} />
          <Route path="/medicine/term/:termId" element={<TermDetailPage />} />
          <Route path="/health" element={<HealthPage />} />
          <Route path="/diseases" element={<DiseasesPage />} />
          <Route path="/diseases/:categoryId/:slug" element={<DiseaseDetailPage />} />
          <Route path="/articles" element={<ArticlesPage />} />
          <Route path="/articles/:categoryId" element={<CategoryArticlesPage />} />
          <Route path="/articles/:categoryId/:slug" element={<ArticleDetailPage />} />
          <Route path="/clinics" element={<ClinicsPage />} />
          <Route path="/clinics/:clinicId" element={<ClinicDetailPage />} />
          <Route path="/med-tech" element={<MedTechPage />} />
          <Route path="/med-tech/:equipmentId" element={<MedTechDetailPage />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/news/:newsId" element={<NewsDetailPage />} />
          <Route path="/diagnostics" element={<DiagnosticsPage />} />
          <Route path="/pharmacies" element={<PharmaciesPage />} />
          <Route path="/blood-banks" element={<BloodBanksPage />} />
          <Route path="/maternity" element={<MaternityPage />} />
          <Route path="/cosmetology" element={<CosmetologyPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/booking" element={<BookingPage />} />
          <Route path="/clinic-register" element={<ClinicRegistrationPage />} />
           <Route path="/vendor-register" element={<VendorRegistrationPage />} />
           <Route path="/diagnostics-register" element={<DiagnosticsRegistrationPage />} />
           <Route path="/maternity-register" element={<MaternityRegistrationPage />} />
           <Route path="/cosmetology-register" element={<CosmetologyRegistrationPage />} />
           <Route path="/doctor-register" element={<DoctorRegistrationPage />} />
           <Route path="/doctors" element={<DoctorsPage />} />
           <Route path="/doctors/:doctorId" element={<DoctorProfilePage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/user-guide" element={<UserGuidePage />} />
          <Route path="/sitemap" element={<SitemapPage />} />
           <Route path="/symptom-checker" element={<SymptomCheckerPage />} />
           <Route path="/ai-services" element={<AIServicesPage />} />
           <Route path="/ai-doctor-chat" element={<AIDoctorChatPage />} />
           <Route path="/ai-report-analysis" element={<AIReportAnalysisPage />} />
           <Route path="/ai-health-risk" element={<AIHealthRiskPage />} />
           <Route path="/ai-diagnostika" element={<AIDiagnostikaPage />} />
           <Route path="/ai-radiology" element={<AIRadiologyPage />} />
           <Route path="/ai-health-assistant" element={<AIHealthAssistantPage />} />
           <Route path="/smart-search" element={<SmartSearchPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </AuthProvider>
  </QueryClientProvider>
);

export default App;
