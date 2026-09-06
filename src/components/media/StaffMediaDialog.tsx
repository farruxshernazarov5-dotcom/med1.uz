import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Share2 } from "lucide-react";
import MediaLinksManager from "./MediaLinksManager";

interface Props {
  entityType: string;
  entityId: string;
  staffId: string;
  staffName: string;
  size?: "sm" | "icon";
}

/** Xodim uchun ijtimoiy tarmoq va video materiallar boshqaruvi */
const StaffMediaDialog = ({ entityType, entityId, staffId, staffName, size = "icon" }: Props) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {size === "icon" ? (
          <Button size="icon" variant="ghost" className="h-8 w-8" title="Ijtimoiy tarmoq va videolar">
            <Share2 className="w-4 h-4" />
          </Button>
        ) : (
          <Button size="sm" variant="outline">
            <Share2 className="w-4 h-4 mr-1" /> Ijtimoiy / Video
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{staffName} — ijtimoiy tarmoq va videolar</DialogTitle>
        </DialogHeader>
        {open && (
          <MediaLinksManager
            entityType={entityType}
            entityId={entityId}
            staffId={staffId}
            compact
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default StaffMediaDialog;
