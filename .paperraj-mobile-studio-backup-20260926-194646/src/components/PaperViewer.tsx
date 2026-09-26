"use client";

import { useEffect, useRef, useState } from "react";

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];

export function PaperViewer({
  paperId,
  fileExt,
  fileName,
  fileSize,
}: {
  paperId: string;
  fileExt: string;
  fileName: string;
  fileSize: string;
}) {
  const [open, setOpen] = useState(() =>
    typeof window !== "undefined" && window.location.hash === "#paper-reader"
  );
  const [failed, setFailed] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const isImage = IMAGE_EXTENSIONS.includes(fileExt.toLowerCase());
  const isMultiPage = fileExt.toLowerCase() === "images";

  useEffect(() => {
    if (!open || !isMultiPage) {
      return;
    }

    let cancelled = false;

    fetch(`/api/papers/${paperId}/view?info=1`)
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load page count.");
        return response.json();
      })
      .then((data: { totalPages?: number }) => {
        if (!cancelled) {
          const count = Number(data.totalPages);
          setTotalPages(Number.isFinite(count) && count > 0 ? count : 1);
        }
      })
      .catch(() => {
        if (!cancelled) setTotalPages(1);
      });

    return () => {
      cancelled = true;
    };
  }, [open, isMultiPage, paperId]);

  const src = isMultiPage
    ? `/api/papers/${paperId}/view?page=${page}`
    : `/api/papers/${paperId}/view`;

  function previousPage() {
    setFailed(false);
    setPage((current) => Math.max(1, current - 1));
  }

  function nextPage() {
    setFailed(false);
    setPage((current) => Math.min(totalPages, current + 1));
  }

  function handleTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    touchStartX.current = event.touches[0]?.clientX ?? null;
    touchStartY.current = event.touches[0]?.clientY ?? null;
  }

  function handleTouchEnd(event: React.TouchEvent<HTMLDivElement>) {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
    const endY = event.changedTouches[0]?.clientY ?? touchStartY.current;

    const deltaX = endX - touchStartX.current;
    const deltaY = endY - touchStartY.current;

    touchStartX.current = null;
    touchStartY.current = null;

    // Ignore mostly vertical scrolling.
    if (Math.abs(deltaX) < 50 || Math.abs(deltaX) < Math.abs(deltaY)) return;

    if (deltaX < 0) {
      nextPage();
    } else {
      previousPage();
    }
  }

  if (!open) {
    return (
      <button type="button" className="btn w-full" onClick={() => setOpen(true)}>
        👁️ View ({fileSize})
      </button>
    );
  }

  return (
    <figure className="paper-viewer grid gap-3">
      <div className="paper-viewer-head flex flex-wrap items-center justify-between gap-2">
        <figcaption className="smallcaps text-[0.74rem] font-bold text-ink-3">
          {isMultiPage
            ? `Image reader · Page ${page} of ${totalPages}`
            : isImage
              ? "Image reader"
              : "PDF reader"}{" "}
          · {fileName}
        </figcaption>

        <div className="flex flex-wrap gap-2">
          <a
            href={`/api/papers/${paperId}/download`}
            className="btn btn-ghost btn-sm"
          >
            Download
          </a>

          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setOpen(false)}
          >
            Close reader
          </button>
        </div>
      </div>

      {failed ? (
        <div className="paper grid place-items-center gap-2 px-5 py-12 text-center">
          <p className="font-serif-papr text-ink-2">
            This page could not be displayed in the reader.
          </p>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setFailed(false)}
          >
            Try again
          </button>

          <a
            href={`/api/papers/${paperId}/download`}
            className="link-ink text-sm"
          >
            Download the paper instead
          </a>
        </div>
      ) : isMultiPage ? (
        <>
          <div
            className="relative overflow-hidden rounded-sm border border-[var(--edge-strong)] bg-white shadow-[var(--shadow-paper)]"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div className="flex min-h-[60vh] items-center justify-center bg-[#f8f5ec] p-2 sm:p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={src}
                src={src}
                alt={`${fileName} — page ${page} of ${totalPages}`}
                className="max-h-[75vh] w-auto max-w-full select-none object-contain"
                draggable={false}
                onError={() => setFailed(true)}
              />
            </div>

            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-3">
              <span className="rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white">
                Page {page} of {totalPages}
              </span>
            </div>
          </div>

          <div className="paper-viewer-pagination flex items-center justify-center gap-3">
            <button
              type="button"
              className="btn btn-ghost"
              disabled={page <= 1}
              onClick={previousPage}
            >
              ← Previous
            </button>

            <span className="min-w-[80px] text-center text-sm text-ink-3">
              {page} / {totalPages}
            </span>

            <button
              type="button"
              className="btn btn-ghost"
              disabled={page >= totalPages}
              onClick={nextPage}
            >
              Next →
            </button>
          </div>

          <p className="text-center text-[0.75rem] text-ink-3">
            Swipe left or right on the page to navigate.
          </p>
        </>
      ) : isImage ? (
        <div className="overflow-auto rounded-sm border border-[var(--edge-strong)] bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={`${fileName} — full preview`}
            className="mx-auto max-h-[75vh] w-auto object-contain"
            onError={() => setFailed(true)}
          />
        </div>
      ) : (
        <object
          data={src}
          type="application/pdf"
          aria-label={`${fileName} PDF preview`}
          className="h-[75vh] w-full rounded-sm border border-[var(--edge-strong)] bg-white"
        >
          <div className="p-4 text-center text-ink-2">
            Your browser cannot display PDFs inline.
            <a
              href={`/api/papers/${paperId}/download`}
              className="link-ink ml-1"
            >
              Download this paper
            </a>
            .
          </div>
        </object>
      )}
    </figure>
  );
}
