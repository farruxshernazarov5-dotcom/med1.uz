import { supabase } from "@/integrations/supabase/client";

export interface PartyInfo {
  name: string;
  legal_name?: string | null;
  inn?: string | null;
  director_name?: string | null;
  license_number?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  source_table?: string;
}

export const OPERATOR = {
  name: '"MED-ALL AI SYSTEM" MChJ',
  inn: "312972027",
  director: "Shernazarov Farrux Farxodovich",
  address: "Samarqand viloyati, G'ijduvon SHFY, G'ijduvon ko'chasi, 173 A-uy",
  contacts: "med1.uz · info@med1.uz · +998 99 214 41 03",
};

const ROLE_TABLE: Record<string, { table: string; nameField: string; ownerField: string }> = {
  clinic: { table: "registered_clinics", nameField: "name", ownerField: "owner_id" },
  diagnostics: { table: "registered_diagnostics", nameField: "name", ownerField: "owner_id" },
  dental: { table: "registered_dental_clinics", nameField: "name", ownerField: "owner_id" },
  maternity: { table: "registered_maternity", nameField: "name", ownerField: "owner_id" },
  cosmetology: { table: "registered_cosmetology", nameField: "name", ownerField: "owner_id" },
  pharmacy: { table: "registered_pharmacies", nameField: "name", ownerField: "owner_id" },
  vendor: { table: "medtech_vendors", nameField: "company_name", ownerField: "owner_id" },
  bloodbank: { table: "blood_banks_registered", nameField: "name", ownerField: "owner_id" },
  doctor: { table: "doctors", nameField: "full_name", ownerField: "user_id" },
};

/** Foydalanuvchi roli bo'yicha tashkilot/shifokor rekvizitlarini yuklaydi */
export async function loadPartyInfo(userId: string, role?: string | null): Promise<PartyInfo> {
  const { data: profile } = await (supabase as any)
    .from("profiles")
    .select("full_name, phone, address")
    .eq("user_id", userId)
    .maybeSingle();

  const { data: authData } = await supabase.auth.getUser();
  const email = authData.user?.email || null;

  const cfg = role ? ROLE_TABLE[role] : undefined;
  if (cfg) {
    const { data: org } = await (supabase as any)
      .from(cfg.table)
      .select("*")
      .eq(cfg.ownerField, userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (org) {
      return {
        name: org[cfg.nameField] || profile?.full_name || "—",
        legal_name: org.legal_name ?? null,
        inn: org.inn ?? null,
        director_name: org.director_name ?? profile?.full_name ?? null,
        license_number: org.license_number ?? null,
        address: org.address ?? profile?.address ?? null,
        phone: org.phone ?? profile?.phone ?? null,
        email: org.email ?? email,
        source_table: cfg.table,
      };
    }
  }

  return {
    name: profile?.full_name || email || "—",
    director_name: profile?.full_name || null,
    address: profile?.address || null,
    phone: profile?.phone || null,
    email,
    source_table: "profiles",
  };
}

const dash = (v?: string | null) => (v && String(v).trim() ? String(v).trim() : "________________");

export interface FillContext {
  party: PartyInfo;
  contractNumber?: string | null;
  date?: Date;
}

/** Shartnoma matnidagi {{...}} joylarni to'ldiradi va rekvizit/imzo bloklarini qo'shadi */
export function fillContractBody(body: string, ctx: FillContext): string {
  const { party } = ctx;
  const date = ctx.date || new Date();
  const dateStr = date.toLocaleDateString("uz-UZ");

  const map: Record<string, string> = {
    partner_name: dash(party.legal_name || party.name),
    partner_short_name: dash(party.name),
    partner_inn: dash(party.inn),
    partner_director: dash(party.director_name),
    partner_address: dash(party.address),
    partner_phone: dash(party.phone),
    partner_email: dash(party.email),
    partner_license: dash(party.license_number),
    contract_number: dash(ctx.contractNumber),
    contract_date: dateStr,
    operator_name: OPERATOR.name,
    operator_inn: OPERATOR.inn,
    operator_director: OPERATOR.director,
    operator_address: OPERATOR.address,
  };

  const filled = (body || "").replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (m, key: string) =>
    map[key.toLowerCase()] !== undefined ? map[key.toLowerCase()] : m,
  );

  const header = [
    "## TOMONLAR REKVIZITLARI",
    "",
    `**Operator (Litsenziar):** ${OPERATOR.name} · STIR ${OPERATOR.inn}`,
    `Direktor: ${OPERATOR.director}`,
    `Manzil: ${OPERATOR.address}`,
    `Aloqa: ${OPERATOR.contacts}`,
    "",
    `**Hamkor (Mijoz):** ${dash(party.legal_name || party.name)}`,
    `STIR: ${dash(party.inn)}`,
    `Rahbar: ${dash(party.director_name)}`,
    `Litsenziya: ${dash(party.license_number)}`,
    `Manzil: ${dash(party.address)}`,
    `Telefon: ${dash(party.phone)} · Email: ${dash(party.email)}`,
    "",
    `Shartnoma sanasi: ${dateStr}`,
    ctx.contractNumber ? `Shartnoma raqami: ${ctx.contractNumber}` : "",
    "",
    "---",
    "",
  ]
    .filter(Boolean)
    .join("\n");

  const footer = [
    "",
    "---",
    "",
    "## TOMONLARNING IMZOLARI",
    "",
    `**Operator:** ${OPERATOR.name}, direktor ${OPERATOR.director} — elektron imzo (platforma tomonidan tasdiqlangan)`,
    "",
    `**Hamkor:** ${dash(party.legal_name || party.name)}, ${dash(party.director_name)} — elektron imzo (OTP + qo'l imzo yoki E-IMZO)`,
    "",
    "Imzolar elektron shaklda qo'yiladi va O'zbekiston Respublikasining «Elektron hujjat aylanishi to'g'risida»gi qonuniga muvofiq yozma imzoga teng kuchga ega.",
  ].join("\n");

  return `${header}${filled}${footer}`;
}
