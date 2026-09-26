import Link from "next/link";
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

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-[var(--edge-strong)] bg-[rgba(231,218,191,0.55)]">
      <div
        aria-hidden
        className="h-[3px] w-full"
        style={{
          background:
            "linear-gradient(90deg,#3b2715,#7a5330 22%,#a9853f 50%,#7a5330 78%,#3b2715)",
        }}
      />
      <div className="mx-auto w-full max-w-[1180px] px-4 pb-[calc(2.5rem+env(safe-area-inset-bottom))] pt-10 sm:px-6">
        <div className="grid gap-9 md:grid-cols-[1.4fr_repeat(3,minmax(0,1fr))]">
          <div>
            <div className="flex items-center gap-3">
              <Logo size={44} />
              <span className="font-display text-2xl font-semibold text-ink">
                Paper<span className="text-wood-2">Raj</span>
              </span>
            </div>
            <p className="mt-4 max-w-sm font-serif-papr text-[0.95rem] leading-relaxed text-ink-2">
              {SITE.description}
            </p>
            <p className="mt-3 font-serif-papr text-[0.95rem] italic text-ink-3">
              “{SITE.tagline}”
            </p>
            <a
              href={`mailto:${SITE.ownerEmail}`}
              className="link-ink mt-4 inline-block text-sm"
            >
              {SITE.ownerEmail}
            </a>
          </div>

          {LINK_GROUPS.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <h2 className="smallcaps mb-3 text-[0.78rem] font-bold text-ink-3">
                {group.title}
              </h2>
              <ul className="grid gap-2">
                {group.links.map((link) => (
                  <li key={link.href}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="text-[0.9rem] text-ink-2 transition-colors hover:text-ink"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-[0.9rem] text-ink-2 transition-colors hover:text-ink"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-9 flex flex-col gap-3 border-t border-[var(--edge)] pt-5 text-[0.8rem] text-ink-3 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {SITE.legalName} · PaperRaj. Built for students,
            teachers and archivists.
          </p>
          <p className="flex items-center gap-3">
            <span>Installable on Android &amp; iPhone</span>
            {/* Discreet librarian entrance — not a security mechanism. */}
            <Link
              href="/admin"
              aria-label="Librarian desk"
              title="Librarian desk"
              className="rounded-sm px-1 text-ink-3/70 transition-colors hover:text-gold"
            >
              ✦
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
