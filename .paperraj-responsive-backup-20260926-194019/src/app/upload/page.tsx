import type { Metadata } from "next";
import Link from "next/link";
import { UploadForm } from "@/components/UploadForm";
import { PageHeader } from "@/components/PageHeader";
import { getFacets } from "@/lib/papers";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Upload a paper",
  description:
    "Contribute a school examination question paper to the PaperRaj archive. PDF, JPG, PNG and WebP up to 50 MB.",
  alternates: { canonical: "/upload" },
};

export const dynamic = "force-dynamic";

export default async function UploadPage() {
  const [settings, facets] = await Promise.all([
    getSettings(),
    getFacets().catch(() => ({
      classLevel: [],
      board: [],
      subject: [],
      exam: [],
      school: [],
      paperType: [],
      year: [],
    })),
  ]);

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Contribute"
        title="Upload a paper"
        lead="Share a question paper with the next batch of students. You do not need an account — but if you sign in, PaperRaj remembers it as yours so you can edit or remove it later."
      >
        <Link href="/papers" className="btn btn-ghost btn-sm">
          Browse the library instead
        </Link>
      </PageHeader>

      <UploadForm
        maxUploadMb={settings.maxUploadMb}
        autoApproval={settings.autoApproval}
        suggestions={{
          classLevel: facets.classLevel.map((f) => f.value),
          board: facets.board.map((f) => f.value),
          subject: facets.subject.map((f) => f.value),
          exam: facets.exam.map((f) => f.value),
          school: facets.school.map((f) => f.value),
        }}
      />
    </div>
  );
}
