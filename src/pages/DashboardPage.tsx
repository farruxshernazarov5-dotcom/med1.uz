import { lazy, Suspense } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, useParams } from "react-router-dom";
const PatientDashboard = lazy(() => import("@/components/dashboard/PatientDashboard"));
const ClinicDashboard = lazy(() => import("@/components/dashboard/ClinicDashboard"));
const AdminDashboard = lazy(() => import("@/components/dashboard/AdminDashboard"));
const VendorDashboard = lazy(() => import("@/components/dashboard/VendorDashboard"));
const DiagnosticsDashboard = lazy(() => import("@/components/dashboard/DiagnosticsDashboard"));
const MaternityDashboard = lazy(() => import("@/components/dashboard/MaternityDashboard"));
const CosmetologyDashboard = lazy(() => import("@/components/dashboard/CosmetologyDashboard"));
const DoctorDashboard = lazy(() => import("@/components/dashboard/DoctorDashboard"));
const PharmacyDashboard = lazy(() => import("@/components/dashboard/PharmacyDashboard"));
const BloodBankDashboard = lazy(() => import("@/components/dashboard/BloodBankDashboard"));
const DentalDashboard = lazy(() => import("@/components/dashboard/DentalDashboard"));
import { getDashboardPath, normalizeDashboardRole } from "@/lib/dashboard";
import PaymentSuccessBanner from "@/components/payments/PaymentSuccessBanner";

const DASHBOARD_MAP: Record<string, React.ComponentType> = {
  admin: AdminDashboard,
  clinic: ClinicDashboard,
  vendor: VendorDashboard,
  diagnostics: DiagnosticsDashboard,
  maternity: MaternityDashboard,
  cosmetology: CosmetologyDashboard,
  doctor: DoctorDashboard,
  pharmacy: PharmacyDashboard,
  bloodbank: BloodBankDashboard,
  dental: DentalDashboard,
  patient: PatientDashboard,
};

const DashboardPage = () => {
  const { user, loading, userRole } = useAuth();
  const { type } = useParams<{ type?: string }>();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-secondary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  // Foydalanuvchining haqiqiy roliga mos dashboard yo'li
  const userDashboardPath = getDashboardPath(userRole);

  // Agar URL'da type yo'q bo'lsa — o'z dashboardiga yuborish
  if (!type) return <Navigate to={userDashboardPath} replace />;

  const dashboardType = type.toLowerCase();
  const DashboardComponent = DASHBOARD_MAP[dashboardType];
  const effectiveUserRole = normalizeDashboardRole(userRole);

  // Agar dashboard turi mavjud emas bo'lsa — o'z dashboardiga
  if (!DashboardComponent) {
    return <Navigate to={userDashboardPath} replace />;
  }

  // QAT'IY ROLE GUARD: Agar URL roli foydalanuvchi roliga mos kelmasa
  // (admin'dan tashqari — admin barcha dashboardlarni ko'ra oladi)
  if (effectiveUserRole !== "admin" && dashboardType !== effectiveUserRole) {
    return <Navigate to={userDashboardPath} replace />;
  }

  return (
    <>
      <PaymentSuccessBanner />
      <DashboardComponent />
    </>
  );
};

export default DashboardPage;
