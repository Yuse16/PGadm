import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { OrganizationOverview } from "@/features/organization/components/organization-overview";
import type { OrganizationStructureResult } from "@/features/organization/application";

function sampleStructure(): OrganizationStructureResult {
  return {
    organization: {
      id: "10000000-0000-0000-0000-000000000001",
      code: "PGM",
      name: "Plomería García",
      legalName: "Plomería García, S.A. de C.V.",
      status: "active",
      timezone: "America/Mexico_City",
      currency: "MXN",
      language: "es",
      externalSource: null,
      externalId: null,
      createdAt: "2026-07-31T00:00:00.000Z",
      updatedAt: "2026-07-31T00:00:00.000Z",
    },
    branches: [
      {
        branch: {
          id: "10000000-0000-0000-0000-000000000002",
          organizationId: "10000000-0000-0000-0000-000000000001",
          code: "NOG",
          name: "Nogalera",
          branchType: "store",
          status: "active",
          timezone: null,
          address: {
            line: null,
            city: null,
            stateProvince: null,
            postalCode: null,
            country: "MX",
          },
          externalSource: null,
          externalId: null,
          createdAt: "2026-07-31T00:00:00.000Z",
          updatedAt: "2026-07-31T00:00:00.000Z",
        },
        warehouses: [
          {
            id: "10000000-0000-0000-0000-000000000003",
            organizationId: "10000000-0000-0000-0000-000000000001",
            branchId: "10000000-0000-0000-0000-000000000002",
            code: "NOG-01",
            name: "Almacén Nogalera 1",
            warehouseType: "store_backroom",
            status: "active",
            isPrimary: true,
            externalSource: null,
            externalId: null,
            createdAt: "2026-07-31T00:00:00.000Z",
            updatedAt: "2026-07-31T00:00:00.000Z",
          },
        ],
        relations: [],
      },
    ],
  };
}

describe("OrganizationOverview", () => {
  it("renders organization name and legal name", () => {
    render(<OrganizationOverview structure={sampleStructure()} />);
    expect(screen.getByText("Plomería García")).toBeInTheDocument();
    expect(
      screen.getByText("Plomería García, S.A. de C.V.")
    ).toBeInTheDocument();
  });

  it("renders the organization code", () => {
    render(<OrganizationOverview structure={sampleStructure()} />);
    expect(screen.getByText(/PGM/)).toBeInTheDocument();
  });

  it("labels the data source as seed demo when no external source exists", () => {
    render(<OrganizationOverview structure={sampleStructure()} />);
    expect(
      screen.getByText(/Fuente de datos: Base de datos \(seed demo\)/)
    ).toBeInTheDocument();
  });

  it("shows the external source when present", () => {
    const structure = sampleStructure();
    structure.organization = {
      ...structure.organization,
      externalSource: "intelisis",
      externalId: "116NOG-PGM",
    };
    render(<OrganizationOverview structure={structure} />);
    expect(screen.getByText(/intelisis \(116NOG-PGM\)/)).toBeInTheDocument();
  });

  it("renders branch name and type", () => {
    render(<OrganizationOverview structure={sampleStructure()} />);
    expect(screen.getByText("Nogalera")).toBeInTheDocument();
    expect(screen.getByText("NOG · Sucursal")).toBeInTheDocument();
  });

  it("renders warehouse with primary badge", () => {
    render(<OrganizationOverview structure={sampleStructure()} />);
    expect(screen.getByText("Almacén Nogalera 1")).toBeInTheDocument();
    expect(screen.getByText("Principal")).toBeInTheDocument();
  });

  it("renders an empty state when there are no branches", () => {
    const structure = sampleStructure();
    structure.branches = [];
    render(<OrganizationOverview structure={structure} />);
    expect(screen.getByText("Sin sucursales registradas.")).toBeInTheDocument();
  });
});
