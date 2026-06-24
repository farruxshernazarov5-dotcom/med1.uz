import { supabase } from "@/integrations/supabase/client";
import { aiChannelHeaders } from "@/lib/aiChannel";

const AI_FUNCTIONS = new Set([
  "symptom-checker",
  "ai-doctor-chat",
  "ai-report-analysis",
  "ai-health-risk",
  "ai-radiology",
  "ai-health-assistant",
  "ai-pregnancy",
  "ai-baby-care",
  "ai-cosmetology",
  "ai-dietolog",
  "ai-psixolog",
  "ai-farmatsevt",
  "ai-fitness",
  "ai-vital-signs",
  "ai-smart-search",
  "smart-match",
  "legal-assistant",
  "dental-ai-chat",
  "diag-ai-workflow",
  "doctor-ai-assistant",
]);

let installed = false;

export function installAiInvokeHeaders() {
  if (installed) return;
  installed = true;

  const functionsClient = supabase.functions as any;
  const originalInvoke = functionsClient.invoke?.bind(functionsClient);
  if (!originalInvoke) return;

  functionsClient.invoke = (functionName: string, options: any = {}) => {
    if (!AI_FUNCTIONS.has(functionName)) return originalInvoke(functionName, options);
    return originalInvoke(functionName, {
      ...options,
      headers: {
        ...aiChannelHeaders(),
        ...(options?.headers || {}),
      },
    });
  };
}