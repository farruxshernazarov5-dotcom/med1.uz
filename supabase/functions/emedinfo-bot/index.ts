import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TOKEN = Deno.env.get("EMEDINFO_BOT_TOKEN") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const CHANNEL_ID = Deno.env.get("EMEDINFO_CHANNEL_ID") ?? "";
const SITE = "https://med1.uz";
const BOT_AVATAR = `${SITE}/__l5e/assets-v1/370135c6-f213-4212-af5e-8d7e2a98950c/emedinfo-bot-avatar.png`;
const db = createClient(SUPABASE_URL, SERVICE_KEY);

type Profile = { user_id: string; full_name: string | null; phone: string | null };
type UserRole = { user_id: string; role: string };

const ROLE_PATH: Record<string, string> = {
  patient: "/dashboard/patient",
  doctor: "/dashboard/doctor",
  clinic: "/dashboard/clinic",
  diagnostics: "/dashboard/diagnostics",
  pharmacy: "/dashboard/pharmacy",
  maternity: "/dashboard/maternity",
  cosmetology: "/dashboard/cosmetology",
  dental: "/dashboard/dental",
  bloodbank: "/dashboard/bloodbank",
  vendor: "/dashboard/vendor",
};

const ROLE_LABEL: Record<string, string> = {
  patient: "Bemor",
  doctor: "Shifokor",
  clinic: "Klinika",
  diagnostics: "Diagnostika",
  pharmacy: "Dorixona",
  maternity: "Tug‘ruqxona",
  cosmetology: "Kosmetologiya",
  dental: "Stomatologiya",
  bloodbank: "Qon banki",
  vendor: "Medtexnika",
};

async function tg(method: string, body: Record<string, unknown>) {
  const response = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = await response.json();
  if (!response.ok || !result?.ok) console.error(`Telegram ${method} failed`, result);
  return result;
}

async function setBotAvatar() {
  const source = await fetch(BOT_AVATAR);
  if (!source.ok) return { ok: false, description: `Avatar download failed: ${source.status}` };
  const form = new FormData();
  form.append("photo", JSON.stringify({ type: "static", photo: "attach://avatar" }));
  form.append("avatar", await source.blob(), "med1uz-bot.png");
  const response = await fetch(`https://api.telegram.org/bot${TOKEN}/setMyProfilePhoto`, { method: "POST", body: form });
  return response.json();
}

