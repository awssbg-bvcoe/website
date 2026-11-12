import { OG_SIZE, renderOg } from "@/lib/og";

export const alt = "AWS Student Builder Group at BVCOE: every link, one tap away.";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return renderOg({ kicker: "Links", lines: ["Every link.", "One tap."], accent: "purple" });
}
