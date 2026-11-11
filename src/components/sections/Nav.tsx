"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Lockup } from "@/components/brand/Lockup";
import { nav } from "@/content/site";
import { gsap, ScrollTrigger, useGSAP, whenIntroDone } from "@/lib/gsap";

export function Nav() {
  const root = useRef<HTMLElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const firstMenuLink = useRef<HTMLAnchorElement>(null);
  const [open, setOpen] = useState(false);

  const close = useCallback((returnFocus = true) => {
    setOpen(false);
    window.__lenis?.start();
    if (returnFocus) menuButton.current?.focus({ preventScroll: true });
  }, []);

  // Menu: hold the page still while open, Escape closes, focus goes to the first link
  useEffect(() => {
    if (!open) return;
    window.__lenis?.stop();
    firstMenuLink.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.set(root.current, { yPercent: -120 });
        return whenIntroDone(() =>
          gsap.to(root.current, {
            yPercent: 0,
            duration: 0.7,
            delay: 0.35,
            ease: "snap",
          }),
        );
      });

      // Logo gains a solid plate once the hero type is behind it; a stepped bar tracks page progress
      const logo = q("[data-nav-logo]")[0] as HTMLElement;
      const bar = q("[data-nav-progress]")[0] as HTMLElement;
      ScrollTrigger.create({
        start: 0,
        end: "max",
        onUpdate: (self) => {
          logo.classList.toggle("is-plated", self.scroll() > 120);
          // 40 hard steps so the bar fills like pixels, not a smooth line
          gsap.set(bar, { scaleX: Math.round(self.progress * 40) / 40 });
        },
      });

      // A mint block slides under the link of the section in view
      const links = q("[data-nav-link]") as HTMLElement[];
      const marker = q("[data-nav-marker]")[0] as HTMLElement;
      const moveTo = (link: HTMLElement | null) => {
        if (!link) {
          gsap.to(marker, { opacity: 0, duration: 0.2 });
          links.forEach((l) => l.removeAttribute("aria-current"));
          return;
        }
        links.forEach((l) =>
          l === link
            ? l.setAttribute("aria-current", "true")
            : l.removeAttribute("aria-current"),
        );
        gsap.to(marker, {
          x: link.offsetLeft,
          width: link.offsetWidth,
          opacity: 1,
          duration: 0.35,
          ease: "snap",
        });
      };
      // Recompute from whichever trigger is active, so a long jump can never leave a stale marker
      let current: HTMLElement | null | undefined;
      const sync = () => {
        const i = triggers.findIndex((t) => t.isActive);
        const next = i >= 0 ? links[i] : null;
        if (next !== current) {
          current = next;
          moveTo(next);
        }
      };
      const triggers: ScrollTrigger[] = links.map((link) =>
        ScrollTrigger.create({
          trigger: document.querySelector(link.getAttribute("href")!),
          start: "top 55%",
          end: "bottom 55%",
          // The nav mounts before the pinned sections; measure after their pin spacers exist
          refreshPriority: -1,
          onToggle: () => gsap.delayedCall(0, sync),
        }),
      );

      return () => {
        triggers.forEach((t) => t.kill());
        mm.revert();
      };
    },
    { scope: root },
  );

  return (
    <>
      <header
        ref={root}
        className="fixed inset-x-0 top-0 flex items-center justify-between gap-3 px-4 pt-4 sm:px-8 sm:pt-5"
        style={{ zIndex: "var(--z-nav)" }}
      >
        <span
          data-nav-progress
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-mint"
        />
        <a
          href="#top"
          data-nav-logo
          className="group flex h-12 items-center px-0 text-paper transition-[background-color,padding] duration-300 ease-out [&.is-plated]:bg-grey-800/95 [&.is-plated]:px-3"
        >
          <Lockup
            compact
            iconClassName="text-mint transition-transform duration-300 ease-out-strong group-hover:rotate-90"
            textClassName="max-sm:sr-only"
            awsClassName="max-sm:hidden"
          />
        </a>

        <nav
          aria-label="Primary"
          className="relative flex h-12 items-stretch bg-grey-800/95 p-1 backdrop-blur-sm"
        >
          {/* Below md the section links live in the full-screen menu; Join stays in the bar */}
          <button
            ref={menuButton}
            type="button"
            aria-expanded={open}
            aria-controls="site-menu"
            onClick={() => (open ? close() : setOpen(true))}
            className="pressable relative flex items-center gap-2 px-3 text-sm font-bold text-paper uppercase hover:bg-grey-700 md:hidden"
          >
            <span aria-hidden="true" className="grid gap-[3px]">
              <span
                className={`block h-[3px] w-4 bg-current transition-transform duration-200 ${open ? "translate-y-[6px] rotate-45" : ""}`}
              />
              <span
                className={`block h-[3px] w-4 bg-current transition-opacity duration-200 ${open ? "opacity-0" : ""}`}
              />
              <span
                className={`block h-[3px] w-4 bg-current transition-transform duration-200 ${open ? "-translate-y-[6px] -rotate-45" : ""}`}
              />
            </span>
            {open ? "Close" : "Menu"}
          </button>
          <span
            data-nav-marker
            aria-hidden="true"
            className="pointer-events-none absolute top-1 bottom-1 left-0 w-0 bg-grey-700 opacity-0"
          />
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              data-nav-link
              className="nav-link pressable relative hidden items-center px-3 text-sm font-bold text-paper uppercase aria-[current]:text-mint sm:px-4 md:flex"
            >
              {item.label}
            </a>
          ))}
          <a
            href="#join"
            onClick={() => open && close(false)}
            className="pressable relative flex items-center bg-mint px-3 text-sm font-bold text-mint-ink uppercase transition-[transform,background-color] hover:-translate-y-0.5 hover:bg-paper sm:px-4"
          >
            Join
          </a>
        </nav>
      </header>

      {/* Full-screen menu (sibling of the header: the header animates its transform, which would trap a fixed child) */}
      <div
        id="site-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        inert={!open}
        data-open={open}
        className="site-menu bg-pixel-grid fixed inset-0 flex flex-col justify-end bg-grey-850 px-4 pt-24 pb-10 [--cell:56px] sm:px-8 md:hidden"
        style={{ zIndex: "calc(var(--z-nav) - 1)" }}
      >
        <ul className="flex flex-col gap-2">
          {nav.map((item, i) => (
            <li key={item.href} className="overflow-hidden">
              <a
                ref={i === 0 ? firstMenuLink : undefined}
                href={item.href}
                onClick={() => close(false)}
                className="menu-link block py-1 font-mono text-[clamp(2.75rem,13vw,4.5rem)] leading-none font-bold tracking-tight text-paper uppercase hover:text-mint focus-visible:text-mint"
                style={{ transitionDelay: open ? `${120 + i * 60}ms` : "0ms" }}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-10 font-mono text-sm text-grey-300">
          AWS Student Builder Group at BVCOE, New Delhi
        </p>
      </div>

      <style>{`
      .site-menu { clip-path: inset(0 0 100% 0); visibility: hidden; transition: clip-path 420ms steps(8), visibility 0s linear 420ms; }
      .site-menu[data-open="true"] { clip-path: inset(0 0 0 0); visibility: visible; transition: clip-path 420ms steps(8), visibility 0s; }
      .menu-link { transform: translateY(105%); transition: transform 500ms cubic-bezier(0.23, 1, 0.32, 1), color 150ms ease; }
      .site-menu[data-open="true"] .menu-link { transform: translateY(0); }
      @media (prefers-reduced-motion: reduce) {
        .site-menu, .site-menu[data-open="true"], .menu-link { transition: none; }
      }
    `}</style>
    </>
  );
}
