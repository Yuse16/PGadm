"use client";

import { useState } from "react";
import { LoginCard } from "@/features/identity/components";
import type { LoginCredentials } from "@/features/identity/domain";
import { loginAction } from "./actions";

export default function LoginPage() {
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(credentials: LoginCredentials) {
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const result = await loginAction(credentials);
      if (!result.ok) {
        setErrorMessage(result.error);
      }
    } catch {
      setErrorMessage(
        "Ocurrió un error inesperado al iniciar sesión. Inténtalo de nuevo."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center px-4 py-12">
      <LoginCard
        onSubmit={handleSubmit}
        submitting={submitting}
        errorMessage={errorMessage}
      />
    </div>
  );
}
