import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));
import {
  archiveLayout,
  createLayout,
  editLayout,
  getLayout,
  listLayouts,
  listVersionHistory,
  publishLayout,
  restoreVersion,
} from "@/features/layout/application";
import {
  LayoutNotFoundError,
  LayoutPermissionError,
  LayoutValidationError,
} from "@/features/layout/domain";
import {
  ADMIN,
  BRANCH_NOG,
  EDITOR,
  LAYOUT_NOGALERA,
  MANAGER,
  ORG_A,
  ORG_B,
  PUBLISHER,
  READER,
  UNKNOWN_BRANCH,
  UNKNOWN_LAYOUT,
  actor,
  makeContext,
  makeEmptyContext,
} from "./helpers";

describe("createLayout", () => {
  it("creates a draft v1 layout with a 'created' version entry and audit event", async () => {
    const context = makeEmptyContext();
    const created = await createLayout(context, {
      actor: actor(ADMIN),
      organizationId: ORG_A,
      branchId: BRANCH_NOG,
      name: "Nogalera Sur",
      width: 12,
      height: 6,
      backgroundReference: "https://canva.pgm.local/planos/nogalera-sur.png",
    });

    expect(created.status).toBe("draft");
    expect(created.version).toBe(1);
    expect(created.branchId).toBe(BRANCH_NOG);
    expect(created.name).toBe("Nogalera Sur");

    const history = await context.layoutRepository.listVersionHistory(ORG_A, created.id);
    expect(history.some((entry) => entry.changeType === "created")).toBe(true);

    const events = context.auditRepository.events;
    expect(events.some((event) => event.action === "layout_created")).toBe(true);
  });

  it("denies creation without layout.manage (insert is manage-scoped)", async () => {
    const context = makeEmptyContext();
    await expect(
      createLayout(context, {
        actor: actor(EDITOR),
        organizationId: ORG_A,
        branchId: BRANCH_NOG,
        name: "Nogalera Sur",
      })
    ).rejects.toThrow(LayoutPermissionError);
  });

  it("rejects a non-store branch (D-L01)", async () => {
    const context = makeEmptyContext();
    await expect(
      createLayout(context, {
        actor: actor(ADMIN),
        organizationId: ORG_A,
        branchId: UNKNOWN_BRANCH,
        name: "Otro",
      })
    ).rejects.toThrow(LayoutValidationError);
  });

  it("rejects a duplicate name per branch (UNIQUE org, branch, name)", async () => {
    const context = makeContext();
    await expect(
      createLayout(context, {
        actor: actor(ADMIN),
        organizationId: ORG_A,
        branchId: BRANCH_NOG,
        name: "Nogalera",
      })
    ).rejects.toThrow(/already exists/i);
  });

  it("rejects cross-organization creation", async () => {
    const context = makeEmptyContext();
    await expect(
      createLayout(context, {
        actor: actor(ADMIN, ORG_B),
        organizationId: ORG_A,
        branchId: BRANCH_NOG,
        name: "Cruce",
      })
    ).rejects.toThrow(LayoutPermissionError);
  });
});

describe("editLayout", () => {
  it("edits draft metadata and records the audit event", async () => {
    const context = makeContext();
    const edited = await editLayout(context, {
      actor: actor(EDITOR),
      organizationId: ORG_A,
      layoutId: LAYOUT_NOGALERA,
      name: "Nogalera v2",
      height: 7,
      reason: "Ajustar lienzo",
    });

    expect(edited.name).toBe("Nogalera v2");
    expect(edited.height).toBe(7);
    expect(context.auditRepository.events.some((e) => e.action === "layout_edited")).toBe(true);
  });

  it("blocks editing a published layout (LA-9)", async () => {
    const context = makeContext();
    await publishLayout(context, {
      actor: actor(PUBLISHER),
      organizationId: ORG_A,
      layoutId: LAYOUT_NOGALERA,
    });
    await expect(
      editLayout(context, {
        actor: actor(EDITOR),
        organizationId: ORG_A,
        layoutId: LAYOUT_NOGALERA,
        name: "No debe pasar",
      })
    ).rejects.toThrow(/only allowed on draft/i);
  });
});

describe("publishLayout", () => {
  it("publishes draft -> published, increments version and appends the published event (LA-12)", async () => {
    const context = makeContext();
    const published = await publishLayout(context, {
      actor: actor(PUBLISHER),
      organizationId: ORG_A,
      layoutId: LAYOUT_NOGALERA,
    });

    expect(published.status).toBe("published");
    expect(published.version).toBe(2);

    const history = await context.layoutRepository.listVersionHistory(ORG_A, LAYOUT_NOGALERA);
    expect(history.some((entry) => entry.changeType === "published" && entry.version === 2)).toBe(true);
    expect(context.auditRepository.events.some((e) => e.action === "layout_published")).toBe(true);
  });

  it("requires layout.publish (LA-25)", async () => {
    const context = makeContext();
    await expect(
      publishLayout(context, {
        actor: actor(EDITOR),
        organizationId: ORG_A,
        layoutId: LAYOUT_NOGALERA,
      })
    ).rejects.toThrow(LayoutPermissionError);
  });

  it("cannot publish an already published layout", async () => {
    const context = makeContext();
    await publishLayout(context, {
      actor: actor(PUBLISHER),
      organizationId: ORG_A,
      layoutId: LAYOUT_NOGALERA,
    });
    await expect(
      publishLayout(context, {
        actor: actor(PUBLISHER),
        organizationId: ORG_A,
        layoutId: LAYOUT_NOGALERA,
      })
    ).rejects.toThrow(/only draft layouts can be published/i);
  });
});

