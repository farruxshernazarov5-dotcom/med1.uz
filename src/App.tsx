import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import MedicinePage from "./pages/MedicinePage";
import HealthPage from "./pages/HealthPage";
import DiseasesPage from "./pages/DiseasesPage";
import ArticlesPage from "./pages/ArticlesPage";
import ClinicsPage from "./pages/ClinicsPage";
import MedTechPage from "./pages/MedTechPage";
import NewsPage from "./pages/NewsPage";
import DiagnosticsPage from "./pages/DiagnosticsPage";
import PharmaciesPage from "./pages/PharmaciesPage";
import BloodBanksPage from "./pages/BloodBanksPage";
import MaternityPage from "./pages/MaternityPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/medicine" element={<MedicinePage />} />
          <Route path="/health" element={<HealthPage />} />
          <Route path="/diseases" element={<DiseasesPage />} />
          <Route path="/articles" element={<ArticlesPage />} />
          <Route path="/clinics" element={<ClinicsPage />} />
          <Route path="/med-tech" element={<MedTechPage />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/diagnostics" element={<DiagnosticsPage />} />
          <Route path="/pharmacies" element={<PharmaciesPage />} />
          <Route path="/blood-banks" element={<BloodBanksPage />} />
          <Route path="/maternity" element={<MaternityPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
