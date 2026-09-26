"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  PaperMetadataFields,
  type MetadataState,
} from "@/components/PaperMetadataFields";
import { formatBytes } from "@/lib/format";

export type EditablePaper = {
  id: string;
  fileName: string;
  uploaderName: string;
  classLevel: string | null;
  board: string | null;
  subject: string | null;
  exam: string | null;
  year: number | null;
  school: string | null;
  paperType: string | null;
  description: string | null;
  fileExt: string;
  fileSize: number;
  status: string;
};

export function EditPaperForm({
  paper,
  maxUploadMb,
  isAdmin,
}: {
  paper: EditablePaper;
  maxUploadMb: number;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [fileName, setFileName] = useState(paper.fileName);
  const [metadata, setMetadata] = useState<MetadataState>({
    uploaderName: paper.uploaderName,
    classLevel: paper.classLevel ?? "",
    board: paper.board ?? "",
    subject: paper.subject ?? "",
    exam: paper.exam ?? "",
    year: paper.year ? String(paper.year) : "",
    school: paper.school ?? "",
    paperType: paper.paperType ?? "",
    description: paper.description ?? "",
  });
  const [replacement, setReplacement] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const maxBytes = maxUploadMb * 1024 * 1024;

  function pickReplacement(next: File | null) {
    setError(null);
    if (!next) {
      setReplacement(null);
      return;
    }
    const ext = next.name.split(".").pop()?.toLowerCase() ?? "";
    if (!["pdf", "jpg", "jpeg", "png", "webp"].includes(ext)) {
      setError("This file type is not supported.");
      return;
    }
    if (next.size > maxBytes) {
      setError(`File exceeds the ${maxUploadMb} MB maximum.`);
      return;
    }
    setReplacement(next);
  }

  async function save() {
    setBusy(true);
    setError(null);
    setSaved(null);
    try {
      let response: Response;
      if (replacement) {
        const form = new FormData();
        form.append("fileName", fileName);
        form.append("file", replacement);
        Object.entries(metadata).forEach(([key, value]) => form.append(key, value));
        response = await fetch(`/api/papers/${paper.id}`, { method: "PATCH", body: form });
      } else {
        response = await fetch(`/api/papers/${paper.id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ fileName, ...metadata }),
        });
      }
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? "The change could not be saved.");
      setSaved(data.message ?? "Changes saved.");
      setReplacement(null);
      router.refresh();
      if (data.paper?.fileName) setFileName(data.paper.fileName);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The change could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-5">
      <section className="paper paper-lined p-4 sm:p-5">
        <h2 className="font-display text-[1.35rem] text-ink">File name</h2>
        <p className="mt-1 text-[0.85rem] text-ink-3">
          Renaming only changes the catalogue label — the stored document stays exactly where it
          is, so you never have to re-upload just to fix a typo.
        </p>
        <label htmlFor="edit-filename" className="label mt-3">
          File name
        </label>
        <input
          id="edit-filename"
          className="field"
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
          maxLength={180}
        />
        <p className="mt-2 text-[0.78rem] text-ink-3">
          Currently stored: {formatBytes(paper.fileSize)} · {paper.fileExt.toUpperCase()}
        </p>
      </section>

      <section className="paper p-4 sm:p-5">
        <h2 className="font-display text-[1.35rem] text-ink">Catalogue card</h2>
        <div className="mt-4">
          <PaperMetadataFields value={metadata} onChange={setMetadata} />
        </div>
      </section>

      <section className="paper p-4 sm:p-5">
        <h2 className="font-display text-[1.35rem] text-ink">
          Replace the document <span className="text-ink-3">(optional)</span>
        </h2>
        <p className="mt-1 text-[0.85rem] text-ink-3">
          Only needed if the file itself is wrong. The replacement is validated exactly like a new
          upload: PDF, JPG, JPEG, PNG or WebP, maximum {maxUploadMb} MB.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-[auto_1fr] sm:items-center">
          <label htmlFor="edit-file" className="btn btn-sm cursor-pointer">
            Choose a replacement
            <input
              id="edit-file"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              className="sr-only"
              onChange={(e) => pickReplacement(e.target.files?.[0] ?? null)}
            />
          </label>
          {replacement ? (
            <p className="text-[0.85rem] text-ink-2">
              {replacement.name} · {formatBytes(replacement.size)}
              <button
                type="button"
                className="btn btn-ghost btn-sm ml-2"
                onClick={() => setReplacement(null)}
              >
                Remove
              </button>
            </p>
          ) : (
            <p className="text-[0.85rem] text-ink-3">No replacement selected.</p>
          )}
        </div>
      </section>

      {error && (
        <p role="alert" className="paper border-seal/60 bg-[rgba(140,47,57,0.06)] px-4 py-3 text-seal">
          {error}
        </p>
      )}
      {saved && (
        <p role="status" className="paper border-moss/50 bg-[rgba(79,107,74,0.08)] px-4 py-3 text-moss">
          {saved}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void save()}>
          {busy ? "Saving…" : "Save changes"}
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => router.back()}>
          Cancel
        </button>
        {isAdmin && (
          <span className="chip chip-status ml-auto self-center">
            Librarian · editing any paper is allowed
          </span>
        )}
      </div>
    </div>
  );
}
