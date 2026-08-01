import type { OrganizationStructureResult } from "../application";
import { BranchCard } from "./branch-card";
import {
  ORGANIZATION_DATA_SOURCE_LABELS,
  type OrganizationDataSource,
} from "../infrastructure";

export function OrganizationOverview({
  structure,
  dataSource,
}: {
  structure: OrganizationStructureResult;
  dataSource: OrganizationDataSource;
}) {
  const { organization, branches } = structure;

  const sourceLabel =
    dataSource === "demo"
      ? ORGANIZATION_DATA_SOURCE_LABELS.demo
      : organization.externalSource && organization.externalId
        ? `${organization.externalSource} (${organization.externalId})`
        : "Base de datos (seed demo)";

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{organization.name}</h2>
            {organization.legalName ? (
              <p className="mt-1 text-sm text-gray-500">{organization.legalName}</p>
            ) : null}
            <p className="mt-2 font-mono text-xs text-gray-400">
              {organization.code} · {organization.id}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Fuente de datos: {sourceLabel}
            </p>
          </div>
          <StatusPill status={organization.status} />
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
          <Field label="Zona horaria" value={organization.timezone} />
          <Field label="Moneda" value={organization.currency} />
          <Field label="Idioma" value={organization.language} />
          <Field
            label="Sucursales"
            value={String(branches.length)}
          />
        </dl>
      </section>

      <section>
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Sucursales</h3>
        {branches.length === 0 ? (
          <p className="rounded-lg border border-dashed border-gray-300 p-6 text-sm text-gray-400">
            Sin sucursales registradas.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {branches.map(({ branch, warehouses }) => (
              <BranchCard
                key={branch.id}
                branch={branch}
                warehouses={warehouses}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatusPill({ status }: { status: OrganizationStructureResult["organization"]["status"] }) {
  const active = status === "active";
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${
        active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${active ? "bg-green-500" : "bg-gray-400"}`} />
      {active ? "Activa" : "Inactiva"}
    </span>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-gray-400">{label}</dt>
      <dd className="mt-0.5 font-medium text-gray-900">{value}</dd>
    </div>
  );
}
