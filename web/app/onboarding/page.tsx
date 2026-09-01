import CreateApartmentPage from "@/features/onboarding/components/create-apartment-page";
import { Suspense } from "react";

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-dvh items-center justify-center bg-white px-4 text-[var(--ink)]">
          <div className="text-center">
            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-[var(--green-soft)] border-t-[var(--brand)]" />
            <p className="mt-4 text-sm font-medium text-[var(--text-muted)]">
              Loading setup
            </p>
          </div>
        </main>
      }
    >
      <CreateApartmentPage />
    </Suspense>
  );
}
