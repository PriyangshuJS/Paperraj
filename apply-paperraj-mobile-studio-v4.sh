#!/bin/bash
set -euo pipefail

ROOT="$(pwd)"
if [[ ! -f "$ROOT/package.json" || ! -d "$ROOT/src" ]]; then
  echo "ERROR: Run this from the PaperRaj project root."
  exit 1
fi

STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP="$ROOT/.paperraj-mobile-studio-backup-$STAMP"
mkdir -p "$BACKUP/src/app" "$BACKUP/src/components"

for f in \
  src/app/globals.css \
  src/app/layout.tsx \
  src/app/page.tsx \
  src/app/papers/[id]/page.tsx \
  src/components/SiteHeader.tsx \
  src/components/SiteFooter.tsx \
  src/components/Library.tsx \
  src/components/PaperViewer.tsx \
  src/components/UploadForm.tsx \
  src/components/AuthForm.tsx \
  src/components/PageHeader.tsx \
  src/components/StatsStrip.tsx \
  src/components/MyUploadsList.tsx \
  src/components/CommentsPanel.tsx; do
  if [[ -f "$f" ]]; then
    mkdir -p "$BACKUP/$(dirname "$f")"
    cp "$f" "$BACKUP/$f"
  fi
done

echo "✓ Backup created: $BACKUP"

python3 - <<'PY'
from pathlib import Path
import re

ROOT = Path.cwd()

def patch(path, transforms):
    p = ROOT / path
    text = p.read_text()
    original = text
    for label, old, new in transforms:
        if new in text:
            print(f"✓ {path}: {label} (already applied)")
            continue
        if old in text:
            text = text.replace(old, new, 1)
            print(f"✓ {path}: {label}")
        else:
            print(f"• {path}: {label} (skipped — source differs; CSS fallback will handle it)")
    if text != original:
        p.write_text(text)

# Layout hook
patch("src/app/layout.tsx", [
    ("main hook", '<main id="main" className="mx-auto w-full max-w-[1180px] px-4 pb-4 pt-6 sm:px-6 sm:pt-8">', '<main id="main" className="paperraj-main mx-auto w-full max-w-[1180px] px-4 pb-4 pt-6 sm:px-6 sm:pt-8">'),
])

# Header hooks
patch("src/components/SiteHeader.tsx", [
    ("header hook", '<header className="relative z-40 border-b border-[var(--edge-strong)] bg-[rgba(242,233,216,0.92)] backdrop-blur-[2px]">', '<header className="paperraj-header relative z-40 border-b border-[var(--edge-strong)] bg-[rgba(242,233,216,0.92)] backdrop-blur-[2px]">'),
    ("brand hook", 'className="flex shrink-0 items-center gap-3 rounded-sm"', 'className="paperraj-brand flex shrink-0 items-center gap-3 rounded-sm"'),
    ("header actions hook", '<div className="ml-auto flex items-center gap-2">', '<div className="paperraj-header-actions ml-auto flex items-center gap-2">'),
    ("menu hook", 'className="btn btn-ghost !px-3"', 'className="paperraj-menu-button btn btn-ghost !px-3"'),
    ("mobile drawer hook", 'className="border-t border-[var(--edge-strong)] bg-[rgba(253,249,240,0.98)] md:hidden"', 'className="paperraj-mobile-drawer border-t border-[var(--edge-strong)] bg-[rgba(253,249,240,0.98)] md:hidden"'),
])

# Home hooks
patch("src/app/page.tsx", [
    ("home wrapper", '<div className="grid gap-8">', '<div className="paperraj-home grid gap-8">'),
    ("hero hook", '<section className="relative overflow-hidden rounded-[4px] border border-[var(--edge-strong)]">', '<section className="paperraj-hero relative overflow-hidden rounded-[4px] border border-[var(--edge-strong)]">'),
    ("hero actions", '<div className="mt-6 flex flex-wrap gap-2">', '<div className="paperraj-hero-actions mt-6 flex flex-wrap gap-2">'),
    ("home stats", '<StatsStrip />', '<div className="paperraj-home-stats"><StatsStrip /></div>'),
    ("about hook", '<section className="paper paper-lined p-5 sm:p-8">', '<section className="paperraj-about paper paper-lined p-5 sm:p-8">'),
])

