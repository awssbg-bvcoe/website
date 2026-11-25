import type { BrandIconName } from "@/content/site";

export type TeamMember = {
  name: string;
  role: string;
  focus: string;
  /** Path under /public, e.g. "/team/samyak-jain.jpg". Falls back to a pixel monogram when absent. */
  photo?: string;
  links?: { linkedin?: string; github?: string };
  tone: "mint" | "purple" | "amber" | "blue" | "magenta" | "paper";
  lead?: boolean;
};

export const team: TeamMember[] = [
  {
    name: "Samyak Jain",
    photo: "/team/samyak-jain.jpg",
    role: "Group Leader",
    focus: "Sets the vision. Leads the group from first idea to launch.",
    tone: "mint",
    lead: true,
  },
  {
    name: "Arya Bhardwaj",
    photo: "/team/arya-bhardwaj.jpg",
    role: "General Secretary",
    focus: "Runs the group. Knows it all before you ask.",
    tone: "purple",
  },
  {
    name: "Pakhshi Luthra",
    photo: "/team/pakhshi-luthra.jpg",
    role: "Treasurer",
    focus: "Guards every rupee. Makes every event possible.",
    tone: "magenta",
  },
  {
    name: "Chetna Negi",
    photo: "/team/chetna-negi.jpg",
    role: "Social Media Strategist",
    focus: "Owns our voice online. Makes every event impossible to miss.",
    tone: "blue",
  },
  {
    name: "Tanisha Kaur",
    photo: "/team/tanisha-kaur.jpg",
    role: "Creative Director",
    focus: "Shapes how the group looks. Every visual starts with her.",
    tone: "amber",
  },
  {
    name: "Aamir Ali Zaidi",
    photo: "/team/aamir-ali-zaidi.jpg",
    role: "Head of Community & Partnerships",
    focus: "Builds the community. Opens doors across campus and beyond.",
    tone: "paper",
  },
];

export type Head = {
  name: string;
  role: string;
  focus: string;
  /** Path under /public; falls back to a pixel monogram when absent. */
  photo?: string;
  tone: "amber" | "blue" | "magenta" | "purple" | "mint";
  icon: BrandIconName;
  /** Role not filled yet: the card shows "?" instead of initials */
  tbd?: boolean;
};

/** Heads of the working teams, shown in the character-select section under the core team. */
export const heads: Head[] = [
  {
    name: "Vansh Tyagi",
    photo: "/team/vansh-tyagi.jpg",
    role: "Event Operations Head",
    focus: "Runs every event on the ground. Venues, kits and timings, all sorted.",
    tone: "amber",
    icon: "wrench",
  },
  {
    name: "Bhumika Rawat",
    photo: "/team/bhumika-rawat.jpg",
    role: "Content & Documentation Head",
    focus: "Writes what we publish. Keeps a record of everything we run.",
    tone: "blue",
    icon: "speaker",
  },
  {
    name: "Gaurangi Chawla",
    photo: "/team/gaurangi-chawla.jpg",
    role: "Design Head",
    focus: "Designs the posters, decks and visuals for every event.",
    tone: "magenta",
    icon: "drop",
  },
  {
    // Photo to come
    name: "Jiya Rawat",
    role: "Outreach Head",
    focus: "Takes the group beyond campus. Brings new people and partners in.",
    tone: "purple",
    icon: "teams",
  },
  {
    // Not appointed yet (user, 2026-11-26): replace name and focus once decided
    name: "To be announced",
    role: "Social Media Head",
    focus: "Announced soon.",
    tone: "mint",
    icon: "double-bracket-smile",
    tbd: true,
  },
];

export type Advisor = {
  name: string;
  /** Main college post, shown first under the name */
  title: string;
  role: string;
  roleDetail: string;
  bio: string;
  photo: string;
  credentials: { label: string; icon: "trophy" | "bolt" | "speaker" | "key"; tone: "amber" | "mint" | "blue" | "purple" }[];
};

/** Faculty advisor. Credentials carried over from the BVP Optica site (same person); nothing Optica-specific is shown. */
export const advisor: Advisor = {
  name: "Dr. Yugnanda Puri",
  title: "Dean of Research and Development, BVCOE, New Delhi",
  role: "President, Institute Innovation Cell",
  roleDetail: "IIC (AICTE, Ministry of Education)",
  bio: "Dr. Puri guides the group. As Dean of Research and Development and President of the Institute Innovation Cell, she champions research and innovation across BVCOE.",
  photo: "/team/yugnanda-puri.jpg",
  credentials: [
    { label: "Ph.D. in Optical Communication", icon: "trophy", tone: "amber" },
    { label: "Dean of Research and Development", icon: "bolt", tone: "mint" },
    { label: "Associate Professor", icon: "speaker", tone: "blue" },
  ],
};
