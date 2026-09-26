"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { DeletePaperButton } from "@/components/PaperActions";
import { EmptyState } from "@/components/Library";
import { formatBytes, formatDateTime, formatNumber } from "@/lib/format";
import type { PaperListItem } from "@/lib/papers";

export function MyUploadsList({ ownerView = false }: { ownerView?: boolean }) {
  const [items, setItems] = useState<PaperListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/papers?mine=1&sort=newest", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not load your uploads.");
      setItems(data.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load your uploads.");
      setItems([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) {
    return (
      <EmptyState
        icon="🕯️"
        title="We could not open your shelf"
        body={error}
        action={
          <button type="button" className="btn btn-primary" onClick={() => void load()}>
            Try again
          </button>
        }
      />
    );
  }

  if (items === null) {
    return (
      <div className="grid gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="paper p-4">
            <div className="skeleton h-5 w-1/2" />
            <div className="skeleton mt-3 h-4 w-1/4" />
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon="📚"
        title="Your shelf is empty"
        body="Papers you upload while signed in appear here, with edit and delete controls. Guest uploads cannot be managed later, since we cannot prove who owns them."
        action={
          <Link href="/upload" className="btn btn-primary">
            Upload your first paper
          </Link>
        }
      />
    );
  }

  return (
    <ul className="grid gap-3">
      {items.map((paper) => (
        <li key={paper.id} className="paper row-hover p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-5">
            <div className="min-w-0 flex-1">
              <h2 className="break-words font-display text-[1.15rem] leading-snug text-ink">
                <Link href={`/papers/${paper.id}`} className="hover:text-accent">
                  {paper.fileName}
                </Link>
              </h2>
              <p className="mt-1 text-[0.8rem] text-ink-3">
                {formatDateTime(paper.createdAt)} · {formatBytes(paper.fileSize)} ·{" "}
                {paper.fileExt.toUpperCase()}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className={`chip ${paper.status === "APPROVED" ? "chip-type" : "chip-status"}`}>
                  {paper.status === "APPROVED" ? "Approved" : "Pending approval"}
                </span>
                {paper.classLevel && <span className="chip">{paper.classLevel}</span>}
                {paper.subject && <span className="chip chip-subject">{paper.subject}</span>}
                {paper.paperType && <span className="chip">{paper.paperType}</span>}
              </div>
              <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[0.76rem] text-ink-3">
                <span>{formatNumber(paper.downloadCount)} downloads</span>
                <span>👍 {formatNumber(paper.likeCount)}</span>
                <span>👎 {formatNumber(paper.dislikeCount)}</span>
                <span>💬 {formatNumber(paper.commentCount)} comments</span>
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:items-stretch">
              <Link href={`/papers/${paper.id}`} className="btn btn-sm">
                View
              </Link>
              <Link href={`/papers/${paper.id}/edit`} className="btn btn-sm">
                Edit
              </Link>
              <DeletePaperButton paperId={paper.id} fileName={paper.fileName} />
              {!ownerView && paper.status !== "APPROVED" && (
                <p className="max-w-[10rem] text-[0.7rem] leading-snug text-ink-3">
                  Waiting for a librarian to approve it.
                </p>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
