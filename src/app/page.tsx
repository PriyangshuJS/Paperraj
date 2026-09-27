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
    <div className="grid gap-6 sm:gap-8">
      <section className="paper paper-lined overflow-hidden">
        <div className="relative p-4 sm:p-7 lg:p-8">
          <div className="max-w-3xl">
            <p className="smallcaps text-[0.68rem] font-bold text-wood-2 sm:text-[0.74rem]">
              School question paper archive
            </p>
            <h1 className="mt-2 max-w-2xl font-display text-[2rem] font-semibold leading-[1.02] text-ink sm:text-[2.8rem] lg:text-[3.15rem]">
              Find the paper you need.
            </h1>
            <p className="mt-3 max-w-2xl font-serif-papr text-[1rem] leading-relaxed text-ink-2 sm:text-[1.08rem]">
              Browse, view and download school examination papers — or share one with the next student.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              <Link
                href="#library"
                className="btn btn-primary col-span-2 !min-h-[42px] sm:col-span-1 sm:min-w-[150px]"
              >
                📚 Browse papers
              </Link>
              <Link
                href="/upload"
                className="btn col-span-1 !min-h-[42px] sm:min-w-[150px]"
              >
                📤 Upload a paper
              </Link>
              <Link
                href="/year-papers"
                className="btn btn-ghost col-span-1 !min-h-[42px] sm:min-w-[120px]"
              >
                Year papers
              </Link>
            </div>

            <p className="mt-3 text-[0.74rem] text-ink-3 sm:text-[0.8rem]">
              No account needed to browse or download · PDF, JPG, PNG and WebP · Up to 50 MB
            </p>
          </div>
        </div>
      </section>

      <section id="library" aria-label="Paper library" className="scroll-mt-20">
        <Library syncUrl />
      </section>

      <section className="paper paper-lined p-3.5 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="smallcaps text-[0.68rem] font-bold text-ink-3">Archive at a glance</p>
            <p className="mt-0.5 font-serif-papr text-sm text-ink-2">Growing with every contribution.</p>
          </div>
          <Link href="/statistics" className="link-ink shrink-0 text-sm">Statistics</Link>
        </div>
        <div className="mt-3">
          <StatsStrip compact />
        </div>
      </section>
    </div>
  );
}
