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
