import type {
  Branch,
} from "./branch";
import type {
  Organization,
} from "./organization";
import type {
  BranchWarehouseRelation,
} from "./branch-warehouse-relation";
import type {
  Warehouse,
} from "./warehouse";

export interface OrganizationRepository {
  findOrganizationById(organizationId: string): Promise<Organization>;
  findOrganizationByCode(code: string): Promise<Organization>;
  listBranchesByOrganization(organizationId: string): Promise<Branch[]>;
  listWarehousesByBranch(branchId: string): Promise<Warehouse[]>;
  listBranchWarehouseRelations(organizationId: string): Promise<BranchWarehouseRelation[]>;
}