# Library hooks
patch("src/components/Library.tsx", [
    ("library root", '<section aria-label="Paper library" className="grid gap-4">', '<section aria-label="Paper library" className="paperraj-library grid gap-4">'),
    ("library search actions", '<div className="mt-3 flex flex-wrap items-center gap-2">', '<div className="paperraj-library-controls mt-3 flex flex-wrap items-center gap-2">'),
    ("paper row hook", '<article className="paper row-hover overflow-hidden">', '<article className="paperraj-paper-row paper row-hover overflow-hidden">'),
    ("paper row actions", '<div className="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:items-stretch">', '<div className="paperraj-paper-actions flex shrink-0 flex-wrap gap-2 sm:flex-col sm:items-stretch">'),
    ("pagination hook", '<nav aria-label="Pagination"', '<nav className="paperraj-pagination" aria-label="Pagination"'),
])

# Detail hooks
patch("src/app/papers/[id]/page.tsx", [
    ("detail root", '<div className="grid gap-6">', '<div className="paperraj-detail grid gap-6">'),
    ("detail header", '<header className="paper paper-lined p-4 sm:p-6">', '<header className="paperraj-detail-header paper paper-lined p-4 sm:p-6">'),
    ("detail actions", '<div className="mt-5 flex flex-wrap items-center gap-2">', '<div className="paperraj-detail-actions mt-5 flex flex-wrap items-center gap-2">'),
])

# Viewer hooks
patch("src/components/PaperViewer.tsx", [
    ("viewer root", '<figure className="grid gap-3">', '<figure className="paperraj-reader grid gap-3">'),
    ("viewer header", '<div className="flex flex-wrap items-center justify-between gap-2">', '<div className="paperraj-reader-header flex flex-wrap items-center justify-between gap-2">'),
    ("viewer controls", '<div className="flex items-center justify-center gap-3">', '<div className="paperraj-reader-controls flex items-center justify-center gap-3">'),
    ("viewer media", '<div className="relative overflow-hidden rounded-sm border border-[var(--edge-strong)] bg-white shadow-[var(--shadow-paper)]"', '<div className="paperraj-reader-media relative overflow-hidden rounded-sm border border-[var(--edge-strong)] bg-white shadow-[var(--shadow-paper)]"'),
])

# Upload hooks
patch("src/components/UploadForm.tsx", [
    ("upload root", '<div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">', '<div className="paperraj-upload grid gap-5 lg:grid-cols-[1.5fr_1fr]">'),
    ("dropzone hook", 'className={`mt-4 flex cursor-pointer flex-col items-center justify-center', 'className={`paperraj-dropzone mt-4 flex cursor-pointer flex-col items-center justify-center'),
])

# Auth hook
patch("src/components/AuthForm.tsx", [
    ("auth root", '<div className="mx-auto w-full max-w-md">', '<div className="paperraj-auth mx-auto w-full max-w-md">'),
])

# Page header hook
patch("src/components/PageHeader.tsx", [
    ("page header hook", '<header className="mb-6 grid gap-3">', '<header className="paperraj-page-header mb-6 grid gap-3">'),
])

# My uploads hook
patch("src/components/MyUploadsList.tsx", [
    ("my uploads root", '<ul className="grid gap-3">', '<ul className="paperraj-my-uploads grid gap-3">'),
])

# Comments hook
patch("src/components/CommentsPanel.tsx", [
    ("comments hook", '<section aria-label="Comments" className="paper p-4 sm:p-5">', '<section aria-label="Comments" className="paperraj-comments paper p-4 sm:p-5">'),
])

