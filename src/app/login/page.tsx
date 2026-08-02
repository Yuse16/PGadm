"use client";

import { useState } from "react";
import { LoginCard } from "@/features/identity/components";
import type { LoginCredentials } from "@/features/identity/domain";

export default function LoginPage() {
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(_credentials: LoginCredentials) {
    void _credentials;
    setSubmitting(true);
    setErrorMessage(null);
    try {
      // Auth integration is intentionally not wired yet.
      await new Promise((resolve) => setTimeout(resolve, 400));
      setErrorMessage(
        "Autenticación real pendiente de integración. El formulario está listo, pero aún no inicia sesión."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center px-4 py-12">
      <LoginCard
        notice="Interfaz preparada — autenticación real pendiente de integración"
        onSubmit={handleSubmit}
        submitting={submitting}
        errorMessage={errorMessage}
      />
    </div>
  );
}
