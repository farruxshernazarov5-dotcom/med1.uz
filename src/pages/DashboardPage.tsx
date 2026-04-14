import { useAuth } from "@/hooks/useAuth";
import { Navigate, useParams } from "react-router-dom";
import PatientDashboard from "@/components/dashboard/PatientDashboard";
import ClinicDashboard from "@/components/dashboard/ClinicDashboard";
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import VendorDashboard from "@/components/dashboard/VendorDashboard";
import DiagnosticsDashboard from "@/components/dashboard/DiagnosticsDashboard";
import MaternityDashboard from "@/components/dashboard/MaternityDashboard";
import CosmetologyDashboard from "@/components/dashboard/CosmetologyDashboard";
import DoctorDashboard from "@/components/dashboard/DoctorDashboard";
import PharmacyDashboard from "@/components/dashboard/PharmacyDashboard";
import BloodBankDashboard from "@/components/dashboard/BloodBankDashboard";
import DentalDashboard from "@/components/dashboard/DentalDashboard";
import { getDashboardPath } from "@/lib/dashboard";

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

  if (!type) return <Navigate to={getDashboardPath(userRole)} replace />;

  const dashboardType = type.toLowerCase();
  const DashboardComponent = DASHBOARD_MAP[dashboardType];

  if (!DashboardComponent) {
    return <Navigate to={getDashboardPath(userRole)} replace />;
  }

  return <DashboardComponent />;
};

export default DashboardPage;
