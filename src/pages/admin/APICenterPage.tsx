import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import APIManagementCenter from "@/components/admin/api/APIManagementCenter";

const APICenterPage = () => {
  const { user, loading, userRole } = useAuth();

  useEffect(() => {
    document.title = "API Management Center · MED1.UZ";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "MED1.UZ API Management Center — mobil, web, HAMBI va partner API'larni boshqarish, kalitlar, OAuth, monitoring, log va analytics.");
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A2540]">
        <div className="animate-spin w-10 h-10 border-4 border-[#2F80ED] border-t-transparent rounded-full" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (userRole !== "admin") return <Navigate to={`/dashboard/${userRole || "patient"}`} replace />;

  return <APIManagementCenter />;
};

export default APICenterPage;
