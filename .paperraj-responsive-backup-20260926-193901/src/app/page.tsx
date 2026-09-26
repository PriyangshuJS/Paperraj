import Link from "next/link";
import type { Metadata } from "next";
import { Library } from "@/components/Library";
import { StatsStrip } from "@/components/StatsStrip";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "PaperRaj — School Question Papers",
  description: SITE.description,
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <div className="grid gap-8">
      {/* ------------------------------------------------ hero */}
      <section className="relative overflow-hidden rounded-[4px] border border-[var(--edge-strong)]">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(700px 320px at 8% -10%, rgba(255,253,246,0.95), transparent 65%), radial-gradient(600px 400px at 100% 110%, rgba(53,86,122,0.1), transparent 60%)",
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(115deg, rgba(122,83,48,0.05) 0 2px, transparent 2px 9px)",
          }}
        />
        <div className="relative grid gap-6 p-5 sm:p-8 lg:grid-cols-[1.35fr_1fr] lg:items-center lg:gap-10">
          <div>
            <p className="smallcaps text-[0.74rem] font-bold text-wood-2">
              Est. archive · open to every student
            </p>
            <h2 className="mt-2 font-display text-[2.4rem] font-semibold leading-[1.05] text-ink sm:text-[3.1rem]">
              An ancient library,
              <br />
              <span className="text-accent">redesigned for the future.</span>
            </h2>
            <p className="mt-4 max-w-xl font-serif-papr text-[1.05rem] leading-relaxed text-ink-2">
              {SITE.description}
            </p>
            <p className="mt-2 font-serif-papr text-[1.05rem] italic text-ink-3">
              “{SITE.tagline}”
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link href="/upload" className="btn btn-primary">
                📤 Upload a paper
              </Link>
              <Link href="#library" className="btn">
                📚 Browse the library
              </Link>
              <Link href="/year-papers" className="btn btn-ghost">
                Year papers
              </Link>
            </div>
            <p className="mt-4 text-[0.78rem] text-ink-3">
              No account needed to browse, search or download. Maximum file size: 50 MB · PDF,
              JPG, PNG, WebP.
            </p>
          </div>

          <div className="grid gap-3">
            <StatsStrip />
            <div className="paper px-4 py-4">
              <p className="smallcaps mb-2 text-[0.7rem] font-bold text-ink-3">
                Catalogues
              </p>
              <ul className="flex flex-wrap gap-1.5">
                {[
                  { href: "/subjects", label: "Subjects" },
                  { href: "/classes", label: "Classes" },
                  { href: "/boards", label: "Boards" },
                  { href: "/year-papers", label: "Year Papers" },
                  { href: "/specimen-papers", label: "Specimen Papers" },
                  { href: "/teachers", label: "Teachers" },
                ].map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="chip">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ library */}
      <section id="library" aria-label="Paper library" className="scroll-mt-24">
        <Library syncUrl />
      </section>

      {/* ------------------------------------------------ about */}
      <section className="paper paper-lined p-5 sm:p-8">
        <h2 className="font-display text-[1.7rem] font-semibold text-ink sm:text-[2rem]">
          About PaperRaj
        </h2>
        <div className="mt-3 grid gap-5 md:grid-cols-[1.4fr_1fr]">
          <div className="grid gap-3">
            <p className="font-serif-papr text-[1.02rem] leading-relaxed text-ink-2">
              {SITE.description}
            </p>
            <p className="font-serif-papr text-[1.02rem] italic text-ink-3">“{SITE.tagline}”</p>
            <p className="text-[0.92rem] leading-relaxed text-ink-2">
              Every paper here was contributed by a student, a teacher or an archivist who
              wanted the next batch to have an easier time revising. Browse freely — searching,
              filtering and downloading never require an account. Sign in only when you want
              PaperRaj to remember your uploads, so you can edit or remove them later.
            </p>
          </div>
          <ul className="grid content-start gap-2 text-[0.9rem] text-ink-2">
            {[
              "Browse, search, filter, view and download as a guest",
              "Upload as a guest or with an account",
              "Year Papers and Specimen Papers sections",
              "In-browser PDF and image viewing",
              "Comments, likes and reports keep the archive clean",
              "Installable on your phone as an app",
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <span aria-hidden className="text-gold">
                  ❧
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
