import { fail, handleError, ok } from "@/lib/api";
import {
  destroyCurrentSession,
  getCurrentUser,
  requestPasswordReset,
  resetPassword,
  signIn,
  signUp,
} from "@/lib/auth";
import { ensureSettingsRow } from "@/lib/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ action: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  try {
    const { action } = await params;
    if (action !== "session") return fail("Unknown action.", 404);
    const user = await getCurrentUser();
    return ok({ user });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request, { params }: Ctx) {
  try {
    const { action } = await params;
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

    switch (action) {
      case "signup": {
        await ensureSettingsRow();
        const result = await signUp({
          email: String(body.email ?? ""),
          password: String(body.password ?? ""),
          fullName: body.fullName ? String(body.fullName) : undefined,
          school: body.school ? String(body.school) : undefined,
        });
        if (!result.ok) return fail(result.error, 400);
        return ok({
          user: result.user,
          needsEmailConfirmation: result.needsEmailConfirmation,
          message: result.needsEmailConfirmation
            ? "Account created. Please confirm your email, then sign in."
            : "Welcome to PaperRaj.",
        });
      }
      case "login": {
        const result = await signIn({
          email: String(body.email ?? ""),
          password: String(body.password ?? ""),
        });
        if (!result.ok) return fail(result.error, 401);
        return ok({ user: result.user, message: "Welcome back." });
      }
      case "logout": {
        await destroyCurrentSession();
        return ok({ message: "Signed out." });
      }
      case "reset-request": {
        const result = await requestPasswordReset(String(body.email ?? ""));
        return ok(result);
      }
      case "reset-confirm": {
        const result = await resetPassword(String(body.token ?? ""), String(body.password ?? ""));
        if (!result.ok) return fail(result.error ?? "Could not reset the password.", 400);
        return ok({ message: "Your password has been updated. You can sign in now." });
      }
      default:
        return fail("Unknown action.", 404);
    }
  } catch (error) {
    return handleError(error);
  }
}
