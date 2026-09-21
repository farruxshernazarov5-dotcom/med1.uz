import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/supabase/vite";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger(), mcpPlugin()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        // Katta ma'lumot bazalarini alohida bo'laklarga ajratamiz — ular
        // faqat kerak bo'lgan sahifada yuklanadi, bosh sahifani sekinlashtirmaydi.
        manualChunks(id: string) {
          if (!id.includes("/src/data/")) return;
          if (id.includes("clinics-external") || id.includes("clinicsExternal")) return "data-clinics-external";
          if (id.includes("dental-clinics") || id.includes("dentalClinics")) return "data-dental";
          if (id.includes("/new_articles/")) return "data-new-articles";
          if (id.includes("/data/terms")) return "data-terms";
          if (id.includes("medicalTerms")) return "data-medical-terms";
          if (id.includes("diseases")) return "data-diseases";
          if (id.includes("/data/articles") || id.includes("extraArticles")) return "data-articles";
          if (id.includes("/officialContracts/") || id.includes("/data/legal")) return "data-legal";
          if (id.includes("/data/news")) return "data-news";
          if (id.includes("/data/clinics") || id.includes("pharmacies") || id.includes("bloodBanks")) return "data-directories";
          if (id.includes("healthTips")) return "data-health-tips";
        },
      },
    },
  },
}));
