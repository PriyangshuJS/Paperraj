import type { Metadata } from "next";
import Link from "next/link";
import { MyUploadsList } from "@/components/MyUploadsList";
import { PageHeader } from "@/components/PageHeader";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My uploads",
  description: "Manage the question papers you have contributed to PaperRaj.",
  robots: { index: false, follow: false },
};

export default async function MyUploadsPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="paper paper-lined mx-auto mt-6 max-w-lg px-6 py-12 text-center">
        <p aria-hidden className="text-3xl">
          🔐
        </p>
        <h1 className="mt-3 font-display text-[1.8rem] text-ink">My uploads</h1>
        <p className="mt-2 font-serif-papr text-ink-2">
          Sign in to see the papers you contributed, and to edit or delete them. Browsing the
          library itself never requires an account.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Link href="/login?next=/my-uploads" className="btn btn-primary">
            Sign in
          </Link>
          <Link href="/signup" className="btn btn-ghost">
            Create an account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={`Signed in as ${user.fullName ?? user.email}`}
        title="My uploads"
        lead="Every paper you contribute while signed in is owned by your account — you can correct its catalogue card or remove it at any time."
      >
        <Link href="/upload" className="btn btn-primary btn-sm">
          Upload another paper
        </Link>
        <Link href="/profile" className="btn btn-ghost btn-sm">
          Edit my details
        </Link>
      </PageHeader>
      <MyUploadsList />
    </div>
  );
}
