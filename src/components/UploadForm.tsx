"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  EMPTY_METADATA,
  PaperMetadataFields,
  useRememberedGuest,
  type MetadataState,
} from "@/components/PaperMetadataFields";
import { formatBytes } from "@/lib/format";
import { useSession } from "@/lib/useSession";

const ACCEPTED = ".pdf,.jpg,.jpeg,.png,.webp";
const GUEST_KEY = "paperraj.guest";

export function UploadForm({
  maxUploadMb,
  autoApproval,
  suggestions,
}: {
  maxUploadMb: number;
  autoApproval: boolean;
  suggestions: {
    classLevel?: string[];
    board?: string[];
    subject?: string[];
    exam?: string[];
    school?: string[];
  };
}) {
  const { user, loading } = useSession();
  const { remembered, remember } = useRememberedGuest();
  const [files, setFiles] = useState<File[]>([]);
  const [metadata, setMetadata] = useState<MetadataState>(EMPTY_METADATA);
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [uploadedId, setUploadedId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setMetadata((prev) => ({
        ...prev,
        uploaderName: prev.uploaderName || user.fullName || "",
        school: prev.school || user.school || "",
      }));
    } else if (remembered) {
      setMetadata((prev) => ({
        ...prev,
        uploaderName: remembered.uploaderName || prev.uploaderName,
        classLevel: prev.classLevel || remembered.classLevel || "",
        board: prev.board || remembered.board || "",
        school: prev.school || remembered.school || "",
      }));
    }
  }, [user, remembered]);

  const maxBytes = maxUploadMb * 1024 * 1024;

  function pickFiles(selected: FileList | File[]) {
    setError(null);
    setStatus("idle");
    setUploadedId(null);

    const selectedFiles = Array.from(selected);

    if (selectedFiles.length === 0) {
      setFiles([]);
      return;
    }

    const hasPdf = selectedFiles.some(
      (file) => file.name.split(".").pop()?.toLowerCase() === "pdf",
    );

    if (hasPdf && selectedFiles.length > 1) {
      setFiles([]);
      setError("A PDF must be uploaded by itself. For multiple pages, select up to 10 images.");
      return;
    }

    if (selectedFiles.length > 10) {
      setFiles([]);
      setError("You can upload a maximum of 10 images at a time.");
      return;
    }

    for (const file of selectedFiles) {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";

      if (!["pdf", "jpg", "jpeg", "png", "webp"].includes(ext)) {
        setFiles([]);
        setError(`"${file.name}" is not a supported file type.`);
        return;
      }

      if (file.size > maxBytes) {
        setFiles([]);
        setError(`"${file.name}" exceeds the ${maxUploadMb} MB maximum.`);
        return;
      }
    }

    const totalSize = selectedFiles.reduce((sum, file) => sum + file.size, 0);
    const maxTotalBytes = maxBytes * 10;

    if (totalSize > maxTotalBytes) {
      setFiles([]);
      setError(`The selected images are too large. Maximum total upload size is ${maxUploadMb * 10} MB.`);
      return;
    }

    setFiles(selectedFiles);
  }

  async function submit() {
    if (files.length === 0) {
      setError("Please choose a file to upload.");
      return;
    }
    if (!user && !metadata.uploaderName.trim()) {
      setError("Please tell us your name so the upload can be credited.");
      return;
    }
    setStatus("uploading");
    setError(null);
    setProgress(5);

    const form = new FormData();

    for (const file of files) {
      form.append("files", file);
    }
    form.append("uploaderName", metadata.uploaderName);
    form.append("classLevel", metadata.classLevel);
    form.append("board", metadata.board);
    form.append("subject", metadata.subject);
    form.append("exam", metadata.exam);
    form.append("year", metadata.year);
    form.append("school", metadata.school);
    form.append("paperType", metadata.paperType);
    form.append("description", metadata.description);

    try {
      const res = await new Promise<Response>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/papers");
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            setProgress(Math.round((event.loaded / event.total) * 92) + 5);
          }
        };
        xhr.onload = () => resolve(new Response(xhr.response, { status: xhr.status }));
        xhr.onerror = () => reject(new Error("network"));
        xhr.ontimeout = () => reject(new Error("timeout"));
        xhr.send(form);
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "The upload failed. Please try again.");
      }
      setProgress(100);
      setStatus("done");
      setMessage(data.message ?? "Thank you!");
      setUploadedId(data.paper?.id ?? null);
      if (!user) remember(metadata);
      setFiles([]);
      if (inputRef.current) inputRef.current.value = "";
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "The upload failed. Please try again.");
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
      <div className="grid gap-5">
        <section className="paper paper-lined p-4 sm:p-5" aria-labelledby="upload-file-title">
          <h2 id="upload-file-title" className="font-display text-[1.35rem] text-ink">
            1 · The document
          </h2>
          <p className="mt-1 text-[0.85rem] text-ink-3">
            Accepted: PDF, JPG, JPEG, PNG, WebP. Maximum file size: {maxUploadMb} MB.
          </p>

          <div
            role="button"
            tabIndex={0}
            aria-describedby="upload-file-help"
            className={`mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-sm border-2 border-dashed px-4 py-9 text-center transition-colors ${
              dragging
                ? "border-accent bg-[rgba(53,86,122,0.06)]"
                : "border-[var(--edge-strong)] bg-[rgba(255,253,247,0.6)] hover:border-wood-2"
            }`}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                inputRef.current?.click();
              }
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              pickFiles(e.dataTransfer.files);
            }}
          >
            <span aria-hidden className="text-3xl">
              📄
            </span>
            <p className="font-serif-papr text-[1.02rem] text-ink">
              {files.length === 0
                ? "Drop a paper here, or tap to choose"
                : files.length === 1
                  ? files[0].name
                  : `${files.length} pages selected`}
            </p>
            <p id="upload-file-help" className="text-[0.8rem] text-ink-3">
              {files.length === 0
                ? `PDF, JPG, JPEG, PNG or WebP · up to ${maxUploadMb} MB each`
                : files.length === 1
                  ? `${formatBytes(files[0].size)} · ready to be catalogued`
                  : `${files.length} images · pages will be shown in this order`}
            </p>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED}
              multiple
              className="sr-only"
              onChange={(e) => {
                if (e.target.files) pickFiles(e.target.files);
              }}
            />
          </div>

          {files.length > 0 && (
            <div className="mt-4 grid gap-3">
              {files.map((file, index) => (
                <div
                  key={`${file.name}-${file.lastModified}-${index}`}
                  className="flex items-center gap-3 rounded-sm border border-[var(--edge)] bg-[rgba(255,253,247,0.7)] p-2"
                >
                  {file.type.startsWith("image/") ? (
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Page ${index + 1}`}
                      className="h-16 w-12 rounded-sm border border-[var(--edge)] object-cover"
                      onLoad={(event) => URL.revokeObjectURL(event.currentTarget.src)}
                    />
                  ) : (
                    <div className="flex h-16 w-12 items-center justify-center rounded-sm border border-[var(--edge)] bg-parchment-2 text-xl">
                      📄
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-ink">
                      {files.length > 1 ? `Page ${index + 1}` : "Document"}
                    </p>
                    <p className="truncate text-[0.78rem] text-ink-3">{file.name}</p>
                    <p className="text-[0.75rem] text-ink-3">{formatBytes(file.size)}</p>
                  </div>

                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      setFiles((current) => current.filter((_, i) => i !== index));
                      if (inputRef.current) inputRef.current.value = "";
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}

              {files.length > 1 && (
                <p className="text-[0.78rem] text-ink-3">
                  {files.length} images selected. Their current order will be used as the paper's
                  page order.
                </p>
              )}
            </div>
          )}
        </section>

        <section className="paper p-4 sm:p-5" aria-labelledby="upload-meta-title">
          <h2 id="upload-meta-title" className="font-display text-[1.35rem] text-ink">
            2 · The catalogue card
          </h2>
          <p className="mt-1 text-[0.85rem] text-ink-3">
            Only the uploader name is required. Everything else helps the next reader find your
            paper.
          </p>
          <div className="mt-4">
            <PaperMetadataFields
              value={metadata}
              onChange={setMetadata}
              suggestions={suggestions}
              requireUploader={!user}
            />
          </div>
        </section>

        {error && (
          <div
            role="alert"
            className="paper border-seal/60 bg-[rgba(140,47,57,0.06)] px-4 py-3 text-[0.92rem] text-seal"
          >
            {error}
            {status === "error" && (
              <div className="mt-2">
                <button type="button" className="btn btn-sm" onClick={() => void submit()}>
                  Try the upload again
                </button>
              </div>
            )}
          </div>
        )}

        {status === "uploading" && (
          <div className="paper px-4 py-3">
            <p className="text-[0.9rem] text-ink-2">
              Placing your paper on the shelf… {progress}%
            </p>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-parchment-2">
              <div
                className="h-full rounded-full bg-wood transition-[width] duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {status === "done" && (
          <div
            role="status"
            className="paper border-moss/50 bg-[rgba(79,107,74,0.08)] px-4 py-4 animate-rise"
          >
            <p className="font-display text-[1.2rem] text-ink">{message}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {uploadedId && (
                <>
                  <Link href={`/papers/${uploadedId}`} className="btn btn-primary btn-sm">
                    View the paper
                  </Link>
                  {!user && (
                    <Link href="/signup" className="btn btn-sm">
                      Create an account to manage it
                    </Link>
                  )}
                </>
              )}
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setStatus("idle");
                  setMessage("");
                  setMetadata((prev) => ({ ...EMPTY_METADATA, uploaderName: prev.uploaderName, school: prev.school }));
                }}
              >
                Upload another
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="btn btn-primary !min-h-[50px] !px-6"
            disabled={status === "uploading" || files.length === 0}
            onClick={() => void submit()}
          >
            {status === "uploading"
              ? "Uploading…"
              : files.length > 1
                ? `Submit ${files.length} pages to the library`
                : "Submit to the library"}
          </button>
          {!loading && !user && (
            <p className="text-[0.82rem] text-ink-3">
              Uploading as a guest.{" "}
              <Link href="/login" className="link-ink">
                Sign in
              </Link>{" "}
              to keep edit and delete rights.
            </p>
          )}
        </div>
      </div>

      <aside className="grid content-start gap-4">
        <section className="paper p-4">
          <h2 className="smallcaps mb-2 text-[0.76rem] font-bold text-ink-3">Before you upload</h2>
          <ul className="grid gap-2 text-[0.88rem] leading-relaxed text-ink-2">
            <li>PDF uploads are single documents; image uploads can contain up to 10 pages.</li>
            <li>Maximum file size: {maxUploadMb} MB per file.</li>
            <li>For image papers, select the pages in the order they should appear.</li>
            <li>
              {autoApproval
                ? "Auto approval is ON, so approved papers appear in the library immediately."
                : "Auto approval is OFF, so a librarian checks every paper before it goes public."}
            </li>
            <li>Upload only papers you have the right to share.</li>
          </ul>
        </section>
        <section className="paper p-4">
          <h2 className="smallcaps mb-2 text-[0.76rem] font-bold text-ink-3">Naming helps</h2>
          <p className="text-[0.88rem] leading-relaxed text-ink-2">
            A good filename makes a paper findable, e.g.{" "}
            <em className="font-serif-papr">Chemistry IX Half Yearly 2026.pdf</em> or{" "}
            <em className="font-serif-papr">Maths Class 10 Specimen 2025.pdf</em>.
          </p>
        </section>
      </aside>
    </div>
  );
}

export { GUEST_KEY };
