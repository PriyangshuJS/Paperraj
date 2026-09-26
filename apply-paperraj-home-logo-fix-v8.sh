#!/bin/bash
set -euo pipefail
ROOT="$(pwd)"
if [ ! -f "$ROOT/package.json" ] || [ ! -d "$ROOT/src" ]; then echo "ERROR: Run from PaperRaj project root."; exit 1; fi
BACKUP="$ROOT/.paperraj-home-logo-fix-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP"
backup(){ local f="$1"; if [ -f "$ROOT/$f" ]; then mkdir -p "$BACKUP/$(dirname "$f")"; cp "$ROOT/$f" "$BACKUP/$f"; fi; }
for f in src/app/page.tsx src/components/Logo.tsx src/components/SiteHeader.tsx src/components/SiteFooter.tsx src/app/globals.css; do backup "$f"; done
python3 - "$ROOT" <<'PY'
from pathlib import Path
import re, sys
root=Path(sys.argv[1])

def patch(rel, fn, label):
 p=root/rel; s=p.read_text(encoding='utf-8'); out=fn(s)
 if out!=s: p.write_text(out,encoding='utf-8'); print(f'✓ {rel}: {label}')
 else: print(f'✓ {rel}: {label} (already applied)')

# Remove any accidental full-logo usage from the homepage. The homepage should begin with the product purpose.
def home(s):
 s=re.sub(r'^import\s*\{\s*Logo\s*\}\s*from\s*["\']@/components/Logo["\'];\n','',s,flags=re.M)
 s=re.sub(r'\s*<Logo(?:\s+[^>]*)?\s*/>\s*','\n',s)
 s=s.replace('className="paper paper-lined overflow-hidden"','className="paper paper-lined overflow-hidden"')
 return s
patch('src/app/page.tsx',home,'removed accidental homepage logo')

# Make the supplied full logo intrinsically safe everywhere: it can never become a giant/cropped image.
def logo(s):
 return '''export function Logo({ size = 44, className = "" }: { size?: number; className?: string }) {
  const width = Math.round(size * 1.5);
  return (
    <img
      src="/paperraj-logo.png"
      width={width}
      height={size}
      alt="PaperRaj"
      className={`paperraj-brand-logo block max-h-full max-w-full object-contain object-center ${className}`}
      style={{ maxWidth: "100%", height: "auto" }}
      draggable={false}
    />
  );
}

export function LogoWordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`font-display font-semibold text-ink ${compact ? "text-xl" : "text-2xl"}`}>
      Paper<span className="text-wood-2">Raj</span>
    </span>
  );
}
'''
patch('src/components/Logo.tsx',logo,'safe non-cropping logo component')

# Header: compact brand lockup, never let the full logo determine header height.
def header(s):
 s=re.sub(r'<Logo\s+size=\{\d+\}\s+className="[^"]*"\s*/>', '<Logo size={42} className="h-9 w-auto sm:h-11" />', s, count=1)
 s=s.replace('className="flex shrink-0 items-center rounded-sm"','className="flex h-10 max-w-[170px] shrink-0 items-center overflow-hidden rounded-sm sm:h-12 sm:max-w-[205px]"',1)
 return s
patch('src/components/SiteHeader.tsx',header,'compact non-growing header logo')

# Footer: compact full logo, never duplicate it with a text wordmark.
def footer(s):
 s=s.replace('<Logo size={46} />','<Logo size={48} className="h-10 w-auto" />')
 s=s.replace('<Logo size={64} className="h-12 w-auto" />','<Logo size={56} className="h-10 w-auto" />')
 s=re.sub(r'\s*<span className="font-display text-2xl font-semibold text-ink">Paper<span className="text-wood-2">Raj</span></span>','',s)
 return s
patch('src/components/SiteFooter.tsx',footer,'compact footer branding')

# Global guard: even if an accidental logo is rendered in a constrained area, it cannot blow up the page.
def css(s):
 marker='/* PaperRaj mobile brand safety */'
 if marker in s: return s
 return s+'\n'+marker+'''\n.paperraj-brand-logo {\n  display: block;\n  max-width: 100%;\n  width: auto;\n  height: auto;\n  object-fit: contain;\n  object-position: center;\n}\n@media (max-width: 767px) {\n  .paperraj-brand-logo { max-height: 42px; }\n}\n'''
patch('src/app/globals.css',css,'logo overflow guard')
PY

echo
echo 'Running checks...'
git diff --check
npm run typecheck
npm run build

echo
echo '=============================================='
echo 'PAPERRAJ HOME/LOGO CORRECTION PASSED'
echo '=============================================='
echo "Backup: $BACKUP"
echo 'No commit or push was performed.'
