import Link from "next/link";
import type { ReactNode } from "react";
import { getOrganizationStructure } from "@/features/organization/application";
import type { OrganizationStructureResult } from "@/features/organization/application";
import { OrganizationOverview } from "@/features/organization/components/organization-overview";
import {
  createOrganizationRepository,
  getOrganizationDataSource,
} from "@/features/organization/infrastructure";
import {
  OrganizationError,
  OrganizationNotFoundError,
  RepositoryConfigurationError,
} from "@/features/organization/domain";

export const dynamic = "force-dynamic";

const DEMO_ORGANIZATION_CODE = "PGM";

export default async function OrganizationPage() {
  const dataSource = getOrganizationDataSource();
  const repository = createOrganizationRepository(dataSource);

  let structure: OrganizationStructureResult | null = null;
  let errorMessage: ReactNode = null;
  try {
    const organization = await repository.findOrganizationByCode(
      DEMO_ORGANIZATION_CODE
    );
    structure = await getOrganizationStructure(
      { organizationRepository: repository },
      { organizationId: organization.id }
    );
  } catch (error) {
    if (error instanceof RepositoryConfigurationError) {
      errorMessage = (
        <EmptyState
          title="Base de datos no configurada"
          message={error.message}
        />
      );
    } else if (error instanceof OrganizationNotFoundError) {
      errorMessage = (
        <EmptyState
          title="Organización no encontrada"
          message={`No se encontró la organización demo "${DEMO_ORGANIZATION_CODE}". Ejecuta el seed de la Fase 1B.2 para crearla.`}
        />
      );
    } else if (error instanceof OrganizationError) {
      errorMessage = (
        <EmptyState
          title="Datos no disponibles"
          message={error.message}
        />
      );
    } else {
      errorMessage = (
        <EmptyState
          title="No se pudo cargar la información"
          message="Ocurrió un error inesperado al consultar la base de datos."
        />
      );
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <nav className="mb-8">
        <Link
          href="/"
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          ← Inicio
        </Link>
      </nav>
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          Organización
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Sucursales y almacenes · Fase 1B.2
        </p>
      </header>
      {structure ? (
        <OrganizationOverview structure={structure} dataSource={dataSource} />
      ) : (
        errorMessage
      )}
    </div>
  );
}

function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      <p className="mt-2 text-sm text-gray-500">{message}</p>
    </div>
  );
}
