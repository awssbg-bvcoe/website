import { PixelTrail } from "@/components/motion/PixelTrail";
import { Preloader } from "@/components/motion/Preloader";
import { SmoothScroll } from "@/components/motion/SmoothScroll";

/** The public site: intro screen, smooth scroll and the cursor trail. /admin and the 404 page skip these. */
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Preloader />
      <SmoothScroll />
      {children}
      <PixelTrail />
    </>
  );
}
