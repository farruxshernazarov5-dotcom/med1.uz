import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TOKEN = Deno.env.get("EMEDINFO_BOT_TOKEN") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SITE = "https://med1.uz";
const db = createClient(SUPABASE_URL, SERVICE_KEY);

async function tg(method: string, body: Record<string, unknown>) {
  const r = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return r.json();
}

async function webhookSecret() {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`emedinfo:${TOKEN}`));
  return btoa(String.fromCharCode(...new Uint8Array(d))).replace(/[^A-Za-z0-9]/g, "").slice(0, 64);
}

const app = (text: string, path: string) => ({ text, web_app: { url: `${SITE}${path}` } });

const HEADER =
  "🏥 <b>MED1.UZ — Raqamli tibbiyot platformasi</b>\n" +
  "━━━━━━━━━━━━━━━━━━\n" +
  "🤖 AI shifokor • 👨‍⚕️ Shifokorlar • 🏨 Klinikalar\n" +
  "💊 Dorixona • 🧪 Tahlillar • 📄 Hujjatlar\n" +
  "━━━━━━━━━━━━━━━━━━";

const MAIN_MENU = {
  inline_keyboard: [
    [app("👤 Shaxsiy kabinet", "/dashboard")],
    [app("🤖 AI shifokor", "/ai-doctor"), app("🩺 Simptom tekshirish", "/symptom-checker")],
    [app("👨‍⚕️ Shifokorlar", "/doctors"), app("🏨 Klinikalar", "/clinics")],
    [app("🦷 Stomatologiya", "/dental"), app("🔬 Diagnostika", "/diagnostics")],
    [app("💊 Dorixona", "/pharmacy"), app("💆 Kosmetologiya", "/cosmetology")],
    [app("📚 Maqolalar", "/articles"), app("📰 Yangiliklar", "/news")],
    [app("💎 Tariflar / Med Coin", "/pricing")],
    [{ text: "📄 Hujjatlar", callback_data: "docs" }, { text: "👤 Mening profilim", callback_data: "profile" }],
    [app("📝 Ro'yxatdan o'tish / Kirish", "/auth")],
  ],
};

const DOCS_MENU = {
  inline_keyboard: [
    [app("📜 Foydalanish shartlari", "/terms")],
    [app("🔒 Maxfiylik siyosati", "/privacy")],
    [app("⚠️ Tibbiy ogohlantirish", "/disclaimer")],
    [app("🏢 SaaS shartlari", "/saas-terms")],
    [app("📖 API hujjatlari", "/api-docs")],
    [{ text: "⬅️ Asosiy menyu", callback_data: "menu" }],
  ],
};

const CONTACT_KB = {
  keyboard: [[{ text: "📱 Telefon raqamni yuborish", request_contact: true }]],
  resize_keyboard: true,
  one_time_keyboard: true,
};

async function findProfile(chatId: number) {
  const { data } = await db.from("profiles").select("user_id, full_name, phone")
    .eq("telegram_chat_id", String(chatId)).maybeSingle();
  return data;
}

async function sendMenu(chatId: number) {
  await tg("sendMessage", { chat_id: chatId, text: `${HEADER}\n\nKerakli bo'limni tanlang 👇`, parse_mode: "HTML", reply_markup: MAIN_MENU });
}