describe("restoreVersion", () => {
  it("returns a published layout to draft and appends a restored event (LA-13)", async () => {
    const context = makeContext();
    await publishLayout(context, {
      actor: actor(PUBLISHER),
      organizationId: ORG_A,
      layoutId: LAYOUT_NOGALERA,
    });

    const restored = await restoreVersion(context, {
      actor: actor(PUBLISHER),
      organizationId: ORG_A,
      layoutId: LAYOUT_NOGALERA,
      version: 1,
    });

    expect(restored.status).toBe("draft");
    const history = await context.layoutRepository.listVersionHistory(ORG_A, LAYOUT_NOGALERA);
    expect(history.some((entry) => entry.changeType === "restored")).toBe(true);
    expect(context.auditRepository.events.some((e) => e.action === "layout_restored")).toBe(true);
  });

  it("rejects restoring a version ahead of the current one", async () => {
    const context = makeContext();
    await expect(
      restoreVersion(context, {
        actor: actor(PUBLISHER),
        organizationId: ORG_A,
        layoutId: LAYOUT_NOGALERA,
        version: 99,
      })
    ).rejects.toThrow(/at version 1/i);
  });
});

describe("archiveLayout", () => {
  it("soft-retires the layout and keeps it out of the active query (LA-14)", async () => {
    const context = makeContext();
    const archived = await archiveLayout(context, {
      actor: actor(ADMIN),
      organizationId: ORG_A,
      layoutId: LAYOUT_NOGALERA,
    });

    expect(archived.status).toBe("archived");
    const active = await listLayouts(context, { actor: actor(READER), organizationId: ORG_A });
    expect(active).toHaveLength(0);
    const withArchived = await listLayouts(context, {
      actor: actor(READER),
      organizationId: ORG_A,
      includeArchived: true,
    });
    expect(withArchived).toHaveLength(1);
    expect(context.auditRepository.events.some((e) => e.action === "layout_archived")).toBe(true);
  });

  it("requires layout.manage", async () => {
    const context = makeContext();
    await expect(
      archiveLayout(context, {
        actor: actor(MANAGER),
        organizationId: ORG_A,
        layoutId: LAYOUT_NOGALERA,
      })
    ).rejects.toThrow(LayoutPermissionError);
  });
});

describe("getLayout / listLayouts / listVersionHistory", () => {
  it("returns the seeded Nogalera detail (layout + elements + positions)", async () => {
    const context = makeContext();
    const detail = await getLayout(context, {
      actor: actor(READER),
      organizationId: ORG_A,
      layoutId: LAYOUT_NOGALERA,
    });

    expect(detail.layout.name).toBe("Nogalera");
    expect(detail.layout.status).toBe("draft");
    expect(detail.elements).toHaveLength(14);
    expect(detail.positions).toHaveLength(35);
  });

  it("throws a typed not-found for an unknown layout", async () => {
    const context = makeContext();
    await expect(
      getLayout(context, {
        actor: actor(READER),
        organizationId: ORG_A,
        layoutId: UNKNOWN_LAYOUT,
      })
    ).rejects.toThrow(LayoutNotFoundError);
  });

  it("lists layouts and version history scoped to the organization", async () => {
    const context = makeContext();
    const layouts = await listLayouts(context, { actor: actor(READER), organizationId: ORG_A });
    expect(layouts).toHaveLength(1);
    expect(layouts[0].id).toBe(LAYOUT_NOGALERA);

    const history = await listVersionHistory(context, {
      actor: actor(READER),
      organizationId: ORG_A,
      layoutId: LAYOUT_NOGALERA,
    });
    expect(history).toHaveLength(6);
  });

  it("never returns data for another organization (D-C07)", async () => {
    const context = makeContext();
    await expect(
      getLayout(context, {
        actor: actor(READER, ORG_B),
        organizationId: ORG_B,
        layoutId: LAYOUT_NOGALERA,
      })
    ).rejects.toThrow(LayoutNotFoundError);
  });

  it("requires layout.read for reads (LA-22)", async () => {
    const context = makeContext();
    await expect(
      listLayouts(context, { actor: actor([], ORG_A), organizationId: ORG_A })
    ).rejects.toThrow(LayoutPermissionError);
  });
});