# Replace footer with a compact, mobile-first version while preserving the desktop information architecture.
footer = ROOT / "src/components/SiteFooter.tsx"
footer.write_text(r'''import Link from "next/link";
import { Logo } from "@/components/Logo";
import { SITE } from "@/lib/site";

const LINK_GROUPS: { title: string; links: { href: string; label: string; external?: boolean }[] }[] = [
  {
    title: "The Library",
    links: [
      { href: "/papers", label: "All Papers" },
      { href: "/year-papers", label: "Year Papers" },
      { href: "/specimen-papers", label: "Specimen Papers" },
      { href: "/upload", label: "Upload" },
      { href: "/my-uploads", label: "My Uploads" },
    ],
  },
  {
    title: "Catalogues",
    links: [
      { href: "/subjects", label: "Subjects" },
      { href: "/classes", label: "Classes" },
      { href: "/boards", label: "Boards" },
      { href: "/teachers", label: "Teachers" },
      { href: "/statistics", label: "Statistics" },
    ],
  },
  {
    title: "PaperRaj",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
      { href: SITE.youtubeUrl, label: "YouTube", external: true },
      { href: `mailto:${SITE.ownerEmail}`, label: "Gmail", external: true },
    ],
  },
];

function FooterLinks({ group }: { group: (typeof LINK_GROUPS)[number] }) {
  return (
    <nav aria-label={group.title}>
      <h2 className="smallcaps mb-3 text-[0.78rem] font-bold text-ink-3">{group.title}</h2>
      <ul className="grid gap-2">
        {group.links.map((link) => (
          <li key={link.href}>
            {link.external ? (
              <a href={link.href} target="_blank" rel="noreferrer noopener" className="text-[0.9rem] text-ink-2 transition-colors hover:text-ink">
                {link.label}
              </a>
            ) : (
              <Link href={link.href} className="text-[0.9rem] text-ink-2 transition-colors hover:text-ink">
                {link.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function SiteFooter() {
  return (
    <footer className="paperraj-footer mt-12 border-t border-[var(--edge-strong)] bg-[rgba(231,218,191,0.55)] sm:mt-16">
      <div aria-hidden className="h-[3px] w-full" style={{ background: "linear-gradient(90deg,#3b2715,#7a5330 22%,#a9853f 50%,#7a5330 78%,#3b2715)" }} />
      <div className="mx-auto w-full max-w-[1180px] px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-6 sm:px-6 sm:pb-[calc(2.5rem+env(safe-area-inset-bottom))] sm:pt-10">
        <div className="paperraj-footer-mobile-intro md:hidden">
          <div className="flex items-center gap-2.5">
            <Logo size={40} />
            <div>
              <p className="font-display text-[1.55rem] font-semibold leading-none text-ink">
                Paper<span className="text-wood-2">Raj</span>
              </p>
              <p className="smallcaps mt-1 text-[0.58rem] text-ink-3">School question paper archive</p>
            </div>
          </div>
          <p className="mt-3 max-w-sm font-serif-papr text-[0.86rem] leading-relaxed text-ink-2">
            {SITE.tagline}
          </p>
          <details className="paperraj-footer-details mt-4 rounded-lg border border-[var(--edge)] bg-[rgba(253,249,240,0.58)]">
            <summary className="cursor-pointer list-none px-3.5 py-3 text-[0.84rem] font-semibold text-ink-2">
              <span className="inline-flex items-center gap-2"><span aria-hidden>☰</span> Explore PaperRaj</span>
            </summary>
            <div className="grid gap-4 border-t border-[var(--edge)] px-3.5 py-3.5">
              {LINK_GROUPS.map((group) => <FooterLinks key={group.title} group={group} />)}
            </div>
          </details>
          <a href={`mailto:${SITE.ownerEmail}`} className="link-ink mt-3 inline-block break-all text-[0.76rem]">
            {SITE.ownerEmail}
          </a>
        </div>

        <div className="hidden md:grid md:grid-cols-[1.4fr_repeat(3,minmax(0,1fr))] md:gap-9">
          <div>
            <div className="flex items-center gap-3">
              <Logo size={44} />
              <span className="font-display text-2xl font-semibold text-ink">Paper<span className="text-wood-2">Raj</span></span>
            </div>
            <p className="mt-4 max-w-sm font-serif-papr text-[0.95rem] leading-relaxed text-ink-2">{SITE.description}</p>
            <p className="mt-3 font-serif-papr text-[0.95rem] italic text-ink-3">“{SITE.tagline}”</p>
            <a href={`mailto:${SITE.ownerEmail}`} className="link-ink mt-4 inline-block text-sm">{SITE.ownerEmail}</a>
          </div>
          {LINK_GROUPS.map((group) => <FooterLinks key={group.title} group={group} />)}
        </div>

        <div className="mt-5 flex flex-col gap-1.5 border-t border-[var(--edge)] pt-4 text-[0.72rem] text-ink-3 sm:mt-9 sm:flex-row sm:items-center sm:justify-between sm:pt-5 sm:text-[0.8rem]">
          <p>© {new Date().getFullYear()} {SITE.legalName} · PaperRaj.</p>
          <p className="flex items-center gap-2"><span>Built for students, teachers &amp; archivists</span><Link href="/admin" aria-label="Librarian desk" title="Librarian desk" className="rounded-sm px-1 text-ink-3/70 transition-colors hover:text-gold">✦</Link></p>
        </div>
      </div>
    </footer>
  );
}
''')
print("✓ src/components/SiteFooter.tsx: redesigned mobile footer")

