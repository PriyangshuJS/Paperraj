import type { Metadata } from "next";
import Link from "next/link";
import { Library } from "@/components/Library";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "PaperRaj — Year Papers",
  description:
    "Previous year school examination question papers. Browse real past papers by class, board and subject.",
  alternates: { canonical: "/year-papers" },
};

export const dynamic = "force-dynamic";

export default function YearPapersPage() {
  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Catalogue"
        title="Year Papers"
        lead="Real examination papers from previous years — the most requested shelf in the library. Every paper here was set in an actual exam."
      >
        <Link href="/specimen-papers" className="btn btn-ghost btn-sm">
          Looking for Specimen Papers?
        </Link>
      </PageHeader>
      <Library preset={{ paperType: "Year Paper" }} />
    </div>
  );
}
