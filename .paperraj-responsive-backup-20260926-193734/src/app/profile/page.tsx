import type { Metadata } from "next";
import Link from "next/link";
import { ProfileForm } from "@/components/ProfileForm";
import { PageHeader } from "@/components/PageHeader";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your profile",
  description: "Manage the details PaperRaj remembers about you.",
  robots: { index: false, follow: false },
};

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="paper paper-lined mx-auto mt-6 max-w-lg px-6 py-12 text-center">
        <p aria-hidden className="text-3xl">
          🔐
        </p>
        <h1 className="mt-3 font-display text-[1.8rem] text-ink">Your profile</h1>
        <p className="mt-2 font-serif-papr text-ink-2">
          Sign in to manage the name and school that PaperRaj pre-fills on your uploads.
        </p>
        <Link href="/login?next=/profile" className="btn btn-primary mt-5">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Reader record"
        title="Your profile"
        lead="Keep this card up to date and uploading becomes a two-minute job."
      />
      <ProfileForm user={user} />
    </div>
  );
}
