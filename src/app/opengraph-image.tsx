import { OG_SIZE, renderOg } from "@/lib/og";

export const alt = "AWS Student Builder Group at BVCOE: Learn. Build. Deploy. Scale.";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return renderOg({ kicker: "BVCOE, New Delhi", lines: ["Learn. Build.", "Deploy. Scale."] });
}
