import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How PaperRaj handles your account, uploads and visitor data.",
  alternates: { canonical: "/privacy" },
};

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: "What we store",
    body: [
      "Papers you upload: the file itself, its filename, the metadata you supply (class, board, subject, exam, year, school, paper type, description) and technical facts recorded automatically — upload date and time, file size, file type and storage location.",
      "If you create an account: your email address, the name and school you choose to save, an optional contact note, and a securely hashed password. Passwords are never stored in readable form.",
      "Engagement: comments you write, your likes and dislikes, and reports you file.",
    ],
  },
  {
    title: "What we do not do",
    body: [
      "We do not sell or rent your data.",
      "We do not run third-party advertising trackers.",
      "We do not require an account to browse, search or download papers.",
    ],
  },
  {
    title: "Who can see what",
    body: [
      "Your uploader name (and any metadata you enter) is public — it appears on the paper's listing, exactly like a library donation label.",
      "Your email address is never published. It is used for sign-in and, at most, for the librarian to contact you about your own uploads.",
      "Your contact note is visible only to you and the librarian.",
    ],
  },
  {
    title: "Removing your data",
    body: [
      "Signed-in contributors can delete their own papers at any time; deletion removes the database record and the stored file.",
      "To delete your account and everything attached to it, write to the owner at " +
        SITE.ownerEmail +
        " and it will be removed.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Legal"
        title="Privacy"
        lead="Plain-language notes on what PaperRaj keeps, why it keeps it, and how to have it removed."
      />
      <div className="grid gap-4">
        {SECTIONS.map((section) => (
          <section key={section.title} className="paper p-5">
            <h2 className="font-display text-[1.3rem] text-ink">{section.title}</h2>
            <div className="mt-2 grid gap-2">
              {section.body.map((paragraph) => (
                <p
                  key={paragraph.slice(0, 24)}
                  className="text-[0.93rem] leading-relaxed text-ink-2"
                >
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
