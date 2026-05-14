/**
 * Premium glass card with optional neon ring + hover lift.
 * Designed to be used on dark cinematic backgrounds.
 */
import { forwardRef, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Tone = "blue" | "purple" | "cyan" | "neutral";

interface Props extends HTMLAttributes<HTMLDivElement> {
  tone?: Tone;
  glow?: boolean;
  interactive?: boolean;
}

const toneRing: Record<Tone, string> = {
  blue: "ring-neon",
  purple: "ring-neon-purple",
  cyan: "shadow-[0_0_0_1px_rgba(34,211,238,0.4),0_0_24px_rgba(34,211,238,0.3)]",
  neutral: "",
};

const GlowCard = forwardRef<HTMLDivElement, Props>(
  ({ tone = "neutral", glow = false, interactive = true, className, children, ...rest }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "glass-dark relative p-5 transition-all duration-300",
          interactive && "hover:-translate-y-0.5",
          glow && toneRing[tone],
          className
        )}
        {...rest}
      >
        {children}
      </div>
    );
  }
);
GlowCard.displayName = "GlowCard";

export default GlowCard;
