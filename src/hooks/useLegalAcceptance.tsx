import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type LegalDocType =
  | "global_terms"
  | "privacy"
  | "disclaimer"
  | "saas_terms"
  | "saas_privacy"
  | "saas_disclaimer";

const CURRENT_VERSIONS: Record<LegalDocType, string> = {
  global_terms: "2026.04",
  privacy: "2026.04",
  disclaimer: "2026.04",
  saas_terms: "2026.04",
  saas_privacy: "2026.04",
  saas_disclaimer: "2026.04",
};

export const useLegalAcceptance = (docTypes: LegalDocType[]) => {
  const { user } = useAuth();
  const [accepted, setAccepted] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await (supabase as any)
      .from("legal_acceptances")
      .select("doc_type, doc_version")
      .eq("user_id", user.id)
      .in("doc_type", docTypes);

    const map: Record<string, boolean> = {};
    docTypes.forEach((dt) => {
      const version = CURRENT_VERSIONS[dt];
      map[dt] = (data || []).some((r: any) => r.doc_type === dt && r.doc_version === version);
    });
    setAccepted(map);
    setLoading(false);
  }, [user, docTypes.join(",")]);

  useEffect(() => { refresh(); }, [refresh]);

  const accept = async (docType: LegalDocType, context: string = "manual") => {
    if (!user) return false;
    const version = CURRENT_VERSIONS[docType];
    const { error } = await (supabase as any).from("legal_acceptances").upsert({
      user_id: user.id,
      doc_type: docType,
      doc_version: version,
      context,
      user_agent: navigator.userAgent,
    }, {
      onConflict: "user_id,doc_type,doc_version",
      ignoreDuplicates: false,
    });
    if (!error) {
      setAccepted((prev) => ({ ...prev, [docType]: true }));
      return true;
    }
    return false;
  };

  const allAccepted = docTypes.every((dt) => accepted[dt]);
  return { accepted, allAccepted, loading, accept, refresh, currentVersions: CURRENT_VERSIONS };
};
