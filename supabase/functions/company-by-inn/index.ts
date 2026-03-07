import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { inn } = await req.json();

    if (!inn || !/^\d{9}$/.test(inn)) {
      return new Response(
        JSON.stringify({ error: "INN 9 ta raqamdan iborat bo'lishi kerak" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Try to fetch from Uzbekistan tax API
    let companyData = null;
    try {
      const response = await fetch(`https://orginfo.uz/api/search?q=${inn}`, {
        headers: { 'Accept': 'application/json' },
      });
      if (response.ok) {
        const data = await response.json();
        if (data && data.data && data.data.length > 0) {
          const company = data.data[0];
          companyData = {
            found: true,
            name: company.name || company.title || "",
            director: company.director || company.head || "",
            address: company.address || "",
            registrationDate: company.reg_date || company.registration_date || "",
            inn: inn,
          };
        }
      }
    } catch {
      // External API not available, try fallback
    }

    // Fallback: try another API
    if (!companyData) {
      try {
        const response = await fetch(`https://api.opendata.uz/company/${inn}`, {
          headers: { 'Accept': 'application/json' },
        });
        if (response.ok) {
          const data = await response.json();
          if (data) {
            companyData = {
              found: true,
              name: data.name || data.full_name || "",
              director: data.director || "",
              address: data.legal_address || data.address || "",
              registrationDate: data.reg_date || "",
              inn: inn,
            };
          }
        }
      } catch {
        // API not available
      }
    }

    if (!companyData) {
      return new Response(
        JSON.stringify({ found: false, message: "Ma'lumot topilmadi. Ma'lumotlarni qo'lda kiritishingiz mumkin." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify(companyData),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Xatolik yuz berdi", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
