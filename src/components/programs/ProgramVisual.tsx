"use client";

import { useRef, type ReactNode } from "react";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";

/** Dark panel with a small title bar, shared by every program visual. */
function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="w-full min-w-0 bg-grey-850 font-mono text-paper shadow-[8px_8px_0_0_rgb(4_23_14/0.45)] outline outline-1 outline-grey-700">
      <div className="flex items-center gap-1.5 border-b border-grey-700 px-3 py-2 text-xs">
        <span className="size-2.5 bg-magenta" />
        <span className="size-2.5 bg-amber" />
        <span className="size-2.5 bg-mint" />
        <span className="ml-2 text-grey-300">{title}</span>
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  );
}

/** Plays `build(tl)` on a repeating timeline only while the panel is on screen; rests on its final frame under reduced motion. */
function useLoop(build: (tl: gsap.core.Timeline, q: (s: string) => HTMLElement[]) => void, rest: (q: (s: string) => HTMLElement[]) => void) {
  const root = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const q = (s: string) => gsap.utils.toArray<HTMLElement>(s, root.current);
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: reduce)", () => rest(q));
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({ repeat: -1, paused: true });
        build(tl, q);
        const st = ScrollTrigger.create({
          trigger: root.current,
          start: "top bottom",
          end: "bottom top",
          onToggle: (self) => (self.isActive ? tl.play() : tl.pause()),
        });
        return () => {
          st.kill();
          tl.kill();
        };
      });
      return () => mm.revert();
    },
    { scope: root },
  );
  return root;
}

