import type {
  Branch,
  OrganizationRepository,
} from "../domain";

export interface ListBranchesDependencies {
  organizationRepository: OrganizationRepository;
}

export interface ListBranchesInput {
  organizationId: string;
}

export async function listBranches(
  dependencies: ListBranchesDependencies,
  input: ListBranchesInput
): Promise<Branch[]> {
  const { organizationRepository } = dependencies;
  const { organizationId } = input;
  return organizationRepository.listBranchesByOrganization(organizationId);
}
