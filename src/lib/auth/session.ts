import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";

import { SESSION_COOKIE } from "./constants";

export { SESSION_COOKIE, STATE_COOKIE } from "./constants";
const SESSION_DAYS = 7;

const hash = (token: string) => createHash("sha256").update(token).digest("hex");

/** GitHub usernames allowed into /admin (case-insensitive), from ADMIN_GITHUB_USERS. */
export function allowedLogins() {
  return new Set(
    (process.env.ADMIN_GITHUB_USERS ?? "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
}

export async function createSession(login: string) {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 864e5);
  await sql()`insert into admin_sessions (token_hash, github_login, expires_at) values (${hash(token)}, ${login}, ${expires})`;
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  });
}

/** The signed-in admin's GitHub login, or null. Re-checks the allowlist on every call. */
export async function currentAdmin(): Promise<string | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const rows = (await sql()`
    select github_login from admin_sessions
    where token_hash = ${hash(token)} and revoked_at is null and expires_at > now()
    limit 1`) as { github_login: string }[];
  const login = rows[0]?.github_login;
  if (!login || !allowedLogins().has(login.toLowerCase())) return null;
  return login;
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await sql()`update admin_sessions set revoked_at = now() where token_hash = ${hash(token)}`;
  jar.delete(SESSION_COOKIE);
}

/** Ends every session for a login (e.g. someone leaves the core team). */
export async function revokeAllFor(login: string) {
  await sql()`update admin_sessions set revoked_at = now() where github_login = ${login} and revoked_at is null`;
}
