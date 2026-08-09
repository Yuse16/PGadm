import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));
import {
  addElement,
  duplicateElement,
  hideElement,
  lockElement,
  moveElement,
  resizeElement,
  rotateElement,
} from "@/features/layout/application";
import {
  LayoutDataError,
  LayoutPermissionError,
  LayoutValidationError,
} from "@/features/layout/domain";
import {
  EDITOR,
  ELEMENT_GALERIA,
  ELEMENT_M1_01,
  LAYOUT_NOGALERA,
  ORG_A,
  ORG_B,
  READER,
  actor,
  makeContext,
} from "./helpers";

describe("addElement", () => {
  it("adds a furniture element to a draft layout with a version entry and audit (LA-8)", async () => {
    const context = makeContext();
    const added = await addElement(context, {
      actor: actor(EDITOR),
      organizationId: ORG_A,
      layoutId: LAYOUT_NOGALERA,
      elementType: "vanity",
      code: "VAN-02",
      label: "Vanity 2",
      x: 0.2,
      y: 0.6,
      width: 0.12,
      height: 0.1,
      reason: "Ampliar zona",
    });

    expect(added.code).toBe("VAN-02");
    expect(added.elementType).toBe("vanity");
    expect(added.locked).toBe(false);

    const history = await context.layoutRepository.listVersionHistory(ORG_A, LAYOUT_NOGALERA);
    expect(history.some((entry) => entry.changeType === "element_added")).toBe(true);
    expect(context.auditRepository.events.some((e) => e.action === "element_edited")).toBe(true);
  });

  it("rejects a duplicate permanent code per layout (LA-3)", async () => {
    const context = makeContext();
    await expect(
      addElement(context, {
        actor: actor(EDITOR),
        organizationId: ORG_A,
        layoutId: LAYOUT_NOGALERA,
        elementType: "muro",
        code: "M1-01",
      })
    ).rejects.toThrow(/already exists/i);
  });

  it("rejects unknown element types and out-of-range coordinates", async () => {
    const context = makeContext();
    await expect(
      addElement(context, {
        actor: actor(EDITOR),
        organizationId: ORG_A,
        layoutId: LAYOUT_NOGALERA,
        elementType: "silla" as never,
        code: "SIL-01",
      })
    ).rejects.toThrow(LayoutDataError);

    await expect(
      addElement(context, {
        actor: actor(EDITOR),
        organizationId: ORG_A,
        layoutId: LAYOUT_NOGALERA,
        elementType: "muro",
        code: "MURO-02",
        x: 1.5,
      })
    ).rejects.toThrow(LayoutValidationError);
  });

  it("denies editing without layout.edit (LA-24)", async () => {
    const context = makeContext();
    await expect(
      addElement(context, {
        actor: actor(READER),
        organizationId: ORG_A,
        layoutId: LAYOUT_NOGALERA,
        elementType: "muro",
        code: "MURO-02",
      })
    ).rejects.toThrow(LayoutPermissionError);
  });
});

describe("moveElement / rotateElement / resizeElement", () => {
  it("moves an unlocked element and records origin/destination (LA-8/LA-10)", async () => {
    const context = makeContext();
    const moved = await moveElement(context, {
      actor: actor(EDITOR),
      organizationId: ORG_A,
      elementId: ELEMENT_GALERIA,
      x: 0.6,
      y: 0.3,
    });

    expect(moved.x).toBe(0.6);
    expect(moved.y).toBe(0.3);

    const history = await context.layoutRepository.listVersionHistory(ORG_A, LAYOUT_NOGALERA);
    const moveEntry = history.find((entry) => entry.changeType === "element_moved");
    expect(moveEntry).toBeDefined();
    expect(moveEntry?.origin).toBe("0.55,0.1");
    expect(moveEntry?.destination).toBe("0.6,0.3");
  });

  it("rotates and resizes an unlocked element", async () => {
    const context = makeContext();
    const rotated = await rotateElement(context, {
      actor: actor(EDITOR),
      organizationId: ORG_A,
      elementId: ELEMENT_GALERIA,
      rotation: 90,
    });
    expect(rotated.rotation).toBe(90);

    const resized = await resizeElement(context, {
      actor: actor(EDITOR),
      organizationId: ORG_A,
      elementId: ELEMENT_GALERIA,
      width: 0.25,
      height: 0.15,
    });
    expect(resized.width).toBe(0.25);
    expect(resized.height).toBe(0.15);
  });

  it("rejects moving a locked element (LA-11)", async () => {
    const context = makeContext();
    await expect(
      moveElement(context, {
        actor: actor(EDITOR),
        organizationId: ORG_A,
        elementId: ELEMENT_M1_01,
        x: 0.5,
        y: 0.5,
      })
    ).rejects.toThrow(/locked/i);
  });

  it("rejects out-of-range rotation", async () => {
    const context = makeContext();
    await expect(
      rotateElement(context, {
        actor: actor(EDITOR),
        organizationId: ORG_A,
        elementId: ELEMENT_GALERIA,
        rotation: 360,
      })
    ).rejects.toThrow(LayoutValidationError);
  });
});

