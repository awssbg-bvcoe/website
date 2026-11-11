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
    role: "Group Leader",
    focus: "Sets the group's direction and works directly with AWS.",
    tone: "mint",
    lead: true,
  },
  {
    name: "Arya Bhardwaj",
    role: "General Secretary",
    focus: "Keeps meeting minutes, coordinates the team and handles official communication.",
    tone: "paper",
  },
  {
    name: "Tanisha Kaur",
    role: "Creative Director",
    focus: "Designs posters, event creatives and visuals in line with the AWS brand kit.",
    tone: "amber",
  },
  {
    name: "Chetna Negi",
    role: "Social Media Strategist",
    focus: "Runs event promos, recaps and the group's presence across social channels.",
    tone: "blue",
  },
  {
    name: "Pakhshi Luthra",
    role: "Treasurer",
    focus: "Plans event budgets, tracks expenses and manages sponsorship funds.",
    tone: "magenta",
  },
  {
    name: "Aamir Ali Zaidi",
    role: "Head of Community & Partnerships",
    focus: "Grows membership, builds partnerships with other clubs and leads recognition on campus.",
    tone: "purple",
  },
];
