import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "About PaperRaj",
  description: SITE.description,
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="About"
        title="About PaperRaj"
        lead={SITE.description}
      />

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="paper paper-lined grid gap-4 p-5 sm:p-6">
          <p className="font-serif-papr text-[1.05rem] italic text-ink-2">“{SITE.tagline}”</p>
          <p className="text-[0.95rem] leading-relaxed text-ink-2">
            PaperRaj exists because revision is hard enough without hunting for a past paper. One
            student&apos;s neatly scanned question paper is another student&apos;s saving grace the
            night before an exam — so we built a place where those papers can live, be found, and
            be trusted.
          </p>
          <p className="text-[0.95rem] leading-relaxed text-ink-2">
            The archive is open to everyone. You never need an account to browse, search, filter,
            read or download. If you contribute while signed in, the paper stays yours: you can
            correct its details or remove it whenever you like. Guests may upload too — we simply
            ask for a name so the donation can be credited.
          </p>
          <p className="text-[0.95rem] leading-relaxed text-ink-2">
            A librarian keeps the shelves tidy: pending uploads are approved, reports are
            investigated, and comments are moderated so the margin stays useful.
          </p>
        </div>

        <aside className="grid content-start gap-4">
          <div className="paper p-4">
            <h2 className="smallcaps mb-2 text-[0.76rem] font-bold text-ink-3">How it works</h2>
            <ol className="grid gap-2 text-[0.9rem] text-ink-2">
              <li>1 · Anyone browses, searches and downloads freely.</li>
              <li>2 · Anyone can upload a paper, with or without an account.</li>
              <li>3 · Signed-in contributors own their uploads and can edit or delete them.</li>
              <li>4 · Readers vote and comment to surface the best papers.</li>
              <li>5 · The librarian approves pending papers and moderates reports.</li>
            </ol>
          </div>
          <div className="paper p-4">
            <h2 className="smallcaps mb-2 text-[0.76rem] font-bold text-ink-3">Go further</h2>
            <ul className="grid gap-1.5 text-[0.9rem]">
              <li>
                <Link href="/papers" className="link-ink">
                  Browse the library
                </Link>
              </li>
              <li>
                <Link href="/upload" className="link-ink">
                  Upload a paper
                </Link>
              </li>
              <li>
                <Link href="/contact" className="link-ink">
                  Contact the owner
                </Link>
              </li>
              <li>
                <Link href="/statistics" className="link-ink">
                  Platform statistics
                </Link>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
