import type { Metadata } from "next";
import Link from "next/link";
import { Lockup } from "@/components/brand/Lockup";
import { PacketGame } from "@/components/game/PacketGame";

export const metadata: Metadata = {
  title: "Page not found",
  description: "This route never got deployed. Play Packet run, the AWS Student Builder Group's pixel game, while you are here.",
  robots: { index: false },
  openGraph: {
    title: "Packet run | AWS SBG BVCOE",
    description: "This route never got deployed. Collect chips in the pixel game instead.",
    images: [{ url: "/og/game", width: 1200, height: 630, alt: "Packet run: the AWS Student Builder Group 404 game" }],
  },
  twitter: { card: "summary_large_image", images: ["/og/game"] },
};

export default function NotFound() {
  return (
    <main id="main" className="bg-pixel-grid min-h-[100dvh] px-4 py-6 [--cell:72px] sm:px-8">
      <div className="flex items-center justify-between gap-4">
        <Link href="/">
          <Lockup compact />
        </Link>
        <Link href="/" className="pressable inline-flex h-11 items-center bg-mint px-4 text-sm font-bold text-mint-ink uppercase hover:bg-paper">
          Back home
        </Link>
      </div>

      <div className="mx-auto mt-12 max-w-4xl sm:mt-16">
        <h1 className="font-mono text-[clamp(3rem,12vw,9rem)] leading-[0.9] font-bold tracking-tight">
          404<span className="text-mint">.</span>
        </h1>
        <p className="mt-4 max-w-[48ch] text-lg text-grey-300 sm:text-xl">
          This route never got deployed. While you are here, see how many chips you can collect.
        </p>
        <div className="mt-10">
          <PacketGame />
        </div>
      </div>
    </main>
  );
}
