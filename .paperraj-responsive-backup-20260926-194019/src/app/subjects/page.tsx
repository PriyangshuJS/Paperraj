import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, ShelfLinks } from "@/components/PageHeader";
import { getFacets } from "@/lib/papers";

export const metadata: Metadata = {
  title: "PaperRaj — Subjects",
  description:
    "Browse school question papers by subject: Mathematics, Physics, Chemistry, Biology, History and more.",
  alternates: { canonical: "/subjects" },
};

export const dynamic = "force-dynamic";

export default async function SubjectsPage() {
  const facets = await getFacets().catch(() => ({
    subject: [],
    classLevel: [],
    board: [],
    exam: [],
    school: [],
    paperType: [],
    year: [],
  }));

  const subjects = (facets.subject ?? []).map((s) => ({
    href: `/papers?subject=${encodeURIComponent(s.value)}`,
    label: s.value,
    count: s.count,
  }));

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Catalogue"
        title="Subjects"
        lead="Shelves organised by subject. Subjects appear as contributors catalogue them, so the list grows with the archive."
      >
        <Link href="/upload" className="btn btn-sm">
          Add a missing subject
        </Link>
      </PageHeader>
      <ShelfLinks
        items={subjects}
        emptyLabel="No subjects catalogued yet. Upload the first paper and its subject will appear here."
      />
    </div>
  );
}
