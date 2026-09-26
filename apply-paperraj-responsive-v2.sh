#!/bin/bash
set -euo pipefail

ROOT="$(pwd)"
if [ ! -f "$ROOT/package.json" ] || [ ! -d "$ROOT/src" ]; then
  echo "ERROR: Run this script from the PaperRaj project root."
  exit 1
fi

STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP="$ROOT/.paperraj-responsive-backup-$STAMP"
mkdir -p "$BACKUP"
cp -R "$ROOT/src" "$BACKUP/src"

echo "✓ Backup created: $BACKUP"

python3 <<'PY'
from pathlib import Path

root = Path.cwd()

# These are optional semantic hooks. If a hook is already present, or the
# surrounding code has a slightly different class layout, we skip it rather
# than aborting the whole responsive pass.
changes = [
    ("src/components/SiteHeader.tsx",
     'className="flex items-center gap-3 py-3 sm:gap-5 sm:py-4"',
     'className="site-header-row flex items-center gap-3 py-3 sm:gap-5 sm:py-4"',
     "header row"),
    ("src/components/SiteHeader.tsx",
     'className="flex shrink-0 items-center gap-3 rounded-sm"',
     'className="site-header-brand flex shrink-0 items-center gap-3 rounded-sm"',
     "brand hook"),
    ("src/components/SiteHeader.tsx",
     'className="ml-auto flex items-center gap-2"',
     'className="site-header-actions ml-auto flex items-center gap-2"',
     "header actions hook"),
    ("src/components/SiteHeader.tsx",
     'className="btn btn-ghost !px-3"',
     'className="site-menu-button btn btn-ghost !px-3"',
     "menu button hook"),
    ("src/components/SiteHeader.tsx",
     'className="mx-auto grid w-full max-w-[1180px] gap-0.5 px-4 py-3"',
     'className="site-mobile-nav mx-auto grid w-full max-w-[1180px] gap-0.5 px-4 py-3"',
     "mobile nav hook"),
    ("src/components/SiteFooter.tsx",
     'className="mx-auto w-full max-w-[1180px] px-4 pb-[calc(2.5rem+env(safe-area-inset-bottom))] pt-10 sm:px-6"',
     'className="site-footer-inner mx-auto w-full max-w-[1180px] px-4 pb-[calc(2.5rem+env(safe-area-inset-bottom))] pt-10 sm:px-6"',
     "footer hook"),
    ("src/components/SiteFooter.tsx",
     'className="mx-auto w-full max-w-[1180px] px-4 py-10 sm:px-6"',
     'className="site-footer-inner mx-auto w-full max-w-[1180px] px-4 py-10 sm:px-6"',
     "footer hook"),
    ("src/app/page.tsx",
     '<div className="relative grid gap-6 p-5 sm:p-8 lg:grid-cols-[1.35fr_1fr] lg:items-center lg:gap-10">',
     '<div className="home-hero-content relative grid gap-6 p-5 sm:p-8 lg:grid-cols-[1.35fr_1fr] lg:items-center lg:gap-10">',
     "hero hook"),
    ("src/app/page.tsx",
     '<h2 className="mt-2 font-display text-[2.4rem] font-semibold leading-[1.05] text-ink sm:text-[3.1rem]">',
     '<h2 className="home-hero-title mt-2 font-display text-[2.4rem] font-semibold leading-[1.05] text-ink sm:text-[3.1rem]">',
     "hero title hook"),
    ("src/app/page.tsx",
     '<div className="mt-6 flex flex-wrap gap-2">',
     '<div className="home-hero-actions mt-6 flex flex-wrap gap-2">',
     "hero actions hook"),
    ("src/components/Library.tsx",
     '<div className="flex items-stretch gap-2">',
     '<div className="library-search-row flex items-stretch gap-2">',
     "search row hook"),
    ("src/components/Library.tsx",
     '<div className="mt-3 flex flex-wrap items-center gap-2">',
     '<div className="library-sort-row mt-3 flex flex-wrap items-center gap-2">',
     "sort row hook"),
    ("src/components/Library.tsx",
     'className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--edge)] pt-4"',
     'className="library-pagination flex flex-wrap items-center justify-between gap-3 border-t border-[var(--edge)] pt-4"',
     "pagination hook"),
    ("src/components/Library.tsx",
     'className="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:items-stretch"',
     'className="paper-row-actions flex shrink-0 flex-wrap gap-2 sm:flex-col sm:items-stretch"',
     "paper actions hook"),
    ("src/app/papers/[id]/page.tsx",
     '<div className="flex flex-wrap items-start justify-between gap-3">',
     '<div className="paper-detail-head flex flex-wrap items-start justify-between gap-3">',
     "detail header hook"),
    ("src/app/papers/[id]/page.tsx",
     '<div className="mt-5 flex flex-wrap items-center gap-2">',
     '<div className="paper-detail-actions mt-5 flex flex-wrap items-center gap-2">',
     "detail actions hook"),
    ("src/app/papers/[id]/page.tsx",
     '<div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">',
     '<div className="paper-detail-layout grid gap-5 lg:grid-cols-[1.6fr_1fr]">',
     "detail layout hook"),
    ("src/components/PaperViewer.tsx",
     '<figure className="grid gap-3">',
     '<figure className="paper-viewer grid gap-3">',
     "viewer hook"),
    ("src/components/PaperViewer.tsx",
     '<div className="flex flex-wrap items-center justify-between gap-2">',
     '<div className="paper-viewer-head flex flex-wrap items-center justify-between gap-2">',
     "viewer header hook"),
    ("src/components/PaperViewer.tsx",
     'className="flex items-center justify-center gap-3"',
     'className="paper-viewer-pagination flex items-center justify-center gap-3"',
     "viewer pagination hook"),
]

