import { Suspense } from "react";
import { Loader2 } from "lucide-react";

import RegisterForm from "@/features/auth/components/registerform";

function RegisterPage() {
  return (
    <Suspense fallback={<RegisterFallback />}>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterFallback() {
  return (
    <main className="relative flex min-h-dvh items-center justify-center bg-[var(--background)] px-4 py-8 sm:px-6">
      <Loader2 className="h-6 w-6 animate-spin text-[var(--brand)]" />
    </main>
  );
}

export default RegisterPage;
