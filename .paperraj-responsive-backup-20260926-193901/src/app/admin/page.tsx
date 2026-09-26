import type { Metadata } from "next";
import Link from "next/link";
import { AdminDashboard } from "@/components/AdminDashboard";
import { PageHeader } from "@/components/PageHeader";
import { AuthForm } from "@/components/AuthForm";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Librarian desk",
  description: "PaperRaj administration area.",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="grid gap-5">
        <div className="mx-auto w-full max-w-md text-center">
          <p className="smallcaps text-[0.74rem] font-bold text-wood-2">Restricted wing</p>
          <h1 className="mt-1 font-display text-[2rem] font-semibold text-ink">
            The Librarian&apos;s Desk
          </h1>
          <p className="mt-2 font-serif-papr text-ink-2">
            This area belongs to the keeper of the archive. Please sign in with the administrator
            account.
          </p>
        </div>
        <AuthForm mode="login" next="/admin" />
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="paper paper-lined mx-auto mt-6 max-w-lg px-6 py-12 text-center">
        <p aria-hidden className="text-3xl">
          🔒
        </p>
        <h1 className="mt-3 font-display text-[1.7rem] text-ink">Administrator access required</h1>
        <p className="mt-2 font-serif-papr text-ink-2">
          Your account is a reader account. The librarian&apos;s desk is reserved for the owner of
          the archive.
        </p>
        <Link href="/" className="btn btn-primary mt-5">
          Back to the library
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={`Librarian · ${user.email}`}
        title="Librarian's desk"
        lead="Approve contributions, moderate reports and comments, and keep the archive in good order."
      />
      <AdminDashboard />
    </div>
  );
}
