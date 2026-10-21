import { Heart, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDoctorCompare, useDoctorFavorites } from "@/hooks/useDoctorFavorites";

export default function DoctorDirectoryActions({ doctorId }: { doctorId: string }) {
  const favorites = useDoctorFavorites();
  const compare = useDoctorCompare();
  return <div className="mt-4 grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
    <Button variant="outline" className="min-h-11 gap-2 whitespace-normal" aria-pressed={favorites.has(doctorId)} onClick={() => favorites.toggle(doctorId)}><Heart className={`h-4 w-4 shrink-0 ${favorites.has(doctorId) ? "fill-current text-primary" : ""}`} />{favorites.has(doctorId) ? "Sevimlilarda" : "Sevimlilarga qo‘shish"}</Button>
    <Button variant="outline" className="min-h-11 gap-2 whitespace-normal" aria-pressed={compare.has(doctorId)} onClick={() => compare.toggle(doctorId)}><Scale className="h-4 w-4 shrink-0" />{compare.has(doctorId) ? "Taqqoslashdan olish" : "Taqqoslashga qo‘shish"}</Button>
  </div>;
}
