import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DeletePaperButton } from "@/components/PaperActions";
import { EditPaperForm } from "@/components/EditPaperForm";
import { PageHeader } from "@/components/PageHeader";
import { getCurrentUser } from "@/lib/auth";
import { getPaperById } from "@/lib/papers";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export const metadata: Metadata = {
  title: "Edit paper",
  robots: { index: false, follow: false },
};

export default async function EditPaperPage({ params }: { params: Params }) {
  const { id } = await params;
  const paper = await getPaperById(id).catch(() => null);
  if (!paper) notFound();

  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/papers/${paper.id}/edit`);

  const isAdmin = user.role === "admin";
  if (!isAdmin && user.id !== paper.ownerId) {
    return (
      <div className="paper paper-lined mx-auto mt-6 max-w-lg px-6 py-12 text-center">
        <p aria-hidden className="text-3xl">
          🔒
        </p>
        <h1 className="mt-3 font-display text-[1.7rem] text-ink">Not your paper</h1>
        <p className="mt-2 font-serif-papr text-ink-2">
          You do not have permission to edit this paper. Only the contributor who uploaded it —
          or the librarian — may change it.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Link href={`/papers/${paper.id}`} className="btn btn-primary">
            View this paper
          </Link>
          <Link href="/my-uploads" className="btn btn-ghost">
            My uploads
          </Link>
        </div>
      </div>
    );
  }

  const settings = await getSettings();

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Stewardship"
        title="Edit this paper"
        lead="Correct the catalogue card, rename the file, or replace the document entirely."
      >
        <Link href={`/papers/${paper.id}`} className="btn btn-ghost btn-sm">
          View paper
        </Link>
        <DeletePaperButton paperId={paper.id} fileName={paper.fileName} />
      </PageHeader>

      <EditPaperForm
        maxUploadMb={settings.maxUploadMb}
        isAdmin={isAdmin}
        paper={{
          id: paper.id,
          fileName: paper.fileName,
          uploaderName: paper.uploaderName,
          classLevel: paper.classLevel,
          board: paper.board,
          subject: paper.subject,
          exam: paper.exam,
          year: paper.year,
          school: paper.school,
          paperType: paper.paperType,
          description: paper.description,
          fileExt: paper.fileExt,
          fileSize: paper.fileSize,
          status: paper.status,
        }}
      />
    </div>
  );
}
