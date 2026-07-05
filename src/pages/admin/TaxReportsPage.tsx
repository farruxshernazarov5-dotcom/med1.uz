import { useAuth } from "@/hooks/useAuth";
import { Navigate, Link } from "react-router-dom";
import TaxReportsModule from "@/components/admin/TaxReportsModule";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const TaxReportsPage = () => {
  const { user, loading, userRole } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A2540]">
        <div className="animate-spin w-10 h-10 border-4 border-[#2F80ED] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (userRole !== "admin" && userRole !== "tax_officer") {
    return <Navigate to={`/dashboard/${userRole || "patient"}`} replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between print:hidden">
          <div>
            <h1 className="text-2xl font-bold text-[#0A2540]">🧾 Soliq hisobotlari</h1>
            <p className="text-sm text-muted-foreground">Aylanma solig'i · my.soliq.uz shakli</p>
          </div>
          <Link to={userRole === "admin" ? "/admin" : "/"}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1" /> Orqaga
            </Button>
          </Link>
        </div>
        <TaxReportsModule />
      </div>
    </div>
  );
};

export default TaxReportsPage;
