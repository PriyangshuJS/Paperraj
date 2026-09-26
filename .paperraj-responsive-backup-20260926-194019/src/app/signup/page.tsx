import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = {
  title: "Create an account",
  description:
    "Create a PaperRaj account so the papers you upload belong to you and can be edited or removed later.",
};

export default function SignupPage() {
  return <AuthForm mode="signup" />;
}
