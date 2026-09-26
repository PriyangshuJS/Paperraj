import { randomBytes, scrypt as _scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { cache } from "react";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { profiles, sessions } from "@/db/schema";

const scrypt = promisify(_scrypt) as (
  password: string,
  salt: string,
  keylen: number,
) => Promise<Buffer>;

export const SESSION_COOKIE = "paperraj_session";
const SESSION_DAYS = 30;

/* ------------------------------------------------------------------ */
/* Password hashing (local auth provider only)                         */
/* ------------------------------------------------------------------ */

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = await scrypt(password, salt, 64);
  return `scrypt$${salt}$${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string | null): Promise<boolean> {
  if (!stored) return false;
  const [scheme, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const derived = await scrypt(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  if (expected.length !== derived.length) return false;
  return timingSafeEqual(expected, derived);
}

/* ------------------------------------------------------------------ */
/* Supabase Auth bridge                                                */
/* ------------------------------------------------------------------ */

export const SUPABASE_URL = (
  process.env.SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  ""
).replace(/\/$/, "");

export const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** True when Supabase Auth handles the credentials. */
export function isSupabaseAuth(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

type SupabaseAuthUser = { id: string; email?: string | null; email_confirmed_at?: string | null };
type SupabaseAuthResponse = {
  user?: SupabaseAuthUser | null;
  access_token?: string;
  error?: string;
  error_description?: string;
  msg?: string;
  message?: string;
};

async function supabaseRequest(
  path: string,
  body: Record<string, unknown>,
): Promise<SupabaseAuthResponse> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as SupabaseAuthResponse;
  if (!res.ok) {
    return {
      ...json,
      error: json.error ?? json.msg ?? json.message ?? `Supabase returned ${res.status}`,
    };
  }
  return json;
}

/* ------------------------------------------------------------------ */
/* Session management                                                  */
/* ------------------------------------------------------------------ */

export type SessionUser = {
  id: string;
  email: string;
  fullName: string | null;
  school: string | null;
  contact: string | null;
  role: string;
  createdAt: string;
};

async function issueSession(userId: string): Promise<string> {
  const token = randomBytes(48).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.insert(sessions).values({ token, userId, expiresAt });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
  return token;
}

export async function destroyCurrentSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.delete(sessions).where(eq(sessions.token, token)).catch(() => undefined);
  }
  jar.delete(SESSION_COOKIE);
}

/** Resolve the signed-in user for the current request (memoised per render). */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  try {
    const jar = await cookies();
    const token = jar.get(SESSION_COOKIE)?.value;
    if (!token) return null;
    const rows = await db
      .select({
        id: profiles.id,
        email: profiles.email,
        fullName: profiles.fullName,
        school: profiles.school,
        contact: profiles.contact,
        role: profiles.role,
        createdAt: profiles.createdAt,
      })
      .from(sessions)
      .innerJoin(profiles, eq(profiles.id, sessions.userId))
      .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())))
      .limit(1);
    const row = rows[0];
    if (!row) return null;
    return { ...row, createdAt: row.createdAt.toISOString() };
  } catch {
    return null;
  }
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("You must be signed in to do that.", 401);
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "admin") throw new AuthError("Administrator access required.", 403);
  return user;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

/* ------------------------------------------------------------------ */
/* Sign up / sign in                                                   */
/* ------------------------------------------------------------------ */

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export type AuthResult =
  | { ok: true; user: SessionUser; needsEmailConfirmation: boolean }
  | { ok: false; error: string };

export async function signUp(input: {
  email: string;
  password: string;
  fullName?: string;
  school?: string;
}): Promise<AuthResult> {
  const email = normalizeEmail(input.email);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }
  if (input.password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters long." };
  }

  const existing = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.email, email))
    .limit(1);
  if (existing.length > 0) {
    return { ok: false, error: "An account with this email already exists." };
  }

  const isAdminEmail =
    Boolean(process.env.ADMIN_EMAIL) &&
    normalizeEmail(process.env.ADMIN_EMAIL ?? "") === email;

  if (isSupabaseAuth()) {
    const res = await supabaseRequest("signup", {
      email,
      password: input.password,
      data: { full_name: input.fullName ?? "" },
    });
    if (res.error || !res.user) {
      return { ok: false, error: friendlySupabaseError(res) };
    }
    const created = await db
      .insert(profiles)
      .values({
        email,
        authUserId: res.user.id,
        fullName: input.fullName?.trim() || email.split("@")[0],
        school: input.school?.trim() || null,
        role: isAdminEmail ? "admin" : "user",
      })
      .returning();
    const profile = created[0];
    if (!profile) return { ok: false, error: "Could not create your profile." };
    if (!res.access_token) {
      return {
        ok: true,
        needsEmailConfirmation: true,
        user: toSessionUser(profile),
      };
    }
    await issueSession(profile.id);
    return { ok: true, needsEmailConfirmation: false, user: toSessionUser(profile) };
  }

  const passwordHash = await hashPassword(input.password);
  const created = await db
    .insert(profiles)
    .values({
      email,
      passwordHash,
      fullName: input.fullName?.trim() || email.split("@")[0],
      school: input.school?.trim() || null,
      role: isAdminEmail ? "admin" : "user",
    })
    .returning();
  const profile = created[0];
  if (!profile) return { ok: false, error: "Could not create your account." };
  await issueSession(profile.id);
  return { ok: true, needsEmailConfirmation: false, user: toSessionUser(profile) };
}

export async function signIn(input: { email: string; password: string }): Promise<AuthResult> {
  const email = normalizeEmail(input.email);
  if (isSupabaseAuth()) {
    const res = await supabaseRequest("token?grant_type=password", {
      email,
      password: input.password,
    });
    if (res.error || !res.user) {
      return { ok: false, error: friendlySupabaseError(res) };
    }
    const found = await db
      .select()
      .from(profiles)
      .where(eq(profiles.email, email))
      .limit(1);
    let profile = found[0];
    if (!profile) {
      const isAdminEmail =
        Boolean(process.env.ADMIN_EMAIL) &&
        normalizeEmail(process.env.ADMIN_EMAIL ?? "") === email;
      const inserted = await db
        .insert(profiles)
        .values({
          email,
          authUserId: res.user.id,
          fullName: email.split("@")[0],
          role: isAdminEmail ? "admin" : "user",
        })
        .returning();
      profile = inserted[0];
    } else if (!profile.authUserId) {
      await db
        .update(profiles)
        .set({ authUserId: res.user.id, updatedAt: new Date() })
        .where(eq(profiles.id, profile.id));
    }
    if (!profile) return { ok: false, error: "Could not sign you in." };
    await issueSession(profile.id);
    return { ok: true, needsEmailConfirmation: false, user: toSessionUser(profile) };
  }

  const found = await db.select().from(profiles).where(eq(profiles.email, email)).limit(1);
  const profile = found[0];
  if (!profile || !(await verifyPassword(input.password, profile.passwordHash))) {
    return { ok: false, error: "Incorrect email or password." };
  }
  await issueSession(profile.id);
  return { ok: true, needsEmailConfirmation: false, user: toSessionUser(profile) };
}

export async function requestPasswordReset(email: string): Promise<{ sent: boolean; link?: string; message: string }> {
  const normalized = normalizeEmail(email);
  if (isSupabaseAuth()) {
    const res = await supabaseRequest("recover", { email: normalized });
    if (res.error) return { sent: false, message: friendlySupabaseError(res) };
    return {
      sent: true,
      message: "Check your inbox — we sent a password reset link to that address.",
    };
  }

  const { passwordResets } = await import("@/db/schema");
  const found = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.email, normalized))
    .limit(1);
  if (found.length === 0) {
    // Never reveal whether an account exists.
    return { sent: true, message: "If that account exists, a reset link has been created." };
  }
  const token = randomBytes(32).toString("base64url");
  await db.insert(passwordResets).values({
    token,
    userId: found[0].id,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
  });
  return {
    sent: true,
    link: `/reset-password?token=${token}`,
    message:
      "Local mode has no mail server, so use the secure link below (valid for one hour).",
  };
}

export async function resetPassword(token: string, password: string): Promise<{ ok: boolean; error?: string }> {
  if (password.length < 8) return { ok: false, error: "Password must be at least 8 characters long." };
  const { passwordResets } = await import("@/db/schema");
  const rows = await db
    .select()
    .from(passwordResets)
    .where(eq(passwordResets.token, token))
    .limit(1);
  const reset = rows[0];
  if (!reset || reset.usedAt || reset.expiresAt.getTime() < Date.now()) {
    return { ok: false, error: "This reset link is invalid or has expired." };
  }
  const passwordHash = await hashPassword(password);
  await db
    .update(profiles)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(profiles.id, reset.userId));
  await db
    .update(passwordResets)
    .set({ usedAt: new Date() })
    .where(eq(passwordResets.token, token));
  return { ok: true };
}

function toSessionUser(profile: {
  id: string;
  email: string;
  fullName: string | null;
  school: string | null;
  contact: string | null;
  role: string;
  createdAt: Date;
}): SessionUser {
  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.fullName,
    school: profile.school,
    contact: profile.contact,
    role: profile.role,
    createdAt: profile.createdAt.toISOString(),
  };
}

function friendlySupabaseError(res: SupabaseAuthResponse): string {
  const raw = res.error_description ?? res.error ?? res.msg ?? res.message ?? "Authentication failed.";
  const lower = raw.toLowerCase();
  if (lower.includes("invalid login credentials")) return "Incorrect email or password.";
  if (lower.includes("email not confirmed")) {
    return "Please confirm your email address first — check your inbox for the confirmation link.";
  }
  if (lower.includes("already registered") || lower.includes("already exists")) {
    return "An account with this email already exists.";
  }
  if (lower.includes("rate limit")) return "Too many attempts. Please wait a minute and try again.";
  if (lower.includes("password")) return "That password is not strong enough (use 8+ characters).";
  if (lower.includes("failed to fetch") || lower.includes("supabase returned")) {
    return "The authentication service is unreachable right now. Please try again.";
  }
  return raw;
}
