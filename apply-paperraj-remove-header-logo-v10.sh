#!/bin/bash
set -euo pipefail

ROOT="$(pwd)"

if [ ! -f "$ROOT/package.json" ] || [ ! -d "$ROOT/src" ]; then
  echo "ERROR: Run this from the PaperRaj project root."
  exit 1
fi

HEADER="$ROOT/src/components/SiteHeader.tsx"
CSS="$ROOT/src/app/globals.css"

if [ ! -f "$HEADER" ]; then
  echo "ERROR: $HEADER not found."
  exit 1
fi
if [ ! -f "$CSS" ]; then
  echo "ERROR: $CSS not found."
  exit 1
fi

BACKUP="$ROOT/.paperraj-remove-header-logo-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP/src/components" "$BACKUP/src/app"
cp "$HEADER" "$BACKUP/src/components/SiteHeader.tsx"
cp "$CSS" "$BACKUP/src/app/globals.css"

echo "✓ Backup created: $BACKUP"

python3 - "$ROOT" <<'PY'
from pathlib import Path
import re, sys

root = Path(sys.argv[1])
header_path = root / "src/components/SiteHeader.tsx"
css_path = root / "src/app/globals.css"

s = header_path.read_text(encoding="utf-8")

# Find the home-brand Link without depending on exact whitespace/classes.
patterns = [
    re.compile(r'(?P<open><Link\b(?=[^>]*\bhref=["\']/["\'])(?=[^>]*\baria-label=["\']PaperRaj home["\'])[^>]*>)(?P<body>.*?)(?P<close></Link>)', re.S),
    re.compile(r'(?P<open><Link\b(?=[^>]*\bhref=["\']/["\'])[^>]*>)(?P<body>.*?)(?P<close></Link>)', re.S),
]

match = None
used = None
for pat in patterns:
    match = pat.search(s)
    if match:
        used = pat
        break

if not match:
    print("ERROR: Could not find the PaperRaj home brand link in SiteHeader.tsx.")
    print("The backup was created and no source changes were made.")
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

s = s[:match.start()] + replacement + s[match.end():]

# Remove Logo imports if they are now unused in SiteHeader.
s = re.sub(r'^import\s*\{\s*Logo(?:\s*,\s*LogoWordmark)?\s*\}\s*from\s*["\']@/components/Logo["\'];\s*\n', '', s, flags=re.M)
s = re.sub(r'^import\s+Logo\s+from\s*["\']@/components/Logo["\'];\s*\n', '', s, flags=re.M)

header_path.write_text(s, encoding="utf-8")
print("✓ SiteHeader: removed oversized full logo from header")
print("✓ SiteHeader: replaced it with compact PaperRaj wordmark")

css = css_path.read_text(encoding="utf-8")
marker = "/* PaperRaj compact header brand v10 */"
if marker not in css:
    css += '''\n\n/* PaperRaj compact header brand v10 */\n@media (max-width: 767px) {\n  header img[alt="PaperRaj"],\n  header .paperraj-full-logo {\n    max-height: 44px !important;\n    width: auto !important;\n  }\n}\n'''
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
