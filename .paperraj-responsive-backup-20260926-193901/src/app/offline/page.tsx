import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Offline",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <div className="paper paper-lined mx-auto mt-6 max-w-xl px-6 py-14 text-center">
      <p aria-hidden className="text-4xl">
        🕯️
      </p>
      <h1 className="mt-4 font-display text-[2rem] font-semibold text-ink">
        The lamps are out
      </h1>
      <p className="mt-3 font-serif-papr text-[1rem] leading-relaxed text-ink-2">
        You are offline right now. Pages you have already opened are still available from the
        app cache — reconnect to search the full archive.
      </p>
    </div>
  );
}
