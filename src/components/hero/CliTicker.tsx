"use client";

import { useRef } from "react";
import { gsap, useGSAP, whenIntroDone } from "@/lib/gsap";

// Keep each command at 30 characters or fewer: the sticker is a fixed width (min(22rem, 80vw)).
const COMMANDS = [
  "aws configure",
  "sam init --runtime python3.13",
  "sam deploy --guided",
  "cdk bootstrap",
  "cdk deploy --all",
  "aws s3 sync ./site s3://bvcoe",
  "aws lambda list-functions",
];

/** Small sticker that types real AWS CLI commands, one after another. */
export function CliTicker({ className = "" }: { className?: string }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const line = root.current!.querySelector<HTMLElement>("[data-cli-line]")!;
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: reduce)", () => {
        line.textContent = COMMANDS[2];
      });

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({ repeat: -1, paused: true });
        COMMANDS.forEach((cmd) => {
          const state = { n: 0 };
          tl.to(state, {
            n: cmd.length,
            duration: cmd.length * 0.045,
            ease: `steps(${cmd.length})`,
            onUpdate: () => {
              line.textContent = cmd.slice(0, Math.round(state.n));
            },
          })
            .to({}, { duration: 1.1 })
            .to(state, {
              n: 0,
              duration: 0.25,
              ease: "steps(6)",
              onUpdate: () => {
                line.textContent = cmd.slice(0, Math.round(state.n));
              },
            });
        });
        const release = whenIntroDone(() => tl.play());
        return () => {
          release();
          tl.kill();
        };
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <div
      ref={root}
      aria-hidden="true"
      className={`w-[min(22rem,80vw)] bg-grey-850 font-mono text-[0.8rem] text-paper shadow-[6px_6px_0_0_var(--mint)] outline outline-1 outline-grey-700 ${className}`}
    >
      <div className="flex items-center gap-1.5 border-b border-grey-700 px-3 py-2">
        <span className="size-2.5 bg-magenta" />
        <span className="size-2.5 bg-amber" />
        <span className="size-2.5 bg-mint" />
        <span className="ml-2 text-grey-300">~/builders</span>
      </div>
      <p className="flex min-h-11 items-center px-3 py-2.5 whitespace-nowrap">
        <span className="mr-2 text-mint">$</span>
        <span data-cli-line />
        <span className="ml-0.5 inline-block h-4 w-2 animate-pulse bg-mint motion-reduce:animate-none" />
      </p>
    </div>
  );
}
