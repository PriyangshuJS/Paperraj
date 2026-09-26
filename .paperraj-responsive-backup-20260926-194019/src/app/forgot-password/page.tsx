import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = {
  title: "Reset your password",
  description: "Request a password reset link for your PaperRaj account.",
};

export default function ForgotPasswordPage() {
  return <AuthForm mode="forgot" />;
}