describe("lockElement / hideElement", () => {
  it("locks and unlocks an element recording the element_locked event", async () => {
    const context = makeContext();
    const locked = await lockElement(context, {
      actor: actor(EDITOR),
      organizationId: ORG_A,
      elementId: ELEMENT_GALERIA,
      locked: true,
    });
    expect(locked.locked).toBe(true);

    const unlocked = await lockElement(context, {
      actor: actor(EDITOR),
      organizationId: ORG_A,
      elementId: ELEMENT_GALERIA,
      locked: false,
    });
    expect(unlocked.locked).toBe(false);

    const history = await context.layoutRepository.listVersionHistory(ORG_A, LAYOUT_NOGALERA);
    expect(history.filter((entry) => entry.changeType === "element_locked")).toHaveLength(2);
  });

  it("hides/shows an element via metadata.hidden and appends element_hidden", async () => {
    const context = makeContext();
    const hidden = await hideElement(context, {
      actor: actor(EDITOR),
      organizationId: ORG_A,
      elementId: ELEMENT_GALERIA,
      hidden: true,
    });
    expect(hidden.metadata?.hidden).toBe(true);

    const shown = await hideElement(context, {
      actor: actor(EDITOR),
      organizationId: ORG_A,
      elementId: ELEMENT_GALERIA,
      hidden: false,
    });
    expect(shown.metadata?.hidden).toBe(false);

    const history = await context.layoutRepository.listVersionHistory(ORG_A, LAYOUT_NOGALERA);
    expect(history.filter((entry) => entry.changeType === "element_hidden")).toHaveLength(2);
  });
});

describe("duplicateElement", () => {
  it("duplicates an element with a new permanent code and unlocks the copy (LA-8)", async () => {
    const context = makeContext();
    const copy = await duplicateElement(context, {
      actor: actor(EDITOR),
      organizationId: ORG_A,
      elementId: ELEMENT_M1_01,
      code: "M1-05",
      x: 0.5,
      y: 0.1,
    });

    expect(copy.code).toBe("M1-05");
    expect(copy.elementType).toBe("m1");
    expect(copy.locked).toBe(false);
    expect(copy.zIndex).toBe(2);

    const history = await context.layoutRepository.listVersionHistory(ORG_A, LAYOUT_NOGALERA);
    const dupEntry = history.find((entry) => entry.changeType === "element_duplicated");
    expect(dupEntry).toBeDefined();
    expect(dupEntry?.origin).toBe("M1-01");
    expect(dupEntry?.destination).toBe("M1-05");
  });

  it("rejects a duplicate code for the copy", async () => {
    const context = makeContext();
    await expect(
      duplicateElement(context, {
        actor: actor(EDITOR),
        organizationId: ORG_A,
        elementId: ELEMENT_M1_01,
        code: "M1-02",
      })
    ).rejects.toThrow(/already exists/i);
  });

  it("denies cross-organization element edits", async () => {
    const context = makeContext();
    await expect(
      moveElement(context, {
        actor: actor(EDITOR, ORG_B),
        organizationId: ORG_A,
        elementId: ELEMENT_GALERIA,
        x: 0.5,
        y: 0.5,
      })
    ).rejects.toThrow(LayoutPermissionError);
  });
});
