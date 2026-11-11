export const site = {
  name: "AWS Student Builder Group",
  campus: "Bharati Vidyapeeth's College of Engineering",
  city: "New Delhi",
  shortName: "AWS SBG BVCOE",
  tagline: "Shaping the future through cloud technology",
  description:
    "The AWS Student Builder Group at Bharati Vidyapeeth's College of Engineering, New Delhi. A student-led community learning cloud and AI through hands-on workshops, certification prep and career sessions.",
  // Absolute origin for metadata and share images. On Vercel, fall back to the production domain
  // so WhatsApp, X and Discord always get an absolute https image URL.
  url:
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000"),
  /** Where "Join the group" sends people. Swap for the group's own page or registration form. */
  joinUrl: "https://builder.aws.com/community/student-builder-groups",
  programUrl: "https://builder.aws.com/community/student-builder-groups",
  /** Add the group's channels here; empty entries are not rendered. */
  socials: [
    { label: "Instagram", href: "https://www.instagram.com/awssbg.bvp/" },
    { label: "LinkedIn", href: "https://www.linkedin.com/company/aws-student-builder-group-bvp/" },
  ] as { label: string; href: string }[],
  maker: { name: "Samyak Jain", href: "https://github.com/sammyyakk" },
  /** Club inbox (sponsors, partners, general contact). Shown in the partner section and the footer. */
  contactEmail: "awssbg.bvcoe@gmail.com",
} as const;

export const nav = [
  { label: "About", href: "#about" },
  { label: "Programs", href: "#programs" },
  { label: "Team", href: "#team" },
  { label: "Partner", href: "#partner" },
] as const;

export type BrandIconName =
  | "bolt"
  | "clock"
  | "double-bracket-smile"
  | "drop"
  | "key"
  | "ladder"
  | "single-bracket-smile"
  | "speaker"
  | "teams"
  | "trophy"
  | "wrench";

export type Program = {
  id: string;
  label: string;
  title: string;
  body: string;
  tags: string[];
  icon: BrandIconName;
  tone: "mint" | "paper" | "purple" | "dark";
};

export const programs: Program[] = [
  {
    id: "workshops",
    label: "Build",
    title: "Hands-on workshops",
    body: "Laptops open, consoles live. We build real things on AWS together, from your first deploy to serverless and generative AI.",
    tags: ["Cloud fundamentals", "Serverless", "Generative AI"],
    icon: "wrench",
    tone: "mint",
  },
  {
    id: "certification",
    label: "Certify",
    title: "Certification prep",
    body: "Study groups and practice runs that get you ready for AWS certifications, starting with Cloud Practitioner.",
    tags: ["Study groups", "Practice exams", "Exam strategy"],
    icon: "trophy",
    tone: "paper",
  },
  {
    id: "careers",
    label: "Grow",
    title: "Career sessions",
    body: "Talks with people who build on AWS for a living, plus honest guidance on internships and cloud careers.",
    tags: ["Industry talks", "Internships", "Resume reviews"],
    icon: "ladder",
    tone: "purple",
  },
  {
    id: "labs",
    label: "Ship",
    title: "Demos and labs",
    body: "Short, focused labs and live demos where you see a service work end to end, then try it yourself.",
    tags: ["Live demos", "Guided labs", "Project nights"],
    icon: "bolt",
    tone: "dark",
  },
];

export const stats = [
  { value: "1,000+", label: "Student Builder Groups worldwide" },
  { value: "68+", label: "Countries in the network" },
  { value: "6+", label: "Events planned this term" },
] as const;

export type PartnerWay = { title: string; body: string; icon: BrandIconName; tone: "mint" | "amber" | "purple" | "blue" };

/** Ways to work with the group (all within what the programme does: events, sessions, careers, club collabs). */
export const partnerWays: PartnerWay[] = [
  { title: "Sponsor an event", body: "Put your name on a hands-on workshop or a certification study series.", icon: "trophy", tone: "amber" },
  { title: "Run a session", body: "Teach a workshop, demo your product or walk students through a live lab.", icon: "speaker", tone: "mint" },
  { title: "Meet builders", body: "Talk careers, mentor a project and meet students for internships.", icon: "ladder", tone: "purple" },
  { title: "Co-host with us", body: "Clubs and communities: plan joint events and build something together.", icon: "teams", tone: "blue" },
];
