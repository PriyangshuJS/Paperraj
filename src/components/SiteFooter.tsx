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

function FooterLinks({ group }: { group: (typeof LINK_GROUPS)[number] }) {
  return (
    <nav aria-label={group.title}>
      <h2 className="smallcaps mb-3 text-[0.76rem] font-bold text-ink-3">{group.title}</h2>
      <ul className="grid gap-2">
        {group.links.map((link) => (
          <li key={link.href}>
            {link.external ? (
              <a href={link.href} target="_blank" rel="noreferrer noopener" className="text-[0.9rem] text-ink-2 hover:text-ink">
                {link.label}
              </a>
            ) : (
              <Link href={link.href} className="text-[0.9rem] text-ink-2 hover:text-ink">
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
    <footer className="mt-10 border-t border-[var(--edge-strong)] bg-[rgba(231,218,191,0.55)] sm:mt-16">
      <div aria-hidden className="h-[3px] w-full bg-[linear-gradient(90deg,#3b2715,#7a5330_22%,#a9853f_50%,#7a5330_78%,#3b2715)]" />
      <div className="mx-auto w-full max-w-[1180px] px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-5 sm:px-6 sm:pb-10 sm:pt-10">
        <div className="sm:hidden">
          <div className="flex items-center"><Logo size={56} className="h-10 w-auto" /></div>
          <p className="mt-3 max-w-md font-serif-papr text-[0.86rem] leading-relaxed text-ink-2">
            {SITE.tagline}
          </p>
          <details className="mt-4 border-y border-[var(--edge)] py-2.5">
            <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-ink-2 [&::-webkit-details-marker]:hidden">
              <span>Explore PaperRaj</span><span aria-hidden className="text-lg text-gold">+</span>
            </summary>
            <div className="mt-3 grid grid-cols-2 gap-4">
              {LINK_GROUPS.map((group) => (
                <FooterLinks key={group.title} group={group} />
              ))}
            </div>
          </details>
          <div className="mt-4 flex items-center justify-between gap-3 text-[0.68rem] text-ink-3">
            <span>© {new Date().getFullYear()} {SITE.legalName}</span>
            <Link href="/admin" aria-label="Librarian desk" className="text-gold">✦</Link>
          </div>
        </div>

        <div className="hidden sm:grid sm:grid-cols-[1.4fr_repeat(3,minmax(0,1fr))] sm:gap-9">
          <div>
            <div className="flex items-center"><Logo size={72} className="h-14 w-auto" /></div>
            <p className="mt-4 max-w-sm font-serif-papr text-[0.95rem] leading-relaxed text-ink-2">{SITE.description}</p>
            <p className="mt-3 font-serif-papr text-[0.95rem] italic text-ink-3">“{SITE.tagline}”</p>
            <a href={`mailto:${SITE.ownerEmail}`} className="link-ink mt-4 inline-block text-sm">{SITE.ownerEmail}</a>
          </div>
          {LINK_GROUPS.map((group) => <FooterLinks key={group.title} group={group} />)}
        </div>

        <div className="hidden sm:flex mt-9 items-center justify-between gap-3 border-t border-[var(--edge)] pt-5 text-[0.8rem] text-ink-3">
          <p>© {new Date().getFullYear()} {SITE.legalName} · PaperRaj. Built for students, teachers and archivists.</p>
          <p className="flex items-center gap-3"><span>Installable on Android &amp; iPhone</span><Link href="/admin" aria-label="Librarian desk" className="text-ink-3/70 hover:text-gold">✦</Link></p>
        </div>
      </div>
    </footer>
  );
}
