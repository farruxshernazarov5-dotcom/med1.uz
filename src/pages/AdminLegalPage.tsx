import { useAuth } from "@/hooks/useAuth";
import { Navigate, Link } from "react-router-dom";
import LegalAdminDashboard from "@/components/admin/legal/LegalAdminDashboard";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const AdminLegalPage = () => {
  const { user, loading, userRole } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A2540]">
        <div className="animate-spin w-10 h-10 border-4 border-[#2F80ED] border-t-transparent rounded-full" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (userRole !== "admin") return <Navigate to={`/dashboard/${userRole || "patient"}`} replace />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-[#0A2540] dark:via-[#0A2540] dark:to-[#0F2D52]">
      <div className="border-b bg-background/80 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/admin">
              <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" /> Admin</Button>
            </Link>
            <div>
              <h1 className="text-lg font-semibold">📜 Legal Contract Management</h1>
              <p className="text-xs text-muted-foreground">Kategoriyalar, andozalar, versiyalar va shartnomalar</p>
            </div>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-6">
        <LegalAdminDashboard />
      </div>
    </div>
  );
};

export default AdminLegalPage;
