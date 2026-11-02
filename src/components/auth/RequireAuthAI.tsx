import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Lock, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { signInDestination } from "@/lib/authDestination";

/** AI tools cost money per request, so only signed-in users may open them. */
export const RequireAuthAI = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();
  const { pathname, search } = useLocation();
  if (loading) return <div className="min-h-[60vh] grid place-items-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (user) return <>{children}</>;
  return (
    <div className="min-h-[70vh] grid place-items-center px-6">
      <div className="max-w-sm w-full text-center space-y-4 rounded-2xl border bg-card p-8 shadow-sm">
        <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 grid place-items-center"><Lock className="h-6 w-6 text-primary" /></div>
        <h1 className="text-xl font-semibold">Med AI xizmatlari uchun kiring</h1>
        <p className="text-sm text-muted-foreground">AI tahlillaridan foydalanish uchun hisobingizga kiring yoki ro‘yxatdan o‘ting. Xulosalaringiz profilingizda saqlanadi.</p>
        <Button asChild className="w-full"><Link to={signInDestination(`${pathname}${search}`)}>Kirish / Ro‘yxatdan o‘tish</Link></Button>
        <Button asChild variant="ghost" className="w-full"><Link to="/ai-services">Barcha AI xizmatlar</Link></Button>
      </div>
    </div>
  );
};
