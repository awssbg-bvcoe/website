"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { currentAdmin } from "@/lib/auth/session";
import { createLink, deleteLink, slugTaken, toggleLink, updateLink } from "@/lib/links/repo";
import { parseLinkInput, type FieldErrors } from "@/lib/links/validate";
import { siteOrigin } from "@/lib/site-origin";

export type LinkFormState = { ok?: boolean; errors?: FieldErrors; message?: string; slug?: string };

/** Every action checks the session itself; nothing relies on the page or the proxy having done it. */
async function requireAdmin() {
  const admin = await currentAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

function idFrom(form: FormData) {
  const id = Number(form.get("id"));
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export async function saveLink(_prev: LinkFormState, form: FormData): Promise<LinkFormState> {
  const admin = await requireAdmin();
  const id = form.get("id") ? idFrom(form) : null;
  if (form.get("id") && !id) return { message: "That link no longer exists." };

  const host = new URL(await siteOrigin()).host;
  const { value, errors } = parseLinkInput(form, host);
  if (!value) return { errors };
  if (await slugTaken(value.slug, id ?? undefined)) return { errors: { slug: `/${value.slug} is already in use.` } };

  try {
    if (id) await updateLink(id, value);
    else await createLink(value, admin);
  } catch (err) {
    console.error("save link failed", err);
    return { message: "Could not save the link. Try again." };
  }
  revalidatePath("/admin");
  if (id) revalidatePath(`/admin/links/${id}`);
  return { ok: true, slug: value.slug };
}

export async function toggleLinkAction(form: FormData) {
  await requireAdmin();
  const id = idFrom(form);
  if (!id) return;
  await toggleLink(id);
  revalidatePath("/admin");
  revalidatePath(`/admin/links/${id}`);
}

export async function deleteLinkAction(form: FormData) {
  await requireAdmin();
  const id = idFrom(form);
  if (!id) return;
  await deleteLink(id);
  revalidatePath("/admin");
  redirect("/admin");
}
