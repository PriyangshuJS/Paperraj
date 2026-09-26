import type { Metadata } from "next";
import { Library, type LibraryFilters } from "@/components/Library";
import { PageHeader } from "@/components/PageHeader";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function pick(params: Record<string, string | string[] | undefined>, key: string): string | undefined {
  const value = params[key];
  if (Array.isArray(value)) return value[0];
  return value;
}

const TITLES: Record<string, { title: string; eyebrow: string }> = {
  default: { title: "All Papers", eyebrow: "The complete catalogue" },
  year: { title: "Year Papers", eyebrow: "Previous examination papers" },
  specimen: { title: "Specimen Papers", eyebrow: "Sample & model papers" },
};

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const params = await searchParams;
  const type = pick(params, "type");
  const subject = pick(params, "subject");
  const klass = pick(params, "class");
  const parts: string[] = [];
  if (klass) parts.push(`Class ${klass}`);
  if (subject) parts.push(subject);
  const label = parts.length > 0 ? parts.join(" ") : (type ?? "All");
  return {
    title: `PaperRaj — ${label} Question Papers`,
    description: `Browse ${label} school examination question papers in the PaperRaj archive. Search, filter and download instantly.`,
  };
}

export default async function PapersPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const type = pick(params, "type");
  const subject = pick(params, "subject");
  const klass = pick(params, "class");
  const board = pick(params, "board");
  const exam = pick(params, "exam");
  const year = pick(params, "year");
  const school = pick(params, "school");
  const q = pick(params, "q");

  const preset: LibraryFilters = {
    q,
    classLevel: klass,
    board,
    subject,
    exam,
    year,
    paperType: type,
    school,
  };

  const parts: string[] = [];
  if (klass) parts.push(`Class ${klass}`);
  if (board) parts.push(board);
  if (subject) parts.push(subject);
  if (exam) parts.push(exam);
  if (year) parts.push(year);
  if (school) parts.push(school);

  const meta =
    type === "Year Paper"
      ? TITLES.year
      : type === "Specimen Paper"
        ? TITLES.specimen
        : TITLES.default;

  const title = parts.length > 0 ? parts.join(" · ") : meta.title;

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={meta.eyebrow}
        title={title}
        lead={
          parts.length > 0
            ? `Papers catalogued under ${parts.join(", ")}. Use the filters to narrow the shelf further.`
            : "Every approved paper in the archive, newest first. Search by filename, subject or uploader, then filter by class, board, exam, year or paper type."
        }
      />
      <Library preset={preset} syncUrl />
    </div>
  );
}
