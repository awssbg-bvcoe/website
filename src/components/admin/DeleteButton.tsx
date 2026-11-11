"use client";

import { deleteLinkAction } from "@/app/admin/actions";

export function DeleteButton({ id, slug }: { id: number; slug: string }) {
  return (
    <form
      action={deleteLinkAction}
      onSubmit={(e) => {
        if (!confirm(`Delete /${slug} and all of its click history? This cannot be undone.`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="pressable inline-flex h-11 items-center border border-magenta px-4 text-sm font-bold text-magenta uppercase hover:bg-magenta hover:text-grey-850">
        Delete link
      </button>
    </form>
  );
}
