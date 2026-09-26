/**
 * PaperRaj — relational schema (PostgreSQL / Supabase)
 *
 * Everything is defined with Drizzle ORM so the same schema runs against a
 * local Postgres instance and against Supabase (Supabase *is* Postgres).
 * The equivalent raw SQL (with RLS + storage policies) lives in
 * `supabase/migrations/*.sql` for people who provision Supabase directly.
 */
import {
  bigint,
  customType,
  index,
  integer,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/** Raw binary column used by the local/database storage fallback. */
const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return "bytea";
  },
});

/* ------------------------------------------------------------------ */
/* People                                                              */
/* ------------------------------------------------------------------ */

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Supabase Auth user id (auth.users.id) when Supabase Auth is enabled. */
    authUserId: text("auth_user_id"),
    email: text("email").notNull(),
    /** Only used by the built-in local auth provider. */
    passwordHash: text("password_hash"),
    fullName: text("full_name"),
    school: text("school"),
    contact: text("contact"),
    /** "user" | "admin" */
    role: text("role").notNull().default("user"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("profiles_email_key").on(t.email),
    uniqueIndex("profiles_auth_user_id_key").on(t.authUserId),
    index("profiles_role_idx").on(t.role),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    token: text("token").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("sessions_user_id_idx").on(t.userId)],
);

export const passwordResets = pgTable(
  "password_resets",
  {
    token: text("token").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("password_resets_user_id_idx").on(t.userId)],
);

/* ------------------------------------------------------------------ */
/* Papers (the library)                                                */
/* ------------------------------------------------------------------ */

export const papers = pgTable(
  "papers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Case-insensitively unique across the whole library. */
    fileName: text("file_name").notNull(),
    ownerId: uuid("owner_id").references(() => profiles.id, { onDelete: "set null" }),
    /** Display name for guest uploads (no account). */
    uploaderName: text("uploader_name").notNull(),
    classLevel: text("class_level"),
    board: text("board"),
    subject: text("subject"),
    exam: text("exam"),
    year: integer("year"),
    school: text("school"),
    /** "Year Paper" | "Specimen Paper" | ... */
    paperType: text("paper_type"),
    description: text("description"),
    fileSize: bigint("file_size", { mode: "number" }).notNull(),
    fileExt: text("file_ext").notNull(),
    mimeType: text("mime_type").notNull(),
    storageBucket: text("storage_bucket").notNull(),
    storagePath: text("storage_path").notNull(),
    /** "PENDING" | "APPROVED" */
    status: text("status").notNull().default("PENDING"),
    downloadCount: integer("download_count").notNull().default(0),
    likeCount: integer("like_count").notNull().default(0),
    dislikeCount: integer("dislike_count").notNull().default(0),
    commentCount: integer("comment_count").notNull().default(0),
    openReportCount: integer("open_report_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("papers_file_name_key").on(t.fileName),
    index("papers_owner_id_idx").on(t.ownerId),
    index("papers_status_idx").on(t.status),
    index("papers_created_at_idx").on(t.createdAt),
    index("papers_subject_idx").on(t.subject),
    index("papers_class_idx").on(t.classLevel),
    index("papers_board_idx").on(t.board),
    index("papers_exam_idx").on(t.exam),
    index("papers_year_idx").on(t.year),
    index("papers_paper_type_idx").on(t.paperType),
    index("papers_download_count_idx").on(t.downloadCount),
  ],
);

/** Local storage fallback (only used when Supabase Storage is not configured). */
export const fileBlobs = pgTable(
  "file_blobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    paperId: uuid("paper_id")
      .notNull()
      .references(() => papers.id, { onDelete: "cascade" }),
    data: bytea("data").notNull(),
  },
  (t) => [uniqueIndex("file_blobs_paper_id_key").on(t.paperId)],
);

/** Individual image pages belonging to a multi-image paper. */
export const paperPages = pgTable(
  "paper_pages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    paperId: uuid("paper_id")
      .notNull()
      .references(() => papers.id, { onDelete: "cascade" }),
    pageNumber: integer("page_number").notNull(),
    fileName: text("file_name").notNull(),
    fileSize: bigint("file_size", { mode: "number" }).notNull(),
    mimeType: text("mime_type").notNull(),
    storageBucket: text("storage_bucket").notNull(),
    storagePath: text("storage_path").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("paper_pages_paper_page_key").on(t.paperId, t.pageNumber),
    index("paper_pages_paper_id_idx").on(t.paperId),
  ],
);

/* ------------------------------------------------------------------ */
/* Engagement                                                          */
/* ------------------------------------------------------------------ */

export const comments = pgTable(
  "comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    paperId: uuid("paper_id")
      .notNull()
      .references(() => papers.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    authorName: text("author_name").notNull(),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("comments_paper_id_idx").on(t.paperId),
    index("comments_user_id_idx").on(t.userId),
    index("comments_created_at_idx").on(t.createdAt),
  ],
);

export const votes = pgTable(
  "votes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    paperId: uuid("paper_id")
      .notNull()
      .references(() => papers.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    /** 1 = like, -1 = dislike */
    value: smallint("value").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("votes_paper_user_key").on(t.paperId, t.userId),
    index("votes_paper_id_idx").on(t.paperId),
  ],
);

export const reports = pgTable(
  "reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    paperId: uuid("paper_id")
      .notNull()
      .references(() => papers.id, { onDelete: "cascade" }),
    reporterId: uuid("reporter_id").references(() => profiles.id, { onDelete: "set null" }),
    reporterName: text("reporter_name"),
    reason: text("reason").notNull(),
    details: text("details"),
    /** "OPEN" | "RESOLVED" */
    status: text("status").notNull().default("OPEN"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("reports_paper_id_idx").on(t.paperId),
    index("reports_status_idx").on(t.status),
  ],
);

/* ------------------------------------------------------------------ */
/* Platform data                                                       */
/* ------------------------------------------------------------------ */

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const teachers = pgTable(
  "teachers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    subject: text("subject"),
    school: text("school"),
    contact: text("contact"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("teachers_subject_idx").on(t.subject)],
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorId: uuid("actor_id").references(() => profiles.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    targetType: text("target_type"),
    targetId: text("target_id"),
    details: text("details"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("audit_logs_created_at_idx").on(t.createdAt)],
);

export type Paper = typeof papers.$inferSelect;
export type PaperPage = typeof paperPages.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type Teacher = typeof teachers.$inferSelect;
