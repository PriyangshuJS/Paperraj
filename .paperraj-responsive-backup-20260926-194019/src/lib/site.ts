/**
 * Single source of truth for brand strings, navigation and contact links.
 * Values can be overridden with environment variables so nothing is duplicated
 * or hardcoded across components.
 */
export const SITE = {
  name: "PaperRaj",
  legalName: "PAPERRA J",
  tagline: "The place to find and share school question papers.",
  description:
    "PaperRaj is a community-driven platform where students and contributors can upload, discover, and share school examination question papers.",
  ownerEmail: process.env.PUBLIC_OWNER_EMAIL ?? "paperraj.library@gmail.com",
  youtubeUrl: process.env.PUBLIC_YOUTUBE_URL ?? "https://www.youtube.com/@paperraj",
  ownerName: process.env.PUBLIC_OWNER_NAME ?? "The PaperRaj Librarian",
} as const;

export const PAPER_TYPES = ["Year Paper", "Specimen Paper"] as const;

export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/papers", label: "All Papers" },
  { href: "/year-papers", label: "Year Papers" },
  { href: "/specimen-papers", label: "Specimen Papers" },
  { href: "/subjects", label: "Subjects" },
  { href: "/classes", label: "Classes" },
  { href: "/boards", label: "Boards" },
  { href: "/upload", label: "Upload" },
  { href: "/my-uploads", label: "My Uploads" },
  { href: "/about", label: "About" },
  { href: "/teachers", label: "Teachers" },
  { href: "/contact", label: "Contact" },
] as const;

export const REPORT_REASONS = [
  "Incorrect content",
  "Duplicate",
  "Inappropriate",
  "Wrong metadata",
  "Suspicious file",
  "Other",
] as const;

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "name-asc", label: "Name A–Z" },
  { value: "name-desc", label: "Name Z–A" },
  { value: "downloads", label: "Most downloaded" },
  { value: "likes", label: "Most liked" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];
