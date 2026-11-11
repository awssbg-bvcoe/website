import QRCode from "qrcode";
import { NextResponse, type NextRequest } from "next/server";
import { currentAdmin } from "@/lib/auth/session";
import { SLUG_RE } from "@/lib/links/validate";

/** Downloadable QR code (SVG) for a short link. Admins only. */
export async function GET(request: NextRequest, { params }: RouteContext<"/api/admin/qr/[slug]">) {
  if (!(await currentAdmin())) return new NextResponse("Unauthorized", { status: 401 });
  const { slug } = await params;
  if (!SLUG_RE.test(slug)) return new NextResponse("Bad slug", { status: 400 });
  const svg = await QRCode.toString(new URL(`/${slug}`, request.url).toString(), {
    type: "svg",
    margin: 2,
    color: { dark: "#161d26", light: "#ffffff" },
  });
  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Content-Disposition": `attachment; filename="${slug}-qr.svg"`,
      "Cache-Control": "private, no-store",
    },
  });
}