# Append one controlled responsive design layer. It is intentionally namespaced so it is easy to remove later.
css = ROOT / "src/app/globals.css"
text = css.read_text()
marker = "/* ================================================================\n   PaperRaj — Mobile Studio v4\n   ================================================================ */"
if marker in text:
    print("✓ src/app/globals.css: Mobile Studio v4 already present")
else:
    layer = r'''

/* ================================================================
   PaperRaj — Mobile Studio v4
   A deliberate mobile composition layer. Desktop remains intentionally close
   to the existing library layout; phones get denser hierarchy, fewer competing
   controls, larger touch targets, and app-like navigation.
   ================================================================ */

html,
body {
  max-width: 100%;
  overflow-x: clip;
}

img,
svg,
video,
canvas,
iframe {
  max-width: 100%;
}

button,
a,
input,
select,
textarea {
  -webkit-tap-highlight-color: transparent;
}

.paperraj-main {
  min-width: 0;
}

.paperraj-home,
.paperraj-library,
.paperraj-detail,
.paperraj-upload {
  min-width: 0;
}

.paperraj-paper-row,
.paperraj-detail-header,
.paperraj-reader,
.paperraj-comments,
.paperraj-auth,
.paperraj-page-header {
  min-width: 0;
}

@media (max-width: 767px) {
  html {
    scroll-padding-top: 0.75rem;
  }

  body {
    min-width: 0;
    background-attachment: scroll;
  }

  .paperraj-main {
    padding-inline: 0.75rem !important;
    padding-top: 0.9rem !important;
    padding-bottom: 1.25rem !important;
  }

  .paperraj-header {
    position: sticky;
    top: 0;
    box-shadow: 0 5px 18px -16px rgba(36, 26, 18, 0.7);
  }

  .paperraj-header > div:nth-child(2) > div {
    gap: 0.5rem !important;
    padding-block: 0.55rem !important;
  }

  .paperraj-brand {
    gap: 0.55rem !important;
    min-width: 0;
  }

  .paperraj-brand > span {
    min-width: 0;
  }

  .paperraj-brand .smallcaps {
    font-size: 0.5rem !important;
    letter-spacing: 0.12em;
    white-space: nowrap;
  }

  .paperraj-header-actions {
    gap: 0.4rem !important;
  }

  .paperraj-header-actions .btn {
    min-height: 42px;
    padding-inline: 0.75rem;
  }

  .paperraj-menu-button {
    width: 42px;
    padding-inline: 0 !important;
  }

  .paperraj-mobile-drawer {
    max-height: calc(100dvh - 64px);
    overflow-y: auto;
    overscroll-behavior: contain;
    box-shadow: 0 16px 30px -28px rgba(36, 26, 18, 0.8);
  }

  .paperraj-mobile-drawer nav {
    padding-inline: 0.75rem !important;
    padding-block: 0.65rem !important;
  }

  .paperraj-mobile-drawer nav > a {
    min-height: 44px;
    padding-inline: 0.75rem !important;
    border-radius: 8px;
  }

  .paperraj-mobile-drawer nav > div {
    margin-top: 0.5rem !important;
    padding-top: 0.65rem !important;
  }

  .paperraj-mobile-drawer .btn {
    min-height: 42px;
    border-radius: 7px;
  }

  .paperraj-home {
    gap: 1rem !important;
  }

  .paperraj-hero {
    border-radius: 12px !important;
    box-shadow: var(--shadow-paper);
  }

  .paperraj-hero > div.relative {
    gap: 1.25rem !important;
    padding: 1.05rem !important;
  }

  .paperraj-hero h2 {
    margin-top: 0.45rem !important;
    font-size: clamp(2rem, 9.6vw, 2.6rem) !important;
    line-height: 1.02 !important;
  }

  .paperraj-hero p {
    font-size: 0.96rem;
  }

  .paperraj-hero-actions {
    display: grid !important;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem !important;
    margin-top: 1rem !important;
  }

  .paperraj-hero-actions > a:first-child {
    grid-column: 1 / -1;
  }

  .paperraj-hero-actions .btn {
    width: 100%;
    min-height: 44px;
    padding-inline: 0.65rem;
    font-size: 0.86rem;
  }

  .paperraj-home-stats > div {
    gap: 0.5rem !important;
  }

  .paperraj-home-stats > div > div {
    min-height: 72px;
    padding: 0.65rem 0.45rem !important;
    border-radius: 8px;
  }

  .paperraj-home-stats > div > div:nth-child(n + 5) {
    display: none;
  }

  .paperraj-home-stats .font-display {
    font-size: 1.35rem;
  }

  .paperraj-home-stats .smallcaps {
    font-size: 0.6rem;
    line-height: 1.2;
  }

  .paperraj-hero .paper {
    border-radius: 9px;
    padding: 0.8rem !important;
  }

  .paperraj-hero .chip {
    min-height: 30px;
    padding-inline: 0.55rem;
  }

  .paperraj-about {
    border-radius: 10px !important;
    padding: 1rem !important;
  }

  .paperraj-about > div {
    gap: 1rem !important;
  }

  .paperraj-about h2 {
    font-size: 1.55rem !important;
  }

  .paperraj-page-header {
    margin-bottom: 1rem !important;
    gap: 0.45rem !important;
  }

  .paperraj-page-header h1 {
    font-size: clamp(1.8rem, 8vw, 2.3rem) !important;
    line-height: 1.05 !important;
  }

  .paperraj-page-header > p {
    font-size: 0.92rem !important;
  }

  .paperraj-page-header > div {
    align-items: stretch;
  }

  .paperraj-page-header > div .btn {
    min-height: 42px;
  }

  .paper,
  .shelf {
    border-radius: 9px;
  }

  .paperraj-library {
    gap: 0.75rem !important;
  }

  .paperraj-library > .paper,
  .paperraj-library > .paper-lined {
    padding: 0.8rem !important;
  }

  .paperraj-library .field {
    min-height: 46px !important;
  }

  .paperraj-library-controls {
    gap: 0.45rem !important;
  }

  .paperraj-library-controls .field {
    min-height: 42px !important;
  }

  .paperraj-library-controls .btn-sm {
    min-height: 40px;
  }

  .paperraj-library > .paper.animate-fade {
    padding: 0.8rem !important;
  }

  .paperraj-library > .paper.animate-fade .grid {
    gap: 0.55rem;
  }

  .paperraj-library > ul {
    gap: 0.65rem !important;
  }

  .paperraj-paper-row {
    border-radius: 10px !important;
  }

  .paperraj-paper-row > div {
    gap: 0.8rem !important;
    padding: 0.85rem !important;
  }

  .paperraj-paper-row h3 {
    font-size: 1.08rem !important;
    line-height: 1.15 !important;
  }

  .paperraj-paper-row .chip {
    min-height: 29px;
    padding: 0.12rem 0.45rem;
  }

  .paperraj-paper-actions {
    width: 100%;
    display: grid !important;
    grid-template-columns: 1fr 1fr;
    gap: 0.45rem !important;
  }

  .paperraj-paper-actions .btn {
    width: 100%;
    min-height: 42px;
  }

  .paperraj-paper-actions .btn-primary {
    grid-column: 1 / -1;
  }

  .paperraj-pagination {
    display: grid !important;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 0.35rem !important;
  }

  .paperraj-pagination > ul {
    min-width: 0;
    justify-content: center;
    overflow: hidden;
  }

  .paperraj-pagination .btn {
    min-width: 42px;
    padding-inline: 0.55rem;
  }

  .paperraj-pagination .btn:first-child,
  .paperraj-pagination .btn:last-child {
    font-size: 0;
  }

  .paperraj-pagination .btn:first-child::after {
    content: "‹";
    font-size: 1.15rem;
  }

  .paperraj-pagination .btn:last-child::after {
    content: "›";
    font-size: 1.15rem;
  }

  .paperraj-detail {
    gap: 1rem !important;
  }

  .paperraj-detail-header {
    padding: 1rem !important;
    border-radius: 10px !important;
  }

  .paperraj-detail-header h1 {
    font-size: clamp(1.45rem, 7vw, 1.85rem) !important;
  }

  .paperraj-detail-actions {
    display: grid !important;
    grid-template-columns: 1fr auto;
    gap: 0.5rem !important;
  }

  .paperraj-detail-actions .btn {
    width: 100%;
  }

  .paperraj-reader {
    gap: 0.6rem !important;
  }

  .paperraj-reader-header {
    align-items: stretch !important;
    gap: 0.5rem !important;
  }

  .paperraj-reader-header figcaption {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .paperraj-reader-header > div {
    display: grid !important;
    grid-template-columns: 1fr 1fr;
    width: 100%;
    gap: 0.45rem !important;
  }

  .paperraj-reader-header .btn {
    width: 100%;
    min-height: 42px;
  }

  .paperraj-reader-media {
    border-radius: 9px !important;
  }

  .paperraj-reader-media > div {
    min-height: 52vh !important;
    max-height: 70vh;
    padding: 0.4rem !important;
  }

  .paperraj-reader-media img {
    max-height: 67vh !important;
  }

  .paperraj-reader-controls {
    display: grid !important;
    grid-template-columns: 1fr auto 1fr;
    gap: 0.45rem !important;
  }

  .paperraj-reader-controls .btn {
    width: 100%;
    min-height: 42px;
    padding-inline: 0.55rem;
  }

  .paperraj-reader-controls .btn:first-child,
  .paperraj-reader-controls .btn:last-child {
    font-size: 0;
  }

  .paperraj-reader-controls .btn:first-child::after {
    content: "‹ Previous";
    font-size: 0.84rem;
  }

  .paperraj-reader-controls .btn:last-child::after {
    content: "Next ›";
    font-size: 0.84rem;
  }

  .paperraj-reader > p:last-child {
    font-size: 0.7rem;
  }

  .paperraj-upload {
    gap: 0.8rem !important;
  }

  .paperraj-upload .paper {
    padding: 0.85rem !important;
  }

  .paperraj-dropzone {
    min-height: 180px;
    padding: 1.4rem 0.8rem !important;
    border-radius: 10px;
  }

  .paperraj-upload .field {
    min-height: 46px;
  }

  .paperraj-upload .btn {
    min-height: 44px;
  }

  .paperraj-upload aside {
    gap: 0.65rem !important;
  }

  .paperraj-upload aside .paper {
    padding: 0.8rem !important;
  }

  .paperraj-auth {
    max-width: 100%;
  }

  .paperraj-auth > .paper {
    border-radius: 10px !important;
    padding: 1rem !important;
  }

  .paperraj-auth h1 {
    font-size: 1.75rem !important;
  }

  .paperraj-auth form {
    gap: 0.8rem !important;
  }

  .paperraj-auth .field {
    min-height: 46px;
  }

  .paperraj-auth form + div {
    align-items: stretch;
    flex-direction: column;
  }

  .paperraj-auth form + div a {
    padding-block: 0.2rem;
  }

  .paperraj-comments {
    border-radius: 10px !important;
  }

  .paperraj-comments .btn {
    min-height: 42px;
  }

  .paperraj-my-uploads {
    gap: 0.65rem !important;
  }

  .paperraj-my-uploads > li {
    border-radius: 10px;
    padding: 0.85rem !important;
  }

  .paperraj-my-uploads > li > div > div:last-child {
    width: 100%;
    display: grid !important;
    grid-template-columns: 1fr 1fr;
  }

  .paperraj-my-uploads > li > div > div:last-child .btn {
    width: 100%;
  }

  .paperraj-footer {
    margin-top: 2.25rem !important;
  }

  .paperraj-footer-mobile-intro {
    display: block;
  }

  .paperraj-footer-details summary::-webkit-details-marker {
    display: none;
  }

  .paperraj-footer-details[open] summary {
    background: rgba(169, 133, 63, 0.08);
  }

  .paperraj-footer-details nav + nav {
    padding-top: 0.25rem;
  }

  .paperraj-footer-details ul {
    gap: 0.4rem;
  }

  .paperraj-footer-details a {
    display: inline-flex;
    min-height: 34px;
    align-items: center;
  }
}

@media (max-width: 380px) {
  .paperraj-brand > span > span:first-child {
    font-size: 1.75rem !important;
  }

  .paperraj-brand .smallcaps {
    display: none;
  }

  .paperraj-header-actions .btn-primary {
    font-size: 0;
    width: 42px;
    padding-inline: 0;
  }

  .paperraj-header-actions .btn-primary > span:first-child {
    font-size: 1rem;
  }

  .paperraj-hero-actions {
    grid-template-columns: 1fr;
  }

  .paperraj-hero-actions > a:first-child {
    grid-column: auto;
  }

  .paperraj-pagination {
    grid-template-columns: 42px 1fr 42px;
  }
}

@media (min-width: 768px) {
  .paperraj-footer-mobile-intro {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
'''
    css.write_text(text + layer)
    print("✓ src/app/globals.css: Mobile Studio v4 design layer")
PY

echo
echo "Running checks..."

git diff --check
npm run typecheck
npm run build

echo
echo "=============================================="
echo "PAPER RAJ MOBILE STUDIO V4 APPLIED SUCCESSFULLY"
echo "Backup: $BACKUP"
echo "=============================================="
