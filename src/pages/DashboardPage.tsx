import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
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

const DashboardPage = () => {
  const { user, loading, userRole } = useAuth();

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

  // Each dashboard now has its own full-page shell layout
  if (userRole === "admin") return <AdminDashboard />;
  if (userRole === "clinic") return <ClinicDashboard />;
  if (userRole === "vendor") return <VendorDashboard />;
  if (userRole === "diagnostics") return <DiagnosticsDashboard />;
  if (userRole === "maternity") return <MaternityDashboard />;
  if (userRole === "cosmetology") return <CosmetologyDashboard />;
  if (userRole === "doctor") return <DoctorDashboard />;
  if (userRole === "pharmacy") return <PharmacyDashboard />;
  if (userRole === "bloodbank") return <BloodBankDashboard />;
  return <PatientDashboard />;
};

export default DashboardPage;
