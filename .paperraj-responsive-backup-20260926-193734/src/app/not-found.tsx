import Link from "next/link";

export default function NotFound() {
  return (
    <div className="paper paper-lined mx-auto mt-6 max-w-xl px-6 py-14 text-center">
      <p className="stamp mx-auto inline-block text-seal">404</p>
      <h1 className="mt-4 font-display text-[2rem] font-semibold text-ink">
        This shelf is empty
      </h1>
      <p className="mt-3 font-serif-papr text-[1rem] leading-relaxed text-ink-2">
        The paper you were looking for is not in the archive — it may have been removed, renamed,
        or it is still waiting for a librarian&apos;s approval.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Link href="/papers" className="btn btn-primary">
          Browse the library
        </Link>
        <Link href="/upload" className="btn">
          Upload a paper
        </Link>
      </div>
    </div>
  );
}
