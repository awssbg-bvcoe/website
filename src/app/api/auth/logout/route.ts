import { NextResponse, type NextRequest } from "next/server";
import { endSession } from "@/lib/auth/session";

/** POST only, so a link or image on another site cannot sign an admin out. */
export async function POST(request: NextRequest) {
  await endSession();
  return NextResponse.redirect(new URL("/admin/login", request.url), 303);
}
