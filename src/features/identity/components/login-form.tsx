"use client";

import { useId, useState, type FormEvent } from "react";
import type { LoginCredentials } from "../domain";

export interface LoginFormProps {
  onSubmit: (credentials: LoginCredentials) => void | Promise<void>;
  submitting?: boolean;
  errorMessage?: string | null;
}

export function LoginForm({
  onSubmit,
  submitting = false,
  errorMessage = null,
}: LoginFormProps) {
  const emailId = useId();
  const passwordId = useId();
  const errorId = useId();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) {
      return;
    }
    await onSubmit({ email: email.trim(), password });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
      noValidate
      aria-describedby={errorMessage ? errorId : undefined}
    >
      <div>
        <label
          htmlFor={emailId}
          className="mb-1.5 block text-sm font-medium text-gray-700"
        >
          Correo
        </label>
        <input
          id={emailId}
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={submitting}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/30 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
          placeholder="usuario@ejemplo.com"
        />
      </div>

      <div>
        <label
          htmlFor={passwordId}
          className="mb-1.5 block text-sm font-medium text-gray-700"
        >
          Contraseña
        </label>
        <input
          id={passwordId}
          name="password"
          type="password"
          autoComplete="current-password"
          required
          disabled={submitting}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/30 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
          placeholder="••••••••"
        />
      </div>

      {errorMessage ? (
        <p
          id={errorId}
          role="alert"
          aria-live="assertive"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {errorMessage}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="flex w-full items-center justify-center rounded-md bg-blue-700 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-blue-400"
      >
        {submitting ? "Iniciando sesión…" : "Iniciar sesión"}
      </button>

      <p className="text-center text-sm text-gray-500">
        <span className="font-medium text-blue-700">Recuperar contraseña</span>
        <span className="text-gray-400"> — próximamente</span>
      </p>
    </form>
  );
}
