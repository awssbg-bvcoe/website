"use client";

import Image from "next/image";
import { useCallback, useRef, useState, useSyncExternalStore, type KeyboardEvent } from "react";
import { scrollTarget } from "@/lib/scroll";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { team, type TeamMember } from "@/content/team";
import { gsap, SCRAMBLE_CHARS, ScrollTrigger, useGSAP } from "@/lib/gsap";

const TONE_HEX: Record<TeamMember["tone"], string> = {
  mint: "#00e582",
  purple: "#ad5cff",
  amber: "#ff9900",
  blue: "#42b4ff",
  magenta: "#ff57e9",
  paper: "#f2f4f5",
};
// Role badge per tone (mint carries mint-ink text; paper gets a mint shadow so it does not melt into its own)
const BADGE: Record<TeamMember["tone"], string> = {
  mint: "bg-mint text-mint-ink shadow-[4px_4px_0_0_#f2f4f5]",
  purple: "bg-purple text-grey-850 shadow-[4px_4px_0_0_#f2f4f5]",
  amber: "bg-amber text-grey-850 shadow-[4px_4px_0_0_#f2f4f5]",
  blue: "bg-blue text-grey-850 shadow-[4px_4px_0_0_#f2f4f5]",
  magenta: "bg-magenta text-grey-850 shadow-[4px_4px_0_0_#f2f4f5]",
  paper: "bg-paper text-grey-850 shadow-[4px_4px_0_0_#00e582]",
};

/** Scroll distance (in viewport heights) each member holds the stage */
const STEP_VH = 0.6;

const pad = (n: number) => String(n).padStart(2, "0");

