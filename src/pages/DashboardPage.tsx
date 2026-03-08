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
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const DashboardPage = () => {
  const { user, loading, userRole } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        {userRole === "admin" && <AdminDashboard />}
        {userRole === "clinic" && <ClinicDashboard />}
        {userRole === "vendor" && <VendorDashboard />}
        {userRole === "diagnostics" && <DiagnosticsDashboard />}
        {userRole === "maternity" && <MaternityDashboard />}
        {userRole === "cosmetology" && <CosmetologyDashboard />}
        {userRole === "doctor" && <DoctorDashboard />}
        {(!userRole || userRole === "patient") && <PatientDashboard />}
      </div>
      <Footer />
    </div>
  );
};

export default DashboardPage;
