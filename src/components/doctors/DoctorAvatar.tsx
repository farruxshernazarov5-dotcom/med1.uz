import { useState } from "react";
import { Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  name: string;
  photoUrl?: string | null;
  specialty?: string | null;
  className?: string;
  rounded?: string;
}

const initials = (name: string) =>
  name
    .replace(/^(Dr\.?|Doktor)\s+/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

/** Doctor photo with a graceful branded fallback when the image is missing or broken. */
const DoctorAvatar = ({ name, photoUrl, specialty, className, rounded = "rounded-xl" }: Props) => {
  const [broken, setBroken] = useState(false);
  const showImg = !!photoUrl && !broken;

  if (showImg) {
    return (
      <img
        src={photoUrl as string}
        alt={`${name}${specialty ? ` — ${specialty}` : ""}`}
        loading="lazy"
        onError={() => setBroken(true)}
        className={cn("object-cover bg-muted", rounded, className)}
      />
    );
  }

  const ini = initials(name);

  return (
    <div
      aria-label={name}
      className={cn(
        "flex items-center justify-center bg-gradient-to-br from-primary/15 to-secondary/15 text-primary font-heading font-bold select-none",
        rounded,
        className,
      )}
    >
      {ini ? <span className="text-[0.9em] leading-none">{ini}</span> : <Stethoscope className="w-1/2 h-1/2" />}
    </div>
  );
};

export default DoctorAvatar;
