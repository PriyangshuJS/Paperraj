import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to PaperRaj to manage the question papers you have uploaded.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const nextParam = Array.isArray(params.next) ? params.next[0] : params.next;
  return <AuthForm mode="login" next={nextParam} />;
}
