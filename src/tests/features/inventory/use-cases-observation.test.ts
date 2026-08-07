import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));
import {
  confirmObservation,
  createObservation,
  listObservations,
} from "@/features/inventory/application";
import {
  InventoryPermissionError,
  InventoryValidationError,
} from "@/features/inventory/domain";
import {
  APPROVER,
  OBSERVER,
  ORG_A,
  ORG_B,
  UNKNOWN_VARIANT,
  VARIANT_051,
  VARIANT_052,
  WAREHOUSE_NOG_01,
  actor,
  makeContext,
} from "./helpers";

describe("createObservation", () => {
  it("creates an observation with actor/date/note/evidence (IA-20)", async () => {
    const context = makeContext();
    const created = await createObservation(context, {
      actor: actor(OBSERVER),
      organizationId: ORG_A,
      variantId: VARIANT_051,
      warehouseId: WAREHOUSE_NOG_01,
      observationType: "physical_count",
      observedQuantity: 128,
      note: "Conteo fisico: 128 piezas en bodega",
      evidenceUrl: "https://storage.pgm.local/evidencia/nogalera-20260806.jpg",
    });

    expect(created.observationType).toBe("physical_count");
    expect(created.observedQuantity).toBe(128);
    expect(created.createdBy).toBe(actor(OBSERVER).userId);
    expect(created.organizationId).toBe(ORG_A);
    expect(created.warehouseId).toBe(WAREHOUSE_NOG_01);

    const events = context.auditRepository.events;
    expect(events).toHaveLength(1);
    expect(events[0].action).toBe("create_observation");
    expect(events[0].entityType).toBe("inventory_observation");
    expect(events[0].entityId).toBe(created.id);
  });

  it("never mutates snapshot quantities (IA-21)", async () => {
    const context = makeContext();
    await createObservation(context, {
      actor: actor(OBSERVER),
      organizationId: ORG_A,
      variantId: VARIANT_051,
      warehouseId: WAREHOUSE_NOG_01,
      observationType: "physical_count",
      observedQuantity: 999,
    });

    const before = await context.inventoryRepository.listSnapshotItems(
      ORG_A,
      "90000000-0000-0000-0000-000000000001"
    );
    expect(before.find((item) => item.variantId === VARIANT_051)?.quantity).toBe(100);
    expect(await context.inventoryRepository.listObservations(ORG_A)).toHaveLength(3);
  });

  it("denies creation without inventory.observe (IA-26)", async () => {
    const context = makeContext();
    await expect(
      createObservation(context, {
        actor: actor([], ORG_A),
        organizationId: ORG_A,
        variantId: VARIANT_051,
        warehouseId: WAREHOUSE_NOG_01,
        observationType: "physical_count",
      })
    ).rejects.toThrow(InventoryPermissionError);
  });

  it("rejects an unknown variant (IA-7)", async () => {
    const context = makeContext();
    await expect(
      createObservation(context, {
        actor: actor(OBSERVER),
        organizationId: ORG_A,
        variantId: UNKNOWN_VARIANT,
        warehouseId: WAREHOUSE_NOG_01,
        observationType: "difference",
      })
    ).rejects.toThrow(InventoryValidationError);
  });

  it("rejects a negative observed quantity", async () => {
    const context = makeContext();
    await expect(
      createObservation(context, {
        actor: actor(OBSERVER),
        organizationId: ORG_A,
        variantId: VARIANT_051,
        warehouseId: WAREHOUSE_NOG_01,
        observationType: "physical_count",
        observedQuantity: -5,
      })
    ).rejects.toThrow(InventoryValidationError);
  });

  it("denies cross-organization writes", async () => {
    const context = makeContext();
    await expect(
      createObservation(context, {
        actor: actor(OBSERVER, ORG_B),
        organizationId: ORG_A,
        variantId: VARIANT_051,
        warehouseId: WAREHOUSE_NOG_01,
        observationType: "physical_count",
      })
    ).rejects.toThrow(InventoryPermissionError);
  });
});

describe("confirmObservation", () => {
  it("confirms an observation with inventory.approve (IA-22)", async () => {
    const context = makeContext();
    const confirmed = await confirmObservation(context, {
      actor: actor(APPROVER),
      organizationId: ORG_A,
      observationId: "90000000-0000-0000-0000-000000000031",
      confirmationNote: "Verificado en sitio",
    });

    expect(confirmed.id).toBe("90000000-0000-0000-0000-000000000031");
    expect(confirmed.note).toBe("Verificado en sitio");
    expect(confirmed.updatedAt >= confirmed.createdAt).toBe(true);

    const events = context.auditRepository.events;
    expect(events.some((event) => event.action === "confirm_observation")).toBe(true);
  });

  it("denies confirmation without inventory.approve (IA-22)", async () => {
    const context = makeContext();
    await expect(
      confirmObservation(context, {
        actor: actor(OBSERVER),
        organizationId: ORG_A,
        observationId: "90000000-0000-0000-0000-000000000031",
      })
    ).rejects.toThrow(InventoryPermissionError);
  });

  it("throws a typed not-found for a missing observation", async () => {
    const context = makeContext();
    await expect(
      confirmObservation(context, {
        actor: actor(APPROVER),
        organizationId: ORG_A,
        observationId: "90000000-0000-0000-0000-000000009999",
      })
    ).rejects.toThrow(/not found/i);
  });
});

describe("listObservations", () => {
  it("lists observations scoped to the organization", async () => {
    const context = makeContext();
    const observations = await listObservations(context, {
      actor: actor(OBSERVER),
      organizationId: ORG_A,
    });
    expect(observations).toHaveLength(2);
    expect(observations[0].id).toBe("90000000-0000-0000-0000-000000000032"); // newest first
    expect(observations[0].createdBy).toBe(actor(OBSERVER).userId);
  });

  it("filters by variant", async () => {
    const context = makeContext();
    const observations = await listObservations(context, {
      actor: actor(OBSERVER),
      organizationId: ORG_A,
      variantId: VARIANT_052,
    });
    expect(observations).toHaveLength(1);
    expect(observations[0].id).toBe("90000000-0000-0000-0000-000000000032");
  });
});
