import type { Metadata } from "next";
import { PageHeader, StatCard } from "@/components/PageHeader";
import { getPublicStats } from "@/lib/papers";
import { formatBytes, formatNumber } from "@/lib/format";
import { db } from "@/db";
import { papers } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Statistics",
  description:
    "Public statistics for the PaperRaj archive: total uploads, approved papers, downloads, contributors, likes and dislikes.",
  alternates: { canonical: "/statistics" },
};

export default async function StatisticsPage() {
  const stats = await getPublicStats().catch(() => null);
  const top = await db
    .select({
      id: papers.id,
      fileName: papers.fileName,
      downloadCount: papers.downloadCount,
      likeCount: papers.likeCount,
      fileSize: papers.fileSize,
    })
    .from(papers)
    .where(eq(papers.status, "APPROVED"))
    .orderBy(desc(papers.downloadCount))
    .limit(5)
    .catch(() => []);

  const totalBytes = top.reduce((sum, p) => sum + p.fileSize, 0);

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="The archive in numbers"
        title="Statistics"
        lead="A public ledger of how the library is growing. The librarian keeps a fuller set of figures behind the desk."
      />

      {stats ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <StatCard label="Total uploads" value={formatNumber(stats.totalUploads)} />
          <StatCard label="Approved papers" value={formatNumber(stats.approvedPapers)} />
          <StatCard label="Pending review" value={formatNumber(stats.pendingPapers)} />
          <StatCard label="Downloads served" value={formatNumber(stats.totalDownloads)} />
          <StatCard label="Readers registered" value={formatNumber(stats.totalUsers)} />
          <StatCard label="Contributors" value={formatNumber(stats.totalContributors)} />
          <StatCard label="Appreciations" value={formatNumber(stats.totalLikes)} hint="👍 likes" />
          <StatCard label="Critiques" value={formatNumber(stats.totalDislikes)} hint="👎 dislikes" />
          <StatCard label="Comments" value={formatNumber(stats.totalComments)} />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="skeleton h-24" />
          ))}
        </div>
      )}

      <section className="paper p-5">
        <h2 className="font-display text-[1.35rem] text-ink">Most consulted papers</h2>
        {top.length === 0 ? (
          <p className="mt-2 font-serif-papr text-ink-3">
            No papers have been consulted yet. The shelves await their first readers.
          </p>
        ) : (
          <ol className="mt-3 grid gap-2">
            {top.map((paper, index) => (
              <li
                key={paper.id}
                className="flex flex-wrap items-baseline gap-2 border-b border-dotted border-[var(--edge)] pb-2 last:border-0"
              >
                <span className="font-display text-[1.1rem] text-gold">{index + 1}</span>
                <a href={`/papers/${paper.id}`} className="link-ink break-all text-[0.95rem]">
                  {paper.fileName}
                </a>
                <span className="ml-auto text-[0.8rem] text-ink-3">
                  {formatNumber(paper.downloadCount)} downloads · 👍 {formatNumber(paper.likeCount)}{" "}
                  · {formatBytes(paper.fileSize)}
                </span>
              </li>
            ))}
          </ol>
        )}
        <p className="mt-3 text-[0.75rem] text-ink-3">
          Sample storage footprint of the papers above: {formatBytes(totalBytes)}
        </p>
      </section>
    </div>
  );
}
