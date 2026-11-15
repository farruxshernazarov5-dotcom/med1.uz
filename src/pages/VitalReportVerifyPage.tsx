import { useParams } from "react-router-dom";
import PrivateDocumentVerification from "@/components/PrivateDocumentVerification";

export default function VitalReportVerifyPage() {
  const { code = "" } = useParams();
  return <PrivateDocumentVerification kind="vital" initialCode={code} />;
}