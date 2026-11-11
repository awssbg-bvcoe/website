"use client";

import { useState } from "react";

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1400);
        } catch {
          setDone(false);
        }
      }}
      className="pressable inline-flex h-11 items-center border border-grey-500 px-3 text-xs font-bold uppercase hover:border-mint hover:text-mint"
      aria-label={`${label} ${text}`}
    >
      <span aria-live="polite">{done ? "Copied" : label}</span>
    </button>
  );
}
