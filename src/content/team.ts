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
    focus: "Sets the group's direction and works directly with AWS.",
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
    focus: "Plans event budgets, tracks expenses and manages sponsorship funds.",
    tone: "magenta",
  },
  {
    name: "Chetna Negi",
    photo: "/team/chetna-negi.jpg",
    role: "Social Media Strategist",
    focus: "Runs event promos, recaps and the group's presence across social channels.",
    tone: "blue",
  },
  {
    name: "Tanisha Kaur",
    photo: "/team/tanisha-kaur.jpg",
    role: "Creative Director",
    focus: "Designs posters, event creatives and visuals in line with the AWS brand kit.",
    tone: "amber",
  },
  {
    name: "Aamir Ali Zaidi",
    photo: "/team/aamir-ali-zaidi.jpg",
    role: "Head of Community & Partnerships",
    focus: "Grows membership, builds partnerships with other clubs and leads recognition on campus.",
    tone: "paper",
  },
];
