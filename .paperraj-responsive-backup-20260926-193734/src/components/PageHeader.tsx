import Link from "next/link";
import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  lead,
  children,
}: {
  eyebrow?: string;
  title: string;
  lead?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="mb-6 grid gap-3">
      {eyebrow && (
        <p className="smallcaps text-[0.74rem] font-bold text-wood-2">{eyebrow}</p>
      )}
      <h1 className="font-display text-[2rem] font-semibold leading-tight text-ink sm:text-[2.5rem]">
        {title}
      </h1>
      {lead && (
        <p className="max-w-2xl font-serif-papr text-[1rem] leading-relaxed text-ink-2">{lead}</p>
      )}
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </header>
  );
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="paper px-4 py-4 text-center">
      <p className="font-display text-[1.75rem] font-semibold leading-none text-ink">{value}</p>
      <p className="smallcaps mt-2 text-[0.72rem] font-bold text-ink-3">{label}</p>
      {hint && <p className="mt-1 text-[0.7rem] text-ink-3/80">{hint}</p>}
    </div>
  );
}

export function ShelfLinks({
  items,
  emptyLabel = "Nothing catalogued here yet.",
}: {
  items: { href: string; label: string; count?: number }[];
  emptyLabel?: string;
}) {
  if (items.length === 0) {
    return (
      <div className="paper px-5 py-10 text-center font-serif-papr text-ink-2">{emptyLabel}</div>
    );
  }
  return (
    <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            className="paper row-hover flex items-center justify-between gap-3 px-4 py-3 text-ink-2"
          >
            <span className="font-serif-papr text-[1.02rem]">{item.label}</span>
            {item.count !== undefined && (
              <span className="chip shrink-0">{item.count}</span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
