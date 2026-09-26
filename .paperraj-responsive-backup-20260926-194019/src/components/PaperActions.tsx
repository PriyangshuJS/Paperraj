"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { REPORT_REASONS } from "@/lib/site";
import { useSession } from "@/lib/useSession";

export function VoteBox({
  paperId,
  likeCount,
  dislikeCount,
  myVote,
}: {
  paperId: string;
  likeCount: number;
  dislikeCount: number;
  myVote: number;
}) {
  const { user } = useSession();
  const [state, setState] = useState({ likeCount, dislikeCount, myVote });
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function vote(value: number) {
    if (!user) {
      setNotice("Please sign in to vote — it keeps the archive honest.");
      return;
    }
    setBusy(true);
    setNotice(null);
    const next = state.myVote === value ? 0 : value;
    try {
      const res = await fetch(`/api/papers/${paperId}/vote`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ value: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNotice(data.error ?? "Your vote could not be saved.");
        return;
      }
      setState({
        likeCount: data.likeCount ?? state.likeCount,
        dislikeCount: data.dislikeCount ?? state.dislikeCount,
        myVote: data.myVote ?? 0,
      });
    } catch {
      setNotice("Network trouble — your vote was not saved.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        className={`btn btn-sm ${state.myVote === 1 ? "btn-accent" : ""}`}
        disabled={busy}
        aria-pressed={state.myVote === 1}
        onClick={() => void vote(1)}
        title="Thumbs up — this paper helped me"
      >
        👍 Helpful <span className="tabular-nums">{state.likeCount}</span>
      </button>
      <button
        type="button"
        className={`btn btn-sm ${state.myVote === -1 ? "btn-danger" : ""}`}
        disabled={busy}
        aria-pressed={state.myVote === -1}
        onClick={() => void vote(-1)}
        title="Thumbs down — something is wrong with this paper"
      >
        👎 Not useful <span className="tabular-nums">{state.dislikeCount}</span>
      </button>
      {state.myVote !== 0 && (
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          disabled={busy}
          onClick={() => void vote(0)}
        >
          Remove my vote
        </button>
      )}
      {notice && (
        <p role="status" className="text-[0.8rem] text-seal">
          {notice}
        </p>
      )}
    </div>
  );
}

export function ReportDialog({ paperId }: { paperId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>(REPORT_REASONS[0]);
  const [details, setDetails] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit() {
    setStatus("sending");
    try {
      const res = await fetch(`/api/papers/${paperId}/report`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reason, details }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Report failed");
      setStatus("sent");
      setMessage(data.message ?? "Thank you — a librarian will review this shortly.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "The report could not be sent.");
    }
  }

  return (
    <>
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(true)}>
        ⚑ Report this paper
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-[rgba(36,26,18,0.45)] p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="report-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="paper paper-lined w-full max-w-md p-5 animate-rise">
            <h2 id="report-title" className="font-display text-[1.4rem] text-ink">
              Report a problem
            </h2>
            {status === "sent" ? (
              <div className="grid gap-3">
                <p className="font-serif-papr text-ink-2">{message}</p>
                <button type="button" className="btn btn-primary" onClick={() => setOpen(false)}>
                  Close
                </button>
              </div>
            ) : (
              <div className="mt-3 grid gap-3">
                <div>
                  <label htmlFor="report-reason" className="label">
                    Reason
                  </label>
                  <select
                    id="report-reason"
                    className="field"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  >
                    {REPORT_REASONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="report-details" className="label">
                    Details (optional)
                  </label>
                  <textarea
                    id="report-details"
                    className="field"
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Anything the librarian should know…"
                  />
                </div>
                {status === "error" && <p className="text-[0.85rem] text-seal">{message}</p>}
                <div className="flex justify-end gap-2">
                  <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={status === "sending"}
                    onClick={() => void submit()}
                  >
                    {status === "sending" ? "Sending…" : "Send report"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export function DeletePaperButton({
  paperId,
  fileName,
  label = "Delete",
}: {
  paperId: string;
  fileName: string;
  label?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmDelete() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/papers/${paperId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Delete failed");
      router.push("/my-uploads");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "The paper could not be deleted.");
      setBusy(false);
    }
  }

  return (
    <>
      <button type="button" className="btn btn-danger btn-sm" onClick={() => setOpen(true)}>
        🗑️ {label}
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-[rgba(36,26,18,0.45)] p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="paper paper-lined w-full max-w-md p-5 animate-rise">
            <h2 id="delete-title" className="font-display text-[1.4rem] text-ink">
              Are you sure you want to permanently delete this paper?
            </h2>
            <p className="mt-2 font-serif-papr text-[0.95rem] text-ink-2">
              <strong className="break-all">{fileName}</strong> and its stored file will be
              removed from the archive. This cannot be undone.
            </p>
            {error && <p className="mt-3 text-[0.85rem] text-seal">{error}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className="btn" onClick={() => setOpen(false)} disabled={busy}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => void confirmDelete()}
                disabled={busy}
              >
                {busy ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
