"use server";

import { redirect } from "next/navigation";
import { hasSupabaseConfig } from "@/schemas/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveIdentitySession } from "@/features/identity/application";
import type { LoginCredentials } from "@/features/identity/domain";

export type LoginActionResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly error: string };

export async function loginAction(
  credentials: LoginCredentials
): Promise<LoginActionResult> {
  if (!hasSupabaseConfig()) {
    return {
      ok: false,
      error:
        "Autenticación no disponible: la base de datos no está configurada. Define NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    };
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });

  if (error) {
    return { ok: false, error: "Correo o contraseña incorrectos." };
  }

  const resolution = await resolveIdentitySession(supabase);
  if (resolution.status === "inactive") {
    redirect("/unauthorized?reason=inactive");
  }

  redirect("/");
}

export async function logoutAction(): Promise<void> {
  if (hasSupabaseConfig()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }
  redirect("/login");
}
