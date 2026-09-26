import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with the PaperRaj owner by Gmail or YouTube — report a problem, request a paper, or ask to be listed in the teacher directory.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Contact"
        title="Contact the owner"
        lead="Questions, corrections, takedown requests and teacher-directory submissions all reach the same desk."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <a
          href={`mailto:${SITE.ownerEmail}`}
          className="paper row-hover flex flex-col gap-2 p-5 no-underline"
        >
          <span aria-hidden className="text-2xl">
            ✉️
          </span>
          <span className="font-display text-[1.3rem] text-ink">Gmail</span>
          <span className="break-all text-[0.92rem] text-accent underline">{SITE.ownerEmail}</span>
          <span className="text-[0.85rem] text-ink-2">
            Best for takedown requests, corrections and private questions.
          </span>
        </a>

        <a
          href={SITE.youtubeUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="paper row-hover flex flex-col gap-2 p-5 no-underline"
        >
          <span aria-hidden className="text-2xl">
            ▶️
          </span>
          <span className="font-display text-[1.3rem] text-ink">YouTube</span>
          <span className="break-all text-[0.92rem] text-accent underline">{SITE.youtubeUrl}</span>
          <span className="text-[0.85rem] text-ink-2">
            Walkthroughs, revision notes and archive announcements.
          </span>
        </a>

        <div className="paper p-5 sm:col-span-2">
          <h2 className="smallcaps mb-2 text-[0.76rem] font-bold text-ink-3">
            Before you write
          </h2>
          <ul className="grid gap-2 text-[0.9rem] text-ink-2">
            <li>
              To report a specific paper, use the <strong>Report this paper</strong> button on its
              page — it reaches the librarian faster and includes the paper automatically.
            </li>
            <li>
              To be listed in the teacher directory, send your name, subject, school and contact
              details.
            </li>
            <li>
              To request a paper that is missing, mention the class, board, subject and year you
              need.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
