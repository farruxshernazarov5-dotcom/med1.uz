import { auth, defineMcp } from "@lovable.dev/mcp-js";
import searchKnowledge from "./tools/search-knowledge";
import listClinics from "./tools/list-clinics";
import getMyProfile from "./tools/get-my-profile";
import listMyAppointments from "./tools/list-my-appointments";

// Construct the OAuth issuer from the Supabase project ref only.
// SUPABASE_URL is the .lovable.cloud proxy on Lovable Cloud and would not
// match the direct supabase.co issuer that discovery advertises. The fallback
// keeps the string well-formed during the throwaway manifest-extract eval.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "med1-uz-mcp",
  title: "MED1.UZ",
  version: "0.1.0",
  instructions:
    "MED1.UZ tools. Use `search_knowledge` for medical article lookup (public), `list_clinics` to find registered clinics, `get_my_profile` for the signed-in user's MED1.UZ profile, and `list_my_appointments` to review the user's appointments. Authenticated tools act as the signed-in MED1.UZ user under RLS.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [searchKnowledge, listClinics, getMyProfile, listMyAppointments],
});
