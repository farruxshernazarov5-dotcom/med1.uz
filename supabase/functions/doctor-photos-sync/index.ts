import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PHOTO_BASE =
  "https://eqvwmwycjunvtyzbycis.supabase.co/storage/v1/object/public/doctor-photos";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: file, error: dlErr } = await admin.storage
      .from("doctor-imports")
      .download("doctor_photo_ids.json");
    if (dlErr || !file) throw new Error(dlErr?.message || "import file not found");

    const ids: string[] = JSON.parse(await file.text());
    let updated = 0;

    for (let i = 0; i < ids.length; i += 500) {
      const chunk = ids.slice(i, i + 500);
      for (const id of chunk) {
        // eslint-disable-next-line no-await-in-loop
      }
      const { error } = await admin.rpc("sync_doctor_photo_urls", {
        _ids: chunk,
        _base: PHOTO_BASE,
      });
      if (error) throw new Error(error.message);
      updated += chunk.length;
    }

    return new Response(JSON.stringify({ ok: true, total: ids.length, updated }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
