"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";
import { NAV_LINKS, SITE } from "@/lib/site";
import { useSession, type SessionUser } from "@/lib/useSession";

const PRIMARY = NAV_LINKS.slice(0, 5);

export function SiteHeader() {
  const { user, loading } = useSession();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="paperraj-header relative z-40 border-b border-[var(--edge-strong)] bg-[rgba(242,233,216,0.92)] backdrop-blur-[2px]">
      {/* carved wooden rail */}
      <div
        aria-hidden
        className="h-[3px] w-full"
        style={{
          background:
            "linear-gradient(90deg,#3b2715,#7a5330 22%,#a9853f 50%,#7a5330 78%,#3b2715)",
        }}
      />
      <div className="mx-auto w-full max-w-[1180px] px-4 sm:px-6">
        <div className="site-header-row flex items-center gap-3 py-3 sm:gap-5 sm:py-4">
          <Link
            href="/"
            className="site-header-brand flex shrink-0 items-center gap-3 rounded-sm"
            aria-label="PaperRaj home"
          >
            <Logo size={42} className="h-9 w-auto sm:h-11" />
            <Logo size={58} className="hidden drop-shadow-[0_2px_6px_rgba(60,42,24,0.35)] sm:block" />
            <Logo />
          </Link>

          <p className="hidden min-w-0 flex-1 border-l border-[var(--edge-strong)] pl-4 text-[0.82rem] leading-snug text-ink-2 lg:block">
            <span className="block font-serif-papr text-[0.95rem] italic text-ink">
              {SITE.tagline}
            </span>
            <span className="line-clamp-2 opacity-80">{SITE.description}</span>
          </p>

          <div className="site-header-actions ml-auto flex items-center gap-2">
            <Link href="/upload" className="btn btn-primary btn-sm !min-h-[40px] !px-3 sm:!min-h-[44px] sm:!px-4">
              <span aria-hidden>📤</span>
              <span className="hidden sm:inline">Upload a paper</span>
              <span className="sm:hidden">Upload</span>
            </Link>

            {!loading && user ? (
              <Link
                href="/profile"
                className="hidden items-center gap-2 rounded-sm border border-[var(--edge-strong)] bg-[rgba(253,249,240,0.8)] px-3 py-2 text-sm text-ink-2 hover:text-ink md:flex"
              >
                <span
                  aria-hidden
                  className="grid h-7 w-7 place-items-center rounded-full bg-accent text-[0.7rem] font-bold text-white"
                >
                  {initials(user)}
                </span>
                <span className="max-w-[10rem] truncate">{user.fullName ?? user.email}</span>
              </Link>
            ) : null}

            <button
              type="button"
              className="site-menu-button btn btn-ghost !px-3"
              aria-expanded={open}
              aria-controls="paperraj-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((v) => !v)}
            >
              <span aria-hidden className="text-lg leading-none">
                ☰
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* desktop nav strip */}
      <nav aria-label="Primary" className="hidden border-t border-[var(--edge)] md:block">
        <div className="mx-auto flex w-full max-w-[1180px] items-center gap-1 px-6 py-1.5">
          {PRIMARY.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-sm px-2.5 py-1.5 text-[0.83rem] transition-colors ${
                pathname === link.href
                  ? "bg-[rgba(169,133,63,0.16)] font-semibold text-ink"
                  : "text-ink-2 hover:bg-[rgba(169,133,63,0.1)] hover:text-ink"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <span aria-hidden className="mx-2 h-4 w-px bg-[var(--edge-strong)]" />
          <div className="flex items-center gap-1">
            <HeaderSession user={user} loading={loading} />
          </div>
        </div>
      </nav>

      {/* mobile / hamburger drawer */}
      <div
        id="paperraj-menu"
        hidden={!open}
        className="paperraj-mobile-drawer border-t border-[var(--edge-strong)] bg-[rgba(253,249,240,0.98)] md:hidden"
      >
        <nav aria-label="Menu" className="site-mobile-nav mx-auto grid w-full max-w-[1180px] gap-0.5 px-4 py-3">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex min-h-[46px] items-center rounded-sm px-3 text-[0.95rem] text-ink-2 hover:bg-[rgba(169,133,63,0.14)] hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-2 border-t border-[var(--edge)] pt-2">
            <HeaderSession user={user} loading={loading} block />
          </div>
        </nav>
      </div>
    </header>
  );
}

function HeaderSession({
  user,
  loading,
  block = false,
}: {
  user: SessionUser | null;
  loading: boolean;
  block?: boolean;
}) {
  if (loading) {
    return <span className="px-3 py-2 text-sm text-ink-3">…</span>;
  }
  if (user) {
    return (
      <div className={block ? "grid gap-1" : "flex items-center gap-1"}>
        <Link href="/my-uploads" className="btn btn-ghost btn-sm">
          My Uploads
        </Link>
        <Link href="/profile" className="btn btn-ghost btn-sm">
          Profile
        </Link>
        {user.role === "admin" && (
          <Link href="/admin" className="btn btn-accent btn-sm">
            Librarian Desk
          </Link>
        )}
      </div>
    );
  }
  return (
    <div className={block ? "grid gap-1" : "flex items-center gap-1"}>
      <Link href="/login" className="btn btn-ghost btn-sm">
        Sign in
      </Link>
      <Link href="/signup" className="btn btn-sm">
        Create account
      </Link>
    </div>
  );
}

function initials(user: SessionUser) {
  const source = user.fullName?.trim() || user.email;
  return source.slice(0, 2).toUpperCase();
}
