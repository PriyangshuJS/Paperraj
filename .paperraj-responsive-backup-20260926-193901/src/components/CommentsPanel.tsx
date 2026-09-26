"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { formatDateTime } from "@/lib/format";
import { useSession } from "@/lib/useSession";

type CommentItem = {
  id: string;
  body: string;
  authorName: string;
  userId: string;
  createdAt: string;
};

export function CommentsPanel({ paperId }: { paperId: string }) {
  const { user } = useSession();
  const [comments, setComments] = useState<CommentItem[] | null>(null);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/papers/${paperId}/comments`, { cache: "no-store" });
      const data = await res.json();
      setComments(data.comments ?? []);
    } catch {
      setComments([]);
    }
  }, [paperId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function submit() {
    if (!body.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/papers/${paperId}/comments`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Comment failed");
      setBody("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "The comment could not be posted.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-label="Comments" className="paper p-4 sm:p-5">
      <h2 className="font-display text-[1.35rem] text-ink">Reader&apos;s margin</h2>
      <p className="mt-1 text-[0.85rem] text-ink-3">
        Questions, corrections and clarifications about this paper. Anyone can read; signing in
        keeps the margin free of spam.
      </p>

      {user ? (
        <div className="mt-4 grid gap-2">
          <label htmlFor="comment-body" className="label">
            Add a note as {user.fullName ?? user.email}
          </label>
          <textarea
            id="comment-body"
            className="field"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="e.g. The paper is missing page 3 — does anyone have it?"
            maxLength={1500}
          />
          {error && <p className="text-[0.85rem] text-seal">{error}</p>}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[0.75rem] text-ink-3">{body.length}/1500</span>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={busy || !body.trim()}
              onClick={() => void submit()}
            >
              {busy ? "Posting…" : "Post comment"}
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-4 rounded-sm border border-[var(--edge)] bg-[rgba(231,218,191,0.4)] px-3 py-2.5 text-[0.88rem] text-ink-2">
          <Link href="/login" className="link-ink">
            Sign in
          </Link>{" "}
          to leave a comment. Reading is always open to everyone.
        </p>
      )}

      <ul className="mt-5 grid gap-3">
        {comments === null ? (
          [0, 1].map((i) => <li key={i} className="skeleton h-16 w-full" />)
        ) : comments.length === 0 ? (
          <li className="py-4 text-center font-serif-papr text-ink-3">
            No notes in the margin yet.
          </li>
        ) : (
          comments.map((comment) => (
            <li
              key={comment.id}
              className="rounded-sm border border-[var(--edge)] bg-[rgba(253,249,240,0.7)] p-3 animate-fade"
            >
              <p className="text-[0.78rem] text-ink-3">
                <span className="font-semibold text-ink-2">{comment.authorName}</span> ·{" "}
                {formatDateTime(comment.createdAt)}
              </p>
              <p className="mt-1.5 whitespace-pre-wrap font-serif-papr text-[0.95rem] leading-relaxed text-ink-2">
                {comment.body}
              </p>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
