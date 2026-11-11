<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md: AWS Student Builder Group at BVCOE website

This file is the single source of truth for every agent (Claude Code, Codex, Cursor, Copilot or any other) and every human working on this repository. `CLAUDE.md` imports it. Read it top to bottom before you touch anything.

---

## 0. Non-negotiable rules for every session

1. **Read this whole file first.** Do not rely on memory from a previous session; rely on this file and the code.
2. **Log every change in the Changelog (section 17) before your session ends.** No exceptions: code, content, config, assets, dependencies, git or deployment changes, and decisions made with the user. A session that changes the repo without a changelog entry has left the next agent with wrong context. Follow the entry template in 17.1 exactly.
3. **Update the relevant reference section too** (repo map, decisions, pending work, gotchas) when your change makes it out of date. The changelog says what happened; the sections above it describe how things are now. Both must be true at the end of your session.
4. **Never commit or push unless the user asks.** When they do, use the club identity set up in section 15. Never push from the maintainer's personal GitHub identity.
   **No attribution in commits, ever:** no `Co-Authored-By` trailers (Claude or anyone else), no "Generated with ..." lines and no session links in commit messages, commit descriptions or PR descriptions. This is a standing instruction from the user and overrides any tool's default.
5. **Use only the brand assets in this repo** (fonts, icons, program icon, colours). No outside icon libraries, no Google Fonts, no stock imagery. See section 6.
6. **Do not invent facts.** Numbers, titles, programmes and claims come from the source documents summarised in section 7. If something is unknown, leave it out or ask.
7. **Keep it accessible.** Zero `critical` or `serious` axe violations is the bar. Everything animated must collapse to a static, fully readable page under `prefers-reduced-motion: reduce`.
8. **Verify in a browser before claiming done** (section 12). Prefer a production build (`pnpm build && pnpm start`) for checks; the dev server's CSS hot reload has served stale CSS in this repo (gotcha G7).
9. **Keep secrets out of the repo and out of this file.** Env var names are fine; values never.

---

## 1. Project overview

| Item | Value |
|---|---|
| Organisation | AWS Student Builder Group (SBG) at Bharati Vidyapeeth's College of Engineering (BVCOE), New Delhi |
| Programme | AWS Student Builder Groups, formerly AWS Cloud Clubs. Programme page: https://builder.aws.com/community/student-builder-groups |
| Group Leader | Samyak Jain (official SBG Leader per the AWS affiliation letter dated 21 September 2026) |
| Purpose of the site | Public club website: who we are, what we run, the core team, how to join. Planned: a link shortener and redirect system (section 16). |
| Tone | Student-led, hands-on, playful pixel/arcade energy inside the official AWS SBG brand kit |
| Reference for feel | https://1minus1.com/ (layout and motion language only; none of their copy, art, fonts or brand is used) |
| GitHub | `awssbg-bvcoe/website` on the club's own GitHub account (not the maintainer's personal account) |
| Hosting | Vercel, on the club's own Vercel account (not linked yet as of the last changelog entry) |

---

## 2. Stack and versions

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 16.4.x, App Router, `src/` dir, TypeScript | `cacheComponents: true` and `partialPrefetching: true` in `next.config.ts`. Bundled docs live in `node_modules/next/dist/docs/`; read them before using any Next API. |
| React | 19.3 | |
| Styling | Tailwind CSS v4 via `@tailwindcss/turbopack` | Tokens in `src/app/globals.css` (`@theme inline`). No `tailwind.config`. |
| Animation | GSAP 3.15 + `@gsap/react` (`useGSAP`) | All plugins are free since 3.13: ScrollTrigger, SplitText, ScrambleTextPlugin, CustomEase, Draggable, InertiaPlugin. Registered once in `src/lib/gsap.ts`. |
| Smooth scroll | Lenis 1.3 | Driven by the GSAP ticker (`autoRaf: false`). |
| 3D | three.js 0.187 (raw, no R3F) | Lazy loaded with `next/dynamic` and `ssr: false`. |
| OG images | `next/og` `ImageResponse` | Shared renderer in `src/lib/og.tsx`. |
| Package manager | pnpm 12 | `pnpm-workspace.yaml` has `allowBuilds` with `sharp: false`. |
| Node | 24 LTS is Vercel's default; local dev ran on Node 26 | |

Do not add Motion (framer-motion), R3F, icon libraries, UI kits or font services without the user's approval and a changelog entry. GSAP and three must never animate the same element at the same time.

---

## 3. Commands

```bash
pnpm install              # install
pnpm dev                  # dev server (Turbopack). Port 3000 by default; use --port to change
pnpm build                # production build (also type-checks)
pnpm start --port 3101    # serve the production build for verification
pnpm lint                 # ESLint (eslint-config-next). Must be clean.
npx tsc --noEmit          # types. `LayoutProps` errors before the first build are expected (generated types)
```

Stopping servers safely: do **not** use `pkill -f next-server` or `pkill -f "next start"` from a shell whose command line contains that same text; it kills the shell itself (exit 144). Kill by port instead:

```bash
for p in $(ss -ltnp | grep -E ":3101 " | grep -o "pid=[0-9]*" | cut -d= -f2); do kill $p; done
```

---

## 4. Repository map

```
AGENTS.md                      this file (single source of truth + changelog)
CLAUDE.md                      imports AGENTS.md for Claude Code
next.config.ts                 cacheComponents, partialPrefetching, Tailwind turbopack loader
public/brand/icons/*.svg       11 brand-kit icons (white set, verified by shape, see 6.3)
public/brand/mark/chip.svg     program icon (the "chip"), white
public/brand/mark/aws.svg      AWS logo (smile), vector from the official SBG presentation template (ppt/media/image9.svg)
db/migrations/*.sql            plain SQL migrations, applied in name order by scripts/migrate.mjs (`pnpm db:migrate`)
scripts/migrate.mjs            migration runner (Neon Pool over WebSocket, one transaction per file, schema_migrations table)
src/proxy.ts                   short-link redirects (/{slug} -> 307) + click recording via waitUntil; cookie gate for /admin
src/app/
  layout.tsx                   root: fonts (next/font/local), metadata, skip link, seen-session inline script
  (site)/layout.tsx            public site only: Preloader, SmoothScroll, PixelTrail (admin and 404 skip them)
  (site)/page.tsx              Nav + main(Hero, About, Programs, Team, Join) + Footer
  admin/                       links admin: layout (noindex), page (dashboard), login/, links/[id]/ (stats, QR, edit, delete), actions.ts (server actions)
  api/auth/github|callback|logout   hand-written GitHub OAuth (state cookie, allowlist, DB sessions)
  api/admin/qr/[slug]          SVG QR download (admin only)
  globals.css                  tokens, z-index scale, Lenis CSS, custom classes in @layer components
  not-found.tsx                404 page with the Packet run game (also reached via /press-start)
  opengraph-image.tsx          home OG image (uses src/lib/og.tsx)
  twitter-image.tsx            re-exports opengraph-image
  icon.svg                     favicon: mint chip on Grey 850
  fonts/*.woff2                subset Amazon Ember Display 300/500/700/800 and Ember Mono 400/700
src/assets/og/*.ttf            TTF subsets for Satori (OG images cannot use woff2)
src/content/
  site.ts                      site constants, nav, programs, stats, BrandIconName type, joinUrl, socials
  team.ts                      core team data (photo and links optional)
src/lib/
  db.ts                        lazy Neon HTTP query function (`sql()`), server-only
  site-origin.ts               request origin from headers (works on previews and custom domains)
  auth/constants.ts            cookie names (kept separate so the proxy stays light)
  auth/session.ts              allowlist, create/verify/end/revoke sessions (SHA-256 token hashes in admin_sessions)
  links/validate.ts            SLUG_RE, RESERVED, parseLinkInput, deviceClass, referrerHost
  links/repo.ts                link queries, 30s per-instance lookup cache, stats queries
  gsap.ts                      plugin registration, custom eases, SCRAMBLE_CHARS, PRELOADER_DONE event, whenIntroDone(), reducedMotion()
  og.tsx                       renderOg({ lines, kicker, accent, footer }) shared OG card
src/components/
  admin/                       LinkForm (useActionState, per-field errors), CopyButton, DeleteButton, AdminHeader, ClicksChart + Breakdown
  brand/BrandIcon.tsx          renders kit icons as CSS masks (inherit currentColor); holds aspect ratios
  brand/Lockup.tsx             chip + mono wordmark lockup; iconClassName prop for colour
  motion/Preloader.tsx         first-visit intro, inert page while showing, fallback timer, dispatches PRELOADER_DONE
  motion/SmoothScroll.tsx      Lenis + ScrollTrigger sync; holds scroll until intro is done
  motion/PixelTrail.tsx        global mint pixel cursor trail (desktop fine pointer only)
  about/LifeGrid.tsx           Game of Life canvas (16x11, mint) in a bento cell
  about/LedMatrix.tsx          LED pixel-matrix ticker (5x7 font) with pointer painting
  programs/ProgramVisual.tsx   per-program animated panels (request flow, CLF-C02 domains, career ladder, S3 lab terminal)
  about/DeployBar.tsx          16-block "Building > Deploying > Live in ap-south-1" loop
  hero/PixelRain.tsx           hero background canvas: stepped falling blocks + cursor scan box
  hero/Tapes.tsx               two crossing marquee tapes, speed follows scroll velocity
  hero/Stickers.tsx            8 brand-icon stickers: burst in, float, mouse parallax, drag/throw, click spin
  hero/CliTicker.tsx           sticker typing real AWS CLI commands
  three/ChipScene.tsx          three.js voxel chip + tile field; scroll burst, rebuild pulse, cube pops, click kick
  sections/Nav.tsx             fixed nav, logo plate after 120px scroll
  sections/Hero.tsx            hero composition, kinetic headline, glitch loop, magnets, pinned scroll timeline
  sections/About.tsx           pixel bento with stats
  sections/Programs.tsx        sticky stacking cards
  sections/Team.tsx            draggable team board (desktop), snap scroller (mobile)
  sections/Join.tsx            "Build with us" + join card
  sections/Footer.tsx          mint footer, marquee, legal line, 404 game link
  game/PacketGame.tsx          canvas snake-style game with keyboard, swipe and d-pad
```

