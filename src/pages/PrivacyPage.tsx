import OfficialDocument from "@/components/legal/OfficialDocument";
import privacySource from "@/data/legal/privacy-uz.md?raw";
import privacyPdf from "@/assets/privacy-uz.pdf.asset.json";

export const PrivacyPage = () => (
  <OfficialDocument
    title="Maxfiylik siyosati"
    subtitle="Shaxsiy ma'lumotlarni qayta ishlash siyosati · MED1.UZ raqamli tibbiyot platformasi"
    source={privacySource}
    pdfUrl={privacyPdf.url}
    pdfName="MED1UZ-Maxfiylik-siyosati-UZ.pdf"
  />
);

export default PrivacyPage;
