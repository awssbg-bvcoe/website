"use client";

import Image from "next/image";
import { useRef } from "react";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { team, type TeamMember } from "@/content/team";
import { Draggable, gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";

const tones: Record<TeamMember["tone"], string> = {
  mint: "bg-mint text-mint-ink",
  purple: "bg-purple text-grey-850",
  amber: "bg-amber text-grey-850",
  blue: "bg-blue text-grey-850",
  magenta: "bg-magenta text-grey-850",
  paper: "bg-paper text-grey-850",
};

/** Scattered layout on the desktop board: left/top in %, rotation in deg. */
const spots = [
  { x: 2, y: 5, r: -4 },
  { x: 27, y: 2, r: 3 },
  { x: 51, y: 6, r: -2 },
  { x: 75, y: 3, r: 4 },
  { x: 16, y: 53, r: -3 },
  { x: 58, y: 54, r: 3 },
];

function initials(name: string) {
  const parts = name.split(" ");
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function Portrait({ member }: { member: TeamMember }) {
  if (member.photo) {
    return (
      <Image
        src={member.photo}
        alt={`Portrait of ${member.name}`}
        fill
        sizes="(min-width: 1024px) 18rem, 72vw"
        className="object-cover grayscale-[15%]"
        draggable={false}
      />
    );
  }
  // Monogram on the brand grid until a photo is added in content/team.ts
  return (
    <div className="bg-pixel-grid absolute inset-0 grid place-items-center bg-grey-850/90 text-current [--cell:24px]">
      <span className="font-mono text-6xl font-bold tracking-tight">{initials(member.name)}</span>
      <BrandIcon name="chip" size={22} className="absolute right-3 bottom-3 opacity-70" />
    </div>
  );
}

function MemberCard({ member }: { member: TeamMember }) {
  const tone = tones[member.tone];
  return (
    <article
      className={`group flex h-full flex-col shadow-[6px_6px_0_0_rgb(4_23_14/0.5)] ${tone} ${member.lead ? "lg:w-[19rem]" : "lg:w-[17rem]"}`}
      aria-label={`${member.name}, ${member.role}`}
    >
      <div className={`scan-hover relative m-3 mb-0 aspect-[4/3] overflow-hidden ${member.tone === "mint" ? "text-mint" : "text-paper"}`}>
        <Portrait member={member} />
      </div>
      <div className="flex flex-1 flex-col p-5 pt-4">
        {member.lead && (
          <span className="mb-2 inline-flex w-fit bg-grey-850 px-2 py-1 text-[0.7rem] font-bold tracking-[0.12em] text-mint uppercase">
            Group Leader
          </span>
        )}
        <h3 className="font-mono text-xl leading-tight font-bold tracking-tight">{member.name}</h3>
        {!member.lead && <p className="mt-1 text-sm font-bold">{member.role}</p>}
        <p className="mt-3 text-[0.95rem] leading-snug">{member.focus}</p>
        {member.links && (member.links.linkedin || member.links.github) && (
          <div className="mt-4 flex gap-2 text-sm font-bold">
            {member.links.linkedin && (
              <a className="pressable border border-current/30 px-2 py-1 hover:bg-grey-850/10" href={member.links.linkedin} target="_blank" rel="noreferrer">
                LinkedIn
              </a>
            )}
            {member.links.github && (
              <a className="pressable border border-current/30 px-2 py-1 hover:bg-grey-850/10" href={member.links.github} target="_blank" rel="noreferrer">
                GitHub
              </a>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

export function Team() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(min-width: 1024px)", () => {
        const board = root.current!.querySelector<HTMLElement>("[data-board]")!;
        // Coming from the mobile pan (resize/rotation), a leftover transform on the track would
        // become the containing block for the absolutely positioned cards and collapse the board
        gsap.set("[data-track]", { clearProps: "transform,translate,overflowX,scrollSnapType" });
        const cards = gsap.utils.toArray<HTMLElement>("[data-member]");
        cards.forEach((card, i) => gsap.set(card, { rotate: spots[i % spots.length].r }));

        let z = cards.length;
        const drags = Draggable.create(cards, {
          type: "x,y",
          bounds: board,
          inertia: true,
          edgeResistance: 0.8,
          zIndexBoost: false,
          onPress() {
            z += 1;
            gsap.set(this.target, { zIndex: z });
            gsap.to(this.target, { scale: 1.04, rotate: 0, duration: 0.25, ease: "snap" });
          },
          onRelease() {
            const i = cards.indexOf(this.target as HTMLElement);
            gsap.to(this.target, { scale: 1, rotate: spots[i % spots.length].r, duration: 0.5, ease: "back.out(2)" });
          },
        });
        return () => drags.forEach((d) => d.kill());
      });

      mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-member]", {
          y: 220,
          opacity: 0,
          rotate: (i) => spots[i % spots.length].r * 4,
          duration: 1,
          stagger: 0.08,
          ease: "snap",
          scrollTrigger: { trigger: "[data-board]", start: "top 75%", once: true },
        });
      });

      // Mobile: hold the board on screen and turn vertical scroll into a sideways pass through every card.
      // The hold is CSS sticky inside a tall rail, not a ScrollTrigger pin: phones run momentum scrolling
      // on the compositor, and a JS pin switched to fixed a frame late, so the board jumped and bounced.
      mm.add("(max-width: 1023px) and (prefers-reduced-motion: no-preference)", () => {
        const rail = root.current!.querySelector<HTMLElement>("[data-board-rail]")!;
        const board = root.current!.querySelector<HTMLElement>("[data-board]")!;
        const track = root.current!.querySelector<HTMLElement>("[data-track]")!;
        const bar = root.current!.querySelector<HTMLElement>("[data-team-progress]")!;
        const cards = gsap.utils.toArray<HTMLElement>("[data-member]");

        // Native horizontal scrolling would fight the scrubbed transform
        gsap.set(track, { overflowX: "visible", scrollSnapType: "none" });

        const distance = () => {
          const last = cards[cards.length - 1];
          const padRight = parseFloat(getComputedStyle(track).paddingRight) || 0;
          return Math.max(0, last.offsetLeft + last.offsetWidth + padRight - track.clientWidth);
        };
        // Centre the board when it fits, otherwise hold it from the top
        const stickyTop = () => Math.max(0, (window.innerHeight - board.offsetHeight) / 2);

        // Rail = board height + pan distance, so the sticky board stays put for exactly the pan
        const layout = () => {
          gsap.set(board, { position: "sticky", top: stickyTop() });
          gsap.set(rail, { height: board.offsetHeight + distance() });
        };
        layout();
        ScrollTrigger.addEventListener("refreshInit", layout);

        const pan = gsap.to(track, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: rail,
            start: () => `top top+=${stickyTop()}`,
            end: () => `+=${distance()}`,
            // 1:1 with the finger: a lagged scrub kept sliding after a fling stopped and read as rubber banding
            scrub: true,
            invalidateOnRefresh: true,
            onUpdate: (self) => gsap.set(bar, { scaleX: self.progress }),
          },
        });

        // Cards swing in from a tilt and settle as they cross the middle of the screen
        cards.forEach((card) => {
          gsap
            .timeline({
              defaults: { ease: "none" },
              scrollTrigger: { trigger: card, containerAnimation: pan, start: "left right", end: "right left", scrub: true },
            })
            .fromTo(card, { rotate: 6, scale: 0.94 }, { rotate: 0, scale: 1 })
            .to(card, { rotate: -6, scale: 0.94 });
        });

        return () => ScrollTrigger.removeEventListener("refreshInit", layout);
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} id="team" aria-labelledby="team-title" className="relative py-28 lg:px-8 lg:py-40">
      <h2 id="team-title" className="px-4 font-mono text-[clamp(2.75rem,9vw,9rem)] leading-[0.9] font-bold tracking-tight uppercase sm:px-8 lg:px-0">
        Core
        <br />
        <span className="text-mint text-outline">Team</span>
      </h2>
      <p className="mt-8 max-w-[46ch] px-4 text-lg leading-relaxed text-grey-300 sm:px-8 sm:text-xl lg:px-0">
        Six students running workshops, partnerships, design and operations for the group this term.
      </p>

      {/* Mobile: the rail is made tall and the board sticks inside it during the sideways pass */}
      <div data-board-rail className="mt-14">
      <div
        data-board
        className="bg-pixel-grid relative overflow-hidden bg-grey-800 lg:h-[58rem] lg:overflow-hidden lg:outline lg:outline-1 lg:outline-grey-700"
      >
        <p className="absolute right-6 bottom-5 hidden items-center gap-2 font-mono text-sm text-grey-300 lg:flex">
          <BrandIcon name="double-bracket-smile" size={14} className="text-mint" />
          Drag the cards around
        </p>
        <div
          data-team-progress
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 bg-mint motion-reduce:hidden lg:hidden"
        />
        <ul
          data-track
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 py-8 [scrollbar-width:none] sm:px-8 lg:block lg:p-0"
          data-lenis-prevent-touch
          tabIndex={0}
          aria-label="Core team members"
        >
          {team.map((member, i) => (
            <li
              key={member.name}
              data-member
              className="w-[78vw] max-w-[19rem] shrink-0 snap-start lg:absolute lg:w-auto lg:max-w-none lg:cursor-grab lg:touch-none lg:active:cursor-grabbing"
              style={{ left: `${spots[i % spots.length].x}%`, top: `${spots[i % spots.length].y}%` }}
            >
              <MemberCard member={member} />
            </li>
          ))}
        </ul>
      </div>
      </div>
    </section>
  );
}
