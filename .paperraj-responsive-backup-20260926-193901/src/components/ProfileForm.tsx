"use client";

import { useState } from "react";
import { primeSession, type SessionUser } from "@/lib/useSession";
import { SignOutButton } from "@/components/AuthForm";

export function ProfileForm({ user }: { user: SessionUser }) {
  const [fullName, setFullName] = useState(user.fullName ?? "");
  const [school, setSchool] = useState(user.school ?? "");
  const [contact, setContact] = useState(user.contact ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ fullName, school, contact }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save.");
      setMessage(data.message ?? "Saved.");
      if (data.user) primeSession(data.user as SessionUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
      <section className="paper paper-lined p-4 sm:p-5">
        <h2 className="font-display text-[1.35rem] text-ink">Your details</h2>
        <p className="mt-1 text-[0.85rem] text-ink-3">
          These are remembered and pre-filled on every paper you upload, so you only ever type
          document-specific information.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="profile-name" className="label">
              Name shown as uploader
            </label>
            <input
              id="profile-name"
              className="field"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              maxLength={120}
            />
          </div>
          <div>
            <label htmlFor="profile-school" className="label">
              School / institution
            </label>
            <input
              id="profile-school"
              className="field"
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              maxLength={160}
            />
          </div>
          <div>
            <label htmlFor="profile-contact" className="label">
              Contact (optional)
            </label>
            <input
              id="profile-contact"
              className="field"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="Only you and the librarian can see this"
              maxLength={160}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="profile-email" className="label">
              Email (sign-in address)
            </label>
            <input id="profile-email" className="field" value={user.email} readOnly />
          </div>
        </div>
        {error && <p className="mt-3 text-[0.88rem] text-seal">{error}</p>}
        {message && <p className="mt-3 text-[0.88rem] text-moss">{message}</p>}
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void save()}>
            {busy ? "Saving…" : "Save details"}
          </button>
          <SignOutButton />
        </div>
      </section>

      <aside className="grid content-start gap-4">
        <div className="paper p-4">
          <h2 className="smallcaps mb-2 text-[0.76rem] font-bold text-ink-3">Account</h2>
          <ul className="grid gap-1.5 text-[0.88rem] text-ink-2">
            <li>Role: {user.role === "admin" ? "Administrator (librarian)" : "Reader & contributor"}</li>
            <li>Member since {new Date(user.createdAt).toLocaleDateString("en-GB")}</li>
          </ul>
        </div>
        <div className="paper p-4">
          <h2 className="smallcaps mb-2 text-[0.76rem] font-bold text-ink-3">Shortcuts</h2>
          <ul className="grid gap-1.5 text-[0.9rem]">
            <li>
              <a href="/my-uploads" className="link-ink">
                My uploads
              </a>
            </li>
            <li>
              <a href="/upload" className="link-ink">
                Upload a paper
              </a>
            </li>
            <li>
              <a href="/papers" className="link-ink">
                Browse the library
              </a>
            </li>
            {user.role === "admin" && (
              <li>
                <a href="/admin" className="link-ink">
                  Librarian&apos;s desk
                </a>
              </li>
            )}
          </ul>
        </div>
      </aside>
    </div>
  );
}
