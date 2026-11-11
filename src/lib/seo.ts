import { programs, site } from "@/content/site";
import { advisor, team } from "@/content/team";

/** True on Vercel preview/development deployments; those must never be indexed. */
export const isNonProductionDeploy = Boolean(process.env.VERCEL_ENV) && process.env.VERCEL_ENV !== "production";

export const abs = (path: string) => new URL(path, site.url).toString();

/** Images crawlers may index (image sitemap + structured data). */
export const indexableImages = [
  abs("/opengraph-image"),
  ...team.flatMap((m) => (m.photo ? [abs(m.photo)] : [])),
  abs(advisor.photo),
];

/**
 * schema.org graph for the home page: the group (with its college, socials, contact,
 * programmes and people) and the website. Facts only; nothing here that the page does not say.
 */
export function homeJsonLd() {
  const org = `${site.url}/#organization`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": org,
        name: `${site.name} at BVCOE`,
        alternateName: [site.shortName, `${site.name}, ${site.campus}`],
        url: site.url,
        logo: { "@type": "ImageObject", url: abs("/icons/icon-512.png"), width: 512, height: 512 },
        image: abs("/opengraph-image"),
        description: site.description,
        slogan: "Learn. Build. Deploy. Scale.",
        email: site.contactEmail,
        sameAs: site.socials.map((s) => s.href),
        areaServed: { "@type": "City", name: site.city },
        parentOrganization: {
          "@type": "CollegeOrUniversity",
          name: site.campus,
          address: { "@type": "PostalAddress", addressLocality: site.city, addressCountry: "IN" },
        },
        contactPoint: {
          "@type": "ContactPoint",
          email: site.contactEmail,
          contactType: "partnerships",
          availableLanguage: ["English", "Hindi"],
        },
        knowsAbout: ["Amazon Web Services", "Cloud computing", "Serverless", "Generative AI", "AWS Certification"],
        makesOffer: programs.map((p) => ({
          "@type": "Offer",
          price: 0,
          priceCurrency: "INR",
          itemOffered: { "@type": "Service", name: p.title, description: p.body },
        })),
        member: [
          ...team.map((m) => ({
            "@type": "OrganizationRole",
            roleName: m.role,
            member: { "@type": "Person", name: m.name, ...(m.photo ? { image: abs(m.photo) } : {}) },
          })),
          {
            "@type": "OrganizationRole",
            roleName: "Faculty Advisor",
            member: { "@type": "Person", name: advisor.name, jobTitle: advisor.role, image: abs(advisor.photo) },
          },
        ],
      },
      {
        "@type": "WebSite",
        "@id": `${site.url}/#website`,
        url: site.url,
        name: `${site.name} at BVCOE`,
        alternateName: site.shortName,
        description: site.description,
        inLanguage: "en-IN",
        publisher: { "@id": org },
      },
    ],
  };
}

/** Serialise JSON-LD for a <script> tag; `<` is escaped so the payload cannot close the tag. */
export const jsonLdScript = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c");