async function sendProfile(chatId: number) {
  const p = await findProfile(chatId);
  if (!p) {
    await tg("sendMessage", {
      chat_id: chatId, parse_mode: "HTML",
      text: "👤 <b>Shaxsiy kabinet</b>\n\nHisobingiz hali botga ulanmagan.\n1️⃣ Pastdagi tugma orqali telefon raqamingizni yuboring\n2️⃣ Hisobingiz bo'lmasa — «Ro'yxatdan o'tish» tugmasini bosing.",
      reply_markup: CONTACT_KB,
    });
    await tg("sendMessage", { chat_id: chatId, text: "Yoki hozir ro'yxatdan o'ting:", reply_markup: { inline_keyboard: [[app("📝 Ro'yxatdan o'tish", "/auth")]] } });
    return;
  }
  const [{ data: role }, { data: wallet }] = await Promise.all([
    db.from("user_roles").select("role").eq("user_id", p.user_id).limit(1).maybeSingle(),
    db.from("user_credits").select("balance").eq("user_id", p.user_id).gt("expires_at", new Date().toISOString()),
  ]);
  await tg("sendMessage", {
    chat_id: chatId, parse_mode: "HTML",
    text: `👤 <b>Shaxsiy kabinet</b>\n━━━━━━━━━━━━━━\n🧑 Ism: <b>${p.full_name || "—"}</b>\n📱 Telefon: ${p.phone || "—"}\n🎭 Rol: ${role?.role ?? "patient"}\n🪙 Med Coin: ${(wallet ?? []).reduce((a: number, w: any) => a + Number(w.balance || 0), 0)}\n━━━━━━━━━━━━━━`,
    reply_markup: { inline_keyboard: [[app("🚀 Kabinetni ochish", "/dashboard")], [{ text: "⬅️ Asosiy menyu", callback_data: "menu" }]] },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (!TOKEN) return new Response(JSON.stringify({ error: "EMEDINFO_BOT_TOKEN not configured" }), { status: 500, headers: corsHeaders });
  const url = new URL(req.url);

  try {
    // One-time setup: webhook + commands + menu button
    if (url.pathname.endsWith("/setup")) {
      const secret = await webhookSecret();
      const results = {
        webhook: await tg("setWebhook", { url: `${SUPABASE_URL}/functions/v1/emedinfo-bot`, secret_token: secret, allowed_updates: ["message", "callback_query"] }),
        commands: await tg("setMyCommands", { commands: [
          { command: "start", description: "Botni ishga tushirish" },
          { command: "menu", description: "Asosiy menyu" },
          { command: "kabinet", description: "Shaxsiy kabinet" },
          { command: "register", description: "Ro'yxatdan o'tish" },
          { command: "docs", description: "Hujjatlar" },
          { command: "help", description: "Yordam" },
        ] }),
        menuButton: await tg("setChatMenuButton", { menu_button: { type: "web_app", text: "Med1.uz", web_app: { url: SITE } } }),
        description: await tg("setMyDescription", { description: "Med1.uz — O'zbekistondagi raqamli tibbiyot platformasi: AI shifokor, shifokor va klinikalar qidiruvi, onlayn qabul, tahlillar va shaxsiy tibbiy kabinet." }),
        shortDescription: await tg("setMyShortDescription", { short_description: "🏥 Med1.uz — AI shifokor, klinikalar va shaxsiy tibbiy kabinet" }),
      };
      return new Response(JSON.stringify(results), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (req.method !== "POST") return new Response("ok");
    if (req.headers.get("X-Telegram-Bot-Api-Secret-Token") !== await webhookSecret()) {
      return new Response("Unauthorized", { status: 401 });
    }

    const update = await req.json();

    if (update.callback_query) {
      const cq = update.callback_query;
      const chatId = cq.message.chat.id;
      await tg("answerCallbackQuery", { callback_query_id: cq.id });
      if (cq.data === "docs") await tg("sendMessage", { chat_id: chatId, parse_mode: "HTML", text: "📄 <b>Hujjatlar</b>\nRasmiy hujjatlarni tanlang:", reply_markup: DOCS_MENU });
      else if (cq.data === "profile") await sendProfile(chatId);
      else await sendMenu(chatId);
      return new Response("ok");
    }

    const msg = update.message;
    if (!msg) return new Response("ok");
    const chatId = msg.chat.id;

    // Contact share → link account
    if (msg.contact) {
      if (msg.contact.user_id && msg.contact.user_id !== msg.from?.id) {
        await tg("sendMessage", { chat_id: chatId, text: "❌ Faqat o'z raqamingizni yuboring." });
        return new Response("ok");
      }
      let phone = String(msg.contact.phone_number).replace(/\D/g, "");
      phone = `+${phone}`;
      await db.from("telegram_otp").upsert({ phone, chat_id: chatId, is_verified: true, updated_at: new Date().toISOString() }, { onConflict: "phone" });
      const { data: linked } = await db.from("profiles").update({ telegram_chat_id: String(chatId) } as any).eq("phone", phone).select("user_id");
      if (linked && linked.length) {
        await tg("sendMessage", { chat_id: chatId, text: "✅ Hisobingiz botga ulandi! Endi bildirishnomalar va tahlil natijalari shu yerga keladi.", reply_markup: { remove_keyboard: true } });
        await sendProfile(chatId);
      } else {
        await tg("sendMessage", {
          chat_id: chatId, parse_mode: "HTML", reply_markup: { remove_keyboard: true },
          text: `📱 Raqam saqlandi: <b>${phone}</b>\n\nBu raqam bilan hisob topilmadi. Ro'yxatdan o'tishda «Telefon» usulini tanlang — kod shu botga keladi.`,
        });
        await tg("sendMessage", { chat_id: chatId, text: "👇", reply_markup: { inline_keyboard: [[app("📝 Ro'yxatdan o'tish", "/auth?mode=register")]] } });
      }
      return new Response("ok");
    }

    const text = String(msg.text || "").trim();
    const cmd = text.split(/[\s@]/)[0].toLowerCase();

    if (cmd === "/start") {
      const name = msg.from?.first_name ? `, ${msg.from.first_name}` : "";
      await tg("sendMessage", {
        chat_id: chatId, parse_mode: "HTML",
        text: `${HEADER}\n\nAssalomu alaykum${name}! 👋\nMed1.uz botiga xush kelibsiz.\n\n✅ Sog'lig'ingiz haqida AI maslahat\n✅ Shifokor va klinikaga onlayn yozilish\n✅ Tahlil natijalari va bildirishnomalar\n✅ Shaxsiy tibbiy kabinet\n\nHisobni ulash uchun telefon raqamingizni yuboring 👇`,
        reply_markup: CONTACT_KB,
      });
      await sendMenu(chatId);
    } else if (cmd === "/menu") await sendMenu(chatId);
    else if (cmd === "/kabinet" || cmd === "/profile") await sendProfile(chatId);
    else if (cmd === "/register") {
      await tg("sendMessage", { chat_id: chatId, parse_mode: "HTML", text: "📝 <b>Ro'yxatdan o'tish</b>\n1️⃣ Telefon raqamingizni yuboring\n2️⃣ Ochilgan oynada rolni tanlab, «Telefon» usuli bilan ro'yxatdan o'ting.", reply_markup: CONTACT_KB });
      await tg("sendMessage", { chat_id: chatId, text: "👇", reply_markup: { inline_keyboard: [[app("📝 Ro'yxatdan o'tish", "/auth?mode=register")]] } });
    } else if (cmd === "/docs") await tg("sendMessage", { chat_id: chatId, parse_mode: "HTML", text: "📄 <b>Hujjatlar</b>", reply_markup: DOCS_MENU });
    else if (cmd === "/help") await tg("sendMessage", { chat_id: chatId, parse_mode: "HTML", text: "ℹ️ <b>Buyruqlar</b>\n/start — boshlash\n/menu — asosiy menyu\n/kabinet — shaxsiy kabinet\n/register — ro'yxatdan o'tish\n/docs — hujjatlar\n\n📞 Yordam: med1.uz/contact" });
    else await sendMenu(chatId);

    return new Response("ok");
  } catch (e) {
    console.error("emedinfo-bot error", e);
    return new Response("ok");
  }
});
