import { renderOg } from "@/lib/og";

/** Share card for the 404 game (a not-found page cannot use the opengraph-image file convention). */
export function GET() {
  return renderOg({ kicker: "404 game", lines: ["Packet run.", "Press start."], accent: "amber" });
}