---

## 5. Page structure and section contracts

Order on `/`: Nav (fixed) > Hero (`#top`) > About (`#about`) > Programs (`#programs`) > Team (`#team`) > Join (`#join`) > Footer.

| Section | Layout family | Key behaviour | Content source |
|---|---|---|---|
| Hero | Display type + tilted media card + collage | See 9.4 | `site.ts`, hard-coded headline from the brand banner ("Learn. Build. Deploy. Scale.") |
| About | Pixel bento (mirrors brand banner) + LED ticker | See 9.5 | `stats` in `site.ts` |
| Programs | Sticky stack | Cards pin at `top top`, land with a ±5° tilt, earlier card scales to 0.92 and darkens via a shade layer (never opacity on the card) | `programs` in `site.ts` |
| Team | Draggable board / mobile pinned horizontal pan | Desktop: absolute spots with rotations (`spots` array), Draggable with inertia and bounds. Mobile (<1024px): board pins and vertical scroll pans through every card, then releases (see 9.5). Reduced motion on mobile: native horizontal scroll-snap, focusable (`tabIndex=0`) | `team.ts` |
| Join | Big type + perks list + paper card | Char reveal, card rises with tilt | `site.joinUrl` |
| Footer | Mint block + marquee | GSAP marquee (static under reduced motion); pills for Builder Center, Instagram, LinkedIn; "Made with <3 by Samyak Jain" linking to GitHub | `site.programUrl`, `site.socials`, `site.maker` |

Each layout family appears once on the page. Do not add a second marquee-style element outside the hero tapes and footer without the user asking.

---

## 6. Brand system

