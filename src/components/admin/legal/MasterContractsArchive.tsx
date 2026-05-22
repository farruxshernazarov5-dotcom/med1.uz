import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, FileSignature, Languages, ShieldCheck, QrCode } from "lucide-react";

const DIRECTOR = "Shernazarov Farrux";
const IIN = "312972027";
const DOC_NO = "LGL-MASTER-2026-0001";
const HASH_ID = "73cca99e9a75d03e4e462ba2fc0cd504";
const VERIFY_URL = `https://med1.uz/verify/contract/${HASH_ID}`;

const FILES = [
  { lang: "O'zbek", code: "UZ", flag: "🇺🇿", pdf: "Shartnoma-MED1UZ-Master-UZ.pdf", docx: "Shartnoma-MED1UZ-Master-UZ.docx" },
  { lang: "Русский", code: "RU", flag: "🇷🇺", pdf: "Shartnoma-MED1UZ-Master-RU.pdf", docx: "Shartnoma-MED1UZ-Master-RU.docx" },
  { lang: "English", code: "EN", flag: "🇬🇧", pdf: "Shartnoma-MED1UZ-Master-EN.pdf", docx: "Shartnoma-MED1UZ-Master-EN.docx" },
];

export default function MasterContractsArchive() {
  const download = (name: string) => {
    // Files are stored in /mnt/documents (artifacts). Provide a public path mirror:
    const url = `/contracts/${name}`;
    const a = document.createElement("a");
    a.href = url; a.download = name; a.click();
  };

  return (
    <div className="space-y-6">
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white">
                <FileSignature className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-xl">Bosh Shartnoma Arxivi</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  MED-ALL AI / MED1.UZ — Enterprise Master Services Agreement
                </p>
              </div>
            </div>
            <Badge variant="outline" className="gap-1"><ShieldCheck className="w-3 h-3" /> Notarial darajada</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div><div className="text-muted-foreground text-xs">Hujjat №</div><div className="font-semibold">{DOC_NO}</div></div>
          <div><div className="text-muted-foreground text-xs">Direktor</div><div className="font-semibold">{DIRECTOR}</div></div>
          <div><div className="text-muted-foreground text-xs">STIR / INN</div><div className="font-semibold">{IIN}</div></div>
          <div><div className="text-muted-foreground text-xs">Hash ID</div><div className="font-mono text-xs truncate">{HASH_ID.slice(0, 16)}…</div></div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        {FILES.map((f) => (
          <Card key={f.code} className="hover:shadow-lg transition">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="text-2xl">{f.flag}</span> {f.lang}
                </CardTitle>
                <Badge variant="secondary"><Languages className="w-3 h-3 mr-1" /> {f.code}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button onClick={() => download(f.pdf)} className="w-full justify-start" variant="default">
                <FileText className="w-4 h-4 mr-2" /> PDF yuklab olish
                <Download className="w-4 h-4 ml-auto" />
              </Button>
              <Button onClick={() => download(f.docx)} className="w-full justify-start" variant="outline">
                <FileText className="w-4 h-4 mr-2" /> DOCX yuklab olish
                <Download className="w-4 h-4 ml-auto" />
              </Button>
              <div className="text-[10px] text-muted-foreground pt-1">
                16 modda • 3 ilova • QR + Hash ID • Suv belgisi
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <QrCode className="w-4 h-4" /> Hujjat haqiqiyligini tekshirish
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-2">
            Har bir PDF/DOCX yagona SHA-256 Hash ID va QR kodga ega. Tekshirish portali:
          </p>
          <a href={VERIFY_URL} target="_blank" rel="noreferrer"
             className="text-primary text-sm font-mono underline break-all">{VERIFY_URL}</a>
        </CardContent>
      </Card>

      <Card className="bg-muted/30">
        <CardContent className="pt-6 text-xs text-muted-foreground space-y-1">
          <div>📜 <b>Huquqiy asos:</b> O'zRFK, "Shaxsiy ma'lumotlar", "ERI", "Elektron tijorat" qonunlari</div>
          <div>🔐 <b>Xavfsizlik:</b> AES-256, RLS, GDPR/HIPAA mosligi, 72 soatlik buzilish bildirishnomasi</div>
          <div>⚖️ <b>Sud:</b> Toshkent shahar Iqtisodiy sudi</div>
          <div>© 2018–2026 MED-ALL AI SYSTEM MCHJ</div>
        </CardContent>
      </Card>
    </div>
  );
}
