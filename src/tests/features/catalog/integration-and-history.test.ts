import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(() => {
    throw new Error("should not be called in demo mode");
  }),
}));

import type { CatalogAuditEvent } from "@/features/catalog/domain";
import { NoopCatalogAuditRepository } from "@/features/catalog/infrastructure/noop-catalog-audit-repository";
import { NoopCatalogIntegrationRepository } from "@/features/catalog/infrastructure/noop-catalog-integration-repository";
import { getProductHistory } from "@/features/catalog/server/history";
import { makeContext, product, variant } from "./helpers";

const ORG = "10000000-0000-0000-0000-000000000001";

describe("catalog integration placeholders (1C.5)", () => {
  it("reports the not-integrated state with the demo message", async () => {
    const repo = new NoopCatalogIntegrationRepository();
    const summary = await repo.getIntegrationSummary();

    expect(summary.status.integrated).toBe(false);
    expect(summary.status.message).toBe("Sin integración de inventario");
  });

  it("exposes every inventory/purchase/pricing integration point as null", async () => {
    const repo = new NoopCatalogIntegrationRepository();
    const summary = await repo.getIntegrationSummary();

    expect(summary.inventory).toEqual({
      currentStock: null,
      reservedStock: null,
      availableStock: null,
      averageCost: null,
      lastCost: null,
    });
    expect(summary.purchase).toEqual({
      lastSupplier: null,
      lastPurchaseAt: null,
      lastPurchaseCost: null,
    });
    expect(summary.pricing).toEqual({
      basePrice: null,
      suggestedPrice: null,
      salePrice: null,
      specialPrice: null,
      priceList: null,
    });
  });
});

describe("NoopCatalogAuditRepository.listEvents", () => {
  it("filters by organization, entity type and entity id, newest first", async () => {
    const repo = new NoopCatalogAuditRepository();
    await repo.record({
      actorUserId: "u1",
      organizationId: ORG,
      action: "create",
      entityType: "product",
      entityId: "product-1",
      detail: "first",
    });
    repo.events[repo.events.length - 1].occurredAt =
      "2026-08-01T00:00:00.000Z";
    await repo.record({
      actorUserId: "u1",
      organizationId: ORG,
      action: "update",
      entityType: "product",
      entityId: "product-1",
      detail: "second",
    });
    repo.events[repo.events.length - 1].occurredAt =
      "2026-08-02T00:00:00.000Z";
    await repo.record({
      actorUserId: "u1",
      organizationId: ORG,
      action: "create",
      entityType: "variant",
      entityId: "variant-1",
      detail: "other entity",
    });
    await repo.record({
      actorUserId: "u1",
      organizationId: "other-org",
      action: "create",
      entityType: "product",
      entityId: "product-1",
      detail: "other org",
    });

    const events = await repo.listEvents({
      organizationId: ORG,
      entityType: "product",
      entityId: "product-1",
    });

    expect(events.map((event) => event.detail)).toEqual(["second", "first"]);
  });

  it("applies the limit", async () => {
    const repo = new NoopCatalogAuditRepository();
    for (let i = 0; i < 5; i += 1) {
      await repo.record({
        actorUserId: "u1",
        organizationId: ORG,
        action: "update",
        entityType: "variant",
        entityId: "variant-1",
        detail: `event-${i}`,
      });
    }

    const events = await repo.listEvents({
      organizationId: ORG,
      entityType: "variant",
      entityId: "variant-1",
      limit: 2,
    });

    expect(events).toHaveLength(2);
  });
});

describe("getProductHistory", () => {
  async function seedEvents(
    repo: NoopCatalogAuditRepository,
    input: Array<Pick<CatalogAuditEvent, "action" | "entityType" | "entityId" | "detail" | "occurredAt">>
  ): Promise<void> {
    for (const item of input) {
      await repo.record({
        actorUserId: "u1",
        organizationId: ORG,
        action: item.action,
        entityType: item.entityType,
        entityId: item.entityId,
        detail: item.detail,
      });
      const recorded = repo.events[repo.events.length - 1];
      recorded.occurredAt = item.occurredAt;
    }
  }

  it("merges product and variant events, newest first", async () => {
    const context = makeContext();
    await seedEvents(context.auditRepository, [
      {
        action: "create",
        entityType: "product",
        entityId: "product-1",
        detail: "create product",
        occurredAt: "2026-08-01T00:00:00.000Z",
      },
      {
        action: "create",
        entityType: "variant",
        entityId: "variant-1",
        detail: "create variant",
        occurredAt: "2026-08-02T00:00:00.000Z",
      },
      {
        action: "update",
        entityType: "variant",
        entityId: "variant-2",
        detail: "update other variant",
        occurredAt: "2026-08-03T00:00:00.000Z",
      },
      {
        action: "update",
        entityType: "product",
        entityId: "product-other",
        detail: "other product",
        occurredAt: "2026-08-04T00:00:00.000Z",
      },
    ]);

    const history = await getProductHistory(
      context,
      ORG,
      product("product-1"),
      [variant("variant-1")]
    );

    expect(history.map((entry) => entry.detail)).toEqual([
      "create variant",
      "create product",
    ]);
  });

  it("caps the timeline at HISTORY_LIMIT events", async () => {
    const context = makeContext();
    for (let i = 0; i < 40; i += 1) {
      await context.auditRepository.record({
        actorUserId: "u1",
        organizationId: ORG,
        action: "update",
        entityType: "product",
        entityId: "product-1",
        detail: `event-${i}`,
      });
      const recorded = context.auditRepository.events[
        context.auditRepository.events.length - 1
      ];
      recorded.occurredAt = `2026-08-01T00:${String(i).padStart(2, "0")}:00.000Z`;
    }

    const history = await getProductHistory(context, ORG, product("product-1"), []);

    expect(history).toHaveLength(30);
    expect(history[0].detail).toBe("event-39");
    expect(history[29].detail).toBe("event-10");
  });
});