Source folder supplied by the club (outside the repo, on the maintainer's machine): `~/Downloads/01- Creative Assets _ Fonts, Icons, Etc.` containing Brandmarks, Fonts, Program Icon, Additional Icons, Presentation Template and Virtual Backgrounds. Only copies of what is in use live in this repo.

### 6.1 Colours (tokens in `globals.css`)

| Token | Hex | Use |
|---|---|---|
| `grey-850` | `#161d26` | Page background (brand "Grey 850") |
| `grey-800` | `#1d2631` | Raised dark surfaces |
| `grey-700` | `#2a3542` | Hairlines, outlines |
| `grey-500` | `#5b6878` | Secondary borders |
| `grey-300` | `#a9b4c0` | Secondary text on dark |
| `paper` | `#f2f4f5` | Primary text on dark, light card surface (never pure white) |
| `mint` | `#00e582` | Primary accent (brand Mint) |
| `mint-ink` | `#04170e` | Text on mint |
| `purple` | `#ad5cff` | Brand block colour |
| `amber` | `#ff9900` | Brand block colour |
| `blue` | `#42b4ff` | Brand block colour |
| `magenta` | `#ff57e9` | Brand block colour |

Mint is the one accent. Purple, amber, blue and magenta appear only as solid "brand blocks" (cards, stickers, tapes, bento cells), the same way the kit's banner and virtual backgrounds use them. Text on purple/amber/blue/magenta is `grey-850` at full opacity (purple at reduced opacity failed contrast, see changelog).

### 6.2 Typography

| Role | Font | Weights in repo | Tailwind |
|---|---|---|---|
| Display, headings, labels in mono | Amazon Ember Mono | 400, 700 | `font-mono` |
| Body, UI | Amazon Ember Display | 300, 500, 700, 800 | `font-sans` (default) |

- **Kit quirk (G1):** `AmazonEmberDisplay_Rg.ttf`, `_Bd.ttf` and `_BdIt.ttf` in the kit are byte-identical and are all Bold 700. There is no real Regular. Body text uses Medium 500 (set on `body`); Light 300 is available for large leads.
- Fonts are subset to Latin with `pyftsubset` (fonttools + brotli in a throwaway venv) and loaded via `next/font/local` with `display: swap`. OG images use separate TTF subsets in `src/assets/og/`.
- Display size token: `--text-display: clamp(2rem, 9.4vw, 13rem)`. It is sized so the 14-character mono row "DEPLOY. SCALE." fits at 390px wide. Ember Mono advance is about 0.65em per character; recompute if you change the headline.
- Outline text uses `.text-outline` (`-webkit-text-fill-color: transparent` + `-webkit-text-stroke`). Never use `color: transparent` for this; it makes `currentColor` transparent too (G2).

### 6.3 Icons

- Use `BrandIcon` (`src/components/brand/BrandIcon.tsx`). It renders the SVG as a CSS mask, so colour comes from `currentColor` and `size` is the height in px. Aspect ratios are stored in the `ratios` map; add one when adding an icon.
- Available: `bolt, clock, double-bracket-smile, drop, key, ladder, single-bracket-smile, speaker, teams, trophy, wrench` and the program icon `chip`.
- **Kit quirk (G3):** about half the files in `Additional Icons/SVG` carry the wrong name (a systematic naming shift). Colour in the filename is also unreliable. Files were grouped by path hash to find true shapes. The `_White` set is correct **except** `Trophy_White.svg`, which is a wrench; the real trophy is the shape found in `Trophy_Mint.svg` (viewBox 3870x3870). Always check an icon visually before adding it.
- **Kit quirk (G4):** `Brandmarks/Alternate (Without AWS)` contains a personal photo, not a logo. Do not use it. Primary brandmark SVG fills also do not match their filenames.
- The lockup is rebuilt in code (chip + "AWS Student Builder Group" / "at BVCOE, New Delhi" in Ember Mono) so it stays live text. It ends with a thin divider and the **AWS logo** (`BrandIcon name="aws"`, accessible name "AWS"), as on the kit's banner. `Lockup` props: `aws` (default true), `awsClassName`, `textClassName`. The nav hides the wordmark text (`textClassName="max-sm:sr-only"`) and the AWS group (`awsClassName="max-sm:hidden"`) below 640px because the phone nav has no room; on phones the hero shows the AWS logo + "Student Builder Group" above the headline instead (`sm:hidden`). The footer lockup shows it from `sm`.
- The AWS logo is official artwork: never redraw or recolour it beyond single-colour (it renders as a mask in `currentColor`: paper on dark, mint-ink on the mint footer). The SVG came from `Presentation Template/AWS_StudentBuilderGroups_PPTTemplate_Final .pptx` > `ppt/media/` (the 300.73x179.82 files are the AWS logo in several colours).
- No hand-drawn SVG icons and no third-party icon sets.

### 6.4 Shape, theme and copy rules

- **Radius 0 everywhere** (pixel brand). Life comes from tilts (sticker rotations), hard offset shadows and motion, not rounded corners.
- **Dark theme only, locked.** The kit is dark-first; no light mode and no section that flips theme.
- **No em-dashes or en-dashes in visible copy.** Use periods, commas or a plain hyphen.
- No scroll cues ("Scroll to explore"), no version labels, no fake metrics, no decorative status dots, no section-number eyebrows.
- One label per intent: "Join the group" is the only join CTA label on the page (nav uses "Join").

---

## 7. Content facts and sources

Source documents (on the maintainer's machine, not in the repo): five core team appointment letters, the "AWS SBG Core Team KT Call" deck, and the AWS affiliation letter. Facts used on the site:

- Programme: "AWS Student Builder Groups (formerly AWS Cloud Clubs) are student-led communities where students explore, create and innovate with AWS." 1,000+ groups, 68+ countries. Members learn cloud and AI through hands-on events, workshops and projects. Membership open to any learner aged 18+.
- Term expectations: host 6+ events in the 12-month term, grow membership, get recognised on campus, publish on AWS Builder Center, attend monthly check-ins, mentor a successor.
- Event types: hands-on workshops, certification prep, career sessions, demos and labs.
- Affiliation letter: groups "exist exclusively for educational purposes" and welcome "members of all disciplines, years, and majors".

Core team (decided with the user: use the **appointment letter titles**, not the deck titles):

| Name | Title on site | Deck title (not used) |
|---|---|---|
| Samyak Jain | Group Leader | Group Leader |
| Aamir Ali Zaidi | Head of Community & Partnerships | Outreach Lead |
| Tanisha Kaur | Creative Director | Design |
| Chetna Negi | Social Media Strategist | Social Media |
| Pakhshi Luthra | Treasurer | Treasurer |
| Arya Bhardwaj | General Secretary | General Secretary |

Photos (supplied 2026-11-11) live in `public/team/<name-slug>.jpg`: 960x720 (the card's 4:3 frame), cropped waist-up with the face at about 38% height, JPEG q82 progressive, all EXIF/GPS metadata stripped. All six members have photos (Tanisha's source was 526px square, so hers is 526x394, never upscaled). The pixel monogram remains the fallback for any future member without a photo. To add or replace one: crop to 4:3 the same way, strip metadata, save under `public/team/`, set `photo` in `team.ts`.

Card order (array order in `team.ts`, user-specified; it drives both the mobile pass and the desktop board spots): Samyak, Arya, Pakhshi, Chetna, Tanisha, Aamir. On desktop that keeps Arya next to Samyak and Aamir in the bottom-right spot. Never publish phone numbers, emails, addresses or ID numbers from the source PDFs.

Legal line in the footer: "AWS Student Builder Groups exist exclusively for educational purposes. Amazon Web Services, AWS and related marks are trademarks of Amazon.com, Inc. or its affiliates." Keep it.

---

## 8. CSS architecture

- `globals.css` order: `@import "tailwindcss"` > `:root` tokens > `@theme inline` > base element rules > `@layer components { ... }` > preloader/reduced-motion rules.
- **All custom classes go inside `@layer components`** (`.bg-pixel-grid`, `.text-outline`, `.brand-icon`, `.pressable`). Unlayered CSS beats Tailwind's layered utilities, so an unlayered `.brand-icon { display: inline-block }` silently overrode `hidden` (G6).
- `html` and `body` have `overflow-x: clip`. Pinned ScrollTrigger sections are sized to `window.innerWidth` (which includes the scrollbar) and caused sideways scroll without it (G5). Use `clip`, not `hidden`, so `position: sticky/fixed` keep working.
- z-index scale (CSS vars): `--z-content 1`, `--z-trail 40`, `--z-nav 50`, `--z-preloader 100`. Inside the hero (an `isolate` stacking context) local layers 0 to 5 are used: rain 0, tapes 1, stickers 3, card and CLI 4, headline + statement + CTAs + corners 5. The headline sits above the card; the `h1` is `pointer-events-none` and only the rows (`w-fit`) take the pointer, so the card stays clickable around the letters.
- `.bg-pixel-grid` takes `--cell` for grid size (`[--cell:40px]`).
- `.pressable` gives `scale(0.97)` on `:active`. GSAP inline transforms (magnetic buttons) override it while active; that is acceptable.

---

## 9. Motion architecture

### 9.1 Registry and conventions (`src/lib/gsap.ts`)

- Import GSAP and plugins **only** from `@/lib/gsap` so registration happens once.
- Custom eases: `smooth` (0.5,0,0,1, default), `natural` (0.8,0,0.2,1), `snap` (0.23,1,0.32,1). Default duration 0.8.
- Every animated component uses `useGSAP({ scope })` + `gsap.matchMedia()` and returns `mm.revert()`. Gate motion with `(prefers-reduced-motion: no-preference)`; gate pointer effects with `(hover: hover) and (pointer: fine)`; gate pinning with `(min-width: 1024px)`.
- Initial hidden states (`gsap.set(..., { opacity: 0 })`) must live **inside** the no-preference branch so reduced-motion users see everything.
- `ScrollTrigger.config({ ignoreMobileResize: true })` is set in the registry so mobile address-bar show/hide does not re-layout pins.
- Never `window.addEventListener("scroll")`. Use ScrollTrigger or IntersectionObserver.
- `gsap.quickTo` needs real property names: `rotation`, not the `rotate` alias (G8). The alias produced hundreds of "rotate not eligible for reset" warnings.
- One element, one owner per transform channel. When two systems move the same element, split them across nested wrappers or across channels (`x/y` vs `xPercent/yPercent`). Example: stickers use outer `[data-sticker]` (mouse parallax `x/y` and scroll scatter `xPercent/yPercent`) > `[data-sticker-drag]` (Draggable `x/y` and click spin) > `[data-sticker-inner]` (burst-in and idle float).

### 9.2 Intro handoff

1. Inline script in `<head>` sets `html[data-seen="1"]` when `sessionStorage["sbg-seen"]` exists; CSS hides `.preloader` then (and under reduced motion).
2. `Preloader` marks the rest of `<body>` `inert`, plays: corners > chip > scrambled wordmark + 000 to 100 counter (waits for `document.fonts.ready`) > wipe up.
3. `finishIntro()` (idempotent) clears `inert`, sets `html[data-intro-done="1"]`, stores the session flag and dispatches `PRELOADER_DONE` (`"sbg:preloader-done"`). A 5s fallback timer and the cleanup both call it, so the page can never stay locked.
4. Components wait with `whenIntroDone(cb)` (fires immediately if already done). `SmoothScroll` calls `lenis.stop()` until then.

### 9.3 Lenis

`new Lenis({ lerp: 0.1, autoRaf: false, anchors: false })`, `lenis.on("scroll", ScrollTrigger.update)`, `gsap.ticker.add(t => lenis.raf(t * 1000))`, `lagSmoothing(0)`. Exposed as `window.__lenis` for `scrollTo` (footer back-to-top, verification scripts). In-page `#section` links are handled by one document click listener in `SmoothScroll.tsx` (Lenis's own `anchors` option is off because it rushed long jumps through the pinned sections): `lenis.scrollTo(target, { duration: durationFor(distance), easing: easeInOutCubic })` from `src/lib/scroll.ts` (duration 0.9s + distance/3200, clamped 1.1 to 2.4s), then focus moves to the section (`tabindex=-1`, `preventScroll`) and the hash is pushed to history. Modifier clicks keep browser behaviour; user scrolling interrupts the glide; under reduced motion Lenis is not created and links jump natively. The footer back-to-top uses the same helpers. Elements with `data-lenis-prevent` opt out.

### 9.4 Hero (most complex area)

Layers and behaviour:

| Layer | Component | Behaviour | Reduced motion |
|---|---|---|---|
| Pixel rain | `PixelRain` | 28px cells, about 0.55 drops per column, weighted brand colours, stepped trail alpha, 7x7 cursor scan box. Pauses off screen and in hidden tabs. | Not started (empty canvas) |
| Tapes | `Tapes` (wrapped in `[data-hero-tapes]`, in normal flow directly after the `h1` with `mt-[clamp(4.5rem,9vh,6.5rem)]`, never absolutely positioned against the viewport) | Mint tape (-3°) and purple tape (+2°), 66px apart, `xPercent` loop; ScrollTrigger velocity sets `timeScale` (sign flips direction) then eases back. Desktop only. | Static |
| Headline | `Hero` | SplitText chars (`aria: "none"`, an `sr-only` copy carries the accessible name) drop in from random order. After the intro the mask wrappers get `overflow: visible` so letters can move. Glitch loop: a random char scrambles and flashes amber/magenta/blue/paper every 0.25 to 1.1s. Row hover scrambles the row. Fine pointer: chars within 220px push away (`y` up to 70px, `rotation` up to 18°) via a ticker. | Plain static text |
| Stickers | `Stickers` | 8 tiles (4 also on mobile with separate `mobile` coords). Burst from hero centre with random spin, then infinite sine float. Fine pointer: depth parallax, Draggable with inertia inside hero bounds, click spins the drag layer 360°. | Static, placed |
| Chip card | `ChipScene` | See 10. Click sets `progress.kick` for a big rebuild. Mint hard shadow. | Single rendered frame |
| CLI sticker | `CliTicker` | Types 7 real AWS CLI commands in a loop with `steps()` eases. Desktop only. The sticker is a fixed `min(22rem, 80vw)` wide, so every command must be 30 characters or fewer (longest today: 29, ending 260px into the 352px box); change the string, never the box. | Shows one static command |
| CTAs | `Hero` | `[data-magnet]` pull toward the cursor (strength 0.35). | No pull |

Every tween in the pinned timeline is a `fromTo` with explicit start values and `immediateRender: false` (G13). The timeline is built while the intro still holds tapes, CLI, subtext and card hidden; a plain `.to()` records that hidden state as its start, so scrolling back to the top hid them again (user-reported bug, fixed).

Desktop layout is mostly in flow: `h1` > tapes > (stickers absolute) > subtext + CTAs (`lg:mt-10`, `max-w-[min(28rem,30vw)]`). The card stays absolute bottom-right and the CLI sticker absolute at `left: calc(min(28rem,30vw) + 4.5rem)` so it always clears the subtext. On short screens (for example 1280x720) the hero becomes taller than the viewport (803px there); the pin then starts at `bottom bottom` instead of `top top`, and `fill()` computes the card's centre at the pin scroll position so the end state is centred. Measured clearances: 1440x900 headline bottom 377, tapes 412 to 609, subtext from 626; 1280x720 headline 349, tapes 381 to 565, subtext from 589.

Pinned scroll timeline (desktop, `end: "+=170%"`, `scrub: 0.6`): rows split (`xPercent` -14 / +14), headline fades to 0 (it sits above the card, so it must fully clear the end state), subtext fades, tapes fall, CLI flies out, stickers scatter outward (computed from their offset from hero centre, as `xPercent/yPercent` of sticker size) with random spin, card un-tilts and scales to cover the viewport (`fill()` measured on refresh after clearing x/y/scale). End state (from 0.58 of the timeline): four mint pixel corner brackets (`[data-hero-corner]`) snap in with `steps(4)`, the mint tag "AWS Student Builder Group / BVCOE" (`[data-st-tag]`) stamps in, the two statement lines (`[data-st-line]`) type in via stepped `clip-path`, and a mint block (`[data-st-block]`) wipes in behind "building". All over the chip-pattern tile reveal in the 3D scene. `progress.value` feeds the three.js scene.

### 9.5 Other sections

- Program card labels (Build / Certify / Grow / Ship) are badges: icon (30px mobile, 38px from `sm`) + mono bold uppercase label (20px, 28px from `sm`) in a solid block inverted against the card (`badge` in the `tones` map: dark block on mint/paper/purple cards with mint/paper/purple text, mint block on the dark card) with a hard offset shadow.
- Program card titles are sized by container query (`@container` on the text column, `text-[clamp(2rem,11cqi,5rem)]`), so the longest word ("Certification", 13 mono chars at about 0.65em each) always fits its column; viewport-based sizing overlapped the panel at mid widths.
- Programs cards are two columns on `lg` (text left, `ProgramVisual` right; both grid children `min-w-0` so long terminal lines truncate instead of widening the card on mobile). Visuals loop only while on screen (`useLoop` in `ProgramVisual.tsx`, ScrollTrigger `onToggle` plays/pauses) and rest on their final frame under reduced motion: Workshops = a pulse stepping You > API Gateway > Lambda > DynamoDB and an amber response back; Certification = the four real CLF-C02 domains filling to their official weights (24/30/34/12%) then a stamp; Careers = a chip climbing four rungs; Labs = `aws s3 mb/cp/ls` with the CLI's real output lines, typed by stepped `clip-path`.
- Programs: canonical sticky stack (pin every card except the last at `top top`, `pinSpacing: false`; animate an inner wrapper, never the pinned element). The shade overlay (`[data-stack-shade]`, `bg-grey-850` to 0.65 opacity) darkens a covered card. Do not fade the card itself; it became see-through and ghosted text (fixed bug).
- About (rebuilt for more energy):
  - Title: SplitText lines (`aria: "none"`, `autoSplit: true`, animation returned from `onSplit`) for "Students who"; then a `whitespace-nowrap` group "build on AWS." so no word is ever left alone on a line. The word "AWS." sits **outside** the split element (G14) in `[data-aws]`: it pops in, a mint block wipes in behind it with `steps(6)`, and the word scrambles every 3.2s. A `{" "}` between the spans keeps the heading's accessible name spaced.
  - Paragraph: SplitText words (`aria: "none"`), opacity 0.55 to 1 scrubbed while scrolling through (0.55 keeps dim words above 4.5:1 contrast; 0.18 failed axe mid-scroll).
  - Bento cells (`[data-cell]`, including the LED panel) fly in from random offsets with spin and `back.out`, staggered randomly, once.
  - Stats count up in `steps()` to the real values parsed from `stats` (`sr-only` copy keeps the final value for screen readers).
  - Live cells: `LifeGrid` (grey), CSS stepped equaliser bars (purple), CSS stepped key rotation (amber), CSS chip pulse (grey), `DeployBar` (mint, plays only while in view).
  - `LedMatrix` under the paragraph: scrolls "LEARN + BUILD + DEPLOY + SCALE + HANDS-ON CLOUD AND AI + OPEN TO EVERY BRANCH +" one column per 70ms; pointer paints amber pixels that fade in thirds. Only these glyphs exist in its 5x7 font: A B C D E G H I L N O P R S U W Y - + space. Add glyphs before changing the message.
  - Mint radial spotlight follows the cursor over the bento (`--sx/--sy` via `quickSetter`, `mix-blend-overlay`).
  - Three pixel staircases at the section edges drift with scroll at different speeds (desktop).
  - Reduced motion: no fly-ins, counters show final values, CSS loops stop, canvases draw one static frame.
- Team, desktop: Draggable, `onPress` raises z-index and straightens, `onRelease` springs back to the spot rotation. The desktop branch first clears any leftover `transform/translate/overflowX/scrollSnapType` on `[data-track]` (G16).
- Team, mobile (`max-width: 1023px` + no-preference): scroll-jacked horizontal pan. `[data-board]` pins (start `center center` when it fits the viewport, else `top top`; `end: +=distance`), `[data-track]` (the `ul`) translates `x` to `-distance` with `scrub: 0.5`; distance = last card's right edge + track right padding - track width, recomputed on refresh. Native scroll on the track is disabled while pinned (`overflowX: visible`, snap off). Each card swings `rotate 6 > 0 > -6` and `scale 0.94 > 1 > 0.94` as it crosses the screen (`containerAnimation`). A 4px mint progress bar (`[data-team-progress]`) at the board's bottom edge fills with pin progress. The board has no negative margins: the section has no horizontal padding below `lg`, the heading and paragraph carry `px-4 sm:px-8` instead (G15).
- Nav: 4px mint progress bar at the very top, filled in 40 hard steps; a grey block (`[data-nav-marker]`) slides under the link of the section in view and the link turns mint with `aria-current`. The section triggers use `refreshPriority: -1` (G18) and the marker is derived from whichever trigger is active (`sync()`), never from toggle order. Links draw a mint underline on hover (`.nav-link`), the logo chip turns 90° on hover, Join steps up.
- Join: the moment is the title filling from a grey outline to solid paper/mint in 16 steps as the section scrolls through (two stacked copies per line, the top one clipped). The card has a marching dashed mint border (`.march::before`, CSS `steps(4)`) and a hard mint shadow; the CTA bursts brand-coloured pixels on hover (throttled) and on press. A light chases round the program icon outline (`.chip-chase`, CSS) in the empty space under the perks list. Perk rows: GSAP animates the `li`, the hover nudge lives on an inner `div` (G19).
- Footer: the marquee is a GSAP loop whose `timeScale` follows scroll velocity (reverses on scroll up) with a velocity skew; every letter is a span that pops up and turns paper on hover.
- Global hover layer (`globals.css`, `@layer components`): `.pressable` steps up 2px on hover and presses on click (fine pointers); `.nav-link` / `.link-draw` underline draws in; `.scan-hover` sweeps a mint scanline over team portraits on hover. Team cards also got a hard offset shadow.
- Global pixel trail: canvas with `mix-blend-mode: difference`, rendered only for fine pointers without reduced motion (CSS media classes), 28px cells, stepped fade.

---

## 10. three.js scene (`src/components/three/ChipScene.tsx`)

- Chip cells derive from the program icon's native 9x9 grid (the kit SVG is 3000 units in 333.33 steps): rows/cols 2..6 at 1 and 7, plus crown cells at 2, 4, 6 on the outer ring. 32 cubes, `InstancedMesh`. `src/lib/og.tsx` uses the same cell function for the OG chip.
- Tile field 25x17 `InstancedMesh` behind the chip; pointer raycast onto a plane lifts nearby tiles in quantised steps.
- Inputs: `progress.current.value` (0..1 hero scroll) and `progress.current.kick` (timestamp of a click). Effects: burst toward random scatter positions, shrink near the end, chip-pattern tiles flip to mint (cols 13..21, rows 4..12), automatic rebuild pulse every 5.5s for 1.4s, random single-cube pops.
- End-state extras (driven by `reveal`): a quantised ripple radiating from the chip centre across the tile field, a 3-tile white "packet" running around the lit chip ring (tiles sorted by angle), and 48 mint sparks (`MeshBasicMaterial` InstancedMesh) rising and shrinking off lit tiles.
- Resolution (G17): the card is CSS-scaled about 2.5x to fill the screen, so `syncResolution()` runs every frame and sets the renderer pixel ratio to `base ratio x (on-screen width / layout width)`, capped at the screen's pixel width and 4, only when it changes by more than 8%. Keep this if you touch the hero card scaling.
- Renderer: `antialias`, `alpha`, base DPR capped at 1.75 (scaled up by `syncResolution`), sized by `ResizeObserver`, paused by `IntersectionObserver`. `new WebGLRenderer` is wrapped in try/catch (no WebGL leaves the static grid card).
- Cleanup disposes both InstancedMeshes, geometries and materials, calls `renderer.dispose()` and `renderer.forceContextLoss()`, and removes the canvas. Keep this complete when editing.
- `THREE.Clock` is deprecated in 0.187; timing uses `performance.now()`.
- Reuse objects in the frame loop (`Matrix4`, `Quaternion`, `Euler`, `Vector3`); do not allocate per cube per frame.

---

## 11. Accessibility rules

- Skip link to `#main` in the layout. Landmarks: `header` (nav), `main#main`, `footer`.
- Split text: use `aria: "none"` when an `sr-only` copy provides the name, or split a heading element itself (SplitText adds `aria-label` to the split element, which is invalid on a bare `span`).
- Accessible names must contain the visible text (`label-content-name-mismatch`). Prefer no `aria-label` on links that already have visible text; hide parts visually with `sr-only`, not `display: none`.
- Scrollable regions must be focusable (`tabIndex={0}`).
- Decorative layers (`PixelRain`, tapes, stickers, CLI, trail, statement) are `aria-hidden`.
- 404 game: the board is a focusable `role="application"` with an `sr-only` `role="status"` line. Keys only act when focus is on the game or on `body`, so links and buttons keep Enter/Space. D-pad buttons work via `onPointerDown` (touch latency) and `onClick` with `detail === 0` (keyboard and assistive tech). Starting a run moves focus to the board.
- Contrast: body copy on brand blocks at full opacity only.

---

## 12. Verification recipe

1. `pnpm lint` clean, `pnpm build` clean.
2. `pnpm start --port 3101`, then with Playwright MCP: `browser_resize` to 1440x900 and 390x844 (768 has not been checked yet), navigate, wait about 3.5s for the intro, screenshot the hero, scroll with `window.__lenis.scrollTo(y, { immediate: true })` and screenshot each section.
3. Overflow check: `document.documentElement.scrollWidth === clientWidth`.
4. axe: scroll through the page first (so `once` reveals have run), inject `https://cdn.jsdelivr.net/npm/axe-core@4/axe.min.js`, run `axe.run()` and map violations to `{ id, impact, nodes }`. Bar: zero critical and serious.
5. Console: `browser_console_messages` at level `warning` must be empty. Only read counts and the first line; never paste full logs.
6. Performance: Chrome DevTools MCP `performance_start_trace` with `reload: true` on the production server. Last measured (localhost, no throttling): LCP 97 ms, CLS 0.00.
7. Delete `.playwright-mcp/` afterwards (it is git-ignored, but keep the tree clean). Playwright can only save screenshots inside the repo.

---

## 13. SEO, metadata and OG images

- Metadata in `layout.tsx`: title template `%s | AWS SBG BVCOE`, description, canonical `/`, author/creator (Samyak Jain), keywords, full `openGraph` (title, description, url, site_name, type, locale) and `twitter` (`summary_large_image`, title, description). `og:image` / `twitter:image` with type, width, height and alt are emitted by the `opengraph-image.tsx` / `twitter-image.tsx` file conventions. `metadataBase` = `site.url` = `NEXT_PUBLIC_SITE_URL`, else `https://$VERCEL_PROJECT_PRODUCTION_URL` (Vercel system env), else localhost, so share images are always absolute https on Vercel (WhatsApp and Discord need that). `theme-color` is mint `#00e582`: Discord uses it for the embed side bar (it also tints mobile browser chrome).
- `renderOg({ lines, kicker, accent, footer })` in `src/lib/og.tsx` produces the 1200x630 card: pixel grid at 70px, stepped brand blocks in the accent colour, a tilted 9x9 pixel chip, Ember Mono headline (second line in accent) and the lockup footer. Every new route should add an `opengraph-image.tsx` that calls it (the planned link shortener should use it per slug). `twitter-image.tsx` re-exports.
- Satori rules: every element needs `display: flex` when it has children; fonts must be TTF/OTF/WOFF (not woff2), read with `readFile(join(process.cwd(), "src/assets/og/..."))`.

---

## 14. Environment variables

| Name | Where | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Vercel (all environments), `.env.local` | Canonical URL for metadata and OG |
| `DATABASE_URL` | Vercel (from the Neon integration), `.env.local` | Pooled Neon connection, used by the app |
| `DATABASE_URL_UNPOOLED` | `.env.local` (and Vercel if migrations ever run there) | Direct connection for `pnpm db:migrate` |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | Vercel (prod OAuth app), `.env.local` (local OAuth app) | GitHub sign-in for /admin. Two OAuth apps on the club GitHub account because each allows one callback: `<origin>/api/auth/callback` |
| `ADMIN_GITHUB_USERS` | Vercel, `.env.local` | Comma-separated GitHub usernames allowed into /admin. Removing a name locks that person out on their next request (the allowlist is re-checked on every session read) |

Database: Neon Postgres 18, region AWS ap-southeast-1 (Singapore), database `neondb`. Set the Vercel Function Region to Singapore (sin1) to sit next to it. Tables: `links`, `link_clicks`, `admin_sessions`, `schema_migrations`.

---

## 15. Git, GitHub and deployment identity

This repo deliberately uses the **club's** GitHub account, not the maintainer's personal one.

| Setting | Value |
|---|---|
| Remote `origin` | `git@github-club:awssbg-bvcoe/website.git` |
| SSH host alias | `github-club` in `~/.ssh/config` > `github.com`, key `~/.ssh/id_ed25519_club`, `IdentitiesOnly yes` |
| Repo-local `core.sshCommand` | `ssh -i ~/.ssh/id_ed25519_club -o IdentitiesOnly=yes` (forces the club key even for `github.com` URLs) |
| Repo-local `user.name` | `awssbg-bvcoe` |
| Repo-local `user.email` | `355285939+awssbg-bvcoe@users.noreply.github.com` |
| Default branch | `main` |
| Auth check | `ssh -T git@github-club` should answer "Hi awssbg-bvcoe!" (exit code 1 is normal) |

- The `gh` CLI on the maintainer's machine is logged into personal accounts, not the club account. Do not use `gh` to create or modify club resources unless the user logs the club account in first.
- Never change global git config. Never commit with another identity.
- Commit messages are plain: no co-author trailers, no "Generated with" lines, no session links (rule 4 in section 0). Commit and push only when asked.
- Vercel: the project must be created under the club's Vercel account. The Vercel CLI on the machine was outdated (58.x vs 65.x) when checked.

---

## 16. Pending work and open decisions

| Item | Status | Notes |
|---|---|---|
| First commit and push | Done 2026-11-11 | `main` pushed to `awssbg-bvcoe/website` |
| Team photos and LinkedIn/GitHub links | Waiting on user | Drop files into `public/team/`, set `photo` and `links` in `team.ts` |
| Group-specific join URL | Waiting on user | `site.joinUrl` still points to the programme page. Socials done (Instagram `awssbg.bvp`, LinkedIn `aws-student-builder-group-bvp`) |
| Link shortener + redirects | Built 2026-11-11 | Needs the GitHub OAuth apps and `ADMIN_GITHUB_USERS` set before anyone can sign in (see section 14) |
| Rotate the Neon password | Recommended | The connection string was pasted into a chat transcript on 2026-11-11 |
| Vercel project + domain | Not started | Club Vercel account |
| 768px verification | Not done | |
| Reduced-motion browser pass of the new hero | Not done | Logic is gated, but not visually verified |
| Mid-range phone performance of the hero | Not measured | Pixel rain + three.js on real hardware |

### 16.1 Link shortener (as built)

- Decisions (user): GitHub sign-in limited to an allowlist; links at the root (`/{slug}`).
- Redirect path: `src/proxy.ts` matches single-segment paths (`/:slug((?!_next)[^/.]+)`). `isUsableSlug` (regex + `RESERVED`) filters first, then `findActiveLink` (enabled, not expired; 30s per-instance cache, cleared on the instance that writes), then a **307** with `Cache-Control: private, no-store` and `X-Robots-Tag: noindex`. Misses and DB errors fall through to the app (404 game). Clicks are recorded only for GET, after the response, via `event.waitUntil`: device class, referrer host and `x-vercel-ip-country`; never IPs, full referrers or user agents. Bots are stored as `bot` and excluded from every admin number.
- Adding a new top-level route? Add its first segment to `RESERVED` in `src/lib/links/validate.ts`, or an existing short link could shadow it in the proxy.
- Auth: `/api/auth/github` sets a 10-minute `state` cookie (path `/api/auth`) and redirects to GitHub (`read:user`); `/api/auth/callback` compares state in constant time, exchanges the code, reads `/user`, lowercases the login and checks `ADMIN_GITHUB_USERS`; sessions are 32 random bytes in an httpOnly SameSite=Lax cookie (`sbg_admin`, 7 days) and only their SHA-256 is stored. Logout is POST only and revokes the row. The proxy redirects `/admin*` without a cookie to `/admin/login`; every page and server action still calls `currentAdmin()` itself.
- Admin UI: dashboard (totals, create form, list with status, 7-day and total clicks, last click, copy, on/off, link to detail); detail page (30-day IST daily chart with hover tooltips and an sr-only table, top referrers/countries/devices, bot count, QR preview + SVG download, edit form, delete with confirm). Toggle is a single `update ... set enabled = not enabled` (no lost updates).
- Validation: slug `^[a-z0-9]([a-z0-9-]{0,62}[a-z0-9])?$` (also enforced by a DB check constraint), not reserved, unique; URL must parse, be http(s), at most 2048 chars, and not point at another short link on this host; note at most 280; expiry must be in the future.

### 16.2 Original target spec (kept for reference)

Improve on the maintainer's earlier project (`~/projects/optica-website`, Neon raw SQL, `/[slug]` page with a 5s JS countdown, no analytics). Target:

- Real HTTP redirects (307/308) at `/{slug}` via a route that checks reserved names first (`about, programs, team, join, admin, api, press-start, _next` and every real route), with optional `?preview` interstitial for humans and OG metadata for bots.
- Click analytics recorded after the response (`after()`): timestamp, referrer, country, device class; no raw IPs.
- Slug validation (charset `[a-z0-9-]`, length limits, reserved list), URL validation (`https:` and `http:` only; reject `javascript:` and `data:`), optional expiry, per-link QR code and per-link OG image via `renderOg`.
- Cached lookups with tag invalidation on edit (`cacheComponents` is on; read the Next 16 caching docs first).
- Admin: login rate limiting, server-side session revocation, transactional reorder, numeric ID validation. Weak spots found in optica to avoid: unvalidated slugs and schemes, no rate limit, stateless 7-day sessions, non-transactional reorder, lost-update toggles, `Number(id)` NaN.

---

## 17. Changelog (mandatory)

### 17.1 Rules and entry template

- Every session that changes anything adds an entry **at the top of 17.2** (newest first) before it ends. If the session is interrupted, the next session reconstructs what it can from `git status`/`git diff` and logs it.
- Be specific: list every file added, changed or removed, why, any user decision, anything verified and how, anything left broken or unverified. Another agent must be able to continue without asking what happened.
- Record user decisions verbatim enough to be unambiguous.
- Never put secrets, tokens, personal phone numbers, emails or addresses in entries.

Template:

```
#### YYYY-MM-DD: <short title>
- Agent/tool: <e.g. Claude Code (model)>
- Requested by user: <what they asked, in one or two lines>
- Decisions: <user choices and assumptions made>
- Files added: <paths + one-line purpose>
- Files changed: <paths + what changed>
- Files removed: <paths>
- Dependencies: <added/removed/upgraded with versions>
- Config/infra: <git, Vercel, env, accounts>
- Verified: <commands run, browser checks, axe/perf numbers, breakpoints>
- Not verified / known issues: <be honest>
- Follow-ups: <what the next session should do>
```

### 17.2 Entries

#### 2026-11-11: CLI sticker commands shortened so they never bleed
- Agent/tool: Claude Code (Claude Opus 5.5)
- Requested by user (screenshot of `aws lambda invoke --function-name hello out.json` running past the sticker): "this bleeds as well.. change the string don't make the box bigger".
- Files changed: `src/components/hero/CliTicker.tsx` (`aws lambda invoke --function-name hello out.json` to `aws lambda list-functions`; `aws s3 sync ./site s3://builders-bvcoe` to `aws s3 sync ./site s3://bvcoe`; comment stating the 30-character limit).
- Verified (production build, 1440x900): with each long command set, the cursor ends 260px into the 352px sticker (the old Lambda line reached 398px).

#### 2026-11-11: AWS logo added to the lockup and the phone hero
- Agent/tool: Claude Code (Claude Opus 5.5)
- Requested by user: "add in the aws logo as well in the navbar/landing page or hero section or somewhere"; the user also sent a raster of the logo. The vector from the official SBG presentation template was used instead (same mark, crisp at any size).
- Files added: `public/brand/mark/aws.svg`.
- Files changed: `src/components/brand/BrandIcon.tsx` (`aws` name, ratio 300.73/179.82, served from `/brand/mark/`); `src/components/brand/Lockup.tsx` (divider + AWS logo; `aws`, `awsClassName`, `textClassName` props); `src/components/sections/Nav.tsx` (uses `textClassName`/`awsClassName` instead of the old `[&>span:last-child]` selector, which would now have hidden the logo); `src/components/sections/Hero.tsx` (phone-only AWS row above the `h1`, part of `[data-hero-fade]`); `src/components/hero/Stickers.tsx` (bolt mobile position y 22% to 31% so it clears the headline after the row pushed it down).
- Bug found and fixed during the work: with the logo in the phone nav, the nav ran to 415px on a 375px viewport and cut off "Join"; the logo moved to the hero on phones.
- Verified (production build): 390x844 nav ends at 359px, no horizontal overflow, AWS logo visible in the hero, bolt sticker top 254px vs headline bottom 229px; 640px nav fits with full lockup + logo (ends at 593 of 625); 1440x900 screenshot shows the lockup with divider and logo, logo also in the footer; axe 0 violations in header, hero and footer.
- Not verified: 768px visually; the admin/404 lockups (same component, logo shown).

#### 2026-11-11: Gentler smooth scrolling for nav and in-page links
- Agent/tool: Claude Code (Claude Opus 5.5)
- Requested by user: "add in smooth scrolling after clicking on the navbar buttons, not aggressive scrolling as it does right now".
- Files added: `src/lib/scroll.ts` (`easeInOutCubic`, `durationFor`).
- Files changed: `src/components/motion/SmoothScroll.tsx` (Lenis `anchors: false`; document-level handler for `a[href^="#"]` as described in 9.3); `src/components/sections/Footer.tsx` (back-to-top uses the same easing and duration).
- Verified (production build, 1440x900): clicking Team from the top moved 0 to 7272px along an ease-in-out curve (2px at 90ms, 1190px at 826ms, 6912px at 1844ms) and settled at 2.3s exactly on the section; URL became `#team`; focus moved to `#team`.
- Not verified: touch devices (Lenis does not smooth native touch scrolling, but the programmatic glide applies there too), Safari.

#### 2026-11-11: Tanisha's photo
- Agent/tool: Claude Code (Claude Opus 5.5)
- Requested by user: Tanisha's photo (from `~/projects/optica-website/public/team/tanisha.png`, 526x526).
- Files added: `public/team/tanisha-kaur.jpg` (526x394 4:3 crop, face about a third down, metadata stripped, 49 KB; not upscaled).
- Files changed: `src/content/team.ts` (`photo`).
- Verified: crop checked visually; `pnpm build` clean.

#### 2026-11-11: Team photos and card order
- Agent/tool: Claude Code (Claude Opus 5.5)
- Requested by user: five team photos (Aamir, Samyak, Arya, Pakhshi, Chetna) and the mobile card order "samyak arya pakhshi chetna tanisha aamir".
- Files added: `public/team/{samyak-jain,arya-bhardwaj,pakhshi-luthra,chetna-negi,aamir-ali-zaidi}.jpg` (89 to 142 KB each; processed as described in section 7 with Pillow in a scratch venv).
- Files changed: `src/content/team.ts` (order; `photo` paths).
- Verified (production build): `/_next/image` serves the photos (200 image/jpeg); 390x844 order Samyak > Arya > Pakhshi > Chetna > Tanisha > Aamir with photos rendered in the pinned pass; 1440x900 board screenshot shows all five photos and the TK monogram, every card inside the board (Aamir 21px from the bottom edge).
- Not verified: photo crops on very narrow phones (they use `object-cover` in the same 4:3 frame, so the framing holds).

#### 2026-11-11: Second commit and push (link shortener, metadata, socials)
- Agent/tool: Claude Code (Claude Opus 5.5)
- Requested by user: "just push everything to github". The user will set Vercel environment variables themselves (Vercel CLI work was stopped at their request). `.env.local` holds the **production** GitHub OAuth app's keys; local sign-in needs the local app's keys in `.env.development.local`.
- Files changed: `.gitignore` (`.vercel-cli/`, a repo-local Vercel CLI login folder).
- Git: commit on `main` as `awssbg-bvcoe`, no attribution trailers; pushed to `origin`. `.env.local`, `.vercel/` and `.vercel-cli/` are ignored and were not committed.

#### 2026-11-11: Social share metadata, socials and maker credit
- Agent/tool: Claude Code (Claude Opus 5.5)
- Requested by user: proper Open Graph for WhatsApp, Twitter/X and Discord; "made with <3 by samyak jain" linking to https://github.com/sammyyakk; Instagram https://www.instagram.com/awssbg.bvp/ and LinkedIn https://www.linkedin.com/company/aws-student-builder-group-bvp/ in the footer. User also confirmed the GitHub OAuth apps and env vars are set (`.env.local` now has GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, ADMIN_GITHUB_USERS; values not read).
- Files changed: `src/content/site.ts` (`url` fallback to `VERCEL_PROJECT_PRODUCTION_URL`; `socials` Instagram + LinkedIn; `maker`); `src/app/layout.tsx` (metadata described in section 13; theme-color mint); `src/components/sections/Footer.tsx` (maker credit with `<3` and an sr-only "love").
- Verified (production build, local): head contains og:title/description/url/site_name/locale/type, og:image with type/width/height/alt, twitter:card summary_large_image with title/description/image/alt, canonical, author, theme-color; OG image 200 image/png 69 KB (under WhatsApp's limit); footer links Builder Center, Instagram, LinkedIn, Samyak Jain (GitHub), 404 game; axe 0 violations in the footer; screenshot at 1440.
- Not verified: live previews in WhatsApp/X/Discord (needs the deployed URL; use the platforms' debuggers or paste the link once deployed).

#### 2026-11-11: Link shortener, GitHub-auth admin and Neon database
- Agent/tool: Claude Code (Claude Opus 5.5)
- Requested by user: a better version of the optica-website link shortener and redirect system; the user created a Neon database (Singapore) and chose GitHub sign-in and root `/{slug}` links.
- Dependencies added: `@neondatabase/serverless@^1.2.0`, `qrcode@^1.5.4`, `server-only`, dev `@types/qrcode@^1.5.6`. Script added: `db:migrate`.
- Files added: `db/migrations/001_links.sql`, `scripts/migrate.mjs`, `src/proxy.ts`, `src/lib/db.ts`, `src/lib/site-origin.ts`, `src/lib/auth/{constants,session}.ts`, `src/lib/links/{validate,repo}.ts`, `src/app/api/auth/{github,callback,logout}/route.ts`, `src/app/api/admin/qr/[slug]/route.ts`, `src/app/admin/{layout,page,actions}.tsx|ts`, `src/app/admin/login/page.tsx`, `src/app/admin/links/[id]/page.tsx`, `src/components/admin/*`, `src/app/(site)/layout.tsx`, `.env.local` (git-ignored, holds the Neon URLs).
- Files moved/changed: `src/app/page.tsx` to `src/app/(site)/page.tsx`; `src/app/layout.tsx` no longer mounts Preloader/SmoothScroll/PixelTrail (moved to the `(site)` layout so /admin and 404 get a plain shell).
- Database: migration 001 applied to the Neon database (tables links, link_clicks, admin_sessions, schema_migrations).
- Verified (production build, local, real database): temporary link `zz-test` returned 307 to its target (also for `/ZZ-TEST`), recorded `mobile` + `www.instagram.com` for an iPhone UA with an Instagram referrer, `desktop`, and `bot` for WhatsApp; unknown and reserved paths 404; `/admin` without a cookie 307 to login; a forged session cookie streams only a redirect to login (no link data in the HTML); QR route 401 without auth; OAuth start reports `error=config` until the client ID exists; a forged callback reports `error=state`; `/icon.svg` unaffected. The test link was deleted afterwards (its clicks cascaded).
- Not verified: a real GitHub sign-in round trip (needs the OAuth apps), the admin UI in a browser, the deployment on Vercel.
- Security: the Neon password was pasted into the chat; rotating it is listed in section 16.
- Follow-ups: user creates the two GitHub OAuth apps and sets `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `ADMIN_GITHUB_USERS` locally and on Vercel; set Vercel Function Region to sin1; then test sign-in and the admin UI.

#### 2026-11-11: First commit and push; no-attribution rule
- Agent/tool: Claude Code (Claude Opus 5.5)
- Requested by user: confirm Turbopack is in use (yes: Next 16 uses Turbopack for `next dev` and `next build` by default; build output reads "Next.js 16.4.6 (Turbopack)"); commit and push the code; "no claude coauthor in any of the commits. no coauthor or session link in commit descriptions either forever".
- Files changed: `AGENTS.md` (rule 4 in section 0 and section 15 now forbid attribution trailers and session links; pending-work table updated); `.gitignore` (`.claude/settings.local.json`).
- Git: first commit on `main` as `awssbg-bvcoe <355285939+awssbg-bvcoe@users.noreply.github.com>`, no trailers; pushed to `git@github-club:awssbg-bvcoe/website.git`.
- Follow-ups: user is deploying on Vercel (club account) and creating the Neon database through Vercel Storage; link shortener admin-auth choice still pending.

#### 2026-11-11: Program card labels made bigger and more prominent
- Agent/tool: Claude Code (Claude Opus 5.5)
- Requested by user (screenshot of the small "SHIP" label): "make the heading on these cards a little bigger and more prominent".
- Files changed: `src/components/sections/Programs.tsx` (`badge` style per tone; label block rebuilt as described in 9.5).
- Verified (production build, 1440x900): screenshot of the Labs card shows the mint SHIP badge; axe on `#programs` 0 violations.
- Not verified: badge on the other three cards visually (same component, colours per tone).

#### 2026-11-11: Program card title no longer overlaps its panel
- Agent/tool: Claude Code (Claude Opus 5.5)
- Requested by user (screenshot of "Certification" running under the CLF-C02 panel): "fix this overlap as well".
- Cause: the title used `5vw`, so at mid widths "Certification" grew wider than its grid column.
- Files changed: `src/components/sections/Programs.tsx` (text column is a `@container`; title `text-[clamp(2rem,11cqi,5rem)]`).
- Verified (production build): gap between each title's text and its panel is positive for all four cards at 1024x768 (Certification 105px), 1280x800 (150px) and 1440x900; screenshot at 1280.
- Not verified: 1100 to 1200px widths specifically (the container sizing makes them follow the same rule).

#### 2026-11-11: Hero headline drawn above the card
- Agent/tool: Claude Code (Claude Opus 5.5)
- Requested by user (screenshot of "SCALE" cut by the tilted card): "move scale on top of the graphic".
- Files changed: `src/components/sections/Hero.tsx` (`h1` z-index 2 to 5 with `pointer-events-none`, rows `pointer-events-auto`; scroll fade of the headline now ends at opacity 0 instead of 0.15).
- Verified (production build, 1440x900): screenshot shows "SCALE." fully over the card; `elementFromPoint` on the letter/card overlap returns the headline row, and inside the card returns the card (click-to-rebuild still works).
- Not verified: other widths (mobile layout is unaffected: the card is in flow below the headline).

#### 2026-11-11: About title wrap fix and more motion across the rest of the site
- Agent/tool: Claude Code (Claude Opus 5.5), with the design-taste-frontend skill (v2.5)
- Requested by user: screenshot showing "AWS." on its own line after "Students who build on"; "add in more bling to the WHOLE WEBSITE, use /design-taste-frontend and figure everything out".
- Decisions: the skill's own kit, starter page and gate were not adopted. Its house rules conflict with explicit user direction already given (scroll-jacking, sticker tilts, chaotic motion) and with the brand (Purple is a kit colour). Compatible parts were applied: hover micro-animations everywhere, card-level diagram visuals that loop in 2.5 to 4s, one moment per section, equal edges, contrast and tap sizes, full reduced-motion fallbacks.
- Files added: `src/components/programs/ProgramVisual.tsx`.
- Files changed: `src/components/sections/About.tsx` (title lines "Students who" / "build on AWS."); `src/components/sections/Programs.tsx` (two-column cards with visuals, `min-w-0`); `src/components/sections/Nav.tsx` (rewritten: progress bar, section marker, hover underline, chip turn); `src/components/sections/Join.tsx` (rewritten: outline-to-fill title moment, marching border, pixel burst CTA, chip chase, perk hover split from GSAP); `src/components/sections/Footer.tsx` (GSAP marquee with velocity + skew, per-letter hover); `src/components/sections/Team.tsx` (card shadow, `group` + `scan-hover`); `src/app/globals.css` (hover layer classes, `scan-sweep` keyframes).
- Bugs found and fixed during the work: an edit accidentally removed the join card, restored; perk rows frozen 24px left by a CSS transform transition (G19); nav marker wrong after long jumps (G18 plus active-trigger sync); labs card overflowing the screen at 390 because of no-wrap terminal lines.
- Verified (production build): nav marker correct after jumps to join/about/team/programs/top; About title lines confirmed and accessible name "Students who build on AWS."; axe 0 violations at 1440x900 and 390x844 (full-page scroll); console clean; no horizontal overflow at either width; screenshots of a program card, the join section and About at 1440 and the labs card at 390.
- Not verified: 768px and 1024px, reduced-motion visual pass, real-phone performance with the added loops.
- Follow-ups: none required.

#### 2026-11-11: Hero ribbons and bolt sticker no longer overlap the headline
- Agent/tool: Claude Code (Claude Opus 5.5)
- Requested by user (two screenshots): move the two ribbons down because they merge with the headline text; the bolt sticker badge also merges with "BUILD".
- Cause: the tapes were absolutely positioned at `top-[44%]` of the hero, so on some viewport sizes they landed on "DEPLOY. SCALE."; the bolt sticker sat at 46%/12%, between the two headline words.
- Files changed: `src/components/sections/Hero.tsx` (tapes wrapper moved into flow after the `h1`; subtext + CTAs moved from absolute bottom-left into flow under the tapes; CLI sticker offset from the subtext width; pin `start` switches to `bottom bottom` when the hero is taller than the viewport; `fill()` measures the card centre at the pin scroll position); `src/components/hero/Tapes.tsx` (rotations -4/+3 to -3/+2, spacing 78 to 66px); `src/components/hero/Stickers.tsx` (bolt desktop position 46%/12% to 50%/3%, above the headline).
- Verified (production build): 1440x900 and 1280x720 bounding boxes show no overlap between headline, tapes and subtext, and the CLI sticker clears the subtext by 40px at both; end-state card covers the viewport at both sizes; subtext and CTAs return to opacity 1 after scrolling back; axe 0 violations and console clean at 1440x900.
- Not verified: very short viewports (under 700px tall), 1024 to 1279px widths visually.
- Follow-ups: none required.

#### 2026-11-11: Hero end state made sharp and busier
- Agent/tool: Claude Code (Claude Opus 5.5)
- Requested by user (screenshot of the full-screen chip end state of the hero scroll): "this page looks too plain and too low resolution as well, should look sharp and should have more bling to it as well".
- Cause of blur: the three.js canvas rendered at the card's layout size (about 700px wide) and the card was CSS-scaled about 2.5x (G17).
- Files changed: `src/components/three/ChipScene.tsx` (`syncResolution()` per frame; ripple; ring-ordered packet; 48 rising sparks InstancedMesh with disposal; `PACKET` colour); `src/components/sections/Hero.tsx` (statement rebuilt as tag + two clip-typed lines + mint block behind "building" + text shadow; four corner brackets; end-state timeline segment from 0.58); `src/components/sections/About.tsx` (paragraph scrub start opacity 0.18 to 0.55 after axe flagged 25 dim words mid-scroll).
- Verified (production build, 1440x900, DPR 1): at scroll 1520 the canvas buffer is 1440x1081 for 1470x1102 on screen (was about 700 wide); screenshot shows corners, tag, typed lines, block, white packet, sparks and ripple; axe 0 violations at the end state and at the top; console 0 warnings/errors.
- Not verified: DPR 2 displays (buffer would be up to 2x the screen width, capped), GPU cost on low-end laptops, 768px, reduced motion.
- Follow-ups: none required.

#### 2026-11-11: Mobile team section scroll-jacking
- Agent/tool: Claude Code (Claude Opus 5.5)
- Requested by user (with a 390px screenshot of the team section): "in this section on mobile add in scroll jacking such that all team is displayed first and then the user is able to scroll past this".
- Files changed: `src/components/sections/Team.tsx` (new mobile matchMedia branch: pinned board, horizontal pan, per-card swing via `containerAnimation`, progress bar element; `data-track` on the `ul`; section horizontal padding moved to the heading and paragraph; board negative margins removed; desktop branch clears leftover track styles); `src/lib/gsap.ts` (`ScrollTrigger.config({ ignoreMobileResize: true })`).
- Bugs found and fixed during the work: board pinned 32px narrower than the screen because of its negative margins (G15); after resizing a mid-pan mobile view to desktop, a leftover `translate(0,0)` on the track collapsed all desktop cards to one row (G16).
- Verified (production build, 390x844): board stays pinned (top 200px) while the track moves 0 > -815 > -1593px showing Samyak/Arya, then Tanisha/Chetna, then Aamir; after the end the board scrolls away normally; board 375px wide (full width); no horizontal overflow; axe 0 violations. 1440x900 fresh load: six cards at their spots. Resize 390 (mid-pan) > 1440: six cards at their correct spots.
- Not verified: real touch-device feel (iOS Safari address bar, momentum), 768px, reduced-motion fallback in the browser.
- Follow-ups: try it on a real phone.

#### 2026-11-11: About section given hero-level motion; hero scroll-back bug fixed
- Agent/tool: Claude Code (Claude Opus 5.5)
- Requested by user: "the screen just after hero is too plain too, gotta add some bling to it as well". Mid-task the user also reported: the ribbons and the command-line sticker disappear on first scroll and do not come back when scrolling to the top.
- Files added: `src/components/about/LifeGrid.tsx`, `src/components/about/LedMatrix.tsx`, `src/components/about/DeployBar.tsx` (see 4 and 9.5).
- Files changed: `src/components/sections/About.tsx` (rewritten, details in 9.5; paragraph text colour now `paper` so the scrubbed word highlight reads); `src/components/sections/Hero.tsx` (pinned timeline converted to `fromTo` + `immediateRender: false` for rows, headline opacity, subtext, tapes, CLI, stickers, card and statement; cause recorded as G13).
- Bugs found and fixed during the work: "AWS." rendered twice when it lived inside the SplitText element while being scrambled (G14), moved outside the split; heading accessible name read "build onAWS.", added a space node.
- Verified (production build): hero opacities before / mid-scroll / after returning to top = 1 / 0 / 1 for tapes, CLI, subtext; stickers back at 1. axe 0 violations at 1440x900 (full page) and 390x844 (About in view); console 0 warnings/errors; no horizontal overflow at either width. Screenshots checked at both widths.
- Not verified: reduced-motion visual pass; 768px; real-phone performance with the extra canvases (LifeGrid, LedMatrix) on top of the hero ones.
- Follow-ups: none required.

#### 2026-11-11: Silence extension-caused hydration warning on body
- Agent/tool: Claude Code (Claude Opus 5.5)
- Requested by user: pasted a dev-overlay hydration mismatch error; the diff showed `className="vsc-initialized"` on `<body>` only on the client.
- Cause: the Video Speed Controller browser extension adds that class to `<body>` before React hydrates. Not an app bug.
- Files changed: `src/app/layout.tsx`: `<body suppressHydrationWarning>` with a comment. This only suppresses attribute mismatches on `<body>` itself, not on its children.
- Verified: `pnpm build` clean.
- Follow-ups: if a hydration warning ever points below `<body>`, it is a real bug; do not widen the suppression.

#### 2026-11-11: AGENTS.md and CLAUDE.md created
- Agent/tool: Claude Code (Claude Opus 5.5)
- Requested by user: a very complex, detailed AGENTS.md, with CLAUDE.md pointing to it, and a rule that every change is logged here in detail so no session has different or incomplete context.
- Decisions: AGENTS.md is the single source of truth; CLAUDE.md only imports it (`@AGENTS.md`) and restates the logging rule. The `nextjs-agent-rules` block written by `next dev` is kept verbatim at the top so `next dev` does not re-add it.
- Files added: `CLAUDE.md`.
- Files changed: `AGENTS.md` (full rewrite below the Next.js block: rules, overview, stack, commands, repo map, sections, brand, content facts, CSS, motion, three.js, a11y, verification, SEO/OG, env, git identity, pending work, changelog).
- Verified: file contents reviewed; no code changed.
- Follow-ups: keep this file current in every session.

#### 2026-11-11: Hero rebuilt as a chaotic, layered scene
- Agent/tool: Claude Code (Claude Opus 5.5)
- Requested by user: "the hero section is very bland. it should be very very very animated and chaotic and should have a lot happening".
- Files added: `src/components/hero/PixelRain.tsx`, `src/components/hero/Tapes.tsx`, `src/components/hero/Stickers.tsx`, `src/components/hero/CliTicker.tsx` (details in 9.4).
- Files changed: `src/components/sections/Hero.tsx` (rewritten: layer stack, random-order char intro, glitch loop, row-hover scramble, cursor-dodging letters, magnetic CTAs, extended pinned timeline to `+=170%` with row split, tape drop, CLI exit, sticker scatter); `src/components/three/ChipScene.tsx` (`SceneProgress.kick`, automatic rebuild pulse every 5.5s, random cube pops, click kick, pulse adds z-rotation).
- Bugs found and fixed during the work: `quickTo(el, "rotate")` produced hundreds of console warnings, switched to `"rotation"` (G8); sticker scroll scatter and mouse parallax fought over `x/y`, scatter moved to `xPercent/yPercent`; idle float, drag and parallax split into three nested layers; tapes overlapped so the mint tape was hidden, spacing raised to 78px and container moved to `top-[44%]`, `h-32`; on mobile the bolt sticker covered "BUILD" and the trophy covered the intro text, stickers got separate `mobile` coordinates.
- Verified (production build): 1440x900 axe 0 violations, console 0 warnings/errors, frame time p50 and p95 about 7 ms in headless Chromium; 390x844 no horizontal overflow and text unobstructed after the sticker fix.
- Not verified: axe at 390 after this change, reduced-motion visual pass, real-phone performance, 768px.

#### 2026-11-11: Initial site build, audit fixes and OG image
- Agent/tool: Claude Code (Claude Opus 5.5)
- Requested by user: Next.js + React (latest) site with three.js and GSAP, general design and feel of 1minus1.com with the club's own touches, strictly using the supplied brand assets, a team showcase, a 404 game, and OG images per route. Also asked to replicate and improve the link shortener from `~/projects/optica-website` (not started, see 16).
- Decisions (user): team titles from the appointment letters; photos to be supplied by the user later (monogram fallback meanwhile); join and contact CTAs are external links (no backend); scope "core feel + 404 game".
- Decisions (agent): dark-only theme and radius 0 to match the kit; Ember Mono for display, Ember Display Medium for body; brand icons only, via CSS masks; Lenis + GSAP + raw three.js; 1minus1 used as a motion and layout reference only.
- Scaffold: `create-next-app@latest` (Next 16.4.6, TS, Tailwind v4, ESLint, App Router, `src/`, pnpm). Removed `favicon.ico` and default `public/*.svg`. `.gitignore` gained `.playwright-mcp/`.
- Dependencies added: `gsap@^3.15.1`, `@gsap/react@^2.1.2`, `lenis@^1.3.27`, `three@^0.187.0`, dev `@types/three@^0.187.0`.
- Assets added: subset woff2 fonts in `src/app/fonts/`, subset TTFs in `src/assets/og/`, 11 white icons in `public/brand/icons/` (trophy replaced with the correct shape from `Trophy_Mint.svg`), program icon `public/brand/mark/chip.svg`, favicon `src/app/icon.svg`.
- Files added: everything listed in section 4 except the hero/ folder (added in the next entry) and CLAUDE.md.
- Bugs found and fixed: outline row invisible (`color: transparent` broke `currentColor` stroke, G2); sideways scroll from pin spacers sized to `innerWidth` (G5); unlayered custom CSS overriding Tailwind `hidden` (G6); Programs card fading made it see-through (shade overlay instead); nav logo plate lost at page end with `toggleClass` + `end: "max"` (switched to `onUpdate` with `scroll() > 120`); footer chip invisible mint-on-mint (`iconClassName`); hero headline clipped at 390px (display clamp lowered); `THREE.Clock` deprecation; SplitText `aria-label` on spans, purple card contrast at 80% opacity, nav and 404 logo label mismatches, team scroller not focusable, `/press-start` prefetch 404 noise (`prefetch={false}`).
- Code review findings fixed: game keyboard handling stealing Enter/Space and arrows from links, d-pad not keyboard operable, game focus, live region, full-board crash, background-tab catch-up; trail canvas now only rendered for fine pointers; preloader `alive` guard, idempotent finish, cleanup + 5s fallback, `inert` page during intro; About SplitText `autoSplit`; WebGL try/catch, InstancedMesh dispose, `forceContextLoss`. Deliberately not changed: keyboard repositioning of team cards (decorative) and the hero statement under reduced motion (decorative, `aria-hidden`).
- Verified (production build): axe 0 violations at 1440 and 390 on `/`, 0 console messages; LCP 97 ms and CLS 0.00 (localhost, unthrottled); OG image renders 200 `image/png`.
- Config/infra (same day, before the build): `git init -b main`; club SSH key and `github-club` alias; repo-local `core.sshCommand`, `user.name`, `user.email`; remote `origin` added and reachable (empty repo). See section 15.
- Not verified / known issues: 768px; reduced-motion visual pass; nothing committed or pushed.

---

## 18. Gotchas index

| ID | Gotcha | Where it bit |
|---|---|---|
| G1 | Kit "Regular" Ember Display file is actually Bold | Fonts |
| G2 | `color: transparent` + `-webkit-text-stroke: currentColor` draws nothing | Hero outline row |
| G3 | Kit icon files are mislabelled; `Trophy_White` is a wrench | Icons |
| G4 | "Alternate (Without AWS)" brandmark folder holds a personal photo | Brandmarks |
| G5 | Pinned sections use `innerWidth` incl. scrollbar, causing sideways scroll | Hero, Programs |
| G6 | Unlayered custom CSS beats Tailwind v4 utilities | `.brand-icon` vs `hidden` |
| G7 | Turbopack dev server served stale CSS after some edits | Use prod build to verify |
| G8 | `gsap.quickTo` needs `rotation`, not `rotate` | Hero letters |
| G9 | `pkill -f` with a pattern in its own command line kills the calling shell | Stopping servers |
| G10 | SplitText `aria` default adds `aria-label` to the split element | Hero rows |
| G11 | Satori (OG) cannot read woff2 and needs `display: flex` on parents | OG images |
| G12 | `toggleClass` with `end: "max"` drops the class at the very bottom | Nav plate |
| G13 | A scrubbed timeline created while an intro holds elements hidden records "hidden" as its start; use `fromTo` + `immediateRender: false` | Hero tapes/CLI vanished after scrolling back |
| G15 | A pinned element with negative margins loses them inside the pin spacer and pins narrower than the screen | Team board on mobile |
| G16 | A leftover inline `transform` on a parent (even `translate(0,0)`) becomes the containing block for absolutely positioned children | Team cards collapsed after resizing mobile to desktop |
| G17 | A WebGL canvas inside a CSS-scaled element renders at layout size and looks blurry when scaled up | Hero end state |
| G18 | ScrollTriggers created before later pinned sections are measured without their pin spacers; use `refreshPriority: -1` for triggers that depend on later pins | Nav section marker |
| G19 | A CSS `transition` on `transform` (e.g. Tailwind `transition-transform`) on an element GSAP is tweening can freeze the tween's end state | Join perk rows stuck at x -24px |
| G14 | SplitText (`autoSplit`) re-splitting an element whose nested child is being scrambled duplicated the child's text ("AWS.AWS.") | About title |
