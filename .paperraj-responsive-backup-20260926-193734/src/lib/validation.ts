import { PAPER_TYPES } from "@/lib/site";

export const ALLOWED_EXTENSIONS = ["pdf", "jpg", "jpeg", "png", "webp"] as const;
export type AllowedExtension = (typeof ALLOWED_EXTENSIONS)[number];

export const MIME_BY_EXT: Record<AllowedExtension, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export type FileVerdict =
  | { ok: true; ext: AllowedExtension; mime: string; size: number; name: string }
  | { ok: false; error: string };

export function getExtension(name: string): string {
  const match = /\.([a-z0-9]+)$/i.exec(name.trim());
  return match ? match[1].toLowerCase() : "";
}

/** Sniff the real file signature — never trust the file extension alone. */
function sniff(buffer: Buffer): AllowedExtension | null {
  if (buffer.length < 12) return null;
  if (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46 &&
    buffer[4] === 0x2d
  ) {
    return "pdf";
  }
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "jpg";
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "png";
  }
  if (
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "webp";
  }
  return null;
}

export function validateFile(
  file: { name: string; size: number; type?: string },
  buffer: Buffer,
  maxUploadMb: number,
): FileVerdict {
  const rawName = (file.name ?? "").trim();
  if (!rawName) return { ok: false, error: "Please choose a file to upload." };

  const ext = getExtension(rawName);
  if (!ALLOWED_EXTENSIONS.includes(ext as AllowedExtension)) {
    return { ok: false, error: "This file type is not supported." };
  }

  const maxBytes = maxUploadMb * 1024 * 1024;
  if (file.size > maxBytes) {
    return { ok: false, error: `File exceeds the ${maxUploadMb} MB maximum.` };
  }
  if (buffer.byteLength > maxBytes) {
    return { ok: false, error: `File exceeds the ${maxUploadMb} MB maximum.` };
  }
  if (buffer.byteLength === 0) {
    return { ok: false, error: "That file appears to be empty." };
  }

  const sniffed = sniff(buffer);
  if (!sniffed) {
    return { ok: false, error: "This file type is not supported." };
  }
  // Allow jpg/jpeg to be interchangeable, otherwise require an exact match so a
  // renamed .exe cannot masquerade as a .pdf.
  const sameFamily =
    sniffed === ext ||
    ((sniffed === "jpg" || sniffed === "jpeg") && (ext === "jpg" || ext === "jpeg"));
  if (!sameFamily) {
    return { ok: false, error: "This file type is not supported." };
  }

  const safeName = sanitizeFileName(rawName);
  if (!safeName) return { ok: false, error: "Please provide a valid file name." };

  return {
    ok: true,
    ext: ext as AllowedExtension,
    mime: MIME_BY_EXT[ext as AllowedExtension],
    size: buffer.byteLength,
    name: safeName,
  };
}

/** Keep the visible name readable but strip anything unsafe for storage/URLs. */
export function sanitizeFileName(name: string): string {
  const cleaned = name
    .normalize("NFKD")
    .replace(/[\u0000-\u001f<>:"/\\|?*]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\s*\.\s*/g, ".")
    .replace(/^[. ]+/, "");
  if (cleaned.length > 180) {
    const ext = getExtension(cleaned);
    const base = cleaned.slice(0, 170).trim();
    return ext ? `${base}.${ext}` : base;
  }
  return cleaned;
}

export function cleanText(value: unknown, maxLength = 200): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.replace(/\s+/g, " ").trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
}

export function cleanMultiline(value: unknown, maxLength = 2000): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ").trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
}

export function cleanYear(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number.parseInt(String(value), 10);
  if (!Number.isFinite(n)) return null;
  if (n < 1900 || n > 2200) return null;
  return n;
}

export function cleanPaperType(value: unknown): string | null {
  const v = cleanText(value, 60);
  if (!v) return null;
  const preset = PAPER_TYPES.find((t) => t.toLowerCase() === v.toLowerCase());
  if (preset) return preset;
  return v;
}

export type PaperMetadata = {
  uploaderName: string;
  classLevel: string | null;
  board: string | null;
  subject: string | null;
  exam: string | null;
  year: number | null;
  school: string | null;
  paperType: string | null;
  description: string | null;
};

export function cleanMetadata(raw: Record<string, unknown>): PaperMetadata {
  return {
    uploaderName: cleanText(raw.uploaderName, 120) ?? "",
    classLevel: cleanText(raw.classLevel, 60),
    board: cleanText(raw.board, 80),
    subject: cleanText(raw.subject, 100),
    exam: cleanText(raw.exam, 100),
    year: cleanYear(raw.year),
    school: cleanText(raw.school, 160),
    paperType: cleanPaperType(raw.paperType),
    description: cleanMultiline(raw.description, 2000),
  };
}
