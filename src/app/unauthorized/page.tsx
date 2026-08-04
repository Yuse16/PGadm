import {
  AccessDenied,
  InactiveAccount,
  SessionExpired,
} from "@/features/identity/components";

type UnauthorizedReason = "forbidden" | "inactive" | "expired";

function parseReason(value: string | string[] | undefined): UnauthorizedReason {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === "inactive" || raw === "expired" || raw === "forbidden") {
    return raw;
  }
  return "forbidden";
}

export default async function UnauthorizedPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  // Visual routing only — this query param is not real authorization.
  const reason = parseReason(params.reason);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center px-4 py-12">
      {reason === "inactive" ? (
        <InactiveAccount />
      ) : reason === "expired" ? (
        <SessionExpired />
      ) : (
        <AccessDenied />
      )}
    </div>
  );
}
