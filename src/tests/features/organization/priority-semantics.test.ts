import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, join } from "node:path";
import { assertRelationshipPriority } from "@/features/organization/domain/branch-warehouse-relation";
import { OrganizationDataError } from "@/features/organization/domain";
import { DemoOrganizationRepository } from "@/features/organization/infrastructure/demo-organization-repository";

const ROOT = process.cwd();
const MIGRATION = "supabase/migrations/00000000000002_organization_structure.sql";

function readSource(relativePath: string): string {
  return readFileSync(resolve(ROOT, relativePath), "utf-8");
}

function listFeatureFiles(dir: string): string[] {
  const result: string[] = [];
  for (const entry of readdirSync(resolve(ROOT, dir))) {
    const full = resolve(ROOT, dir, entry);
    if (statSync(full).isDirectory()) {
      result.push(...listFeatureFiles(join(dir, entry)));
    } else if (entry.endsWith(".ts") || entry.endsWith(".tsx")) {
      result.push(join(dir, entry));
    }
  }
  return result;
}

const ORGANIZATION_ID = "10000000-0000-0000-0000-000000000001";
const BRANCH_NOG_ID = "10000000-0000-0000-0000-000000000002";
const BRANCH_SAL_ID = "10000000-0000-0000-0000-000000000004";
const WAREHOUSE_SAL01_ID = "10000000-0000-0000-0000-000000000005";

/**
 * Priority semantics: 1 is the highest priority and lower values are evaluated
 * first (ascending order). Every layer must agree, so a regression anywhere is
 * caught by a single, explicit test.
 */
describe("branch warehouse relation priority ordering", () => {
  it("orders the demo supply relation before lower priorities", async () => {
    const repository = new DemoOrganizationRepository();
    const relations = await repository.listBranchWarehouseRelations(
      ORGANIZATION_ID
    );
    expect(relations.map((relation) => relation.priority)).toEqual([1]);
  });

  it("keeps the demo supply relation pointing at the distribution source", async () => {
    const repository = new DemoOrganizationRepository();
    const salWarehouses = await repository.listWarehousesByBranch(BRANCH_SAL_ID);
    const relations = await repository.listBranchWarehouseRelations(
      ORGANIZATION_ID
    );
    expect(relations[0]?.priority).toBe(1);
    expect(salWarehouses.map((w) => w.id)).toContain(relations[0]?.warehouseId);
  });

  it("sorts relations by ascending priority so 1 is evaluated before 2", async () => {
    const repository = new DemoOrganizationRepository();
    const relations = await repository.listBranchWarehouseRelations(
      ORGANIZATION_ID
    );
    const sorted = [...relations].sort((a, b) => a.priority - b.priority);
    expect(relations.map((r) => r.priority)).toEqual(
      sorted.map((r) => r.priority)
    );
  });

  it("validates that priority must be a positive integer (1 = highest)", () => {
    expect(assertRelationshipPriority(1, "test")).toBe(1);
    expect(assertRelationshipPriority(2, "test")).toBe(2);
  });

  it("rejects priority values below 1", () => {
    expect(() => assertRelationshipPriority(0, "test")).toThrow(
      OrganizationDataError
    );
    expect(() => assertRelationshipPriority(-1, "test")).toThrow(
      OrganizationDataError
    );
  });

  it("rejects non-integer priority values", () => {
    expect(() => assertRelationshipPriority(1.5, "test")).toThrow(
      OrganizationDataError
    );
  });

  it("keeps the SQL column comment aligned with the ascending semantics", () => {
    const migration = readSource(MIGRATION);
    const comment = migration.match(
      /comment on column public\.branch_warehouse_relations\.priority is\s*'([^']*)'/
    );
    expect(comment).not.toBeNull();
    expect(comment![1]).toMatch(/1 is the highest priority/i);
    expect(comment![1]).toMatch(/ascending/i);
    expect(comment![1]).not.toMatch(/higher wins/i);
  });

  it("keeps the repository ordering aligned with the ascending semantics", () => {
    const repositorySource = readSource(
      "src/features/organization/infrastructure/supabase-organization-repository.ts"
    );
    expect(repositorySource).toMatch(
      /order\(["']priority["'],\s*\{\s*ascending:\s*true\s*\}/
    );
  });

  it("keeps the demo fixtures on priority 1 as the default supply relation", async () => {
    const repository = new DemoOrganizationRepository();
    const relations = await repository.listBranchWarehouseRelations(
      ORGANIZATION_ID
    );
    expect(relations).toHaveLength(1);
    expect(relations[0]).toMatchObject({
      branchId: BRANCH_NOG_ID,
      warehouseId: WAREHOUSE_SAL01_ID,
      relationshipType: "supply",
    });
    expect(relations[0].branchId).not.toBe(BRANCH_SAL_ID);
  });

  it("keeps every ordering concern in the feature aligned and non-contradictory", () => {
    const migration = readSource(MIGRATION);
    expect(migration).toMatch(/constraint bwr_priority_positive check \(priority >= 1\)/);
    const orderingSources = listFeatureFiles("src/features/organization").filter(
      (file) => file.endsWith(".ts") || file.endsWith(".tsx")
    );
    for (const file of orderingSources) {
      const source = readSource(file);
      expect(
        source,
        `${file} must not re-introduce "higher wins" semantics`
      ).not.toMatch(/higher wins/i);
      expect(
        source,
        `${file} must not sort priority descending`
      ).not.toMatch(/sort\([^)]*b\.priority - a\.priority/);
    }
  });
});
