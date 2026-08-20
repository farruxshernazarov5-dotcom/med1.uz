import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { clickCors, clickEnv, clickAuthHeader } from "../_shared/click.ts";

// Click fiskalizatsiyasi (chek / fiscal items) — Merchant API v2
// POST { action: "send" | "status", payment_id, click_trans_id, items[], mode: "test" | "live" }
const FISCAL_PREPARE = "https://api.click.uz/v2/merchant/payment/ficsal_items/prepare";
const FISCAL_STATUS = "https://api.click.uz/v2/merchant/payment/ficsal_items";

interface FiscalItem {
  Name: string;
  SPIC: string;
  PackageCode: string;
  Units?: number;
  GoodPrice?: number;
  Price: number;
  Amount: number;
  VAT: number;
  VATPercent: number;
  CommissionInfo?: { TIN?: string };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: clickCors });
  const json = (b: unknown, s = 200) =>
    new Response(JSON.stringify(b), { status: s, headers: { ...clickCors, "Content-Type": "application/json" } });

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

    const env = clickEnv();
    if (!env.merchantUserId || !env.secretKey || !env.serviceId) {
      return json({ error: "Click fiskal konfiguratsiyasi to'liq emas (merchant_user_id / secret_key / service_id)" }, 400);
    }

    const body = await req.json().catch(() => ({}));
    const action = String(body?.action ?? "send");
    const mode: "test" | "live" = body?.mode === "live" ? "live" : "test";
    const clickTransId = body?.click_trans_id ? String(body.click_trans_id) : null;
    const paymentId = body?.payment_id ? String(body.payment_id) : null;

    const auth = await clickAuthHeader(env.merchantUserId, env.secretKey);

    if (action === "status") {
      if (!clickTransId) return json({ error: "click_trans_id kerak" }, 400);
      const resp = await fetch(`${FISCAL_STATUS}/${clickTransId}`, {
        headers: { "Auth": auth, "Accept": "application/json" },
      });
      const data = await resp.json().catch(() => ({}));
      return json({ ok: resp.ok, http_status: resp.status, data });
    }

    // --- Chipta (chek) tuzish ---
    const rawItems = Array.isArray(body?.items) ? body.items : [];
    const items: FiscalItem[] = rawItems.map((i: Record<string, unknown>) => {
      const price = Math.round(Number(i.Price ?? i.price ?? 0) * 100); // tiyin
      const qty = Number(i.Units ?? i.qty ?? 1);
      const vatPercent = Number(i.VATPercent ?? i.vat_percent ?? 12);
      const amountTiyin = price * qty;
      const vat = Math.round((amountTiyin / (100 + vatPercent)) * vatPercent);
      return {
        Name: String(i.Name ?? i.name ?? "Xizmat"),
        SPIC: String(i.SPIC ?? i.spic ?? "10202001001000000"),
        PackageCode: String(i.PackageCode ?? i.package_code ?? "1512216"),
        Units: qty,
        GoodPrice: price,
        Price: amountTiyin,
        Amount: qty * 1000,
        VAT: vat,
        VATPercent: vatPercent,
        CommissionInfo: { TIN: String(i.TIN ?? i.tin ?? "310123456") },
      };
    });

    if (!items.length) return json({ error: "Kamida bitta chipta pozitsiyasi kerak" }, 400);

    const totalTiyin = items.reduce((s, i) => s + i.Price, 0);
    const payload = {
      service_id: Number(env.serviceId),
      payment_id: clickTransId ? Number(clickTransId) : 0,
      items,
      received_ecash: totalTiyin,
      received_cash: 0,
      received_card: 0,
    };

    let responseBody: unknown = null;
    let httpStatus = 0;
    let status = "test_only";
    let errorNote: string | null = null;

    if (mode === "live") {
      if (!clickTransId) return json({ error: "Live rejimda click_trans_id majburiy" }, 400);
      const resp = await fetch(FISCAL_PREPARE, {
        method: "POST",
        headers: { "Auth": auth, "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(payload),
      });
      httpStatus = resp.status;
      responseBody = await resp.json().catch(async () => ({ raw: await resp.text().catch(() => "") }));
      const errCode = (responseBody as { error_code?: number })?.error_code;
      status = resp.ok && (errCode === undefined || errCode === 0) ? "sent" : "failed";
      if (status === "failed") errorNote = JSON.stringify(responseBody).slice(0, 500);
    }

    const { data: receipt } = await admin.from("click_fiscal_receipts").insert({
      payment_id: paymentId,
      click_trans_id: clickTransId,
      service_id: env.serviceId,
      mode,
      items,
      received_ecash: totalTiyin / 100,
      request_body: payload,
      response_body: responseBody as Record<string, unknown> | null,
      status,
      error_note: errorNote,
    }).select().single();

    return json({ ok: status !== "failed", status, http_status: httpStatus, payload, response: responseBody, receipt });
  } catch (err) {
    console.error("click-fiscal error", err);
    return json({ error: err instanceof Error ? err.message : "Server xatolik" }, 500);
  }
});
