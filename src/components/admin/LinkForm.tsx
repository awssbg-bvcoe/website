"use client";

import { useActionState, useEffect, useRef } from "react";
import { saveLink, type LinkFormState } from "@/app/admin/actions";

type Initial = {
  id?: number;
  slug?: string;
  url?: string;
  note?: string | null;
  expiresAt?: string | null;
  enabled?: boolean;
  title?: string | null;
  description?: string | null;
  listed?: boolean;
  featured?: boolean;
};

const field = "h-11 w-full bg-grey-850 px-3 text-paper outline outline-1 outline-grey-500 placeholder:text-grey-500 focus-visible:outline-2 focus-visible:outline-mint";

function Field({ id, label, error, hint, children }: { id: string; label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-bold text-paper">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-grey-300">{hint}</p>}
      {error && (
        <p id={`${id}-error`} className="text-sm text-magenta">
          {error}
        </p>
      )}
    </div>
  );
}

/** Create (no `initial.id`) or edit a link. Errors show under their own field. */
export function LinkForm({ initial, origin }: { initial?: Initial; origin: string }) {
  const [state, action, pending] = useActionState<LinkFormState, FormData>(saveLink, {});
  const form = useRef<HTMLFormElement>(null);
  const editing = Boolean(initial?.id);
  const prefix = origin.replace(/^https?:\/\//, "");

  useEffect(() => {
    if (state.ok && !editing) form.current?.reset();
  }, [state, editing]);

  return (
    <form ref={form} action={action} className="grid gap-5 sm:grid-cols-2" noValidate>
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}
      <Field id="slug" label="Short name" error={state.errors?.slug} hint={`${prefix}/your-name`}>
        <div className="flex">
          <span className="grid h-11 shrink-0 place-items-center bg-grey-800 px-3 font-mono text-sm text-grey-300 outline outline-1 outline-grey-500">/</span>
          <input
            id="slug"
            name="slug"
            required
            defaultValue={initial?.slug}
            autoComplete="off"
            spellCheck={false}
            aria-invalid={Boolean(state.errors?.slug)}
            aria-describedby={state.errors?.slug ? "slug-error" : undefined}
            className={`${field} font-mono`}
          />
        </div>
      </Field>
      <Field id="url" label="Destination" error={state.errors?.url}>
        <input
          id="url"
          name="url"
          type="url"
          required
          defaultValue={initial?.url}
          placeholder="https://"
          aria-invalid={Boolean(state.errors?.url)}
          aria-describedby={state.errors?.url ? "url-error" : undefined}
          className={field}
        />
      </Field>
      <Field id="note" label="Note (optional)" error={state.errors?.note} hint="Only admins see this.">
        <input id="note" name="note" maxLength={280} defaultValue={initial?.note ?? ""} className={field} />
      </Field>
      <Field id="expiresAt" label="Expires (optional)" error={state.errors?.expiresAt} hint="After this the short link shows the 404 page.">
        <input
          id="expiresAt"
          name="expiresAt"
          type="datetime-local"
          defaultValue={initial?.expiresAt ?? ""}
          aria-invalid={Boolean(state.errors?.expiresAt)}
          className={`${field} [color-scheme:dark]`}
        />
      </Field>
      {editing && <input type="hidden" name="enabled" value={initial?.enabled ? "on" : "off"} />}

      <fieldset className="grid gap-5 border-t border-grey-700 pt-5 sm:col-span-2 sm:grid-cols-2">
        <legend className="sr-only">Card on the /links page</legend>
        <p className="font-mono text-sm font-bold text-paper sm:col-span-2">
          Card on <span className="text-mint">/links</span>
        </p>
        <Field id="title" label="Title" error={state.errors?.title} hint="Needed to show it on /links.">
          <input
            id="title"
            name="title"
            maxLength={80}
            defaultValue={initial?.title ?? ""}
            aria-invalid={Boolean(state.errors?.title)}
            aria-describedby={state.errors?.title ? "title-error" : undefined}
            className={field}
          />
        </Field>
        <Field id="description" label="Description (optional)" error={state.errors?.description} hint="One short line under the title.">
          <input
            id="description"
            name="description"
            maxLength={140}
            defaultValue={initial?.description ?? ""}
            aria-invalid={Boolean(state.errors?.description)}
            aria-describedby={state.errors?.description ? "description-error" : undefined}
            className={field}
          />
        </Field>
        <div className="flex flex-wrap gap-x-8 gap-y-3 sm:col-span-2">
          <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-bold">
            <input type="checkbox" name="listed" defaultChecked={initial?.listed ?? false} className="size-5 accent-mint" />
            Show on /links
          </label>
          <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-bold">
            <input type="checkbox" name="featured" defaultChecked={initial?.featured ?? false} className="size-5 accent-mint" />
            Featured (pinned to the top, bigger card)
          </label>
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="pressable inline-flex h-11 items-center bg-mint px-6 font-bold text-mint-ink uppercase hover:bg-paper disabled:opacity-60"
        >
          {pending ? "Saving" : editing ? "Save changes" : "Create link"}
        </button>
        <p role="status" className="text-sm text-grey-300">
          {state.message ?? (state.ok ? `Saved ${prefix}/${state.slug}` : "")}
        </p>
      </div>
    </form>
  );
}
