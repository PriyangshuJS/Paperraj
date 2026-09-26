import { handleError, ok } from "@/lib/api";
import { getPublicStats } from "@/lib/papers";
import { getSettings } from "@/lib/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [stats, settings] = await Promise.all([getPublicStats(), getSettings()]);
    return ok({ stats, maxUploadMb: settings.maxUploadMb });
  } catch (error) {
    return handleError(error);
  }
}
