import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  label?: string;
  date?: string | null;
  className?: string;
  size?: "sm" | "md";
};

/** Small trust chip shown when content is backed by a verified official source. */
export function VerifiedBadge({ label = "Verified", date, className, size = "sm" }: Props) {
  const verified = date
    ? new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-secondary/10 font-semibold text-secondary-strong",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        className,
      )}
    >
      <BadgeCheck className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} aria-hidden="true" />
      {label}
      {verified ? <span className="font-normal opacity-80">· {verified}</span> : null}
    </span>
  );
}
