import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { captureReferralFromUrl } from "@/lib/referralCapture";

/**
 * Mount inside <BrowserRouter>. On every route change, checks the URL for
 * ?ref= / ?referral= / ?invite= and persists the code to localStorage so the
 * registration flow can attach it to the new account.
 */
export default function ReferralCapture() {
  const location = useLocation();
  useEffect(() => {
    captureReferralFromUrl();
  }, [location.pathname, location.search]);
  return null;
}
