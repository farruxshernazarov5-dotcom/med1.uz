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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get user role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    await supabase.from("audit_logs").insert({
      user_id: user.id,
      role: roleData?.role || "unknown",
      action: entry.action,
      entity_type: entry.entity_type,
      entity_id: entry.entity_id || null,
      module: entry.module || entry.entity_type,
      details: entry.details || null,
      old_data: entry.old_data || null,
      new_data: entry.new_data || null,
    } as any);
  } catch (e) {
    console.error("Audit log error:", e);
  }
};
