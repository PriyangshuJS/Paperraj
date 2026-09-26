"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { primeSession, type SessionUser } from "@/lib/useSession";

type Mode = "login" | "signup" | "forgot" | "reset";

const COPY: Record<Mode, { title: string; lead: string; cta: string }> = {
  login: {
    title: "Sign in",
    lead: "Sign in only if you want PaperRaj to remember your uploads. Browsing and downloading never need an account.",
    cta: "Sign in",
  },
  signup: {
    title: "Create an account",
    lead: "An account makes every paper you upload yours — so you can edit or remove it later. It takes about twenty seconds.",
    cta: "Create account",
  },
  forgot: {
    title: "Reset your password",
    lead: "Tell us the email you signed up with and we will send a secure reset link.",
    cta: "Send reset link",
  },
  reset: {
    title: "Choose a new password",
    lead: "Pick something at least 8 characters long.",
    cta: "Save new password",
  },
};

export function AuthForm({ mode, next, token }: { mode: Mode; next?: string; token?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fullName, setFullName] = useState("");
  const [school, setSchool] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [resetLink, setResetLink] = useState<string | null>(null);

  const copy = COPY[mode];

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (mode === "reset" && password !== confirm) {
        throw new Error("The two passwords do not match.");
      }
      const endpoint =
        mode === "login"
          ? "/api/auth/login"
          : mode === "signup"
            ? "/api/auth/signup"
            : mode === "forgot"
              ? "/api/auth/reset-request"
              : "/api/auth/reset-confirm";
      const payload =
        mode === "signup"
          ? { email, password, fullName, school }
          : mode === "forgot"
            ? { email }
            : mode === "reset"
              ? { token, password }
              : { email, password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "That did not work. Please try again.");

      if (mode === "forgot") {
        setNotice(data.message ?? "If that account exists, a reset link has been created.");
        setResetLink(data.link ?? null);
        return;
      }
      if (mode === "reset") {
        setNotice(data.message ?? "Your password has been updated.");
        setTimeout(() => router.push("/login"), 1200);
        return;
      }

      primeSession((data.user ?? null) as SessionUser | null);
      if (data.needsEmailConfirmation) {
        setNotice(data.message ?? "Please confirm your email, then sign in.");
        return;
      }
      router.push(next && next.startsWith("/") ? next : "/my-uploads");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "That did not work. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="paperraj-auth mx-auto w-full max-w-md">
      <div className="paper paper-lined p-5 sm:p-6">
        <h1 className="font-display text-[1.9rem] font-semibold text-ink">{copy.title}</h1>
        <p className="mt-2 font-serif-papr text-[0.95rem] leading-relaxed text-ink-2">
          {copy.lead}
        </p>

        <form className="mt-5 grid gap-4" onSubmit={submit}>
          {mode === "signup" && (
            <>
              <div>
                <label htmlFor="auth-name" className="label">
                  Your name
                </label>
                <input
                  id="auth-name"
                  className="field"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Rahul M."
                  autoComplete="name"
                  maxLength={120}
                />
              </div>
              <div>
                <label htmlFor="auth-school" className="label">
                  School / institution
                </label>
                <input
                  id="auth-school"
                  className="field"
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  placeholder="e.g. ABC School"
                  autoComplete="organization"
                  maxLength={160}
                />
                <p className="mt-1 text-[0.74rem] text-ink-3">
                  Filled in automatically on every future upload.
                </p>
              </div>
            </>
          )}

          {mode !== "reset" && (
            <div>
              <label htmlFor="auth-email" className="label">
                Email
              </label>
              <input
                id="auth-email"
                type="email"
                className="field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>
          )}

          {mode !== "forgot" && (
            <div>
              <label htmlFor="auth-password" className="label">
                {mode === "reset" ? "New password" : "Password"}
              </label>
              <input
                id="auth-password"
                type="password"
                className="field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                minLength={8}
                required
              />
            </div>
          )}

          {mode === "reset" && (
            <div>
              <label htmlFor="auth-confirm" className="label">
                Repeat the new password
              </label>
              <input
                id="auth-confirm"
                type="password"
                className="field"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
          )}

          {error && (
            <p role="alert" className="text-[0.88rem] text-seal">
              {error}
            </p>
          )}
          {notice && (
            <div role="status" className="text-[0.88rem] text-moss">
              <p>{notice}</p>
              {resetLink && (
                <Link href={resetLink} className="link-ink mt-1 block break-all">
                  {resetLink}
                </Link>
              )}
            </div>
          )}

          <button type="submit" className="btn btn-primary !min-h-[48px]" disabled={busy}>
            {busy ? "Working…" : copy.cta}
          </button>
        </form>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--edge)] pt-4 text-[0.85rem]">
          {mode === "login" ? (
            <>
              <Link href="/signup" className="link-ink">
                Create an account
              </Link>
              <Link href="/forgot-password" className="link-ink">
                Forgot your password?
              </Link>
            </>
          ) : mode === "signup" ? (
            <>
              <Link href="/login" className="link-ink">
                I already have an account
              </Link>
              <Link href="/papers" className="text-ink-3 hover:text-ink">
                Just let me browse
              </Link>
            </>
          ) : (
            <Link href="/login" className="link-ink">
              Back to sign in
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export function SignOutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="btn btn-ghost btn-sm"
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        primeSession(null);
        router.push("/");
        router.refresh();
      }}
    >
      Sign out
    </button>
  );
}
