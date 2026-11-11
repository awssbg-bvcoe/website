import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { allowedLogins, createSession, STATE_COOKIE } from "@/lib/auth/session";

function sameString(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** GitHub redirects here. Verify state, swap the code for a token, check the allowlist, start a session. */
export async function GET(request: NextRequest) {
  const fail = (error: string) => {
    const res = NextResponse.redirect(new URL(`/admin/login?error=${error}`, request.url));
    res.cookies.delete({ name: STATE_COOKIE, path: "/api/auth" });
    return res;
  };

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const expected = request.cookies.get(STATE_COOKIE)?.value;
  if (!code || !state || !expected || !sameString(state, expected)) return fail("state");

  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: new URL("/api/auth/callback", request.url).toString(),
    }),
    cache: "no-store",
  });
  const token = (await tokenRes.json().catch(() => ({}))) as { access_token?: string };
  if (!token.access_token) return fail("github");

  const userRes = await fetch("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${token.access_token}`, Accept: "application/vnd.github+json", "User-Agent": "sbg-links" },
    cache: "no-store",
  });
  const user = (await userRes.json().catch(() => ({}))) as { login?: string };
  const login = user.login?.toLowerCase();
  if (!login) return fail("github");
  if (!allowedLogins().has(login)) return fail("denied");

  await createSession(login);
  const res = NextResponse.redirect(new URL("/admin", request.url));
  res.cookies.delete({ name: STATE_COOKIE, path: "/api/auth" });
  return res;
}
