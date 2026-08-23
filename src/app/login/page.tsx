import { Suspense } from "react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";
import { getSessionUser } from "@/lib/session";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage() {
  if (await getSessionUser()) redirect("/recipes");

  return (
    <div className="shell max-w-[420px] py-16 md:py-24">
      <p className="eyebrow mb-3">
        <span className="numeral">№</span> Welcome back
      </p>
      <h1 className="font-display text-[38px] leading-[1.1] mb-2">Sign in</h1>
      <p className="text-[15px] text-muted mb-8">Your recipe book is waiting.</p>

      <div className="card card-pad">
        <Suspense fallback={null}>
          <AuthForm mode="login" />
        </Suspense>
      </div>
    </div>
  );
}
