import { supabase } from "@/integrations/supabase/client";
import { aiChannelHeaders } from "@/lib/aiChannel";
import { recordAiDiagnostic } from "@/lib/aiDiagnostics";

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
  "ai-health-check",
]);

let installed = false;

function extractStatus(err: any): number | null {
  if (!err) return null;
  if (typeof err.status === "number") return err.status;
  if (typeof err.context?.status === "number") return err.context.status;
  return null;
}

async function extractBody(err: any): Promise<string | null> {
  try {
    const res = err?.context?.response ?? err?.context;
    if (res && typeof res.clone === "function") {
      const cloned = res.clone();
      return await cloned.text();
    }
    if (typeof res?.body === "string") return res.body;
    if (err?.message) return err.message;
    return null;
  } catch {
    return null;
  }
}

function extractRequestId(err: any): string | null {
  const res = err?.context?.response;
  if (res && typeof res.headers?.get === "function") {
    return res.headers.get("x-request-id") || res.headers.get("x-lovable-aig-run-id");
  }
  return null;
}

export function installAiInvokeHeaders() {
  if (installed) return;
  installed = true;

  const functionsClient = supabase.functions as any;
  const originalInvoke = functionsClient.invoke?.bind(functionsClient);
  if (!originalInvoke) return;

  functionsClient.invoke = async (functionName: string, options: any = {}) => {
    if (!AI_FUNCTIONS.has(functionName)) return originalInvoke(functionName, options);
    const t0 = performance.now();
    const result = await originalInvoke(functionName, {
      ...options,
      headers: {
        ...aiChannelHeaders(),
        ...(options?.headers || {}),
      },
    });
    const durationMs = Math.round(performance.now() - t0);

    const err = (result as any)?.error;
    if (err) {
      const body = await extractBody(err);
      recordAiDiagnostic({
        functionName,
        status: extractStatus(err),
        ok: false,
        requestId: extractRequestId(err),
        errorCode: err?.code ?? err?.name ?? null,
        message: err?.message ?? "AI request failed",
        body,
        durationMs,
      });
    } else {
      recordAiDiagnostic({
        functionName,
        status: 200,
        ok: true,
        requestId: null,
        errorCode: null,
        message: "ok",
        body: null,
        durationMs,
      });
    }
    return result;
  };
}