async function webhookSecret() {
  const data = new TextEncoder().encode(`emedinfo:${TOKEN}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(digest))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

const esc = (value: unknown) => String(value ?? "—").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const app = (text: string, path: string) => ({ text, web_app: { url: `${SITE}${path}` } });
const callback = (text: string, data: string) => ({ text, callback_data: data });

const HEADER =
  "🏥 <b>MED1.UZ — Raqamli tibbiyot ekotizimi</b>\n" +
  "━━━━━━━━━━━━━━━━━━\n" +
  "🤖 Tibbiy AI  •  👨‍⚕️ Shifokorlar  •  🏨 Klinikalar\n" +
  "🔬 Diagnostika  •  💳 To‘lovlar  •  📄 Shartnomalar\n" +
  "━━━━━━━━━━━━━━━━━━";

const MAIN_MENU = {
  inline_keyboard: [
    [callback("👤 Shaxsiy kabinet", "profile")],
    [callback("🤖 AI salomatlik", "ai"), callback("🏥 Tibbiy xizmatlar", "services")],
    [callback("💼 Biznes boshqaruvi", "business"), callback("💳 Tarif va to‘lovlar", "payments")],
    [callback("📰 Yangiliklar va OAV", "media"), callback("📄 Hujjatlar", "docs")],
    [callback("🌐 Platforma haqida", "platform"), callback("☎️ Yordam", "help")],
    [app("🚀 Med1.uz Mini App", "/")],
  ],
};

const AI_MENU = {
  inline_keyboard: [
    [app("🤖 AI shifokor", "/ai-doctor-chat"), app("🩺 Simptom tekshirish", "/symptom-checker")],
    [app("📊 Tahlil natijasi", "/ai-report-analysis"), app("🩻 AI radiologiya", "/ai-radiology")],
    [app("❤️ Sog‘liq xavfi", "/ai-health-risk"), app("🫀 Hayotiy ko‘rsatkichlar", "/ai-vital-signs")],
    [app("🤰 Homiladorlik", "/ai-pregnancy"), app("👶 Bola parvarishi", "/ai-baby-care")],
    [app("🥗 Dietolog", "/ai-dietolog"), app("🧠 Psixolog", "/ai-psixolog")],
    [app("💊 Farmatsevt", "/ai-farmatsevt"), app("🏃 Fitness", "/ai-fitness")],
    [app("🧬 Onkologiya", "/ai-oncology"), app("🩸 Diabet", "/ai-diabetes")],
    [app("✨ Barcha AI xizmatlar", "/ai-services")],
    [callback("⬅️ Asosiy menyu", "menu")],
  ],
};

const SERVICES_MENU = {
  inline_keyboard: [
    [app("👨‍⚕️ Shifokorlar", "/doctors"), app("🏨 Klinikalar", "/clinics")],
    [app("🔬 Diagnostika", "/diagnostics"), app("💊 Dorixonalar", "/pharmacies")],
    [app("🦷 Stomatologiya", "/dental"), app("🤰 Tug‘ruqxona", "/maternity")],
    [app("💆 Kosmetologiya", "/cosmetology"), app("🩸 Qon banklari", "/blood-banks")],
    [app("🦾 Medtexnika", "/med-tech"), app("📍 Yaqin xizmatlar", "/smart-search")],
    [app("📅 Qabulga yozilish", "/booking")],
    [callback("⬅️ Asosiy menyu", "menu")],
  ],
};

const PAYMENTS_MENU = {
  inline_keyboard: [
    [app("🪙 Med Coin va AI tariflari", "/ai-subscription")],
    [app("💎 Biznes tariflari", "/pricing"), app("📣 Med1 TOP reklama", "/med1-top")],
    [app("🧾 Mening to‘lovlarim", "/dashboard")],
    [callback("⬅️ Asosiy menyu", "menu")],
  ],
};

const MEDIA_MENU = {
  inline_keyboard: [
    [app("📰 So‘nggi yangiliklar", "/news"), app("📚 Tibbiy maqolalar", "/articles")],
    [app("🏆 Yutuqlar va ochiqlik", "/transparency"), app("🎙 OAV va media", "/about")],
    [app("📖 Tibbiy ensiklopediya", "/knowledge"), app("❤️ Salomatlik", "/health")],
    [callback("⬅️ Asosiy menyu", "menu")],
  ],
};

const DOCS_MENU = {
  inline_keyboard: [
    [app("✍️ Mening shartnomalarim", "/legal-center")],
    [app("📜 Foydalanish shartlari", "/terms"), app("🔒 Maxfiylik", "/privacy")],
    [app("⚠️ Tibbiy ogohlantirish", "/disclaimer"), app("🏢 SaaS shartlari", "/saas-terms")],
    [app("✅ Hujjatni tekshirish", "/verify"), app("📖 API hujjatlari", "/api-docs")],
    [callback("⬅️ Asosiy menyu", "menu")],
  ],
};

const PLATFORM_MENU = {
  inline_keyboard: [
    [app("ℹ️ Biz haqimizda", "/about"), app("🤝 Hamkorlik", "/partnership")],
    [app("🧭 Xizmatlar", "/services"), app("📘 Foydalanish qo‘llanmasi", "/user-guide")],
    [app("🗺 Sayt xaritasi", "/sitemap"), app("☎️ Bog‘lanish", "/contact")],
    [app("👨‍💻 Dasturchilar", "/developers"), app("📣 Reklama", "/med1-top")],
    [callback("⬅️ Asosiy menyu", "menu")],
  ],
};

const REPLY_ROWS = [
  [{ text: "👤 Kabinetlarim" }, { text: "🤖 AI xizmatlar" }],
  [{ text: "🏥 Tibbiy xizmatlar" }, { text: "💼 Biznes" }],
  [{ text: "💳 To‘lovlar" }, { text: "📰 Yangiliklar" }],
  [{ text: "📄 Hujjatlar" }, { text: "☎️ Yordam" }],
];
const REPLY_ACTIONS: Record<string, string> = {
  "👤 Kabinetlarim": "profile", "🤖 AI xizmatlar": "ai", "🏥 Tibbiy xizmatlar": "services", "💼 Biznes": "business",
  "💳 To‘lovlar": "payments", "📰 Yangiliklar": "media", "📄 Hujjatlar": "docs", "☎️ Yordam": "help",
};
const replyKeyboard = (linked: boolean) => ({
  keyboard: linked ? REPLY_ROWS : [[{ text: "📱 Telefon raqamimni yuborish", request_contact: true }], ...REPLY_ROWS],
  resize_keyboard: true,
  is_persistent: true,
  input_field_placeholder: "Bo‘limni tanlang 👇",
});

const DAILY_MESSAGES = [
  { text: "🌅 <b>Xayrli tong!</b>\n\nBugun o‘zingizni qanday his qilyapsiz? 🤖 AI shifokorga 1 daqiqada simptomlaringizni yozing — qayerga murojaat qilishni aytib beradi.", button: "🤖 AI shifokor bilan suhbat", path: "/ai-doctor-chat" },
  { text: "🧪 <b>Tahlil natijangiz tushunarsizmi?</b>\n\nRasmini yuklang — AI har bir ko‘rsatkichni oddiy tilda tushuntiradi.", button: "📊 Tahlilni AI’ga ko‘rsatish", path: "/ai-report-analysis" },
  { text: "🥗 <b>Bugungi menyu tayyormi?</b>\n\nAI dietolog yoshingiz va maqsadingizga mos ovqatlanish rejasini tuzib beradi.", button: "🥗 AI dietolog", path: "/ai-dietolog" },
  { text: "❤️ <b>Yuragingiz sizga rahmat aytadi!</b>\n\n2 daqiqalik test bilan sog‘liq xavflaringizni AI yordamida baholang.", button: "❤️ Sog‘liq xavfini tekshirish", path: "/ai-health-risk" },
  { text: "🧠 <b>Stress ko‘paydimi?</b>\n\nAI psixolog bilan anonim suhbatlashing — hech kim bilmaydi, maslahat esa tayyor.", button: "🧠 AI psixolog", path: "/ai-psixolog" },
  { text: "💊 <b>Dorilarni birga ichsa bo‘ladimi?</b>\n\nAI farmatsevt dori o‘zaro ta’sirini soniyalarda tekshiradi.", button: "💊 AI farmatsevt", path: "/ai-farmatsevt" },
  { text: "🏃 <b>Harakat — bu dori!</b>\n\nAI fitness murabbiy sizga mos kunlik mashqlar rejasini tuzadi.", button: "🏃 AI fitness", path: "/ai-fitness" },
];

async function trackUser(from: Record<string, unknown> | undefined, chatId: number) {
  const { error } = await db.from("emedinfo_bot_users").upsert({
    chat_id: chatId,
    first_name: from?.first_name ?? null,
    username: from?.username ?? null,
    language_code: from?.language_code ?? null,
    last_seen_at: new Date().toISOString(),
    is_blocked: false,
  }, { onConflict: "chat_id" });
  if (error) console.error("trackUser failed", error);
}

async function openAccount(chatId: number, userId: string, role: string) {
  const profiles = await findProfiles(chatId);
  const profile = profiles.find((item) => item.user_id === userId);
  const path = ROLE_PATH[role];
  if (!profile || !path) return tg("sendMessage", { chat_id: chatId, text: "❌ Bu profil sizning Telegram hisobingizga ulanmagan." });
  const roles = await getRoles([profile]);
  if (!roles.some((row) => row.role === role)) return tg("sendMessage", { chat_id: chatId, text: "❌ Bu profilda ushbu rol mavjud emas." });
  let url = `${SITE}${path}`;
  const { data: userData } = await db.auth.admin.getUserById(userId);
  const email = userData?.user?.email;
  if (email) {
    const { data: link, error } = await db.auth.admin.generateLink({ type: "magiclink", email, options: { redirectTo: url } });
    if (error) console.error("generateLink failed", error);
    else if (link?.properties?.action_link) url = link.properties.action_link;
  }
  return tg("sendMessage", {
    chat_id: chatId,
    parse_mode: "HTML",
    text: `🔐 <b>${esc(profile.full_name ?? "Profil")}</b> — ${esc(ROLE_LABEL[role] ?? role)} kabineti\n\nQuyidagi tugma aynan shu profilga kiradi. Havola bir martalik va qisqa muddat amal qiladi.`,
    reply_markup: { inline_keyboard: [[{ text: `🚀 ${ROLE_LABEL[role] ?? role} kabinetini ochish`, web_app: { url } }], [callback("⬅️ Kabinetlarim", "profile")]] },
  });
}

async function sendDaily(limit = 600) {
  const cutoff = new Date(Date.now() - 20 * 3600_000).toISOString();
  const { data: users, error } = await db.from("emedinfo_bot_users")
    .select("chat_id, first_name")
    .eq("is_blocked", false).eq("daily_opt_out", false)
    .or(`last_daily_at.is.null,last_daily_at.lt.${cutoff}`)
    .order("last_seen_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  const day = Math.floor(Date.now() / 86400_000);
  const item = DAILY_MESSAGES[day % DAILY_MESSAGES.length];
  let sent = 0, failed = 0;
  for (const user of users ?? []) {
    await db.from("emedinfo_bot_users").update({ last_daily_at: new Date().toISOString() }).eq("chat_id", user.chat_id);
    const name = user.first_name ? `${esc(user.first_name)}, ` : "";
    const result = await tg("sendMessage", {
      chat_id: user.chat_id,
      parse_mode: "HTML",
      text: `${name}${item.text}\n\n<i>Med1.uz — sog‘ligingiz uchun har kuni yoningizda 💙</i>`,
      reply_markup: { inline_keyboard: [[app(item.button, item.path)], [app("✨ Barcha AI xizmatlar", "/ai-services")], [callback("🔕 Kunlik xabarni o‘chirish", "daily_off")]] },
    });
    if (result?.ok) sent++; else { failed++; if (result?.error_code === 403) await db.from("emedinfo_bot_users").update({ is_blocked: true }).eq("chat_id", user.chat_id); }
    await new Promise((r) => setTimeout(r, 40));
  }
  if (sent || failed) await db.from("emedinfo_bot_broadcasts").insert({ kind: "daily_ai", message: item.text, button_text: item.button, button_path: item.path, sent_count: sent, failed_count: failed });
  return { sent, failed };
}

async function broadcast(body: Record<string, unknown>, adminId: string) {
  const message = String(body?.message ?? "").trim().slice(0, 3500);
  const buttonText = String(body?.button_text ?? "").trim().slice(0, 60);
  const buttonPath = String(body?.button_path ?? "").trim();
  const segment = String(body?.segment ?? "all");
  if (!message) throw new Error("Xabar matni kerak");
  if (buttonPath && (!buttonPath.startsWith("/") || buttonPath.startsWith("//"))) throw new Error("Tugma yo‘li / bilan boshlanishi kerak");
  let query = db.from("emedinfo_bot_users").select("chat_id").eq("is_blocked", false).order("last_seen_at", { ascending: false }).limit(2000);
  if (segment === "linked") {
    const { data: linked } = await db.from("profiles").select("telegram_chat_id").not("telegram_chat_id", "is", null).limit(5000);
    const ids = [...new Set((linked ?? []).map((row) => Number(row.telegram_chat_id)).filter(Boolean))];
    if (!ids.length) return { sent: 0, failed: 0 };
    query = query.in("chat_id", ids);
  }
  const { data: users, error } = await query;
  if (error) throw error;
  const markup = buttonText && buttonPath ? { inline_keyboard: [[app(buttonText, buttonPath)]] } : undefined;
  let sent = 0, failed = 0;
  for (const user of users ?? []) {
    const result = await tg("sendMessage", { chat_id: user.chat_id, parse_mode: "HTML", text: `🔔 <b>Med1.uz eslatma</b>\n\n${esc(message)}`, reply_markup: markup });
    if (result?.ok) sent++; else { failed++; if (result?.error_code === 403) await db.from("emedinfo_bot_users").update({ is_blocked: true }).eq("chat_id", user.chat_id); }
    await new Promise((r) => setTimeout(r, 40));
  }
  await db.from("emedinfo_bot_broadcasts").insert({ kind: segment === "linked" ? "manual_linked" : "manual", message, button_text: buttonText || null, button_path: buttonPath || null, sent_count: sent, failed_count: failed, created_by: adminId });
  return { sent, failed };
}

async function botStats() {
  const count = async (build: (q: any) => any) => { const { count: c } = await build(db.from("emedinfo_bot_users").select("chat_id", { count: "exact", head: true })); return c ?? 0; };
  const day = new Date(Date.now() - 86400_000).toISOString();
  const week = new Date(Date.now() - 7 * 86400_000).toISOString();
  const { count: linked } = await db.from("profiles").select("user_id", { count: "exact", head: true }).not("telegram_chat_id", "is", null);
  const { data: broadcasts } = await db.from("emedinfo_bot_broadcasts").select("*").order("created_at", { ascending: false }).limit(20);
  return {
    total: await count((q) => q),
    active24h: await count((q) => q.gte("last_seen_at", day)),
    active7d: await count((q) => q.gte("last_seen_at", week)),
    new7d: await count((q) => q.gte("started_at", week)),
    blocked: await count((q) => q.eq("is_blocked", true)),
    dailyOptOut: await count((q) => q.eq("daily_opt_out", true)),
    linkedProfiles: linked ?? 0,
    broadcasts: broadcasts ?? [],
  };
}

const CONTACT_KB = {
  keyboard: [[{ text: "📱 Telefon raqamimni yuborish", request_contact: true }]],
  resize_keyboard: true,
  one_time_keyboard: true,
  input_field_placeholder: "Hisobni ulash uchun raqamingizni yuboring",
};

function phoneVariants(raw: unknown) {
  const digits = String(raw ?? "").replace(/\D/g, "");
  const national = digits.startsWith("998") ? digits : `998${digits.replace(/^0+/, "")}`;
  return [...new Set([`+${national}`, national, `+${digits}`, digits])].filter((value) => value.length >= 12);
}

async function findProfiles(chatId: number | string): Promise<Profile[]> {
  const { data, error } = await db.from("profiles")
    .select("user_id, full_name, phone")
    .eq("telegram_chat_id", String(chatId))
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) console.error("findProfiles failed", error);
  return (data ?? []) as Profile[];
}

async function getRoles(profiles: Profile[]): Promise<UserRole[]> {
  const userIds = [...new Set(profiles.map((profile) => profile.user_id))];
  if (!userIds.length) return [];
  const { data, error } = await db.from("user_roles").select("user_id, role").in("user_id", userIds);
  if (error) console.error("getRoles failed", error);
  return ((data ?? []) as UserRole[]).filter((row) => row.role !== "admin");
}

async function linkProfilesByPhone(chatId: number, rawPhone: unknown) {
  const variants = phoneVariants(rawPhone);
  if (!variants.length) return [] as Profile[];
  const filter = variants.map((value) => `phone.eq.${value}`).join(",");
  const { data: matches, error } = await db.from("profiles")
    .select("user_id, full_name, phone")
    .or(filter)
    .limit(20);
  if (error) console.error("profile phone lookup failed", error);
  const profiles = (matches ?? []) as Profile[];
  if (profiles.length) {
    const userIds = profiles.map((profile) => profile.user_id);
    const { error: updateError } = await db.from("profiles")
      .update({ telegram_chat_id: String(chatId) })
      .in("user_id", userIds);
    if (updateError) console.error("profile link failed", updateError);
  }
  return profiles;
}

async function sendSection(chatId: number, title: string, subtitle: string, menu: Record<string, unknown>) {
  await tg("sendMessage", {
    chat_id: chatId,
    text: `${HEADER}\n\n${title}\n${subtitle}`,
    parse_mode: "HTML",
    reply_markup: menu,
  });
}

async function sendMenu(chatId: number) {
  const profiles = await findProfiles(chatId);
  const status = profiles.length
    ? `✅ <b>${profiles.length > 1 ? `${profiles.length} ta profilingiz` : "Hisobingiz"} ulangan.</b>`
    : "🔗 Kabinet uchun telefon raqamingizni bir marta ulang.";
  await tg("sendMessage", {
    chat_id: chatId,
    text: `${HEADER}\n\n${status}\nKerakli bo‘limni tanlang 👇`,
    parse_mode: "HTML",
    reply_markup: MAIN_MENU,
  });
}

async function sendProfile(chatId: number) {
  const profiles = await findProfiles(chatId);
  if (!profiles.length) {
    await tg("sendMessage", {
      chat_id: chatId,
      parse_mode: "HTML",
      text: "👤 <b>Shaxsiy kabinet</b>\n\nHisobingiz hali botga ulanmagan. Telefon raqamingizni bir marta yuboring yoki ro‘yxatdan o‘ting.",
      reply_markup: CONTACT_KB,
    });
    await tg("sendMessage", {
      chat_id: chatId,
      text: "Yangi hisob kerakmi?",
      reply_markup: { inline_keyboard: [[app("📝 Ro‘yxatdan o‘tish", "/auth?mode=register")], [callback("⬅️ Menyu", "menu")]] },
    });
    return;
  }

  const roles = await getRoles(profiles);
  const userIds = profiles.map((profile) => profile.user_id);
  const { data: wallet } = await db.from("user_credits")
    .select("user_id, balance")
    .in("user_id", userIds)
    .gt("expires_at", new Date().toISOString());
  const coins = (wallet ?? []).reduce((sum, row) => sum + Number(row.balance || 0), 0);
  const roleList = [...new Set(roles.map((row) => row.role))];
  const names = [...new Set(profiles.map((profile) => profile.full_name).filter(Boolean))].join(" / ");
  const phones = [...new Set(profiles.map((profile) => profile.phone).filter(Boolean))].join(" / ");
  const buttons: Array<Array<Record<string, unknown>>> = [];
  for (const profile of profiles) {
    const own = roles.filter((row) => row.user_id === profile.user_id && ROLE_PATH[row.role]);
    const label = profiles.length > 1 ? ` — ${(profile.full_name ?? "Profil").slice(0, 18)}` : "";
    for (const row of own) {
      buttons.push([callback(`${row.role === "patient" ? "👤" : "💼"} ${ROLE_LABEL[row.role] ?? row.role}${label}`, `go:${profile.user_id}:${row.role}`)]);
    }
  }
  buttons.push([app("✍️ Shartnomalar", "/legal-center"), app("🪙 To‘lovlar", "/ai-subscription")]);
  buttons.push([callback("⬅️ Asosiy menyu", "menu")]);

  await tg("sendMessage", {
    chat_id: chatId,
    parse_mode: "HTML",
    text: `👤 <b>Shaxsiy kabinet</b>\n━━━━━━━━━━━━━━\n🧑 Ism: <b>${esc(names)}</b>\n📱 Telefon: ${esc(phones)}\n🎭 Rollar: ${esc(roleList.map((role) => ROLE_LABEL[role] ?? role).join(", "))}\n🪙 Med Coin: <b>${coins}</b>\n🔗 Ulangan profil: <b>${profiles.length}</b>\n━━━━━━━━━━━━━━`,
    reply_markup: { inline_keyboard: buttons },
  });
}

async function sendBusiness(chatId: number) {
  const profiles = await findProfiles(chatId);
  if (!profiles.length) return sendProfile(chatId);
  const roleRows = (await getRoles(profiles)).filter((row) => row.role !== "patient" && ROLE_PATH[row.role]);
  const roles = [...new Set(roleRows.map((row) => row.role))];
  if (!roles.length) {
    await tg("sendMessage", {
      chat_id: chatId,
      text: "💼 Biznes profilingiz topilmadi. Hamkor sifatida ro‘yxatdan o‘tishingiz mumkin.",
      reply_markup: { inline_keyboard: [[app("🤝 Hamkor bo‘lish", "/partnership")], [callback("⬅️ Menyu", "menu")]] },
    });
    return;
  }
  const buttons: Array<Array<Record<string, unknown>>> = roleRows.map((row) => {
    const owner = profiles.find((p) => p.user_id === row.user_id);
    const label = profiles.length > 1 ? ` — ${(owner?.full_name ?? "Profil").slice(0, 18)}` : "";
    return [callback(`💼 ${ROLE_LABEL[row.role] ?? row.role}${label}`, `go:${row.user_id}:${row.role}`)];
  });
  buttons.push([app("📊 Tahlil va moliya", ROLE_PATH[roles[0]]), app("📣 Marketing", "/med1-top/my")]);
  buttons.push([app("👥 Xodimlar", "/check-in"), app("✍️ Yuridik markaz", "/legal-center")]);
  buttons.push([callback("⬅️ Asosiy menyu", "menu")]);
  await tg("sendMessage", {
    chat_id: chatId,
    parse_mode: "HTML",
    text: `💼 <b>Biznes boshqaruvi</b>\n\nSizga biriktirilgan ${roles.length} ta biznes rol bo‘yicha kabinetlar:`,
    reply_markup: { inline_keyboard: buttons },
  });
}

async function handleCallback(chatId: number, data: string) {
  if (data.startsWith("go:")) { const [, userId, role] = data.split(":"); return openAccount(chatId, userId, role); }
  if (data === "daily_off" || data === "daily_on") {
    await db.from("emedinfo_bot_users").update({ daily_opt_out: data === "daily_off" }).eq("chat_id", chatId);
    return tg("sendMessage", { chat_id: chatId, text: data === "daily_off" ? "🔕 Kunlik AI xabarlari o‘chirildi." : "🔔 Kunlik AI xabarlari yoqildi.", reply_markup: { inline_keyboard: [[callback(data === "daily_off" ? "🔔 Qayta yoqish" : "🔕 O‘chirish", data === "daily_off" ? "daily_on" : "daily_off")]] } });
  }
  if (data === "profile" || data === "patient") return sendProfile(chatId);
  if (data === "business") return sendBusiness(chatId);
  if (data === "ai") return sendSection(chatId, "🤖 <b>AI salomatlik markazi</b>", "Kerakli AI xizmatini tanlang:", AI_MENU);
  if (data === "services") return sendSection(chatId, "🏥 <b>Tibbiy xizmatlar</b>", "Barcha xizmatlar sayt bilan jonli sinxron ishlaydi:", SERVICES_MENU);
  if (data === "payments") return sendSection(chatId, "💳 <b>Tariflar va to‘lovlar</b>", "Med Coin, obuna va reklama boshqaruvi:", PAYMENTS_MENU);
  if (data === "media") return sendSection(chatId, "📰 <b>Yangiliklar, yutuqlar va OAV</b>", "Eng so‘nggi materiallar Med1.uz’dan ochiladi:", MEDIA_MENU);
  if (data === "docs") return sendSection(chatId, "📄 <b>Hujjatlar va shartnomalar</b>", "Ko‘rish, imzolash, yuklab olish va tekshirish:", DOCS_MENU);
  if (data === "platform") return sendSection(chatId, "🌐 <b>Med1.uz platformasi</b>", "Platforma, hamkorlik va aloqa bo‘limlari:", PLATFORM_MENU);
  if (data === "help") {
    return tg("sendMessage", {
      chat_id: chatId,
      parse_mode: "HTML",
      text: "☎️ <b>Yordam</b>\n\n/menu — barcha bo‘limlar\n/kabinet — shaxsiy kabinet\n/business — biznes boshqaruvi\n/ai — AI xizmatlar\n/services — tibbiy xizmatlar\n/news — yangiliklar\n/docs — hujjatlar\n/about — platforma haqida\n\n🌐 med1.uz/contact",
      reply_markup: { inline_keyboard: [[app("☎️ Yordam markazi", "/contact")], [callback("⬅️ Menyu", "menu")]] },
    });
  }
  return sendMenu(chatId);
}

async function setupBot() {
  const secret = await webhookSecret();
  return {
    webhook: await tg("setWebhook", {
      url: `${SUPABASE_URL}/functions/v1/emedinfo-bot`,
      secret_token: secret,
      allowed_updates: ["message", "callback_query"],
      drop_pending_updates: false,
    }),
    commands: await tg("setMyCommands", { commands: [
      { command: "start", description: "Med1.uz botini boshlash" },
      { command: "menu", description: "Barcha bo‘limlar" },
      { command: "kabinet", description: "Shaxsiy kabinet" },
      { command: "patient", description: "Bemor kabineti" },
      { command: "business", description: "Biznes boshqaruvi" },
      { command: "ai", description: "AI salomatlik xizmatlari" },
      { command: "services", description: "Tibbiy xizmatlar" },
      { command: "news", description: "Yangiliklar va OAV" },
      { command: "docs", description: "Hujjatlar va shartnomalar" },
      { command: "about", description: "Med1.uz haqida" },
      { command: "help", description: "Yordam" },
    ] }),
    menuButton: await tg("setChatMenuButton", { menu_button: { type: "web_app", text: "Med1.uz", web_app: { url: SITE } } }),
    name: await tg("setMyName", { name: "Med1.uz — Tibbiy AI" }),
    descriptionUz: await tg("setMyDescription", { description: "Med1.uz — O‘zbekistonning raqamli tibbiyot ekotizimi. AI shifokor, klinika va shifokorlar, onlayn qabul, tahlillar, to‘lovlar, shartnomalar hamda bemor va biznes kabinetlari.", language_code: "uz" }),
    descriptionEn: await tg("setMyDescription", { description: "Med1.uz is Uzbekistan’s digital healthcare ecosystem for medical AI, doctors, clinics, appointments, diagnostics, payments, contracts, and secure patient and business accounts.", language_code: "en" }),
    descriptionDefault: await tg("setMyDescription", { description: "Med1.uz — raqamli tibbiyot va Medical AI platformasi. Bemor va biznes uchun yagona Telegram Mini App." }),
    shortDescription: await tg("setMyShortDescription", { short_description: "🏥 Medical AI, klinikalar, to‘lovlar va shaxsiy kabinet" }),
    avatar: await setBotAvatar(),
  };
}

async function authenticatedAdmin(req: Request): Promise<string | false> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const authClient = createClient(SUPABASE_URL, anonKey, { global: { headers: { Authorization: authHeader } } });
  const { data, error } = await authClient.auth.getClaims(authHeader.slice(7));
  const userId = data?.claims?.sub;
  if (error || !userId) return false;
  const { data: isAdmin } = await db.rpc("has_role", { _user_id: userId, _role: "admin" });
  return isAdmin ? String(userId) : false;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (!TOKEN || !SUPABASE_URL || !SERVICE_KEY) {
    return new Response(JSON.stringify({ error: "Bot configuration is incomplete" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  const url = new URL(req.url);

  try {
    if (url.pathname.endsWith("/setup")) {
      if (!(await authenticatedAdmin(req))) return new Response("Forbidden", { status: 403, headers: corsHeaders });
      return new Response(JSON.stringify(await setupBot()), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (url.pathname.endsWith("/stats")) {
      if (!(await authenticatedAdmin(req))) return new Response("Forbidden", { status: 403, headers: corsHeaders });
      return json(await botStats());
    }
    if (url.pathname.endsWith("/broadcast")) {
      const adminId = await authenticatedAdmin(req);
      if (!adminId) return new Response("Forbidden", { status: 403, headers: corsHeaders });
      try { return json(await broadcast(await req.json(), adminId)); } catch (e) { return json({ error: (e as Error).message }, 400); }
    }
    if (url.pathname.endsWith("/daily")) {
      // Idempotent: each user receives at most one message per 20 hours.
      return json(await sendDaily());
    }

    if (url.pathname.endsWith("/publish")) {
      if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });
      if (!(await authenticatedAdmin(req))) return new Response("Forbidden", { status: 403, headers: corsHeaders });
      if (!CHANNEL_ID) return new Response(JSON.stringify({ error: "Telegram kanal hali ulanmagan" }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const body = await req.json();
      const title = String(body?.title ?? "").trim().slice(0, 240);
      const summary = String(body?.summary ?? "").trim().slice(0, 1200);
      const path = String(body?.path ?? "/news");
      if (!title || !summary || !path.startsWith("/") || path.startsWith("//")) {
        return new Response(JSON.stringify({ error: "Sarlavha, qisqa matn va xavfsiz sayt yo‘li talab qilinadi" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const result = await tg("sendMessage", {
        chat_id: CHANNEL_ID,
        parse_mode: "HTML",
        text: `📰 <b>${esc(title)}</b>\n\n${esc(summary)}\n\n🌐 Med1.uz`,
        reply_markup: { inline_keyboard: [[{ text: "Batafsil o‘qish", url: `${SITE}${path}` }]] },
      });
      return new Response(JSON.stringify(result), { status: result?.ok ? 200 : 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (req.method !== "POST") return new Response("ok", { headers: corsHeaders });
    if (req.headers.get("X-Telegram-Bot-Api-Secret-Token") !== await webhookSecret()) {
      return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    }

    const update = await req.json();
    if (update.callback_query) {
      const query = update.callback_query;
      const chatId = query.message?.chat?.id;
      await tg("answerCallbackQuery", { callback_query_id: query.id });
      if (chatId) await trackUser(query.from, Number(chatId));
      if (chatId) await handleCallback(chatId, String(query.data ?? "menu"));
      return new Response("ok", { headers: corsHeaders });
    }

    const msg = update.message;
    if (!msg?.chat?.id) return new Response("ok", { headers: corsHeaders });
    const chatId = Number(msg.chat.id);
    await trackUser(msg.from, chatId);

    if (msg.contact) {
      if (msg.contact.user_id && msg.contact.user_id !== msg.from?.id) {
        await tg("sendMessage", { chat_id: chatId, text: "❌ Faqat o‘z telefon raqamingizni yuboring." });
        return new Response("ok", { headers: corsHeaders });
      }
      const normalizedPhone = phoneVariants(msg.contact.phone_number)[0];
      if (!normalizedPhone) {
        await tg("sendMessage", { chat_id: chatId, text: "❌ Telefon raqam formati noto‘g‘ri." });
        return new Response("ok", { headers: corsHeaders });
      }
      await db.from("telegram_otp").upsert({
        phone: normalizedPhone,
        chat_id: chatId,
        is_verified: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: "phone" });
      const linked = await linkProfilesByPhone(chatId, normalizedPhone);
      if (linked.length) {
        await tg("sendMessage", {
          chat_id: chatId,
          parse_mode: "HTML",
          text: `✅ <b>${linked.length > 1 ? `${linked.length} ta hisobingiz` : "Hisobingiz"} botga ulandi!</b>\nBildirishnomalar va tahlil natijalari shu yerga keladi.`,
          reply_markup: replyKeyboard(true),
        });
        await sendProfile(chatId);
      } else {
        await tg("sendMessage", {
          chat_id: chatId,
          parse_mode: "HTML",
          text: `📱 Raqam saqlandi: <b>${esc(normalizedPhone)}</b>\n\nBu raqam bilan hisob topilmadi. Ro‘yxatdan o‘tishda “Telefon” usulini tanlang.`,
          reply_markup: { remove_keyboard: true },
        });
        await tg("sendMessage", { chat_id: chatId, text: "Yangi hisob ochish:", reply_markup: { inline_keyboard: [[app("📝 Ro‘yxatdan o‘tish", "/auth?mode=register")], [callback("⬅️ Menyu", "menu")]] } });
      }
      return new Response("ok", { headers: corsHeaders });
    }

    const text = String(msg.text ?? "").trim();
    const cmd = text.split(/[\s@]/)[0].toLowerCase();
    if (cmd === "/start") {
      const profiles = await findProfiles(chatId);
      const name = msg.from?.first_name ? `, ${esc(msg.from.first_name)}` : "";
      if (profiles.length) {
        await tg("sendMessage", {
          chat_id: chatId,
          parse_mode: "HTML",
          text: `${HEADER}\n\nAssalomu alaykum${name}! 👋\n✅ Hisobingiz ulangan. Pastdagi menyu doim ochiq turadi 👇`,
          reply_markup: replyKeyboard(true),
        });
        await sendMenu(chatId);
      } else {
        await tg("sendMessage", {
          chat_id: chatId,
          parse_mode: "HTML",
          text: `${HEADER}\n\nAssalomu alaykum${name}! 👋\nMed1.uz botiga xush kelibsiz. Kabinet, tahlil va bildirishnomalarni ulash uchun telefon raqamingizni bir marta yuboring.`,
          reply_markup: replyKeyboard(false),
        });
        await sendMenu(chatId);
      }
    } else if (cmd === "/menu") await sendMenu(chatId);
    else if (cmd === "/kabinet" || cmd === "/profile" || cmd === "/patient") await sendProfile(chatId);
    else if (cmd === "/business") await sendBusiness(chatId);
    else if (cmd === "/ai") await handleCallback(chatId, "ai");
    else if (cmd === "/services") await handleCallback(chatId, "services");
    else if (cmd === "/news") await handleCallback(chatId, "media");
    else if (cmd === "/docs") await handleCallback(chatId, "docs");
    else if (cmd === "/about") await handleCallback(chatId, "platform");
    else if (cmd === "/help") await handleCallback(chatId, "help");
    else if (cmd === "/stop_daily") await handleCallback(chatId, "daily_off");
    else if (REPLY_ACTIONS[text]) await handleCallback(chatId, REPLY_ACTIONS[text]);
    else await sendMenu(chatId);

    return new Response("ok", { headers: corsHeaders });
  } catch (error) {
    console.error("emedinfo-bot error", error);
    return new Response("ok", { headers: corsHeaders });
  }
});