function initials(name: string) {
  const parts = name.split(" ");
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Reduced motion as an external store (no setState inside an effect)
const RM = "(prefers-reduced-motion: reduce)";
const subscribeRM = (cb: () => void) => {
  const m = window.matchMedia(RM);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
};
const getRM = () => window.matchMedia(RM).matches;
const getRMServer = () => false;

function Portrait({ member: head, sizes, priority = false }: { member: TeamMember; sizes: string; priority?: boolean }) {
  if (head.photo) {
    return <Image src={head.photo} alt={`Portrait of ${head.name}`} fill sizes={sizes} priority={priority} className="object-cover" draggable={false} />;
  }
  return (
    <div role="img" aria-label={`${head.name}, photo coming soon`} className="bg-pixel-grid @container absolute inset-0 grid place-items-center bg-grey-850 text-paper [--cell:24px]">
      {/* Sized to its frame (container query), so it fits the small roster tile and the big stage alike */}
      <span aria-hidden="true" className="font-mono text-[34cqi] leading-none font-bold tracking-tight">
        {initials(head.name)}
      </span>
    </div>
  );
}

/**
 * Core team as an arcade character select: a roster of tiles (tabs) and a big stage for the picked member.
 * The section holds on screen (CSS sticky inside a tall rail, G21) and scrolling steps through every member,
 * so nobody can scroll past the team without seeing all six. Picking a tile scrolls to that member's step.
 */
export function Team() {
  const root = useRef<HTMLElement>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const trigger = useRef<ScrollTrigger | null>(null);
  const [active, setActive] = useState(0);
  const reduced = useSyncExternalStore(subscribeRM, getRM, getRMServer);
  const firstSwitch = useRef(true);

  const head = team[active];
  const n = team.length;

  // Scroll to the middle of member i's step; the scroll position is the source of truth for `active`
  const pick = useCallback(
    (i: number, focus = false) => {
      setActive(i);
      if (focus) tabs.current[i]?.focus({ preventScroll: true });
      const st = trigger.current;
      if (st) scrollTarget(st.start + ((i + 0.5) / n) * (st.end - st.start), reduced);
    },
    [n, reduced],
  );

  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const next = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: n - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    pick(Math.min(n - 1, Math.max(0, next)), true);
  };

  // Hold: the panel sticks while the rail scrolls by; each member owns an equal slice of that distance
  useGSAP(
    () => {
      const rail = root.current!.querySelector<HTMLElement>("[data-team-rail]")!;
      const panel = root.current!.querySelector<HTMLElement>("[data-team-panel]")!;
      const step = () => Math.max(320, window.innerHeight * STEP_VH);
      const stickyTop = () => parseFloat(getComputedStyle(panel).top) || 0;
      const layout = () => {
        rail.style.height = `${panel.offsetHeight + n * step()}px`;
      };
      layout();
      ScrollTrigger.addEventListener("refreshInit", layout);
      trigger.current = ScrollTrigger.create({
        trigger: rail,
        start: () => `top top+=${stickyTop()}`,
        end: () => `+=${n * step()}`,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const i = Math.min(n - 1, Math.floor(self.progress * n));
          setActive((a) => (a === i ? a : i));
        },
      });
      return () => {
        ScrollTrigger.removeEventListener("refreshInit", layout);
        trigger.current?.kill();
        trigger.current = null;
        rail.style.height = "";
      };
    },
    { scope: root },
  );

  // Intro: roster tiles drop in from a spin, the stage lands from a tilt, corners snap on
  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const st = { trigger: root.current, start: "top 70%", once: true };
        gsap
          .timeline({ scrollTrigger: st })
          .fromTo(q("[data-team-title-row]"), { yPercent: 110 }, { yPercent: 0, duration: 0.7, stagger: 0.1, ease: "snap" })
          .fromTo(q("[data-team-stage]"), { y: 90, rotate: -5, opacity: 0 }, { y: 0, rotate: 0, opacity: 1, duration: 0.9, ease: "snap" }, "<0.15")
          .fromTo(
            q("[data-team-tile]"),
            { y: -70, opacity: 0, rotate: () => gsap.utils.random(-25, 25) },
            { y: 0, opacity: 1, rotate: 0, duration: 0.7, stagger: 0.09, ease: "back.out(1.8)" },
            "<0.1",
          )
          .fromTo(q("[data-team-corner]"), { opacity: 0, scale: 2.4 }, { opacity: 1, scale: 1, duration: 0.3, stagger: 0.05, ease: "steps(4)" }, "<0.35")
          .fromTo(q("[data-team-fade]"), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.07, ease: "snap" }, "<");
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  // Switch: tone flash, the portrait wipes up in hard steps, the name scrambles in, badge stamps on
  useGSAP(
    () => {
      if (firstSwitch.current) {
        firstSwitch.current = false;
        return;
      }
      if (reduced) return;
      const q = gsap.utils.selector(root);
      gsap
        .timeline({ defaults: { overwrite: "auto" } })
        .fromTo(q("[data-team-flash]"), { opacity: 0.9 }, { opacity: 0, duration: 0.35, ease: "steps(3)" })
        .fromTo(q("[data-team-stage]"), { x: -8 }, { x: 0, duration: 0.3, ease: "steps(3)" }, 0)
        .fromTo(q("[data-team-photo]"), { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.55, ease: "steps(8)" }, 0.05)
        .fromTo(q("[data-team-scan]"), { yPercent: 0 }, { yPercent: 200, duration: 0.6, ease: "steps(10)" }, 0.05)
        .to(q("[data-team-name]"), { duration: 0.7, scrambleText: { text: head.name, chars: SCRAMBLE_CHARS, speed: 0.7 } }, 0.05)
        .fromTo(q("[data-team-badge]"), { scale: 1.7, rotate: -12, opacity: 0 }, { scale: 1, rotate: -3, opacity: 1, duration: 0.35, ease: "steps(4)" }, 0.2)
        .fromTo(q("[data-team-copy]"), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4, ease: "snap" }, 0.3)
        .fromTo(q("[data-team-ghost-num]"), { yPercent: 40, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.5, ease: "steps(5)" }, 0)
        .fromTo(q("[data-team-p1]"), { scale: 0, rotate: -30 }, { scale: 1, rotate: -8, duration: 0.4, ease: "back.out(3)" }, 0);
    },
    { scope: root, dependencies: [active], revertOnUpdate: false },
  );

  return (
    <section ref={root} id="team" aria-labelledby="team-title" className="relative overflow-x-clip px-4 py-28 sm:px-8 lg:py-40">
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-6">
        <h2 id="team-title" className="font-mono text-[clamp(2.75rem,9vw,9rem)] leading-[0.9] font-bold tracking-tight uppercase">
          <span className="block overflow-hidden">
            <span data-team-title-row className="block">
              Core
            </span>
          </span>
          <span className="block overflow-hidden pb-[0.06em]">
            <span data-team-title-row className="block text-mint text-outline">
              Team
            </span>
          </span>
        </h2>
        <p data-team-fade className="max-w-[34ch] text-lg leading-relaxed text-grey-300 sm:text-xl lg:mb-3">
          Six students running workshops, partnerships, design and operations for the group this term.
        </p>
      </div>

      {/* Rail: tall enough for one scroll step per member; the panel sticks inside it */}
      <div data-team-rail className="mt-14">
      <div data-team-panel className="sticky top-20 grid gap-4 sm:gap-6 lg:top-24 lg:grid-cols-12 lg:items-start lg:gap-10">
        {/* Roster: pick a head (tabs) */}
        <div className="lg:order-2 lg:col-span-4">
          {/* Which member of how many: one block per member, lit up to the current one */}
          <div data-team-fade className="mb-3 flex items-center justify-between gap-4 font-mono text-sm font-bold tracking-tight text-mint uppercase sm:mb-4">
            <span>
              {pad(active + 1)} <span className="text-grey-300">/ {pad(n)}</span>
            </span>
            <span aria-hidden="true" className="flex gap-1">
              {team.map((m, i) => (
                <span
                  key={m.name}
                  className={`block h-3 w-5 outline outline-1 transition-colors duration-150 sm:w-7 ${i <= active ? "outline-transparent" : "bg-grey-800 outline-grey-700"}`}
                  style={i <= active ? { backgroundColor: TONE_HEX[head.tone] } : undefined}
                />
              ))}
            </span>
          </div>
          <div role="tablist" aria-label="Core team members" aria-orientation="vertical" className="grid grid-cols-6 gap-2 sm:gap-3 lg:grid-cols-1">
            {team.map((h, i) => {
              const selected = i === active;
              return (
                <button
                  key={h.name}
                  ref={(el) => {
                    tabs.current[i] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`team-tab-${i}`}
                  aria-selected={selected}
                  aria-controls="team-panel"
                  tabIndex={selected ? 0 : -1}
                  onClick={() => pick(i)}
                  onKeyDown={(e) => onTabKey(e, i)}
                  data-team-tile
                  className={`group relative flex flex-col p-1 text-left outline outline-2 transition-[background-color,outline-color] duration-200 sm:p-1.5 lg:flex-row lg:items-center lg:gap-4 lg:p-2 ${
                    selected ? "bg-grey-800 outline-mint" : "bg-grey-850 outline-grey-700 hover:bg-grey-800 hover:outline-grey-500"
                  }`}
                  style={selected ? { boxShadow: `6px 6px 0 0 ${TONE_HEX[h.tone]}` } : undefined}
                >
                  <span className="relative block aspect-square w-full shrink-0 overflow-hidden lg:aspect-[4/3] lg:w-16">
                    <Portrait member={h} sizes="(min-width: 1024px) 4rem, 16vw" />
                    {!selected && <span aria-hidden="true" className="absolute inset-0 bg-grey-850/45 transition-opacity group-hover:opacity-0" />}
                  </span>
                  {/* Phones show the photo only (the stage names the member); the name stays for screen readers */}
                  <span className="min-w-0 max-lg:sr-only">
                    <span className="block truncate font-mono text-base font-bold tracking-tight text-paper">{h.name}</span>
                    <span className="block truncate text-sm text-grey-300">{h.role}</span>
                  </span>
                  {selected && (
                    <span
                      data-team-p1
                      aria-hidden="true"
                      className="absolute -top-3 -right-2 z-10 rotate-[-8deg] bg-mint px-1 py-0.5 font-mono text-[0.6rem] sm:px-1.5 sm:text-[0.7rem] font-bold text-mint-ink motion-safe:animate-[team-blink_1s_steps(1)_infinite]"
                    >
                      P1
                    </span>
                  )}
                </button>
              );
            })}
          </div>

        </div>

        {/* Stage: the picked head, big */}
        <div className="lg:order-1 lg:col-span-8">
          <div
            data-team-stage
            id="team-panel"
            role="tabpanel"
            aria-labelledby={`team-tab-${active}`}
            className="relative isolate overflow-hidden bg-grey-800 outline outline-1 outline-grey-700 transition-shadow duration-300"
            style={{ boxShadow: `12px 12px 0 0 ${TONE_HEX[head.tone]}` }}
          >
            <div aria-hidden="true" className="bg-pixel-grid absolute inset-0 -z-10 [--cell:48px]" />
            {/* Giant index number behind the stage */}
            <div aria-hidden="true" data-team-ghost className="pointer-events-none absolute -right-4 -bottom-10 -z-10 select-none sm:-bottom-16">
              <span data-team-ghost-num key={active} className="block font-mono text-[clamp(9rem,30vw,22rem)] leading-none font-bold text-grey-700/70">
                {pad(active + 1)}
              </span>
            </div>

            <div className="grid gap-4 p-3 sm:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] sm:items-center sm:gap-8 sm:p-6 lg:p-8">
              {/* Portrait with pixel corner brackets */}
              <div className="relative">
                <div key={active} data-team-photo className="relative aspect-[16/10] overflow-hidden bg-grey-850 sm:aspect-[4/3] [@media(max-height:680px)]:aspect-[2/1] sm:[@media(max-height:680px)]:aspect-[16/10]">
                  <Portrait member={head} sizes="(min-width: 1024px) 34rem, (min-width: 640px) 48vw, 92vw" />
                  <span aria-hidden="true" data-team-scan className="pointer-events-none absolute inset-x-0 -top-full h-full bg-[linear-gradient(to_bottom,transparent_0,rgb(0_229_130/0.55)_46%,transparent_54%)]" />
                </div>
                {(["-top-2 -left-2 border-t-4 border-l-4", "-top-2 -right-2 border-t-4 border-r-4", "-bottom-2 -left-2 border-b-4 border-l-4", "-bottom-2 -right-2 border-r-4 border-b-4"] as const).map((c) => (
                  <span key={c} aria-hidden="true" data-team-corner className={`pointer-events-none absolute h-6 w-6 border-mint ${c}`} />
                ))}
              </div>

              {/* Details */}
              <div key={active} className="min-w-0">
                <p className="font-mono text-xs font-bold tracking-[0.14em] text-grey-300 uppercase sm:text-sm">
                  Player {pad(active + 1)} <span className="text-grey-300/80">/ {pad(team.length)}</span>
                </p>
                <p data-team-name className="mt-2 font-mono text-[clamp(1.75rem,4.6vw,3.75rem)] sm:mt-3 leading-[0.95] font-bold tracking-tight text-paper">
                  {head.name}
                </p>
                <div className="mt-3 sm:mt-5">
                  <span
                    data-team-badge
                    className={`inline-flex rotate-[-3deg] items-center gap-2.5 px-3 py-2 font-mono text-sm font-bold uppercase sm:text-base ${BADGE[head.tone]}`}
                  >
                    <BrandIcon name="chip" size={18} />
                    {head.role}
                  </span>
                </div>
                <p data-team-copy className="mt-4 max-w-[34ch] text-base leading-relaxed text-paper sm:mt-6 sm:text-xl">
                  {head.focus}
                </p>
              </div>
            </div>

            {/* Switch flash in the head's colour */}
            <div aria-hidden="true" data-team-flash className="pointer-events-none absolute inset-0 opacity-0" style={{ backgroundColor: TONE_HEX[head.tone] }} />
          </div>
        </div>
      </div>
      </div>
    </section>
  );
}
