"use client";

import { useEffect, useState } from "react";
import { formatNumber } from "@/lib/format";
import type { PublicStats } from "@/lib/papers";

export function StatsStrip({ compact = false }: { compact?: boolean }) {
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [maxUploadMb, setMaxUploadMb] = useState(50);

  useEffect(() => {
    fetch("/api/stats", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { stats?: PublicStats; maxUploadMb?: number }) => {
        if (d.stats) setStats(d.stats);
        if (d.maxUploadMb) setMaxUploadMb(d.maxUploadMb);
      })
      .catch(() => undefined);
  }, []);

  const items: { label: string; value: string }[] = stats
    ? [
        { label: "Papers in the archive", value: formatNumber(stats.approvedPapers) },
        { label: "Total uploads", value: formatNumber(stats.totalUploads) },
        { label: "Downloads served", value: formatNumber(stats.totalDownloads) },
        { label: "Contributors", value: formatNumber(stats.totalContributors) },
        ...(!compact
          ? [
              { label: "Readers registered", value: formatNumber(stats.totalUsers) },
              { label: "Appreciations", value: formatNumber(stats.totalLikes) },
            ]
          : []),
      ]
    : [];

  return (
    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 sm:gap-2">
      {(items.length > 0
        ? items
        : Array.from({ length: compact ? 4 : 6 }, () => ({ label: "·", value: "" }))
      ).map((item, i) => (
        <div key={`${item.label}-${i}`} className="shelf px-2 py-2.5 text-center sm:px-3 sm:py-3">
          {stats ? (
            <>
              <p className="font-display text-[1.2rem] font-semibold leading-none text-ink sm:text-[1.5rem]">
                {item.value}
              </p>
              <p className="smallcaps mt-1 text-[0.58rem] font-bold leading-tight text-ink-3 sm:mt-1.5 sm:text-[0.68rem]">{item.label}</p>
            </>
          ) : (
            <div className="skeleton h-9 w-full" />
          )}
        </div>
      ))}
      <p className="sr-only">Maximum file size: {maxUploadMb} MB</p>
    </div>
  );
}
