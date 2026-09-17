// Med Coin nazorat markazi — faqat super admin uchun.
// Payme/Click admin funksiyalariga tegmaydi.
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
    const action = String(body?.action ?? "overview");

    // ---------- Umumiy hisob ----------
    if (action === "overview") {
      const nowIso = new Date().toISOString();
      const [credits, expired, ledger, payments, orgs] = await Promise.all([
        admin.from("user_credits").select("balance,expires_at"),
        admin.from("user_credits").select("balance").lt("expires_at", nowIso),
        admin.from("med_coin_ledger").select("type,amount"),
        admin.from("platform_payments").select("status,amount,fulfilled_at,metadata,provider"),
        admin.from("org_credit_accounts").select("balance,lifetime_coins"),
      ]);

      const activeBalance = (credits.data ?? [])
        .filter((c: any) => c.expires_at && c.expires_at > nowIso)
        .reduce((s: number, c: any) => s + (c.balance || 0), 0);
      const expiredBalance = (expired.data ?? []).reduce((s: number, c: any) => s + (c.balance || 0), 0);

      let sold = 0, spent = 0, refunded = 0;
      for (const l of ledger.data ?? []) {
        const a = Number((l as any).amount || 0);
        if (a > 0) sold += a;
        else if ((l as any).type === "REFUND") refunded += Math.abs(a);
        else spent += Math.abs(a);
      }

      const pay = payments.data ?? [];
      const paid = pay.filter((p: any) => ["paid", "completed"].includes(p.status));
      const revenue = paid.reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
      const unfulfilled = pay.filter((p: any) => p.status === "paid" && !p.fulfilled_at).length;

      return json({
        ok: true,
        overview: {
          active_balance: activeBalance,
          expired_balance: expiredBalance,
          coins_sold: sold,
          coins_spent: spent,
          coins_refunded: refunded,
          org_balance: (orgs.data ?? []).reduce((s: number, o: any) => s + (o.balance || 0), 0),
          org_lifetime: (orgs.data ?? []).reduce((s: number, o: any) => s + (o.lifetime_coins || 0), 0),
          revenue,
          payments_total: pay.length,
          payments_paid: paid.length,
          payments_pending: pay.filter((p: any) => p.status === "pending").length,
          payments_refunded: pay.filter((p: any) => p.status === "refunded").length,
          unfulfilled,
        },
      });
    }

    // ---------- To'lovlar ----------
    if (action === "payments") {
      const status = String(body?.status ?? "all");
      const provider = String(body?.provider ?? "all");
      const search = String(body?.search ?? "").trim();
      let q = admin
        .from("platform_payments")
        .select("id,user_id,provider,amount,currency,status,purpose,package_id,metadata,paid_at,fulfilled_at,created_at")
        .order("created_at", { ascending: false })
        .limit(Math.min(Number(body?.limit) || 100, 300));
      if (status === "unfulfilled") q = q.eq("status", "paid").is("fulfilled_at", null);
      else if (status !== "all") q = q.eq("status", status);
      if (provider !== "all") q = q.eq("provider", provider);
      if (search) {
        q = /^[0-9a-f-]{8,}$/i.test(search)
          ? q.or(`id.eq.${search},user_id.eq.${search}`)
          : q.ilike("purpose", `%${search}%`);
      }
      const { data, error } = await q;
      if (error) throw error;

      const userIds = [...new Set((data ?? []).map((p: any) => p.user_id).filter(Boolean))];
      const { data: profiles } = userIds.length
        ? await admin.from("profiles").select("id,full_name,email,phone").in("id", userIds)
        : { data: [] as any[] };

      return json({ ok: true, payments: data ?? [], profiles: profiles ?? [] });
    }

    // ---------- Paketlar ----------
    if (action === "packages") {
      const { data, error } = await admin.from("payment_packages").select("*").order("sort_order").order("price");
      if (error) throw error;
      return json({ ok: true, packages: data ?? [] });
    }

    if (action === "package_save") {
      const pkg = body?.package ?? {};
      const payload = {
        code: String(pkg.code || "").trim(),
        name_uz: String(pkg.name_uz || "").trim(),
        name_ru: pkg.name_ru || null,
        name_en: pkg.name_en || null,
        kind: pkg.kind === "subscription" ? "subscription" : "med_coin",
        price: Number(pkg.price) || 0,
        currency: pkg.currency || "UZS",
        coin_amount: Number(pkg.coin_amount) || 0,
        bonus_coins: Number(pkg.bonus_coins) || 0,
        subscription_tier: pkg.subscription_tier || null,
        duration_days: Number(pkg.duration_days) || 30,
        sort_order: Number(pkg.sort_order) || 0,
        is_active: pkg.is_active !== false,
      };
      if (!payload.code || !payload.name_uz) return json({ error: "Kod va nom majburiy" }, 400);

      const res = pkg.id
        ? await admin.from("payment_packages").update(payload).eq("id", pkg.id).select().single()
        : await admin.from("payment_packages").insert(payload).select().single();
      if (res.error) throw res.error;
      await admin.from("audit_logs").insert({
        action: pkg.id ? "medcoin_package_update" : "medcoin_package_create",
        entity_type: "payment_packages", entity_id: res.data.id, user_id: userId, details: payload,
      });
      return json({ ok: true, package: res.data });
    }

    if (action === "package_delete") {
      const id = String(body?.id || "");
      if (!id) return json({ error: "id majburiy" }, 400);
      const { error } = await admin.from("payment_packages").update({ is_active: false }).eq("id", id);
      if (error) throw error;
      await admin.from("audit_logs").insert({
        action: "medcoin_package_disable", entity_type: "payment_packages", entity_id: id, user_id: userId, details: {},
      });
      return json({ ok: true });
    }

    // ---------- To'lovni yetkazish / qaytarish ----------
    if (action === "fulfill") {
      const id = String(body?.payment_id || "");
      if (!id) return json({ error: "payment_id majburiy" }, 400);
      const { data, error } = await admin.rpc("fulfill_platform_payment", { _payment_id: id });
      if (error) throw error;
      return json({ ok: true, result: data });
    }

    if (action === "refund") {
      const id = String(body?.payment_id || "");
      const reason = String(body?.reason || "Admin tomonidan qaytarildi");
      if (!id) return json({ error: "payment_id majburiy" }, 400);
      const { data, error } = await admin.rpc("refund_platform_payment", { _payment_id: id, _reason: reason });
      if (error) throw error;
      await admin.from("audit_logs").insert({
        action: "payment_refunded", entity_type: "platform_payments", entity_id: id,
        user_id: userId, details: { reason, result: data },
      });
      return json({ ok: true, result: data });
    }

    // ---------- Foydalanuvchi hisobi ----------
    if (action === "user_lookup") {
      const search = String(body?.search ?? "").trim();
      if (!search) return json({ error: "Qidiruv matni kerak" }, 400);
      const isUuid = /^[0-9a-f-]{20,}$/i.test(search);
      const { data: profiles } = isUuid
        ? await admin.from("profiles").select("id,full_name,email,phone").eq("id", search).limit(5)
        : await admin.from("profiles").select("id,full_name,email,phone")
            .or(`email.ilike.%${search}%,full_name.ilike.%${search}%,phone.ilike.%${search}%`).limit(10);

      const ids = (profiles ?? []).map((p: any) => p.id);
      const nowIso = new Date().toISOString();
      const { data: credits } = ids.length
        ? await admin.from("user_credits").select("user_id,balance,expires_at").in("user_id", ids).gt("expires_at", nowIso)
        : { data: [] as any[] };
      const { data: history } = ids.length
        ? await admin.from("credit_history").select("*").in("user_id", ids).order("created_at", { ascending: false }).limit(50)
        : { data: [] as any[] };

      const balances: Record<string, number> = {};
      for (const c of credits ?? []) {
        balances[(c as any).user_id] = (balances[(c as any).user_id] || 0) + ((c as any).balance || 0);
      }
      return json({ ok: true, users: profiles ?? [], balances, history: history ?? [] });
    }

    if (action === "adjust") {
      const targetId = String(body?.user_id || "");
      const amount = Number(body?.amount);
      const reason = String(body?.reason || "").trim();
      if (!targetId || !Number.isFinite(amount) || amount === 0 || !reason) {
        return json({ error: "Foydalanuvchi, miqdor va sabab majburiy" }, 400);
      }
      const nowIso = new Date().toISOString();
      if (amount > 0) {
        const expires = new Date(Date.now() + 30 * 86400000).toISOString();
        const { error } = await admin.from("user_credits").insert({
          user_id: targetId, balance: amount, purchased_at: nowIso, expires_at: expires, package_name: "admin_grant",
        });
        if (error) throw error;
      } else {
        let remaining = Math.abs(amount);
        const { data: rows } = await admin.from("user_credits")
          .select("id,balance").eq("user_id", targetId).gt("balance", 0)
          .gt("expires_at", nowIso).order("expires_at", { ascending: false });
        for (const r of rows ?? []) {
          if (remaining <= 0) break;
          const take = Math.min(remaining, (r as any).balance);
          await admin.from("user_credits").update({ balance: (r as any).balance - take }).eq("id", (r as any).id);
          remaining -= take;
        }
      }
      const { data: fresh } = await admin.from("user_credits")
        .select("balance").eq("user_id", targetId).gt("expires_at", nowIso).gt("balance", 0);
      const balance = (fresh ?? []).reduce((s: number, c: any) => s + (c.balance || 0), 0);

      await admin.from("credit_history").insert({
        user_id: targetId, amount, type: amount > 0 ? "admin_grant" : "admin_deduct",
        description: reason, balance_after: balance,
      });
      await admin.from("audit_logs").insert({
        action: "medcoin_admin_adjust", entity_type: "user_credits", entity_id: targetId,
        user_id: userId, details: { amount, reason, balance_after: balance },
      });
      return json({ ok: true, balance });
    }

    // ---------- Muassasa hisoblari ----------
    if (action === "org_accounts") {
      const { data, error } = await admin.from("org_credit_accounts").select("*").order("balance", { ascending: false }).limit(200);
      if (error) throw error;
      return json({ ok: true, accounts: data ?? [] });
    }

    return json({ error: `Noma'lum amal: ${action}` }, 400);
  } catch (e) {
    console.error("medcoin-admin error", e);
    return new Response(JSON.stringify({ error: String((e as Error).message || e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
