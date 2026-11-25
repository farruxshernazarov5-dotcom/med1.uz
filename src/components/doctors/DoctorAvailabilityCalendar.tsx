import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Loader2 } from "lucide-react";
import { fetchDoctorCalendar, WEEKDAY_UZ, type DayAvailability } from "@/lib/doctorAvailability";
import DoctorDatePicker from "./DoctorDatePicker";

interface Props {
  doctorId: string;
  onPickSlot?: (date: string, time: string) => void;
}

export default function DoctorAvailabilityCalendar({ doctorId, onPickSlot }: Props) {
  const [days, setDays] = useState<DayAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(0);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(false);
    fetchDoctorCalendar(doctorId, 14)
      .then((d) => {
        if (!alive) return;
        setDays(d);
        const first = d.findIndex((x) => x.freeCount > 0);
        setActive(first >= 0 ? first : 0);
      })
      .catch(() => { if (alive) setError(true); })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [doctorId]);

  const day = days[active];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-primary" /> Mavjudlik kalendari
        </CardTitle>
      </CardHeader>
      <CardContent className="min-w-0 space-y-3 p-4 sm:p-6">
        {loading ? (
          <div className="py-8 flex justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : error ? <p role="alert" className="text-sm text-destructive">Qabul vaqtlari yuklanmadi. Sahifani qayta oching.</p> : (
          <>
            <DoctorDatePicker value={day?.date ?? ""} dates={days.map(d => d.date)} onChange={date => setActive(days.findIndex(d => d.date === date))} />
            <div className="flex min-w-0 max-w-full gap-2 overflow-x-auto pb-1">
              {days.map((d, i) => {
                const dt = new Date(`${d.date}T00:00:00`);
                const isActive = i === active;
                return (
                  <Button variant="outline"
                    key={d.date}
                    onClick={() => setActive(i)}
                    className={`shrink-0 flex-col h-auto w-16 rounded-lg border px-2 py-2 text-center transition ${
                      isActive ? "border-primary bg-primary/10" : "hover:bg-muted/50"
                    } ${d.freeCount === 0 ? "opacity-50" : ""}`}
                  >
                    <p className="text-[10px] text-muted-foreground">{WEEKDAY_UZ[d.weekday]}</p>
                    <p className="text-sm font-bold">{dt.getDate()}</p>
                    <p className="text-[10px] text-medical-green">
                      {d.closed ? "—" : `${d.freeCount} bo‘sh`}
                    </p>
                  </Button>
                );
              })}
            </div>

            {day?.closed ? (
              <p className="text-xs text-muted-foreground py-3 text-center">
                Bu kuni shifokor qabul qilmaydi.
              </p>
            ) : (
              <div className="grid grid-cols-3 min-[400px]:grid-cols-4 sm:grid-cols-6 gap-2">
                {day?.slots.map((s) => {
                  const disabled = s.taken || s.past;
                  return (
                    <Button
                      key={s.time}
                      size="sm"
                      variant={disabled ? "ghost" : "outline"}
                      disabled={disabled}
                      onClick={() => onPickSlot?.(day.date, s.time)}
                      className={`h-11 text-xs ${disabled ? "line-through opacity-40" : "hover:border-primary"}`}
                    >
                      {s.time}
                    </Button>
                  );
                })}
                {day && day.slots.length === 0 && (
                  <p className="text-xs text-muted-foreground">Bo‘sh vaqtlar mavjud emas.</p>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground">
              <Badge variant="outline" className="text-[10px]">Bo'sh</Badge>
              <Badge variant="outline" className="text-[10px] line-through opacity-60">Band / o'tgan</Badge>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
