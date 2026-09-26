import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { votes } from "@/db/schema";
import { DeletePaperButton, ReportDialog, VoteBox } from "@/components/PaperActions";
import { CommentsPanel } from "@/components/CommentsPanel";
import { PaperViewer } from "@/components/PaperViewer";
import { getCurrentUser } from "@/lib/auth";
import { getPaperById } from "@/lib/papers";
import { formatBytes, formatDateTime, formatNumber } from "@/lib/format";

type Params = Promise<{ id: string }>;

export const dynamic = "force-dynamic";

function nearbyShelves(paper: {
  subject: string | null;
  classLevel: string | null;
  board: string | null;
  paperType: string | null;
}): { href: string; label: string }[] {
  const links: { href: string; label: string }[] = [];
  if (paper.subject) {
    links.push({
      href: `/papers?subject=${encodeURIComponent(paper.subject)}`,
      label: `More ${paper.subject} papers`,
    });
  }
  if (paper.classLevel) {
    links.push({
      href: `/papers?class=${encodeURIComponent(paper.classLevel)}`,
      label: `More ${paper.classLevel} papers`,
    });
  }
  if (paper.board) {
    links.push({
      href: `/papers?board=${encodeURIComponent(paper.board)}`,
      label: `More ${paper.board} papers`,
    });
  }
  if (paper.paperType) {
    links.push({
      href: `/papers?type=${encodeURIComponent(paper.paperType)}`,
      label: `More ${paper.paperType}s`,
    });
  }
  return links;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const paper = await getPaperById(id).catch(() => null);
  if (!paper) return { title: "Paper not found" };
  return {
    title: `${paper.fileName} — PaperRaj`,
    description:
      paper.description ??
      `${paper.fileName} — a ${paper.paperType ?? "school"} question paper${paper.subject ? ` for ${paper.subject}` : ""}${paper.classLevel ? `, ${paper.classLevel}` : ""}. Download or read it online.`,
    alternates: { canonical: `/papers/${paper.id}` },
  };
}

