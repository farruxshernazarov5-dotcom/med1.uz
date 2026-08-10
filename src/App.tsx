import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { CreditProvider } from "@/hooks/useCredits";
import ActivityTracker from "@/components/activity/ActivityTracker";
import { ThemeProvider } from "next-themes";
import ErrorBoundary from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Lazy-loaded pages for code splitting
const MedicinePage = lazy(() => import("./pages/MedicinePage"));
const HealthPage = lazy(() => import("./pages/HealthPage"));
const DiseasesPage = lazy(() => import("./pages/DiseasesPage"));
const DiseaseDetailPage = lazy(() => import("./pages/DiseaseDetailPage"));
const ArticlesPage = lazy(() => import("./pages/ArticlesPage"));
const ArticleDetailPage = lazy(() => import("./pages/ArticleDetailPage"));
const CategoryArticlesPage = lazy(() => import("./pages/CategoryArticlesPage"));
const ClinicsPage = lazy(() => import("./pages/ClinicsPage"));
const ClinicDetailPage = lazy(() => import("./pages/ClinicDetailPage"));
const NewsDetailPage = lazy(() => import("./pages/NewsDetailPage"));
const MedTechPage = lazy(() => import("./pages/MedTechPage"));
const MedTechDetailPage = lazy(() => import("./pages/MedTechDetailPage"));
const NewsPage = lazy(() => import("./pages/NewsPage"));
const DiagnosticsPage = lazy(() => import("./pages/DiagnosticsPage"));
const PharmaciesPage = lazy(() => import("./pages/PharmaciesPage"));
const BloodBanksPage = lazy(() => import("./pages/BloodBanksPage"));
const MaternityPage = lazy(() => import("./pages/MaternityPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const ServicesPage = lazy(() => import("./pages/ServicesPage"));
const UserGuidePage = lazy(() => import("./pages/UserGuidePage"));
const SitemapPage = lazy(() => import("./pages/SitemapPage"));
const CosmetologyPage = lazy(() => import("./pages/CosmetologyPage"));
const DentalPage = lazy(() => import("./pages/DentalPage"));
const DentalDetailPage = lazy(() => import("./pages/DentalDetailPage"));
const TermDetailPage = lazy(() => import("./pages/TermDetailPage"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const StaffCheckInPage = lazy(() => import("./pages/StaffCheckInPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const BookingPage = lazy(() => import("./pages/BookingPage"));
const ClinicRegistrationPage = lazy(() => import("./pages/ClinicRegistrationPage"));
const VendorRegistrationPage = lazy(() => import("./pages/VendorRegistrationPage"));
const DiagnosticsRegistrationPage = lazy(() => import("./pages/DiagnosticsRegistrationPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const SymptomCheckerPage = lazy(() => import("./pages/SymptomCheckerPage"));
const AIDoctorChatPage = lazy(() => import("./pages/AIDoctorChatPage"));
const AIReportAnalysisPage = lazy(() => import("./pages/AIReportAnalysisPage"));
const AIHealthRiskPage = lazy(() => import("./pages/AIHealthRiskPage"));
const AIServicesPage = lazy(() => import("./pages/AIServicesPage"));
const MaternityRegistrationPage = lazy(() => import("./pages/MaternityRegistrationPage"));
const CosmetologyRegistrationPage = lazy(() => import("./pages/CosmetologyRegistrationPage"));
const DoctorsPage = lazy(() => import("./pages/DoctorsPage"));
const DoctorProfilePage = lazy(() => import("./pages/DoctorProfilePage"));
const DoctorExternalDetailPage = lazy(() => import("./pages/DoctorExternalDetailPage"));
const DoctorSpecialtyPage = lazy(() => import("./pages/DoctorSpecialtyPage"));
const DoctorRegistrationPage = lazy(() => import("./pages/DoctorRegistrationPage"));
const SmartSearchPage = lazy(() => import("./pages/SmartSearchPage"));
const AIDiagnostikaPage = lazy(() => import("./pages/AIDiagnostikaPage"));
const AIRadiologyPage = lazy(() => import("./pages/AIRadiologyPage"));
const AIHealthAssistantPage = lazy(() => import("./pages/AIHealthAssistantPage"));
const PartnershipPage = lazy(() => import("./pages/PartnershipPage"));
const ReportVerificationPage = lazy(() => import("./pages/ReportVerificationPage"));
const ContractVerifyPage = lazy(() => import("./pages/ContractVerifyPage"));
const PharmacyRegistrationPage = lazy(() => import("./pages/PharmacyRegistrationPage"));
const AIPregnancyPage = lazy(() => import("./pages/AIPregnancyPage"));
const AIBabyCarePage = lazy(() => import("./pages/AIBabyCarePage"));
const AICosmetologyPage = lazy(() => import("./pages/AICosmetologyPage"));
const PricingPage = lazy(() => import("./pages/PricingPage"));
const AIDietologPage = lazy(() => import("./pages/AIDietologPage"));
const AIPsixologPage = lazy(() => import("./pages/AIPsixologPage"));
const AIFarmatsevtPage = lazy(() => import("./pages/AIFarmatsevtPage"));
const AIFitnessPage = lazy(() => import("./pages/AIFitnessPage"));
const AISubscriptionPage = lazy(() => import("./pages/AISubscriptionPage"));
const AIPaymentPage = lazy(() => import("./pages/AIPaymentPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const AdminLegalPage = lazy(() => import("./pages/AdminLegalPage"));
const LegalCenterPage = lazy(() => import("./pages/LegalCenterPage"));
const AIVitalSignsPage = lazy(() => import("./pages/AIVitalSignsPage"));
const BloodDonorRegistrationPage = lazy(() => import("./pages/BloodDonorRegistrationPage"));
const DentalRegistrationPage = lazy(() => import("./pages/DentalRegistrationPage"));
const UnsubscribePage = lazy(() => import("./pages/UnsubscribePage"));
const PaymentSuccessPage = lazy(() => import("./pages/PaymentSuccessPage"));
const DiagnosticsBookingPage = lazy(() => import("./pages/DiagnosticsBookingPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const DisclaimerPage = lazy(() => import("./pages/DisclaimerPage"));
const SaasTermsPage = lazy(() => import("./pages/SaasTermsPage"));
const CookiePolicyPage = lazy(() => import("./pages/CookiePolicyPage"));

const KnowledgePage = lazy(() => import("./pages/KnowledgePage"));
const KnowledgeArticlePage = lazy(() => import("./pages/KnowledgeArticlePage"));
const DevelopersPage = lazy(() => import("./pages/DevelopersPage"));
const PartnerIntegrationPage = lazy(() => import("./pages/PartnerIntegrationPage"));

const PartnerDashboardPage = lazy(() => import("./pages/PartnerDashboardPage"));
const ReferralPage = lazy(() => import("./pages/ReferralPage"));
const ReferralTermsPage = lazy(() => import("./pages/ReferralTermsPage"));
const PartnerTermsPage = lazy(() => import("./pages/PartnerTermsPage"));

const HambiPartnerAdminPage = lazy(() => import("./pages/admin/HambiPartnerAdminPage"));
const AIAnalyticsPage = lazy(() => import("./pages/admin/AIAnalyticsPage"));
const HambiDashboardPage = lazy(() => import("./pages/admin/HambiDashboardPage"));
const HambiReadinessPage = lazy(() => import("./pages/admin/HambiReadinessPage"));
const PaymentSandboxPage = lazy(() => import("./pages/admin/PaymentSandboxPage"));
const TaxReportsPage = lazy(() => import("./pages/admin/TaxReportsPage"));
const SeoMonitorPage = lazy(() => import("./pages/admin/SeoMonitorPage"));
const SponsorsModerationPage = lazy(() => import("./pages/admin/SponsorsModerationPage"));
const TransparencyPage = lazy(() => import("./pages/TransparencyPage"));

const ApiDocsPage = lazy(() => import("./pages/ApiDocsPage"));
const APICenterPage = lazy(() => import("./pages/admin/APICenterPage"));
const AIOncologyPage = lazy(() => import("./pages/AIOncologyPage"));
const AIDiabetesPage = lazy(() => import("./pages/AIDiabetesPage"));
const AIRadiologyPulmonologyPage = lazy(() => import("./pages/AIRadiologyPulmonologyPage"));
const AIRadiologyBrainPage = lazy(() => import("./pages/AIRadiologyBrainPage"));
const AIRadiologyBonePage = lazy(() => import("./pages/AIRadiologyBonePage"));
const AIRadiologyChestCTPage = lazy(() => import("./pages/AIRadiologyChestCTPage"));
const AIRadiologyMammographyPage = lazy(() => import("./pages/AIRadiologyMammographyPage"));
const AIRadiologyAbdomenPage = lazy(() => import("./pages/AIRadiologyAbdomenPage"));
const AIRadiologySpinePage = lazy(() => import("./pages/AIRadiologySpinePage"));
const AIOrchestratorPage = lazy(() => import("./pages/AIOrchestratorPage"));
const OAuthConsentPage = lazy(() => import("./pages/OAuthConsentPage"));

import FloatingAISearch from "./components/FloatingAISearch";
import FloatingAIPanel from "./components/FloatingAIPanel";
import { SmartMatchPanel } from "./components/smart-match/SmartMatchPanel";
import { GeoPromoProvider } from "./components/geo/GeoPromoProvider";
import FloatingServicesPanel from "./components/FloatingServicesPanel";
import HambiReturnButton from "./components/partner/HambiReturnButton";
import CookieConsent from "./components/CookieConsent";
import ReferralCapture from "./components/referral/ReferralCapture";
import YandexAdsManager from "./components/ads/YandexAdsManager";
import AIDiagnosticsPanel from "./components/AIDiagnosticsPanel";
import RouteCanonical from "./components/seo/RouteCanonical";


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Core Web Vitals: keep fetched data warm so route re-entry is instant
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 1,
    },
  },
});


const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-muted-foreground">Yuklanmoqda...</p>
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey="med1-theme">
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <CreditProvider>
          <RouteCanonical />
          <ActivityTracker />

          <ReferralCapture />
          <YandexAdsManager />
          <FloatingAISearch />
          <FloatingAIPanel />
          <FloatingServicesPanel />
          <SmartMatchPanel />
          <GeoPromoProvider />
          <CookieConsent />
          <HambiReturnButton />
          <AIDiagnosticsPanel />
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/api-docs" element={<ApiDocsPage />} />
                <Route path="/api-docs/*" element={<ApiDocsPage />} />
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
                <Route path="/dental" element={<DentalPage />} />
                <Route path="/dental/:slug" element={<DentalDetailPage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/check-in" element={<StaffCheckInPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/dashboard/:type" element={<DashboardPage />} />
                <Route path="/booking" element={<BookingPage />} />
                <Route path="/clinic-register" element={<ClinicRegistrationPage />} />
                <Route path="/vendor-register" element={<VendorRegistrationPage />} />
                <Route path="/diagnostics-register" element={<DiagnosticsRegistrationPage />} />
                <Route path="/maternity-register" element={<MaternityRegistrationPage />} />
                <Route path="/cosmetology-register" element={<CosmetologyRegistrationPage />} />
                <Route path="/doctor-register" element={<DoctorRegistrationPage />} />
                <Route path="/doctors" element={<DoctorsPage />} />
                <Route path="/doctors/mutaxassislik/:slug" element={<DoctorSpecialtyPage />} />
                <Route path="/doctors/ext/:slug" element={<DoctorExternalDetailPage />} />
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
                <Route path="/partnership" element={<PartnershipPage />} />
                <Route path="/report/:reportId" element={<ReportVerificationPage />} />
                <Route path="/verify" element={<ReportVerificationPage />} />
                <Route path="/verify/:reportId" element={<ReportVerificationPage />} />
                <Route path="/verify/hambi/:reportId" element={<ReportVerificationPage />} />
                <Route path="/verify/report/:reportId" element={<ReportVerificationPage />} />
                <Route path="/verify/contract/:hashId" element={<ContractVerifyPage />} />
                <Route path="/pharmacy-register" element={<PharmacyRegistrationPage />} />
                <Route path="/ai-pregnancy" element={<AIPregnancyPage />} />
                <Route path="/ai-baby-care" element={<AIBabyCarePage />} />
                <Route path="/ai-cosmetology" element={<AICosmetologyPage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/ai-dietolog" element={<AIDietologPage />} />
                <Route path="/ai-psixolog" element={<AIPsixologPage />} />
                <Route path="/ai-farmatsevt" element={<AIFarmatsevtPage />} />
                <Route path="/ai-fitness" element={<AIFitnessPage />} />
                <Route path="/ai-subscription" element={<AISubscriptionPage />} />
                <Route path="/ai-payment" element={<AIPaymentPage />} />
                <Route path="/ai-oncology" element={<AIOncologyPage />} />
                <Route path="/ai-diabetes" element={<AIDiabetesPage />} />
                <Route path="/ai-radiology/pulmonology" element={<AIRadiologyPulmonologyPage />} />
                <Route path="/ai-radiology/brain" element={<AIRadiologyBrainPage />} />
                <Route path="/ai-radiology/bone" element={<AIRadiologyBonePage />} />
                <Route path="/ai-radiology/chest-ct" element={<AIRadiologyChestCTPage />} />
                <Route path="/ai-radiology/mammography" element={<AIRadiologyMammographyPage />} />
                <Route path="/ai-radiology/abdomen" element={<AIRadiologyAbdomenPage />} />
                <Route path="/ai-radiology/spine" element={<AIRadiologySpinePage />} />
                <Route path="/ai-orchestrator" element={<AIOrchestratorPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/admin/legal" element={<AdminLegalPage />} />
                <Route path="/admin/partners/:slug" element={<HambiPartnerAdminPage />} />
                <Route path="/admin/partners" element={<HambiPartnerAdminPage />} />
                <Route path="/admin/ai-analytics" element={<AIAnalyticsPage />} />
                <Route path="/admin/hambi" element={<HambiDashboardPage />} />
                <Route path="/admin/hambi-readiness" element={<HambiReadinessPage />} />
                <Route path="/admin/payment-sandbox" element={<PaymentSandboxPage />} />
                <Route path="/admin/tax-reports" element={<TaxReportsPage />} />
                <Route path="/admin/seo-monitor" element={<SeoMonitorPage />} />

                <Route path="/admin/api-center" element={<APICenterPage />} />
                <Route path="/legal-center" element={<LegalCenterPage />} />
                <Route path="/legal" element={<LegalCenterPage />} />
                <Route path="/ai-vital-signs" element={<AIVitalSignsPage />} />
                <Route path="/blood-donor-register" element={<BloodDonorRegistrationPage />} />
                <Route path="/dental-register" element={<DentalRegistrationPage />} />
                <Route path="/unsubscribe" element={<UnsubscribePage />} />
                <Route path="/payment/success" element={<PaymentSuccessPage />} />
                <Route path="/payment/result" element={<PaymentSuccessPage />} />
                <Route path="/diagnostics/:id/book" element={<DiagnosticsBookingPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/disclaimer" element={<DisclaimerPage />} />
                <Route path="/saas-terms" element={<SaasTermsPage />} />
                <Route path="/cookies" element={<CookiePolicyPage />} />
                <Route path="/cookie-policy" element={<CookiePolicyPage />} />

                <Route path="/referral" element={<ReferralPage />} />
                <Route path="/referral-terms" element={<ReferralTermsPage />} />
                <Route path="/partner-terms" element={<PartnerTermsPage />} />

                <Route path="/knowledge" element={<KnowledgePage />} />
                <Route path="/knowledge/:lang/:slug" element={<KnowledgeArticlePage />} />
                <Route path="/developers" element={<DevelopersPage />} />
                <Route path="/integration" element={<PartnerIntegrationPage />} />

                <Route path="/partner" element={<PartnerDashboardPage />} />
                <Route path="/.lovable/oauth/consent" element={<OAuthConsentPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
          </CreditProvider>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
