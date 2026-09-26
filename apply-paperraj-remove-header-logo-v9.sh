#!/bin/bash
set -euo pipefail
ROOT="$(pwd)"
if [ ! -f "$ROOT/package.json" ] || [ ! -d "$ROOT/src" ]; then
  echo "ERROR: Run this from the PaperRaj project root."
  exit 1
fi

BACKUP="$ROOT/.paperraj-remove-header-logo-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP/src/components"
cp "$ROOT/src/components/SiteHeader.tsx" "$BACKUP/src/components/SiteHeader.tsx"
cp "$ROOT/src/app/globals.css" "$BACKUP/src/app/globals.css"

echo "✓ Backup created: $BACKUP"

python3 - "$ROOT" <<'PY'
from pathlib import Path
import re, sys

root = Path(sys.argv[1])
header_path = root / "src/components/SiteHeader.tsx"
css_path = root / "src/app/globals.css"
s = header_path.read_text(encoding="utf-8")

# Remove the supplied full-size logo from the header brand area only.
# Keep the header compact and let the browser/PWA icon handle the emblem branding.
pattern = re.compile(
    r'(<Link\s+\n?\s*href="/"\s+\n?\s*className="[^"]*"\s+\n?\s*aria-label="PaperRaj home"\s+\n?\s*>)(.*?)(</Link>)',
    re.S,
)

m = pattern.search(s)
if not m:
    # Some later versions may have formatted the Link differently.
    pattern2 = re.compile(r'(<Link\b(?=[^>]*href="/"\b)(?=[^>]*aria-label="PaperRaj home"\b)[^>]*>)(.*?)(</Link>)', re.S)
    m = pattern2.search(s)
    pattern = pattern2

if not m:
    print("ERROR: Could not find the PaperRaj home brand link in SiteHeader.tsx.")
    print("No files were changed by this script.")
    raise SystemExit(2)

replacement = '''<Link
            href="/"
            className="flex min-w-0 shrink-0 items-center rounded-sm"
            aria-label="PaperRaj home"
          >
            <span className="font-display text-[1.45rem] font-semibold tracking-[-0.02em] text-ink sm:text-[1.7rem]">
              Paper<span className="text-wood-2">Raj</span>
            </span>
          </Link>'''

s = s[:m.start()] + replacement + s[m.end():]

# The full-logo import is no longer needed if it is now unused.
s = re.sub(r'import\s*\{\s*Logo\s*\}\s*from\s*["\']@/components/Logo["\'];\n', '', s)
s = re.sub(r'import\s*\{\s*Logo,\s*LogoWordmark\s*\}\s*from\s*["\']@/components/Logo["\'];\n', '', s)

header_path.write_text(s, encoding="utf-8")
print("✓ SiteHeader: removed oversized full logo from header")
print("✓ SiteHeader: replaced it with compact PaperRaj wordmark")

# Add a defensive class for any accidental header brand image left by an older layer.
css = css_path.read_text(encoding="utf-8")
marker = "/* PaperRaj compact header brand v9 */"
if marker not in css:
    css += '''\n\n/* PaperRaj compact header brand v9 */\n@media (max-width: 767px) {\n  header img[alt="PaperRaj"] {\n    max-height: 44px !important;\n    width: auto !important;\n  }\n}\n'''
    css_path.write_text(css, encoding="utf-8")
    print("✓ globals.css: added compact header-logo safety guard")
else:
    print("✓ globals.css: compact header-logo safety guard already present")
PY

echo
echo "Running checks..."
git diff --check
npm run typecheck
npm run build

echo
echo "=============================================="
echo "PAPERRAJ HEADER LOGO REMOVAL PASSED"
echo "=============================================="
echo "Backup: $BACKUP"
echo "No commit or push was performed."
