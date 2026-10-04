import { Settings, ShieldAlert } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { openAppSettings } from "@/lib/nativeHealth";

export type PermissionKind = "notifications" | "biometric";

const COPY: Record<PermissionKind, { title: string; description: string }> = {
  notifications: {
    title: "Bildirishnoma ruxsati kerak",
    description:
      "Dori ichish va shifokor qabuli eslatmalari ishlamasi uchun telefon bildirishnomalarga ruxsat bermagan. " +
      "Qayta urinib ko‘ring yoki telefon sozlamalaridan Med1.uz uchun bildirishnomani yoqing.",
  },
  biometric: {
    title: "Biometrik tasdiqlash ishlamadi",
    description:
      "Face ID yoki barmoq izi tasdiqlanmadi. Qayta urinib ko‘ring yoki telefon sozlamalarida biometrik qulf sozlanganini tekshiring.",
  },
};

interface Props {
  kind: PermissionKind | null;
  onClose: () => void;
  onRetry: () => void;
}

/** Explains a denied/failed native permission and offers retry or a jump to phone settings. */
export const PermissionDeniedDialog = ({ kind, onClose, onRetry }: Props) => {
  const copy = kind ? COPY[kind] : null;
  return (
    <AlertDialog open={!!kind} onOpenChange={(open) => { if (!open) onClose(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-destructive" /> {copy?.title}
          </AlertDialogTitle>
          <AlertDialogDescription>{copy?.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
          <AlertDialogCancel onClick={onClose}>Yopish</AlertDialogCancel>
          <AlertDialogAction
            className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
            onClick={() => { void openAppSettings(); onClose(); }}
          >
            <Settings className="mr-1 h-4 w-4" /> Sozlamalarni ochish
          </AlertDialogAction>
          <AlertDialogAction onClick={() => { onClose(); onRetry(); }}>
            Qayta urinish
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
