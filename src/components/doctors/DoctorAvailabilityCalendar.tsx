import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Loader2 } from "lucide-react";
import { fetchDoctorCalendar, WEEKDAY_UZ, type DayAvailability } from "@/lib/doctorAvailability";

interface Props {
  doctorId: string;
  onPickSlot?: (date: string, time: string) => void;
}

export default function DoctorAvailabilityCalendar({ doctorId, onPickSlot }: Props) {
  const [days, setDays] = useState<DayAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchDoctorCalendar(doctorId, 14)
      .then((d) => {
        if (!alive) return;
        setDays(d);
        const first = d.findIndex((x) => x.freeCount > 0);
        setActive(first >= 0 ? first : 0);
      })
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
      <CardContent className="space-y-3">
        {loading ? (
          <div className="py-8 flex justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {days.map((d, i) => {
                const dt = new Date(`${d.date}T00:00:00`);
                const isActive = i === active;
                return (
                  <button
                    key={d.date}
                    onClick={() => setActive(i)}
                    className={`shrink-0 w-16 rounded-xl border px-2 py-2 text-center transition ${
                      isActive ? "border-primary bg-primary/10" : "hover:bg-muted/50"
                    } ${d.freeCount === 0 ? "opacity-50" : ""}`}
                  >
                    <p className="text-[10px] text-muted-foreground">{WEEKDAY_UZ[d.weekday]}</p>
                    <p className="text-sm font-bold">{dt.getDate()}</p>
                    <p className="text-[10px] text-medical-green">
                      {d.closed ? "—" : `${d.freeCount} slot`}
                    </p>
                  </button>
                );
              })}
            </div>

            {day?.closed ? (
              <p className="text-xs text-muted-foreground py-3 text-center">
                Bu kuni shifokor qabul qilmaydi.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {day?.slots.map((s) => {
                  const disabled = s.taken || s.past;
                  return (
                    <Button
                      key={s.time}
                      size="sm"
                      variant={disabled ? "ghost" : "outline"}
                      disabled={disabled}
                      onClick={() => onPickSlot?.(day.date, s.time)}
                      className={`h-8 text-xs ${disabled ? "line-through opacity-40" : "hover:border-primary"}`}
                    >
                      {s.time}
                    </Button>
                  );
                })}
                {day && day.slots.length === 0 && (
                  <p className="text-xs text-muted-foreground">Slotlar mavjud emas.</p>
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
