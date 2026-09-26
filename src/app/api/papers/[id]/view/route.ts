import { fail, handleError } from "@/lib/api";
import { servePaperFile } from "@/app/api/papers/[id]/download/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** Inline preview (PDF viewer / image) — never increments the download count. */
export async function GET(_request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const response = await servePaperFile(id, "view");
    if (response.status >= 400) return response;
    const headers = new Headers(response.headers);
    headers.set("content-disposition", "inline");
    return new Response(response.body, { status: response.status, headers });
  } catch (error) {
    return handleError(error);
  }
}

export { fail };
