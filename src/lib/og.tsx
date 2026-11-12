import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };

const C = {
  bg: "#161d26",
  panel: "#1d2631",
  line: "rgba(169,180,192,0.14)",
  paper: "#f2f4f5",
  grey: "#a9b4c0",
  mint: "#00e582",
  ink: "#04170e",
  amber: "#ff9900",
  purple: "#ad5cff",
  blue: "#42b4ff",
  magenta: "#ff57e9",
};

export type OgAccent = "mint" | "amber" | "purple" | "blue" | "magenta";

/** Program icon on its native 9x9 grid (same cells as the 3D hero chip). */
function chipCells() {
  const cells: [number, number][] = [];
  for (let i = 2; i <= 6; i++) cells.push([i, 1], [i, 7], [1, i], [7, i]);
  for (const i of [2, 4, 6]) cells.push([i, 0], [i, 8], [0, i], [8, i]);
  return cells;
}

const CELL = 70; // background grid cell, matches the kit's banner rhythm

async function fonts() {
  const dir = join(process.cwd(), "src/assets/og");
  const [mono, display500, display700] = await Promise.all([
    readFile(join(dir, "ember-mono-700.ttf")),
    readFile(join(dir, "ember-display-500.ttf")),
    readFile(join(dir, "ember-display-700.ttf")),
  ]);
  return [
    { name: "Ember Mono", data: mono, weight: 700 as const, style: "normal" as const },
    { name: "Ember", data: display500, weight: 500 as const, style: "normal" as const },
    { name: "Ember", data: display700, weight: 700 as const, style: "normal" as const },
  ];
}

/** AWS logo from the official SBG template, recoloured single-colour paper (never redrawn). */
async function awsLogo() {
  const svg = await readFile(join(process.cwd(), "public/brand/mark/aws.svg"), "utf8");
  // Drop the template's theme stylesheet and class (its fill overrides attributes), then set one fill
  const paper = svg
    .replace(/<style>[\s\S]*?<\/style>/g, "")
    .replace(/\sclass="[^"]*"/g, "")
    .replace(/fill="#[0-9A-Fa-f]{6}"/g, `fill="${C.paper}"`);
  return `data:image/svg+xml;base64,${Buffer.from(paper).toString("base64")}`;
}

const AWS_RATIO = 300.73 / 179.82;

/**
 * Shared Open Graph card: brand pixel grid, a stepped block staircase in the
 * route's accent, a big pixel chip and mono display type.
 * `lines` are the headline rows (max 3, short); the second row is set in the accent.
 */
export async function renderOg({
  lines,
  kicker,
  accent = "mint",
  footer = "AWS Student Builder Group",
  icon = null,
}: {
  lines: string[];
  kicker: string;
  accent?: OgAccent;
  footer?: string;
  /** Destination logo (PNG/JPEG/SVG data URI) shown on a tilted paper tile instead of the pixel chip */
  icon?: string | null;
}) {
  const a = C[accent];
  const longest = Math.max(...lines.map((l) => l.length));
  // Mono glyphs are ~0.62em wide; fit the longest row inside ~640px
  const size = Math.min(104, Math.floor(640 / (longest * 0.62)));
  const chip = chipCells();
  const px = 26;
  const [fontData, aws] = await Promise.all([fonts(), awsLogo()]);
  const awsH = 52;

  // Stepped blocks (cols, rows in grid units) echoing the kit's banner/backgrounds
  const blocks: { c: number; r: number; w: number; h: number; color: string }[] = [
    { c: 15, r: 0, w: 2, h: 1, color: a },
    { c: 13, r: 1, w: 1, h: 1, color: C.purple },
    { c: 16, r: 1, w: 1, h: 2, color: a },
    { c: 14, r: 7, w: 3, h: 2, color: a },
    { c: 11, r: 8, w: 1, h: 1, color: C.amber },
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          backgroundColor: C.bg,
          backgroundImage: `linear-gradient(to right, ${C.line} 1px, transparent 1px), linear-gradient(to bottom, ${C.line} 1px, transparent 1px)`,
          backgroundSize: `${CELL}px ${CELL}px`,
          fontFamily: "Ember",
          color: C.paper,
        }}
      >
        {blocks.map((b, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: b.c * CELL,
              top: b.r * CELL,
              width: b.w * CELL,
              height: b.h * CELL,
              backgroundColor: b.color,
              display: "flex",
            }}
          />
        ))}

        {icon ? (
          /* Destination logo on a paper tile with the accent's hard shadow, tilted like the site's stickers */
          <div
            style={{
              position: "absolute",
              right: 110,
              top: 190,
              width: 250,
              height: 250,
              backgroundColor: C.paper,
              boxShadow: `14px 14px 0 0 ${a}`,
              transform: "rotate(-6deg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={icon} alt="" width={156} height={156} style={{ objectFit: "contain" }} />
          </div>
        ) : (
          /* Pixel chip, slightly tilted like the sticker cards on the site */
          <div
            style={{
              position: "absolute",
              right: 92,
              top: 176,
              width: px * 9 + 48,
              height: px * 9 + 48,
              backgroundColor: C.panel,
              border: `2px solid ${C.line}`,
              transform: "rotate(-6deg)",
              display: "flex",
            }}
          >
            {chip.map(([c, r]) => (
              <div
                key={`${c}-${r}`}
                style={{
                  position: "absolute",
                  left: 24 + c * px,
                  top: 24 + r * px,
                  width: px - 2,
                  height: px - 2,
                  backgroundColor: a,
                  display: "flex",
                }}
              />
            ))}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "56px 64px", width: "100%" }}>
          {/* Top row: AWS logo, thin divider, kicker (logo first, as on the kit banner) */}
          <div style={{ display: "flex", alignItems: "center" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={aws} alt="AWS" width={Math.round(awsH * AWS_RATIO)} height={awsH} style={{ display: "flex" }} />
            <div style={{ display: "flex", width: 2, height: 48, backgroundColor: C.grey, opacity: 0.5, marginLeft: 26, marginRight: 26 }} />
            <div style={{ display: "flex", backgroundColor: a, color: C.ink, padding: "8px 14px", fontSize: 22, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>
              {kicker}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", fontFamily: "Ember Mono", fontWeight: 700, fontSize: size, lineHeight: 0.98, letterSpacing: -2 }}>
            {lines.slice(0, 3).map((line, i) => (
              <div key={i} style={{ display: "flex", color: i === 1 ? a : C.paper }}>
                {line}
              </div>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", fontFamily: "Ember Mono", fontWeight: 700 }}>
            <div style={{ display: "flex", fontSize: 28 }}>{footer}</div>
            <div style={{ display: "flex", fontSize: 20, color: C.grey, marginTop: 6 }}>
              at Bharati Vidyapeeth&apos;s College of Engineering, New Delhi
            </div>
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: fontData },
  );
}