/* Workshops: a request pulse travels through a serverless stack and the response comes back */
const STACK = ["You", "API Gateway", "Lambda", "DynamoDB"];
function DeployFlow() {
  const root = useLoop(
    (tl, q) => {
      const nodes = q("[data-node]");
      const pulse = q("[data-pulse]")[0];
      const step = nodes[1].offsetTop - nodes[0].offsetTop;
      tl.set(pulse, { y: 0, backgroundColor: "#00e582", opacity: 1 });
      nodes.forEach((node, i) => {
        tl.to(node, { backgroundColor: "#00e582", color: "#04170e", duration: 0.01 }, i === 0 ? 0 : ">")
          .to(node, { backgroundColor: "#1d2631", color: "#f2f4f5", duration: 0.01 }, ">0.22");
        if (i < nodes.length - 1) tl.to(pulse, { y: step * (i + 1), duration: 0.32, ease: "steps(4)" }, "<");
      });
      tl.set(pulse, { backgroundColor: "#ff9900" }).to(pulse, { y: 0, duration: 0.7, ease: "steps(10)" }).to(nodes[0], { backgroundColor: "#ff9900", color: "#161d26", duration: 0.01 }, ">").to(nodes[0], { backgroundColor: "#1d2631", color: "#f2f4f5", duration: 0.01 }, ">0.4");
    },
    (q) => gsap.set(q("[data-pulse]"), { opacity: 0 }),
  );
  return (
    <div ref={root}>
      <Panel title="request.flow">
        <div className="relative flex flex-col gap-4 pl-7">
          <span aria-hidden="true" className="absolute top-3 bottom-3 left-[9px] w-0.5 bg-grey-700" />
          <span data-pulse aria-hidden="true" className="absolute top-[9px] left-[5px] size-2.5 bg-mint" />
          {STACK.map((name) => (
            <div key={name} data-node className="bg-grey-800 px-3 py-2.5 text-sm font-bold outline outline-1 outline-grey-700">
              {name}
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

/* Certification: the four AWS Certified Cloud Practitioner (CLF-C02) domains and their exam weights */
const DOMAINS = [
  { name: "Cloud Concepts", weight: 24 },
  { name: "Security and Compliance", weight: 30 },
  { name: "Cloud Technology and Services", weight: 34 },
  { name: "Billing, Pricing, and Support", weight: 12 },
];
function ExamDomains() {
  const root = useLoop(
    (tl, q) => {
      const bars = q("[data-bar]");
      const stamp = q("[data-stamp]")[0];
      tl.set(bars, { scaleX: 0 }).set(stamp, { opacity: 0, scale: 1.6 });
      bars.forEach((bar) => tl.to(bar, { scaleX: 1, duration: 0.45, ease: "steps(8)" }, ">0.05"));
      tl.to(stamp, { opacity: 1, scale: 1, duration: 0.2, ease: "steps(3)" }, ">0.1").to({}, { duration: 1.1 });
    },
    (q) => {
      gsap.set(q("[data-bar]"), { scaleX: 1 });
      gsap.set(q("[data-stamp]"), { opacity: 1 });
    },
  );
  return (
    <div ref={root}>
      <Panel title="clf-c02.domains">
        <ul className="flex flex-col gap-3.5">
          {DOMAINS.map((d) => (
            <li key={d.name}>
              <div className="flex justify-between gap-3 text-xs sm:text-sm">
                <span>{d.name}</span>
                <span className="text-mint">{d.weight}%</span>
              </div>
              <div className="mt-1.5 h-2.5 bg-grey-800">
                <div data-bar className="h-full origin-left bg-mint" style={{ width: `${(d.weight / 34) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
        <p data-stamp className="mt-4 inline-block bg-mint px-2 py-1 text-xs font-bold text-mint-ink">
          Exam weights, AWS CLF-C02
        </p>
      </Panel>
    </div>
  );
}

/* Careers: a chip climbs the rungs one step at a time */
const RUNGS = ["Land an internship", "Earn a certification", "Ship a project", "Join a session"];
function CareerLadder() {
  const root = useLoop(
    (tl, q) => {
      const rungs = q("[data-rung]");
      const climber = q("[data-climber]")[0];
      const h = rungs[0].offsetHeight + 8;
      tl.set(rungs, { color: "#a9b4c0", borderColor: "#2a3542" }).set(climber, { y: 0 });
      // rungs are listed top to bottom; climb from the last (bottom) to the first
      for (let k = rungs.length - 1; k >= 0; k--) {
        const up = rungs.length - 1 - k;
        tl.to(climber, { y: -h * up, duration: 0.18, ease: "steps(3)" }, ">0.12").to(rungs[k], { color: "#00e582", borderColor: "#00e582", duration: 0.01 }, "<0.1");
      }
      tl.to({}, { duration: 0.9 });
    },
    (q) => gsap.set(q("[data-rung]"), { color: "#00e582", borderColor: "#00e582" }),
  );
  return (
    <div ref={root}>
      <Panel title="career.path">
        <div className="relative flex gap-4">
          <div className="relative w-8 shrink-0">
            <span data-climber aria-hidden="true" className="absolute bottom-1.5 left-1 text-mint">
              <BrandIcon name="chip" size={24} />
            </span>
          </div>
          <ol className="flex flex-1 flex-col gap-2">
            {RUNGS.map((r) => (
              <li key={r} data-rung className="border-l-4 border-grey-700 bg-grey-800 px-3 py-2.5 text-sm font-bold text-grey-300">
                {r}
              </li>
            ))}
          </ol>
        </div>
      </Panel>
    </div>
  );
}

/* Labs: a real S3 lab, command by command, with the CLI's actual output lines */
const LAB = [
  { cmd: "aws s3 mb s3://lab-bvcoe", out: "make_bucket: lab-bvcoe" },
  { cmd: "aws s3 cp index.html s3://lab-bvcoe", out: "upload: ./index.html to s3://lab-bvcoe/index.html" },
  { cmd: "aws s3 ls s3://lab-bvcoe", out: "index.html" },
];
function LabTerminal() {
  const root = useLoop(
    (tl, q) => {
      const lines = q("[data-lab-line]");
      tl.set(lines, { clipPath: "inset(0 100% 0 0)" });
      lines.forEach((line, i) => {
        const isCmd = i % 2 === 0;
        tl.to(line, { clipPath: "inset(0 0% 0 0)", duration: isCmd ? 0.5 : 0.01, ease: isCmd ? "steps(18)" : "none" }, isCmd ? ">0.15" : ">0.12");
      });
      tl.to({}, { duration: 1.2 });
    },
    (q) => gsap.set(q("[data-lab-line]"), { clipPath: "inset(0 0% 0 0)" }),
  );
  return (
    <div ref={root}>
      <Panel title="~/labs/s3">
        <div className="flex flex-col gap-1.5 overflow-hidden text-xs sm:text-sm">
          {LAB.map((l) => (
            <div key={l.cmd} className="contents">
              <p data-lab-line className="truncate">
                <span className="text-mint">$ </span>
                {l.cmd}
              </p>
              <p data-lab-line className="mb-1.5 truncate text-grey-300">
                {l.out}
              </p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

export function ProgramVisual({ id }: { id: string }) {
  switch (id) {
    case "workshops":
      return <DeployFlow />;
    case "certification":
      return <ExamDomains />;
    case "careers":
      return <CareerLadder />;
    case "labs":
      return <LabTerminal />;
    default:
      return null;
  }
}
