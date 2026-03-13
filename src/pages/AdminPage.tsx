import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import AdminDashboard from "@/components/dashboard/AdminDashboard";

const AdminPage = () => {
  const { user, loading, userRole } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A2540]">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-[#2F80ED] border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-white/60 text-sm">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (userRole !== "admin") return <Navigate to="/dashboard" replace />;

  return <AdminDashboard />;
};

export default AdminPage;
