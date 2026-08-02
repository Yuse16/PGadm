"use client";

import type { ReactNode } from "react";
import { LoginForm, type LoginFormProps } from "./login-form";

export interface LoginCardProps extends LoginFormProps {
  title?: string;
  description?: ReactNode;
  notice?: ReactNode;
}

export function LoginCard({
  title = "Iniciar sesión",
  description = "Accede a PGadm con tu cuenta de trabajo.",
  notice,
  ...formProps
}: LoginCardProps) {
  return (
    <section className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
      <header className="mb-6 space-y-2">
        <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">
          {title}
        </h1>
        {description ? (
          <p className="text-sm text-gray-500">{description}</p>
        ) : null}
        {notice ? (
          <p
            role="status"
            aria-live="polite"
            className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800"
          >
            {notice}
          </p>
        ) : null}
      </header>
      <LoginForm {...formProps} />
    </section>
  );
}
