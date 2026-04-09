import { supabase } from "@/integrations/supabase/client";

interface AuditLogEntry {
  action: string;
  entity_type: string;
  entity_id?: string;
  module?: string;
  details?: Record<string, any>;
  old_data?: Record<string, any>;
  new_data?: Record<string, any>;
}

export const writeAuditLog = async (entry: AuditLogEntry) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    await supabase.functions.invoke("write-audit-log", {
      body: {
        action: entry.action,
        entity_type: entry.entity_type,
        entity_id: entry.entity_id || null,
        module: entry.module || entry.entity_type,
        details: entry.details || null,
        old_data: entry.old_data || null,
        new_data: entry.new_data || null,
      },
    });
  } catch (e) {
    console.error("Audit log error:", e);
  }
};
