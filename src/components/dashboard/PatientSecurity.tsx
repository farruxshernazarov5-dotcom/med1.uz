import { useState } from "react";
import { Shield, Smartphone, Monitor, MapPin, Clock, LogOut, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface DeviceSession {
  id: string;
  name: string;
  type: "mobile" | "desktop" | "tablet";
  browser: string;
  location: string;
  lastActive: string;
  ip: string;
  isCurrent: boolean;
}

const mockSessions: DeviceSession[] = [
  {
    id: "1",
    name: "Chrome — Windows",
    type: "desktop",
    browser: "Chrome 120",
    location: "Toshkent, O'zbekiston",
    lastActive: "Hozir",
    ip: "192.168.1.***",
    isCurrent: true,
  },
  {
    id: "2",
    name: "Safari — iPhone 15",
    type: "mobile",
    browser: "Safari 17",
    location: "Toshkent, O'zbekiston",
    lastActive: "2 soat oldin",
    ip: "10.0.0.***",
    isCurrent: false,
  },
  {
    id: "3",
    name: "Firefox — MacOS",
    type: "desktop",
    browser: "Firefox 121",
    location: "Samarqand, O'zbekiston",
    lastActive: "3 kun oldin",
    ip: "172.16.0.***",
    isCurrent: false,
  },
];

interface LoginEntry {
  date: string;
  device: string;
  location: string;
  status: "success" | "failed";
}

const loginHistory: LoginEntry[] = [
  { date: "2026-03-27 14:30", device: "Chrome — Windows", location: "Toshkent", status: "success" },
  { date: "2026-03-27 10:15", device: "Safari — iPhone", location: "Toshkent", status: "success" },
  { date: "2026-03-26 22:00", device: "Firefox — MacOS", location: "Samarqand", status: "success" },
  { date: "2026-03-26 18:45", device: "Noma'lum qurilma", location: "Buxoro", status: "failed" },
  { date: "2026-03-25 09:20", device: "Chrome — Android", location: "Toshkent", status: "success" },
];

const PatientSecurity = () => {
  const { toast } = useToast();
  const [sessions, setSessions] = useState(mockSessions);

  const removeSession = (id: string) => {
    setSessions((s) => s.filter((x) => x.id !== id));
    toast({ title: "Qurilma o'chirildi", description: "Sessiya muvaffaqiyatli tugatildi" });
  };

  const logoutAll = () => {
    setSessions((s) => s.filter((x) => x.isCurrent));
    toast({ title: "Barcha qurilmalardan chiqildi", description: "Faqat joriy sessiya qoldirildi" });
  };

  return (
    <div className="space-y-6">
      {/* Connected Devices */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Ulangan qurilmalar
          </CardTitle>
          <Button variant="destructive" size="sm" onClick={logoutAll}>
            <LogOut className="w-3.5 h-3.5 mr-1" /> Barchasidan chiqish
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {sessions.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border"
            >
              <div className="flex items-center gap-3">
                {s.type === "mobile" ? (
                  <Smartphone className="w-8 h-8 text-primary p-1.5 bg-primary/10 rounded-lg" />
                ) : (
                  <Monitor className="w-8 h-8 text-primary p-1.5 bg-primary/10 rounded-lg" />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{s.name}</p>
                    {s.isCurrent && (
                      <Badge variant="default" className="text-[10px] px-1.5 py-0">
                        Joriy
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {s.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {s.lastActive}
                    </span>
                    <span>IP: {s.ip}</span>
                  </div>
                </div>
              </div>
              {!s.isCurrent && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => removeSession(s.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Login History */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Kirish tarixi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {loginHistory.map((entry, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {entry.status === "failed" ? (
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                  ) : (
                    <Shield className="w-4 h-4 text-medical-green" />
                  )}
                  <div>
                    <p className="text-sm text-foreground">{entry.device}</p>
                    <p className="text-xs text-muted-foreground">
                      {entry.location} • {entry.date}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={entry.status === "success" ? "default" : "destructive"}
                  className="text-[10px]"
                >
                  {entry.status === "success" ? "Muvaffaqiyatli" : "Rad etildi"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security Tips */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-4">
          <h4 className="font-heading font-semibold text-foreground mb-2 flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" /> Xavfsizlik tavsiyalari
          </h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>• Noma'lum qurilmalarni darhol o'chiring</li>
            <li>• Murakkab parol ishlatib, uni muntazam o'zgartiring</li>
            <li>• Umumiy Wi-Fi tarmoqlarida ehtiyot bo'ling</li>
            <li>• Shubhali kirish urinishlarini kuzatib boring</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientSecurity;
