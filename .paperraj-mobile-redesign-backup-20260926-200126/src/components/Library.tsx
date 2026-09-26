"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatBytes, formatDateTime, formatNumber } from "@/lib/format";
import { SORT_OPTIONS } from "@/lib/site";
import type { PaperListItem } from "@/lib/papers";

export type LibraryFilters = {
  q?: string;
  classLevel?: string;
  board?: string;
  subject?: string;
  exam?: string;
  year?: string;
  paperType?: string;
  school?: string;
  fileExt?: string;
};

export type FacetGroup = { value: string; count: number }[];
export type Facets = Record<string, FacetGroup>;

const FILTER_DEFS: { key: keyof LibraryFilters; label: string; facetKey: string }[] = [
  { key: "classLevel", label: "Class", facetKey: "classLevel" },
  { key: "board", label: "Board", facetKey: "board" },
  { key: "subject", label: "Subject", facetKey: "subject" },
  { key: "exam", label: "Exam", facetKey: "exam" },
  { key: "year", label: "Year", facetKey: "year" },
  { key: "paperType", label: "Paper type", facetKey: "paperType" },
  { key: "school", label: "School", facetKey: "school" },
];

export function Library({
  preset,
  syncUrl = false,
  showFileTypeFilter = true,
}: {
  preset?: LibraryFilters;
  syncUrl?: boolean;
  showFileTypeFilter?: boolean;
}) {
  const [query, setQuery] = useState(preset?.q ?? "");
  const [debouncedQuery, setDebouncedQuery] = useState(preset?.q ?? "");
  const [sort, setSort] = useState("newest");
  const [filters, setFilters] = useState<LibraryFilters>(preset ?? {});
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{
    items: PaperListItem[];
    total: number;
    totalPages: number;
    page: number;
  } | null>(null);
  const [facets, setFacets] = useState<Facets>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const firstLoad = useRef(true);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query.trim()), 320);
    return () => clearTimeout(id);
  }, [query]);

  useEffect(() => {
    fetch("/api/filters", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { facets?: Facets }) => setFacets(d.facets ?? {}))
      .catch(() => undefined);
  }, []);

  const search = useMemo(() => {
    const params = new URLSearchParams();
    if (debouncedQuery) params.set("q", debouncedQuery);
    if (sort !== "newest") params.set("sort", sort);
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key === "classLevel" ? "class" : key === "fileExt" ? "fileType" : key, value);
    });
    if (page > 1) params.set("page", String(page));
    return params.toString();
  }, [debouncedQuery, filters, sort, page]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/papers?${search}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Request failed");
      const json = await res.json();
      setData(json);
    } catch {
      setError("We could not reach the library shelves. Check your connection and try again.");
    } finally {
      setLoading(false);
      firstLoad.current = false;
    }
  }, [search]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!syncUrl) return;
    const url = search ? `?${search}` : window.location.pathname;
    window.history.replaceState(null, "", url);
  }, [search, syncUrl]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, filters, sort]);

  const activeFilterCount = Object.values(filters).filter(Boolean).length + (debouncedQuery ? 1 : 0);

  const rangeStart = data && data.total > 0 ? (data.page - 1) * 100 + 1 : 0;
  const rangeEnd = data ? Math.min(data.page * 100, data.total) : 0;

  return (
    <section aria-label="Paper library" className="paperraj-library grid gap-4">
      {/* ---------------------------------------------- search */}
      <div className="paper paper-lined p-4 sm:p-5">
        <label htmlFor="paperraj-search" className="label">
          Search the catalogue
        </label>
        <div className="library-search-row flex items-stretch gap-2">
          <div className="relative flex-1">
            <span
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3"
            >
              🔍
            </span>
            <input
              id="paperraj-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by filename, subject, uploader..."
              className="field !min-h-[50px] pl-10 text-[1rem]"
              autoComplete="off"
            />
          </div>
          <button
            type="button"
            className="btn !min-h-[50px] md:hidden"
            aria-expanded={showFilters}
            onClick={() => setShowFilters((v) => !v)}
          >
            Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
          </button>
        </div>

        <div className="library-sort-row mt-3 flex flex-wrap items-center gap-2">
          <label htmlFor="paperraj-sort" className="smallcaps text-[0.72rem] font-bold text-ink-3">
            Sort
          </label>
          <select
            id="paperraj-sort"
            className="field !min-h-[42px] w-auto py-1"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn btn-ghost btn-sm hidden md:inline-flex"
            aria-expanded={showFilters}
            onClick={() => setShowFilters((v) => !v)}
          >
            {showFilters ? "Hide filters" : "Show filters"}
            {activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
          </button>
          {activeFilterCount > 0 && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setFilters({});
                setQuery("");
              }}
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* ---------------------------------------------- filters */}
      {showFilters && (
        <div className="paper animate-fade p-4 sm:p-5">
          <h2 className="smallcaps mb-3 text-[0.78rem] font-bold text-ink-3">Refine the search</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {FILTER_DEFS.map((def) => (
              <div key={def.key}>
                <label htmlFor={`filter-${def.key}`} className="label">
                  {def.label}
                </label>
                <select
                  id={`filter-${def.key}`}
                  className="field !min-h-[42px]"
                  value={(filters[def.key] as string) ?? ""}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, [def.key]: e.target.value || undefined }))
                  }
                >
                  <option value="">All</option>
                  {(facets[def.facetKey] ?? []).map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.value} ({item.count})
                    </option>
                  ))}
                </select>
              </div>
            ))}
            {showFileTypeFilter && (
              <div>
                <label htmlFor="filter-fileType" className="label">
                  File type
                </label>
                <select
                  id="filter-fileType"
                  className="field !min-h-[42px]"
                  value={filters.fileExt ?? ""}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, fileExt: e.target.value || undefined }))
                  }
                >
                  <option value="">All</option>
                  <option value="pdf">PDF</option>
                  <option value="jpg">JPG</option>
                  <option value="jpeg">JPEG</option>
                  <option value="png">PNG</option>
                  <option value="webp">WebP</option>
                </select>
              </div>
            )}
          </div>
          <p className="mt-3 text-[0.78rem] text-ink-3">
            Filter values are built from what contributors have already catalogued, so the list
            grows with the archive.
          </p>
        </div>
      )}

      {/* ---------------------------------------------- count */}
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--edge-strong)] pb-2">
        <p className="font-display text-[1.15rem] text-ink">
          {loading && !data ? (
            <span className="skeleton inline-block h-6 w-40" />
          ) : (
            <>
              {formatNumber(data?.total ?? 0)}{" "}
              {(data?.total ?? 0) === 1 ? "file found" : "files found"}
            </>
          )}
        </p>
        {data && data.total > 0 && (
          <p className="text-[0.8rem] text-ink-3">
            Showing {formatNumber(rangeStart)}–{formatNumber(rangeEnd)}
          </p>
        )}
      </div>

      {/* ---------------------------------------------- list */}
      {error ? (
        <EmptyState
          icon="🕯️"
          title="The library is unreachable"
          body={error}
          action={
            <button type="button" className="btn btn-primary" onClick={() => void load()}>
              Try again
            </button>
          }
        />
      ) : loading && !data ? (
        <div className="grid gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="paper p-4">
              <div className="skeleton h-5 w-2/3" />
              <div className="skeleton mt-3 h-4 w-1/3" />
              <div className="skeleton mt-4 h-8 w-1/2" />
            </div>
          ))}
        </div>
      ) : data && data.items.length === 0 ? (
        <EmptyState
          icon="📜"
          title="No papers on this shelf yet"
          body="Try a different spelling, remove a filter, or be the first to contribute a paper to this part of the archive."
          action={
            <Link href="/upload" className="btn btn-primary">
              Upload a paper
            </Link>
          }
        />
      ) : (
        <ul className="grid gap-3">
          {(data?.items ?? []).map((paper, index) => (
            <li key={paper.id} className="animate-rise" style={{ animationDelay: `${index * 18}ms` }}>
              <PaperRow paper={paper} />
            </li>
          ))}
        </ul>
      )}

      {/* ---------------------------------------------- pagination */}
      {data && data.totalPages > 1 && (
        <nav
          aria-label="Pagination"
          className="library-pagination flex flex-wrap items-center justify-between gap-3 border-t border-[var(--edge)] pt-4"
        >
          <button
            type="button"
            className="btn btn-sm"
            disabled={data.page <= 1}
            onClick={() => {
              setPage((p) => Math.max(1, p - 1));
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            ← Previous
          </button>
          <ul className="flex flex-wrap items-center gap-1">
            {pageWindow(data.page, data.totalPages).map((p) =>
              p === "…" ? (
                <li key={`gap-${p}-${Math.random()}`} className="px-2 text-ink-3">
                  …
                </li>
              ) : (
                <li key={p}>
                  <button
                    type="button"
                    aria-current={p === data.page ? "page" : undefined}
                    className={`min-h-[40px] min-w-[40px] rounded-sm border text-sm transition-colors ${
                      p === data.page
                        ? "border-wood bg-wood font-semibold text-parchment"
                        : "border-[var(--edge)] text-ink-2 hover:bg-[rgba(169,133,63,0.14)]"
                    }`}
                    onClick={() => {
                      setPage(p);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    {p}
                  </button>
                </li>
              ),
            )}
          </ul>
          <button
            type="button"
            className="btn btn-sm"
            disabled={data.page >= data.totalPages}
            onClick={() => {
              setPage((p) => Math.min(data.totalPages, p + 1));
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            Next →
          </button>
        </nav>
      )}
    </section>
  );
}

export function PaperRow({ paper }: { paper: PaperListItem }) {
  const [imageFailed, setImageFailed] = useState(false);
  const isImage = ["jpg", "jpeg", "png", "webp", "images"].includes(paper.fileExt);
  return (
    <article className="paperraj-paper-row paper row-hover overflow-hidden">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:gap-4 sm:p-5">
        {isImage && !imageFailed && (
          <Link
            href={`/papers/${paper.id}`}
            className="relative hidden h-[92px] w-[70px] shrink-0 overflow-hidden rounded-sm border border-[var(--edge-strong)] bg-parchment-2 sm:block"
            aria-hidden
            tabIndex={-1}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/papers/${paper.id}/view`}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover"
              onError={() => setImageFailed(true)}
            />
          </Link>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-[1.18rem] leading-snug text-ink sm:text-[1.28rem]">
            <Link href={`/papers/${paper.id}`} className="hover:text-accent">
              {paper.fileName}
            </Link>
          </h3>
          <p className="mt-1 text-[0.82rem] text-ink-3">
            Uploaded by <span className="font-semibold text-ink-2">{paper.uploaderName}</span> ·{" "}
            {formatDateTime(paper.createdAt)} · {formatBytes(paper.fileSize)}
          </p>
          <ul className="mt-2.5 flex flex-wrap gap-1.5">
            {paper.classLevel && (
              <li>
                <Link href={`/papers?class=${encodeURIComponent(paper.classLevel)}`} className="chip">
                  {paper.classLevel}
                </Link>
              </li>
            )}
            {paper.board && (
              <li>
                <Link href={`/papers?board=${encodeURIComponent(paper.board)}`} className="chip">
                  {paper.board}
                </Link>
              </li>
            )}
            {paper.exam && (
              <li>
                <Link href={`/papers?exam=${encodeURIComponent(paper.exam)}`} className="chip">
                  {paper.exam}
                </Link>
              </li>
            )}
            {paper.subject && (
              <li>
                <Link
                  href={`/papers?subject=${encodeURIComponent(paper.subject)}`}
                  className="chip chip-subject"
                >
                  {paper.subject}
                </Link>
              </li>
            )}
            {paper.paperType && (
              <li>
                <Link
                  href={`/papers?type=${encodeURIComponent(paper.paperType)}`}
                  className="chip chip-type"
                >
                  {paper.paperType}
                </Link>
              </li>
            )}
            {paper.year && (
              <li>
                <Link href={`/papers?year=${paper.year}`} className="chip">
                  {paper.year}
                </Link>
              </li>
            )}
          </ul>
          <p className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.76rem] text-ink-3">
            {paper.downloadCount > 0 && <span>{formatNumber(paper.downloadCount)} downloads</span>}
            {paper.likeCount > 0 && <span>👍 {formatNumber(paper.likeCount)}</span>}
            {paper.dislikeCount > 0 && <span>👎 {formatNumber(paper.dislikeCount)}</span>}
            {paper.commentCount > 0 && <span>💬 {formatNumber(paper.commentCount)}</span>}
          </p>
        </div>
        <div className="paper-row-actions flex shrink-0 flex-wrap gap-2 sm:flex-col sm:items-stretch">
          <Link href={`/papers/${paper.id}`} className="btn btn-sm min-w-0">
            Details
          </Link>
          <Link
            href={`/papers/${paper.id}#paper-reader`}
            className="btn btn-sm min-w-0"
          >
            View
          </Link>
          <a href={`/api/papers/${paper.id}/download`} className="btn btn-primary btn-sm col-span-2 sm:col-span-1">
            Download
          </a>
        </div>
      </div>
    </article>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: string;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="paper flex flex-col items-center gap-3 px-5 py-12 text-center">
      <span aria-hidden className="text-4xl opacity-80">
        {icon}
      </span>
      <h3 className="font-display text-[1.4rem] text-ink">{title}</h3>
      <p className="max-w-md font-serif-papr text-[0.95rem] leading-relaxed text-ink-2">{body}</p>
      {action}
    </div>
  );
}

function pageWindow(page: number, totalPages: number): (number | "…")[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const pages: (number | "…")[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);
  if (start > 2) pages.push("…");
  for (let i = start; i <= end; i += 1) pages.push(i);
  if (end < totalPages - 1) pages.push("…");
  pages.push(totalPages);
  return pages;
}
