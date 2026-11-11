import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { PixelTrail } from "@/components/motion/PixelTrail";
import { Preloader } from "@/components/motion/Preloader";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { site } from "@/content/site";
import "./globals.css";

const emberDisplay = localFont({
  variable: "--font-ember-display",
  display: "swap",
  src: [
    { path: "./fonts/ember-display-300.woff2", weight: "300", style: "normal" },
    { path: "./fonts/ember-display-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/ember-display-700.woff2", weight: "700", style: "normal" },
    { path: "./fonts/ember-display-800.woff2", weight: "800", style: "normal" },
  ],
  fallback: ["system-ui", "Arial", "sans-serif"],
});

const emberMono = localFont({
  variable: "--font-ember-mono",
  display: "swap",
  src: [
    { path: "./fonts/ember-mono-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/ember-mono-700.woff2", weight: "700", style: "normal" },
  ],
  fallback: ["ui-monospace", "Menlo", "monospace"],
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} at BVCOE`,
    template: `%s | ${site.shortName}`,
  },
  description: site.description,
  openGraph: {
    title: `${site.name} at BVCOE`,
    description: site.description,
    siteName: site.shortName,
    type: "website",
    locale: "en_IN",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#161d26",
  colorScheme: "dark",
};

// Runs before paint: skip the intro on repeat visits in the same session
const seenScript = `try{if(sessionStorage.getItem("sbg-seen"))document.documentElement.dataset.seen="1"}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${emberDisplay.variable} ${emberMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: seenScript }} />
      </head>
      {/* Extensions (e.g. Video Speed Controller adds `vsc-initialized`) edit <body> before hydration */}
      <body suppressHydrationWarning>
        <a
          href="#main"
          className="fixed top-3 left-3 -translate-y-24 bg-mint px-4 py-2 font-bold text-mint-ink focus:translate-y-0"
          style={{ zIndex: "var(--z-preloader)" }}
        >
          Skip to content
        </a>
        <Preloader />
        <SmoothScroll />
        {children}
        <PixelTrail />
      </body>
    </html>
  );
}
