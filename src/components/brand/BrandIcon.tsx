import type { CSSProperties } from "react";
import type { BrandIconName } from "@/content/site";

const ratios: Record<BrandIconName | "chip", number> = {
  bolt: 2580 / 3870,
  clock: 1,
  "double-bracket-smile": 5160 / 3012,
  drop: 3010 / 4300,
  key: 4300 / 2150,
  ladder: 2580 / 3870,
  "single-bracket-smile": 3440 / 3010,
  speaker: 5592 / 3440,
  teams: 6880 / 3870,
  trophy: 1,
  wrench: 5590 / 2580,
  chip: 1,
};

/**
 * Renders an icon from the AWS Student Builder Group kit as a CSS mask,
 * so it inherits `currentColor`. `size` is the icon height in px.
 */
export function BrandIcon({
  name,
  size = 24,
  className = "",
  label,
}: {
  name: BrandIconName | "chip";
  size?: number;
  className?: string;
  label?: string;
}) {
  const src = name === "chip" ? "/brand/mark/chip.svg" : `/brand/icons/${name}.svg`;
  const style = {
    "--icon": `url("${src}")`,
    height: size,
    width: Math.round(size * ratios[name]),
  } as CSSProperties;

  return (
    <span
      className={`brand-icon ${className}`}
      style={style}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  );
}
