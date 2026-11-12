import "server-only";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let client: NeonQueryFunction<false, false> | null = null;

/** HTTP query function for Neon (one round trip per query, ideal for serverless). */
export function sql() {
  if (!client) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    // Never let Next's fetch cache store database responses (Neon queries over fetch): it kept a
    // build-time result across builds. Caching is done explicitly with "use cache" + tags (G22).
    client = neon(url, { fetchOptions: { cache: "no-store" } });
  }
  return client;
}
