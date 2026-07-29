import OfficialDocument from "@/components/legal/OfficialDocument";
import termsSource from "@/data/legal/terms-uz.md?raw";
import termsPdf from "@/assets/terms-uz.pdf.asset.json";

export const TermsPage = () => (
  <OfficialDocument
    title="Foydalanuvchi shartnomasi"
    subtitle="Ommaviy oferta (qo'shilish shartnomasi) · MED1.UZ raqamli tibbiyot ekotizimi"
    source={termsSource}
    pdfUrl={termsPdf.url}
    pdfName="MED1UZ-Foydalanuvchi-shartnomasi-UZ.pdf"
  />
);

export default TermsPage;
