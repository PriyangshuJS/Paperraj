"use client";

import { useState } from "react";

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
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const isImage = ["jpg", "jpeg", "png", "webp"].includes(fileExt);
  const src = `/api/papers/${paperId}/view`;

  if (!open) {
    return (
      <button type="button" className="btn w-full" onClick={() => setOpen(true)}>
        👁️ Open the paper in the reader ({fileSize})
      </button>
    );
  }

  return (
    <figure className="grid gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <figcaption className="smallcaps text-[0.74rem] font-bold text-ink-3">
          {isImage ? "Image reader" : "PDF reader"} · {fileName}
        </figcaption>
        <div className="flex gap-2">
          <a href={src} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">
            Open in new tab
          </a>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>
            Close reader
          </button>
        </div>
      </div>

      {failed ? (
        <div className="paper grid place-items-center gap-2 px-5 py-12 text-center">
          <p className="font-serif-papr text-ink-2">
            This document could not be displayed in the reader.
          </p>
          <a href={`/api/papers/${paperId}/download`} className="btn btn-primary btn-sm">
            Download it instead
          </a>
        </div>
      ) : isImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={`${fileName} — full preview`}
          className="mx-auto max-h-[75vh] w-auto rounded-sm border border-[var(--edge-strong)] bg-white shadow-[var(--shadow-paper)]"
          onError={() => setFailed(true)}
        />
      ) : (
        <object
          data={src}
          type="application/pdf"
          aria-label={`${fileName} PDF preview`}
          className="h-[75vh] w-full rounded-sm border border-[var(--edge-strong)] bg-white"
        >
          <div className="p-4 text-center text-ink-2">
            Your browser cannot display PDFs inline.
            <a href={`/api/papers/${paperId}/download`} className="link-ink ml-1">
              Download this paper
            </a>
            .
          </div>
        </object>
      )}
    </figure>
  );
}
