import type { Metadata } from "next";
import Link from "next/link";
import { Library } from "@/components/Library";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "PaperRaj — Specimen Papers",
  description:
    "Specimen, sample and model question papers for school examinations, shared by teachers and contributors.",
  alternates: { canonical: "/specimen-papers" },
};

export const dynamic = "force-dynamic";

export default function SpecimenPapersPage() {
  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Catalogue"
        title="Specimen Papers"
        lead="Sample and model papers that show the shape of an exam before you sit it — ideal for practice and revision."
      >
        <Link href="/year-papers" className="btn btn-ghost btn-sm">
          Looking for Year Papers?
        </Link>
      </PageHeader>
      <Library preset={{ paperType: "Specimen Paper" }} />
    </div>
  );
}
