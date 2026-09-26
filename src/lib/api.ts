import { NextResponse } from "next/server";
import { AuthError } from "@/lib/auth";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data as object, {
    ...init,
    headers: { "cache-control": "no-store", ...(init?.headers ?? {}) },
  });
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status, headers: { "cache-control": "no-store" } });
}

/** Map internal errors to friendly messages — never leak database errors. */
export function handleError(error: unknown) {
  if (error instanceof AuthError) return fail(error.message, error.status);
  const message = error instanceof Error ? error.message : "Something went wrong.";
  if (/duplicate key/i.test(message)) {
    return fail("A file with this name already exists.", 409);
  }
  if (/relation .* does not exist/i.test(message)) {
    return fail("The library is still being set up. Please try again in a moment.", 503);
  }
  console.error("[paperraj]", error);
  return fail("Something went wrong on our side. Please try again.", 500);
}

export function str(value: FormDataEntryValue | null | undefined): string {
  return typeof value === "string" ? value : "";
}
