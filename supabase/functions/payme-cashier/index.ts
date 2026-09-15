// Payme Kassa (cashier) — admin uchun Payme to'lovlarini kuzatish va bekor qilish.
// Super admin paneldagi payme-admin-diag funksiyasiga tegmaydi.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const anon = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes } = await anon.auth.getUser();
    const userId = userRes?.user?.id;
    if (!userId) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) return json({ error: "Forbidden — admin roli talab qilinadi" }, 403);

    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const action = String(body?.action ?? "list");

    if (action === "list") {
      const search = String(body?.search ?? "").trim();
      const status = String(body?.status ?? "all");
      const limit = Math.min(Number(body?.limit) || 100, 300);

      let q = admin
        .from("platform_payments")
        .select("id,user_id,amount,currency,status,purpose,reference_id,provider_transaction_id,metadata,paid_at,created_at,is_test")
        .eq("provider", "payme")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (status !== "all") q = q.eq("status", status);
      if (search) {
        const like = `%${search}%`;
        q = /^[0-9a-f-]{8,}$/i.test(search)
          ? q.or(`id.eq.${search},user_id.eq.${search}`)
          : q.or(`purpose.ilike.${like},provider_transaction_id.ilike.${like}`);
      }
      const { data: payments, error } = await q;
      if (error) throw error;

      const ids = (payments ?? []).map((p: any) => p.id);
      const { data: txs } = ids.length
        ? await admin.from("payme_transactions").select("*").in("payment_id", ids)
        : { data: [] as any[] };

      const all = await admin
        .from("platform_payments")
        .select("amount,status")
        .eq("provider", "payme");
      const rows = all.data ?? [];
      const isPaid = (s: string) => s === "paid" || s === "completed";
      const stats = {
        total: rows.length,
        paid: rows.filter((r: any) => isPaid(r.status)).length,
        pending: rows.filter((r: any) => r.status === "pending").length,
        cancelled: rows.filter((r: any) => r.status === "cancelled" || r.status === "canceled").length,
        revenue: rows.filter((r: any) => isPaid(r.status)).reduce((s: number, r: any) => s + Number(r.amount || 0), 0),
        refunded: rows.filter((r: any) => r.status === "refunded").reduce((s: number, r: any) => s + Number(r.amount || 0), 0),
      };

      return json({ ok: true, payments: payments ?? [], transactions: txs ?? [], stats });
    }

    if (action === "detail") {
      const paymentId = String(body?.payment_id ?? "");
      if (!paymentId) return json({ error: "payment_id talab qilinadi" }, 400);
      const [payment, tx, logs] = await Promise.all([
        admin.from("platform_payments").select("*").eq("id", paymentId).maybeSingle(),
        admin.from("payme_transactions").select("*").eq("payment_id", paymentId).order("created_at", { ascending: false }),
        admin.from("payme_webhook_log").select("*").eq("payment_id", paymentId).order("created_at", { ascending: false }).limit(50),
      ]);
      return json({ ok: true, payment: payment.data, transactions: tx.data ?? [], logs: logs.data ?? [] });
    }

    if (action === "cancel") {
      const paymentId = String(body?.payment_id ?? "");
      const reason = Number(body?.reason) || 5; // 5 — qaytarish (refund)
      const note = String(body?.note ?? "").slice(0, 300);
      if (!paymentId) return json({ error: "payment_id talab qilinadi" }, 400);

      const { data: payment } = await admin.from("platform_payments").select("*").eq("id", paymentId).maybeSingle();
      if (!payment) return json({ error: "To'lov topilmadi" }, 404);
      if (payment.provider !== "payme") return json({ error: "Bu to'lov Payme orqali emas" }, 400);
      if (payment.status === "cancelled" || payment.status === "refunded") {
        return json({ error: "To'lov allaqachon bekor qilingan" }, 409);
      }

      const wasPaid = payment.status === "paid" || payment.status === "completed";
      const { data: txRow } = await admin
        .from("payme_transactions")
        .select("*")
        .eq("payment_id", paymentId)
        .order("created_at", { ascending: false })
        .maybeSingle();

      // Payme Cashier API orqali chekni bekor qilishga urinish (kalit mavjud bo'lsa)
      let remote: { attempted: boolean; ok: boolean; detail: string } = { attempted: false, ok: false, detail: "Payme tomonida bekor qilinmadi (kassa kaliti sozlanmagan)" };
      const cashierKey = Deno.env.get("PAYME_CASHIER_KEY") || "";
      const merchantId = Deno.env.get("PAYME_MERCHANT_ID") || "";
      const receiptId = txRow?.id || payment.provider_transaction_id;
      if (cashierKey && merchantId && receiptId) {
        remote.attempted = true;
        try {
          const r = await fetch("https://checkout.paycom.uz/api", {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-Auth": `${merchantId}:${cashierKey}` },
            body: JSON.stringify({ id: Date.now(), method: "receipts.cancel", params: { id: receiptId } }),
          });
          const data = await r.json().catch(() => null) as any;
          remote.ok = r.status === 200 && !data?.error;
          remote.detail = remote.ok ? "Payme tomonida chek bekor qilindi" : `Payme javobi: ${JSON.stringify(data?.error ?? data)}`.slice(0, 300);
        } catch (e) {
          remote.detail = `Payme so'rovi bajarilmadi: ${e instanceof Error ? e.message : String(e)}`;
        }
      }

      const newStatus = wasPaid ? "refunded" : "cancelled";
      const { data: updated, error: upErr } = await admin
        .from("platform_payments")
        .update({
          status: newStatus,
          metadata: {
            ...(payment.metadata ?? {}),
            cancelled_by: userId,
            cancelled_at: new Date().toISOString(),
            cancel_reason: reason,
            cancel_note: note,
            payme_remote_cancel: remote,
          },
        })
        .eq("id", paymentId)
        .select()
        .single();
      if (upErr) throw upErr;

      if (txRow) {
        await admin
          .from("payme_transactions")
          .update({
            state: wasPaid ? -2 : -1,
            reason,
            cancel_time: Date.now(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", txRow.id);
      }

      await admin.from("audit_logs").insert({
        action: wasPaid ? "payme_payment_refunded" : "payme_payment_cancelled",
        entity_type: "platform_payments",
        entity_id: paymentId,
        user_id: userId,
        details: { reason, note, amount: payment.amount, remote },
      });

      return json({ ok: true, payment: updated, remote });
    }

    return json({ error: "Noma'lum action" }, 400);
  } catch (err) {
    console.error("payme-cashier error", err);
    return json({ error: err instanceof Error ? err.message : "Server xatolik" }, 500);
  }
});
