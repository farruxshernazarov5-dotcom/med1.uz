import { supabase } from "@/integrations/supabase/client";

export type AuditAction = "create" | "update" | "delete" | "view" | "login" | "logout" | "export" | "print" | "send" | "share";
export type AuditEntity = "patient" | "appointment" | "prescription" | "lab_order" | "billing" | "telemed" | "record" | "file" | "treatment_plan" | "profile" | "settings";
export type AuditSeverity = "info" | "warning" | "critical";

interface AuditLogParams {
  doctorId: string;
  actionType: AuditAction;
  entityType: AuditEntity;
  entityId?: string;
  entityName?: string;
  description?: string;
  oldData?: any;
  newData?: any;
  severity?: AuditSeverity;
  metadata?: Record<string, any>;
}

const getDeviceType = (): string => {
  const ua = navigator.userAgent;
  if (/mobile/i.test(ua)) return "mobile";
  if (/tablet|ipad/i.test(ua)) return "tablet";
  return "desktop";
};

export const logDoctorAction = async (params: AuditLogParams): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("doctor_audit_logs").insert({
      doctor_id: params.doctorId,
      user_id: user?.id,
      action_type: params.actionType,
      entity_type: params.entityType,
      entity_id: params.entityId || null,
      entity_name: params.entityName || null,
      description: params.description || null,
      old_data: params.oldData || null,
      new_data: params.newData || null,
      user_agent: navigator.userAgent.slice(0, 200),
      device_type: getDeviceType(),
      severity: params.severity || "info",
      metadata: params.metadata || {},
    });
  } catch (e) {
    console.error("Audit log error:", e);
  }
};
