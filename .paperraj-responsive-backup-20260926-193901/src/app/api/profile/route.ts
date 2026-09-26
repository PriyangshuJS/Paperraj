import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { fail, handleError, ok } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { cleanText } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    return ok({ user });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return fail("Please sign in first.", 401);
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (body.fullName !== undefined) updates.fullName = cleanText(body.fullName, 120);
    if (body.school !== undefined) updates.school = cleanText(body.school, 160);
    if (body.contact !== undefined) updates.contact = cleanText(body.contact, 160);
    await db.update(profiles).set(updates).where(eq(profiles.id, user.id));
    const fresh = await getCurrentUser();
    return ok({ user: fresh, message: "Profile updated." });
  } catch (error) {
    return handleError(error);
  }
}
