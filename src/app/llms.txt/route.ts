import { programs, site } from "@/content/site";
import { advisor, team } from "@/content/team";

// Plain-text summary for AI search and assistants (llmstxt.org). Built from the same content as the page.
export function GET() {
  const body = `# ${site.name} at BVCOE

> ${site.description}

${site.name}s (formerly AWS Cloud Clubs) are student-led communities where students explore, create and innovate with AWS. This group is based at ${site.campus}, ${site.city}, and is open to students of every branch and year.

## Programs

${programs.map((p) => `- ${p.title}: ${p.body}`).join("\n")}

## Core team

${team.map((m) => `- ${m.name}, ${m.role}`).join("\n")}
- ${advisor.name}, Faculty Advisor (${advisor.role})

## Links

- [Website](${site.url})
- [Join the group](${site.joinUrl})
${site.socials.map((s) => `- [${s.label}](${s.href})`).join("\n")}
- Partnerships and sponsorship: ${site.contactEmail}
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
