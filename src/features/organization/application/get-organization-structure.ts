import type {
  Branch,
  BranchWarehouseRelation,
  Organization,
  OrganizationRepository,
  Warehouse,
} from "../domain";

export interface OrganizationStructureResult {
  organization: Organization;
  branches: Array<{
    branch: Branch;
    warehouses: Warehouse[];
    relations: BranchWarehouseRelation[];
  }>;
}

export interface GetOrganizationStructureDependencies {
  organizationRepository: OrganizationRepository;
}

export interface GetOrganizationStructureInput {
  organizationId: string;
}

export async function getOrganizationStructure(
  dependencies: GetOrganizationStructureDependencies,
  input: GetOrganizationStructureInput
): Promise<OrganizationStructureResult> {
  const { organizationRepository } = dependencies;
  const { organizationId } = input;

  const [organization, branches, relations] = await Promise.all([
    organizationRepository.findOrganizationById(organizationId),
    organizationRepository.listBranchesByOrganization(organizationId),
    organizationRepository.listBranchWarehouseRelations(organizationId),
  ]);

  const branchesWithWarehouses = await Promise.all(
    branches.map(async (branch) => {
      const warehouses = await organizationRepository.listWarehousesByBranch(
        branch.id
      );
      return {
        branch,
        warehouses,
        relations: relations.filter((relation) => relation.branchId === branch.id),
      };
    })
  );

  return {
    organization,
    branches: branchesWithWarehouses,
  };
}
