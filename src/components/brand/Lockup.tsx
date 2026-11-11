import { BrandIcon } from "./BrandIcon";

/** Program icon + mono wordmark, following the kit's horizontal lockup. */
export function Lockup({
  compact = false,
  className = "",
  iconClassName = "text-mint",
}: {
  compact?: boolean;
  className?: string;
  iconClassName?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <BrandIcon name="chip" size={compact ? 26 : 34} className={iconClassName} />
      <span className="font-mono leading-[1.15]">
        <span className={`block font-bold tracking-tight ${compact ? "text-[0.8rem]" : "text-[0.95rem]"}`}>
          AWS Student Builder Group
        </span>
        <span className={`block text-current/70 ${compact ? "text-[0.7rem]" : "text-[0.78rem]"}`}>at BVCOE, New Delhi</span>
      </span>
    </span>
  );
}
