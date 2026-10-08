import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Native ilova ba'zan /index.html bilan ochiladi — bosh sahifaga yo'naltiramiz.
    if (/\/index\.html$/.test(location.pathname)) navigate("/" + location.search, { replace: true });
    else console.error("404:", location.pathname);
  }, [location.pathname, location.search, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-6 pb-24">
      <div className="text-center">
        <h1 className="mb-3 text-4xl font-bold">404</h1>
        <p className="mb-6 text-lg text-muted-foreground">Sahifa topilmadi</p>
        <div className="flex flex-col gap-2">
          <Button onClick={() => navigate(-1)} variant="outline">Ortga qaytish</Button>
          <Button asChild><Link to="/auth">Kirish / Ro‘yxatdan o‘tish</Link></Button>
          <Button asChild variant="ghost"><Link to="/">Bosh sahifa</Link></Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
