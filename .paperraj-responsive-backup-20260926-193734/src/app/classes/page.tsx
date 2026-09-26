import type { Metadata } from "next";
import { PageHeader, ShelfLinks } from "@/components/PageHeader";
import { getFacets } from "@/lib/papers";

export const metadata: Metadata = {
  title: "PaperRaj — Classes",
  description:
    "Browse school question papers by class — Class 9, Class 10, Class 11, Class 12 and every other class in the archive.",
  alternates: { canonical: "/classes" },
};

export const dynamic = "force-dynamic";

const CLASS_ORDER = (a: string, b: string) => {
  const na = /^class\s+(\d+)/i.exec(a);
  const nb = /^class\s+(\d+)/i.exec(b);
  if (na && nb) return Number(na[1]) - Number(nb[1]);
  if (na) return -1;
  if (nb) return 1;
  return a.localeCompare(b);
};

export default async function ClassesPage() {
  const facets = await getFacets().catch(() => ({
    subject: [],
    classLevel: [],
    board: [],
    exam: [],
    school: [],
    paperType: [],
    year: [],
  }));

  const classes = [...(facets.classLevel ?? [])]
    .sort((a, b) => CLASS_ORDER(a.value, b.value))
    .map((c) => ({
      href: `/papers?class=${encodeURIComponent(c.value)}`,
      label: c.value,
      count: c.count,
    }));

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Catalogue"
        title="Classes"
        lead="Pick your class and see every paper catalogued for it, from Class 1 through Class 12 and beyond."
      />
      <ShelfLinks
        items={classes}
        emptyLabel="No classes catalogued yet. Upload the first paper and its class will appear here."
      />
    </div>
  );
}
