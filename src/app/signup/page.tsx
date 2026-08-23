import { Suspense } from "react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";
import { getSessionUser } from "@/lib/session";

export const metadata: Metadata = { title: "Create account" };

export default async function SignupPage() {
  if (await getSessionUser()) redirect("/recipes");

  return (
    <div className="shell max-w-[420px] py-16 md:py-24">
      <p className="eyebrow mb-3">
        <span className="numeral">№</span> Get started
      </p>
      <h1 className="font-display text-[38px] leading-[1.1] mb-2">Create your account</h1>
      <p className="text-[15px] text-muted mb-8">
        Free, and your recipes stay private to you.
      </p>

      <div className="card card-pad">
        <Suspense fallback={null}>
          <AuthForm mode="signup" />
        </Suspense>
      </div>
    </div>
  );
}