export default async function PaperDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const paper = await getPaperById(id).catch(() => null);
  if (!paper) notFound();

  const user = await getCurrentUser();
  const canManage = Boolean(user && (user.role === "admin" || user.id === paper.ownerId));
  if (paper.status !== "APPROVED" && !canManage) notFound();

  let myVote = 0;
  if (user) {
    const rows = await db
      .select({ value: votes.value })
      .from(votes)
      .where(and(eq(votes.paperId, paper.id), eq(votes.userId, user.id)))
      .limit(1);
    myVote = rows[0]?.value ?? 0;
  }

  const details: { label: string; value: string }[] = [];
  if (paper.uploaderName) details.push({ label: "Uploaded by", value: paper.uploaderName });
  if (paper.classLevel) details.push({ label: "Class", value: paper.classLevel });
  if (paper.board) details.push({ label: "Board", value: paper.board });
  if (paper.subject) details.push({ label: "Subject", value: paper.subject });
  if (paper.exam) details.push({ label: "Exam", value: paper.exam });
  if (paper.year) details.push({ label: "Year", value: String(paper.year) });
  if (paper.school) details.push({ label: "School", value: paper.school });
  if (paper.paperType) details.push({ label: "Paper type", value: paper.paperType });
  details.push({ label: "Uploaded", value: formatDateTime(paper.createdAt) });
  details.push({ label: "File size", value: formatBytes(paper.fileSize) });
  details.push({ label: "File type", value: paper.fileExt.toUpperCase() });
  if (paper.downloadCount > 0) {
    details.push({ label: "Downloads", value: `${formatNumber(paper.downloadCount)} downloads` });
  }
  if (paper.likeCount > 0) details.push({ label: "Likes", value: formatNumber(paper.likeCount) });
  if (paper.dislikeCount > 0) {
    details.push({ label: "Dislikes", value: formatNumber(paper.dislikeCount) });
  }

  return (
    <div className="grid gap-6">
      <nav aria-label="Breadcrumb" className="text-[0.8rem] text-ink-3">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-ink">
              Home
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href="/papers" className="hover:text-ink">
              Papers
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="max-w-[16rem] truncate text-ink-2">{paper.fileName}</li>
        </ol>
      </nav>

      <article className="grid gap-5">
        <header className="paper paper-lined p-4 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="break-words font-display text-[1.6rem] font-semibold leading-tight text-ink sm:text-[2rem]">
                {paper.fileName}
              </h1>
              <p className="mt-1.5 text-[0.85rem] text-ink-3">
                Uploaded by <span className="font-semibold text-ink-2">{paper.uploaderName}</span>{" "}
                · {formatDateTime(paper.createdAt)} · {formatBytes(paper.fileSize)}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {paper.status === "APPROVED" ? (
                <span className="chip chip-type">Approved</span>
              ) : (
                <span className="chip chip-status">Pending approval</span>
              )}
              {canManage && (
                <>
                  <Link href={`/papers/${paper.id}/edit`} className="btn btn-sm">
                    ✎ Edit
                  </Link>
                  <DeletePaperButton paperId={paper.id} fileName={paper.fileName} />
                </>
              )}
            </div>
          </div>

          <ul className="mt-3 flex flex-wrap gap-1.5">
            {paper.classLevel && <li className="chip">{paper.classLevel}</li>}
            {paper.board && <li className="chip">{paper.board}</li>}
            {paper.exam && <li className="chip">{paper.exam}</li>}
            {paper.subject && <li className="chip chip-subject">{paper.subject}</li>}
            {paper.paperType && <li className="chip chip-type">{paper.paperType}</li>}
            {paper.year && <li className="chip">{paper.year}</li>}
          </ul>

          {paper.description && (
            <p className="mt-4 whitespace-pre-wrap border-l-2 border-gold/60 pl-3 font-serif-papr text-[1rem] leading-relaxed text-ink-2">
              {paper.description}
            </p>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <a href={`/api/papers/${paper.id}/download`} className="btn btn-primary">
              ⬇ Download · {formatBytes(paper.fileSize)}
            </a>
            <a
              href={`/api/papers/${paper.id}/view`}
              target="_blank"
              rel="noreferrer"
              className="btn"
            >
              👁️ View
            </a>
            <ReportDialog paperId={paper.id} />
          </div>

          <div className="mt-4">
            <VoteBox
              paperId={paper.id}
              likeCount={paper.likeCount}
              dislikeCount={paper.dislikeCount}
              myVote={myVote}
            />
          </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
          <div className="grid gap-5">
            <PaperViewer
              paperId={paper.id}
              fileExt={paper.fileExt}
              fileName={paper.fileName}
              fileSize={formatBytes(paper.fileSize)}
            />
            <CommentsPanel paperId={paper.id} />
          </div>

          <aside className="grid content-start gap-4">
            <section className="paper p-4" aria-label="Paper details">
              <h2 className="smallcaps mb-3 text-[0.76rem] font-bold text-ink-3">
                Catalogue card
              </h2>
              <dl className="grid gap-2.5">
                {details.map((item) => (
                  <div
                    key={item.label}
                    className="grid grid-cols-[auto_1fr] items-baseline gap-2 border-b border-dotted border-[var(--edge)] pb-2 last:border-0"
                  >
                    <dt className="text-[0.75rem] font-semibold uppercase tracking-wide text-ink-3">
                      {item.label}
                    </dt>
                    <dd className="text-right text-[0.9rem] text-ink-2">{item.value}</dd>
                  </div>
                ))}
              </dl>
              {user?.role === "admin" && (
                <p className="mt-3 rounded-sm border border-[var(--edge)] bg-[rgba(231,218,191,0.45)] p-2 text-[0.75rem] text-ink-3">
                  Librarian view · owner: {paper.ownerEmail ?? "guest upload"}
                </p>
              )}
            </section>

            <section className="paper p-4" aria-label="Related shelves">
              <h2 className="smallcaps mb-3 text-[0.76rem] font-bold text-ink-3">
                Nearby shelves
              </h2>
              <ul className="grid gap-1.5">
                {nearbyShelves(paper).map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="link-ink text-[0.9rem]">
                      {link.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link href="/papers" className="link-ink text-[0.9rem]">
                    Browse the whole library
                  </Link>
                </li>
              </ul>
            </section>
          </aside>
        </div>
      </article>
    </div>
  );
}
