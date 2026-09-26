import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms",
  description: "The rules for using and contributing to the PaperRaj archive.",
  alternates: { canonical: "/terms" },
};

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: "1 · What PaperRaj is",
    body: [
      "PaperRaj is a community archive of school examination question papers. It exists so that students can find past and specimen papers in one place.",
      "The service is provided as-is, without warranty of any kind.",
    ],
  },
  {
    title: "2 · What you may upload",
    body: [
      "Only documents you have the right to share: your own papers, papers shared with you for revision, or papers whose distribution is otherwise permitted.",
      "You must not upload anything unlawful, defamatory, obscene, or designed to harm a reader or their device.",
      "Only PDF, JPG, JPEG, PNG and WebP files are accepted, up to the published maximum size (currently 50 MB).",
    ],
  },
  {
    title: "3 · Moderation",
    body: [
      "Uploads may be held for approval before becoming publicly visible. The librarian may edit or remove any contribution, and may suspend accounts that break these terms.",
      "Reports from readers are investigated and acted on.",
    ],
  },
  {
    title: "4 · Ownership and licences",
    body: [
      "You keep whatever rights you hold in the documents you upload. By uploading, you grant PaperRaj permission to store and display that document within the archive, and to serve it to readers.",
      "If you believe a paper infringes your rights, write to the owner at " +
        SITE.ownerEmail +
        " and it will be reviewed and removed where appropriate.",
    ],
  },
  {
    title: "5 · Conduct",
    body: [
      "Be decent in the comments. Spam, abuse and impersonation are removed.",
      "Do not attempt to manipulate votes, download counts or another contributor's papers. Ownership is enforced server-side; attempts to bypass it may result in suspension.",
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Legal"
        title="Terms"
        lead="Short, readable rules that keep the archive useful for everyone."
      />
      <div className="grid gap-4">
        {SECTIONS.map((section) => (
          <section key={section.title} className="paper p-5">
            <h2 className="font-display text-[1.3rem] text-ink">{section.title}</h2>
            <div className="mt-2 grid gap-2">
              {section.body.map((paragraph) => (
                <p key={paragraph.slice(0, 24)} className="text-[0.93rem] leading-relaxed text-ink-2">
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
