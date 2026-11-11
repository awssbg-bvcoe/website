import { BrandIcon } from "./BrandIcon";

/** Program icon + mono wordmark, following the kit's horizontal lockup. */
export function Lockup({
  compact = false,
  className = "",
  iconClassName = "text-mint",
  aws = true,
  awsClassName = "",
  textClassName = "",
}: {
  compact?: boolean;
  className?: string;
  iconClassName?: string;
  /** Show the AWS logo after a divider, as on the kit's banner. */
  aws?: boolean;
  /** Extra classes for the AWS logo + divider group (e.g. to hide it on small screens). */
  awsClassName?: string;
  /** Extra classes for the wordmark text (e.g. `max-sm:sr-only` in the nav). */
  textClassName?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <BrandIcon name="chip" size={compact ? 26 : 34} className={iconClassName} />
      <span className={`font-mono leading-[1.15] ${textClassName}`}>
        <span className={`block font-bold tracking-tight ${compact ? "text-[0.8rem]" : "text-[0.95rem]"}`}>
          AWS Student Builder Group
        </span>
        <span className={`block text-current/70 ${compact ? "text-[0.7rem]" : "text-[0.78rem]"}`}>at BVCOE, New Delhi</span>
      </span>
      {aws && (
        <span className={`inline-flex items-center gap-3 ${awsClassName}`}>
          <span aria-hidden="true" className={`block w-px self-stretch bg-current/30 ${compact ? "my-1" : "my-0.5"}`} />
          <BrandIcon name="aws" size={compact ? 22 : 28} label="AWS" />
        </span>
      )}
    </span>
  );
}
