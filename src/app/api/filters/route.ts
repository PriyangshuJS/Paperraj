import { handleError, ok } from "@/lib/api";
import { getFacets } from "@/lib/papers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const facets = await getFacets();
    return ok({ facets });
  } catch (error) {
    return handleError(error);
  }
}
