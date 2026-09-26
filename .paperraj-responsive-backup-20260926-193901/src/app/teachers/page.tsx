import type { Metadata } from "next";
import Link from "next/link";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { teachers } from "@/db/schema";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/Library";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Teachers",
  description:
    "A directory of teacher contacts — subject, school and contact details shared by the PaperRaj community.",
  alternates: { canonical: "/teachers" },
};

export default async function TeachersPage() {
  const rows = await db
    .select()
    .from(teachers)
    .orderBy(asc(teachers.name))
    .catch(() => []);

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Directory"
        title="Teachers"
        lead="Subject specialists and their contact details, kept separately from the papers themselves. Useful when a paper needs a teacher's eye."
      />

      {rows.length === 0 ? (
        <EmptyState
          icon="🖋️"
          title="The directory is empty"
          body="Teacher contacts are added by the librarian. If you would like to be listed, send your name, subject, school and contact details through the contact page."
          action={
            <Link href="/contact" className="btn btn-primary">
              Contact the librarian
            </Link>
          }
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((teacher) => (
            <li key={teacher.id} className="paper row-hover p-4">
              <h2 className="font-display text-[1.2rem] text-ink">{teacher.name}</h2>
              <ul className="mt-2 grid gap-1 text-[0.86rem] text-ink-2">
                {teacher.subject && (
                  <li>
                    <span className="smallcaps text-[0.68rem] font-bold text-ink-3">Subject</span>
                    <br />
                    {teacher.subject}
                  </li>
                )}
                {teacher.school && (
                  <li>
                    <span className="smallcaps text-[0.68rem] font-bold text-ink-3">School</span>
                    <br />
                    {teacher.school}
                  </li>
                )}
                {teacher.contact && (
                  <li>
                    <span className="smallcaps text-[0.68rem] font-bold text-ink-3">Contact</span>
                    <br />
                    {teacher.contact}
                  </li>
                )}
              </ul>
              {teacher.notes && (
                <p className="mt-2 border-t border-dotted border-[var(--edge)] pt-2 font-serif-papr text-[0.9rem] text-ink-2">
                  {teacher.notes}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
