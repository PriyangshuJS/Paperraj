import type { Metadata } from "next";
import { PageHeader, ShelfLinks } from "@/components/PageHeader";
import { getFacets } from "@/lib/papers";

export const metadata: Metadata = {
  title: "PaperRaj — Boards",
  description:
    "Browse school question papers by examination board — ICSE, CBSE, State Boards and every board in the archive.",
  alternates: { canonical: "/boards" },
};

export const dynamic = "force-dynamic";

export default async function BoardsPage() {
  const facets = await getFacets().catch(() => ({
    subject: [],
    classLevel: [],
    board: [],
    exam: [],
    school: [],
    paperType: [],
    year: [],
  }));

  const boards = [...(facets.board ?? [])]
    .sort((a, b) => a.value.localeCompare(b.value))
    .map((b) => ({
      href: `/papers?board=${encodeURIComponent(b.value)}`,
      label: b.value,
      count: b.count,
    }));

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Catalogue"
        title="Boards"
        lead="Examination boards and councils represented in the archive — ICSE, CBSE, State Boards and any board contributors catalogue."
      />
      <ShelfLinks
        items={boards}
        emptyLabel="No boards catalogued yet. Upload the first paper and its board will appear here."
      />
    </div>
  );
}
