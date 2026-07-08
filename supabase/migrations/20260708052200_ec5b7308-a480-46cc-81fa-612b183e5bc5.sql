
-- Fix 1: Restrict api_endpoints SELECT: public rows only, admins see all
DROP POLICY IF EXISTS "endpoints readable by all" ON public.api_endpoints;
CREATE POLICY "endpoints public readable" ON public.api_endpoints
  FOR SELECT
  USING (is_public = true OR has_role(auth.uid(), 'admin'::app_role));

-- Fix 2: Revoke EXECUTE from anon on SECURITY DEFINER functions in public schema
-- Keep anon access on public contract verification functions
REVOKE EXECUTE ON FUNCTION public.update_ai_usage_result FROM anon;
REVOKE EXECUTE ON FUNCTION public.analytics_recent_usage FROM anon;
REVOKE EXECUTE ON FUNCTION public.refund_ai_credits FROM anon;
REVOKE EXECUTE ON FUNCTION public.analytics_timeseries FROM anon;
REVOKE EXECUTE ON FUNCTION public.analytics_overview FROM anon;
REVOKE EXECUTE ON FUNCTION public.analytics_by_service FROM anon;
REVOKE EXECUTE ON FUNCTION public.security_notif_check_rate FROM anon;
REVOKE EXECUTE ON FUNCTION public.purge_security_logs FROM anon;
REVOKE EXECUTE ON FUNCTION public.insert_security_log FROM anon;
REVOKE EXECUTE ON FUNCTION public.analytics_by_channel FROM anon;
REVOKE EXECUTE ON FUNCTION public.notify_security_log_entry FROM anon;
REVOKE EXECUTE ON FUNCTION public.grant_welcome_coins FROM anon;
REVOKE EXECUTE ON FUNCTION public.trg_ai_subscription_webhook FROM anon;
REVOKE EXECUTE ON FUNCTION public.trg_credit_history_webhook FROM anon;
REVOKE EXECUTE ON FUNCTION public.analytics_by_region FROM anon;
REVOKE EXECUTE ON FUNCTION public.email_queue_dispatch FROM anon;
REVOKE EXECUTE ON FUNCTION public.analytics_error_breakdown FROM anon;
REVOKE EXECUTE ON FUNCTION public.email_queue_wake FROM anon;
REVOKE EXECUTE ON FUNCTION public.trg_ai_payment_webhook FROM anon;
REVOKE EXECUTE ON FUNCTION public.deduct_ai_credits FROM anon;
REVOKE EXECUTE ON FUNCTION public.analytics_top_users FROM anon;
REVOKE EXECUTE ON FUNCTION public.analytics_revenue FROM anon;
-- Also revoke EXECUTE from PUBLIC role to prevent implicit anon access
REVOKE EXECUTE ON FUNCTION public.update_ai_usage_result FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.analytics_recent_usage FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.refund_ai_credits FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.analytics_timeseries FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.analytics_overview FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.analytics_by_service FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.security_notif_check_rate FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.purge_security_logs FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.insert_security_log FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.analytics_by_channel FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_security_log_entry FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.grant_welcome_coins FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.trg_ai_subscription_webhook FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.trg_credit_history_webhook FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.analytics_by_region FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.email_queue_dispatch FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.analytics_error_breakdown FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.email_queue_wake FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.trg_ai_payment_webhook FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.deduct_ai_credits FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.analytics_top_users FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.analytics_revenue FROM PUBLIC;