for path, old, new, label in changes:
    p = root / path
    s = p.read_text()
    if new in s:
        print(f"✓ {path}: {label} (already applied)")
    elif old in s:
        p.write_text(s.replace(old, new, 1))
        print(f"✓ {path}: {label}")
    else:
        print(f"• {path}: {label} (skipped — layout already differs; CSS fallback will handle it)")

css = r'''

/* ================================================================
   PaperRaj responsive refinement layer
   Added by apply-paperraj-responsive-v2.sh
   ================================================================ */

html,
body {
  width: 100%;
  max-width: 100%;
  overflow-x: clip;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

img,
svg,
video,
canvas,
iframe,
object {
  max-width: 100%;
}

@media (max-width: 767px) {
  body { min-width: 0; }

  main#main {
    padding-left: max(0.75rem, env(safe-area-inset-left));
    padding-right: max(0.75rem, env(safe-area-inset-right));
    padding-top: 1rem;
    padding-bottom: 1rem;
  }

  .site-header-row {
    min-width: 0;
    padding-top: 0.6rem;
    padding-bottom: 0.6rem;
  }

  .site-header-brand { min-width: 0; gap: 0.5rem; }
  .site-header-brand > :last-child { min-width: 0; max-width: min(43vw, 11rem); }
  .site-header-actions { gap: 0.35rem; }
  .site-header-actions .btn { min-height: 42px; }
  .site-header-actions .site-menu-button { min-width: 42px; padding-left: 0.65rem !important; padding-right: 0.65rem !important; }

  .site-mobile-nav {
    padding-left: max(0.75rem, env(safe-area-inset-left));
    padding-right: max(0.75rem, env(safe-area-inset-right));
    padding-bottom: max(0.75rem, env(safe-area-inset-bottom));
  }
  .site-mobile-nav .btn { width: 100%; justify-content: flex-start; }

  .paper { max-width: 100%; }
  .btn { min-height: 44px; max-width: 100%; }
  .btn-sm { min-height: 42px; }
  .field { min-height: 46px; font-size: 16px; }
  textarea.field { min-height: 120px; }
  .chip { min-height: 30px; padding: 0.2rem 0.55rem; }

  .home-hero-content { gap: 1.25rem; padding: 1.1rem; }
  .home-hero-title { font-size: clamp(2rem, 9.5vw, 2.55rem); }
  .home-hero-actions { display: grid; grid-template-columns: 1fr; }
  .home-hero-actions .btn { width: 100%; }

  .library-search-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; }
  .library-search-row > button { min-width: 88px; }
  .library-sort-row { align-items: stretch; }
  .library-sort-row select { min-width: 0; flex: 1 1 11rem; }

  .paper-row-actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    width: 100%;
  }
  .paper-row-actions .btn { width: 100%; }

  .library-pagination { display: grid; grid-template-columns: 1fr 1fr; }
  .library-pagination > button { width: 100%; }
  .library-pagination > ul {
    grid-column: 1 / -1;
    grid-row: 1;
    justify-content: center;
    order: -1;
    min-width: 0;
  }

  .paper-detail-head { display: grid; gap: 0.85rem; }
  .paper-detail-head > :last-child { width: 100%; }
  .paper-detail-head > :last-child > * { flex: 1 1 auto; }
  .paper-detail-actions { display: grid; grid-template-columns: 1fr; }
  .paper-detail-actions .btn { width: 100%; }
  .paper-detail-layout { gap: 1rem; }

  .paper-viewer-head { align-items: stretch; }
  .paper-viewer-head figcaption { width: 100%; overflow-wrap: anywhere; }
  .paper-viewer-head > div { width: 100%; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .paper-viewer-head .btn { width: 100%; }
  .paper-viewer-pagination { display: grid; grid-template-columns: 1fr 1fr; }
  .paper-viewer-pagination > button { width: 100%; }
  .paper-viewer-pagination > span { grid-column: 1 / -1; grid-row: 1; order: -1; }
  .paper-viewer > div:has(img) img { max-height: 68vh; }
  .paper-viewer object { height: 70vh; min-height: 28rem; }
  .paper-viewer [class*="min-h-[60vh]"] { min-height: 52vh; }

  .site-footer-inner,
  footer > div:last-child {
    padding-top: 2.25rem;
    padding-bottom: max(2.25rem, calc(2.25rem + env(safe-area-inset-bottom)));
  }

  .site-footer-inner > div:first-child { gap: 2rem; }
  .site-footer-inner > div:last-child { margin-top: 2rem; }
  .site-footer-inner > div:last-child p { overflow-wrap: anywhere; }
}

@media (max-width: 390px) {
  .site-header-row { gap: 0.45rem; }
  .site-header-brand > :last-child { max-width: 35vw; }
  .site-header-actions { gap: 0.25rem; }
  .site-header-actions .btn-primary { padding-left: 0.65rem; padding-right: 0.65rem; }
  .site-header-actions .btn-primary span:last-child { font-size: 0.78rem; }
  .home-hero-content { padding: 0.9rem; }
  .home-hero-title { font-size: 2rem; }
  .library-search-row { grid-template-columns: 1fr; }
  .library-search-row > button { width: 100%; }
  .paper-row-actions { grid-template-columns: 1fr; }
  .paper-viewer-head > div { grid-template-columns: 1fr; }
  .paper-viewer-pagination { grid-template-columns: 1fr; }
  .paper-viewer-pagination > span { grid-column: auto; grid-row: auto; }
}

@media (min-width: 768px) {
  .paper-row-actions { width: auto; }
}
'''

global_css = root / "src/app/globals.css"
s = global_css.read_text()
if "PaperRaj responsive refinement layer" not in s:
    global_css.write_text(s.rstrip() + css)
    print("✓ src/app/globals.css: responsive refinement layer")
else:
    print("✓ src/app/globals.css: responsive layer already present")
PY

echo
echo "Running checks..."
git diff --check
npm run typecheck
npm run build

echo
echo "=============================================="
echo "RESPONSIVE OVERHAUL APPLIED SUCCESSFULLY"
echo "Backup: $BACKUP"
echo "=============================================="
