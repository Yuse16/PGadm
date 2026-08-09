import type { LayoutContext } from "@/features/layout/application";
import { createLayoutActor, type LayoutActor } from "@/features/layout/domain";
import {
  DemoLayoutReferenceCatalog,
  DemoLayoutRepository,
  DemoLayoutStockProvider,
  NoopLayoutAuditRepository,
  DEMO_ORG_PGM,
  DEMO_LAYOUT_NOGALERA,
  DEMO_ELEMENT_M1_01,
  DEMO_ELEMENT_M1_02,
  DEMO_ELEMENT_GALERIA,
  DEMO_ELEMENT_MOSTRADOR,
  DEMO_POSITION_M1_01_RF_P01,
  DEMO_POSITION_M1_01_RF_P03,
  DEMO_POSITION_M1_01_RI_P01,
  DEMO_POSITION_M1_01_RP_P01,
  DEMO_POSITION_M1_02_RF_P01,
  DEMO_POSITION_MOST_V01,
  DEMO_POSITION_MOST_V02,
  DEMO_VARIANT_051,
  DEMO_VARIANT_052,
  DEMO_VARIANT_053,
  DEMO_BRANCH_NOG,
} from "@/features/layout/infrastructure";

export const ORG_A = DEMO_ORG_PGM;
export const ORG_B = "20000000-0000-0000-0000-000000000001";
export const USER_ADMIN = "30000000-0000-0000-0000-000000000006";
export const USER_EDITOR = "30000000-0000-0000-0000-000000000001";

export {
  DEMO_LAYOUT_NOGALERA as LAYOUT_NOGALERA,
  DEMO_ELEMENT_M1_01 as ELEMENT_M1_01,
  DEMO_ELEMENT_M1_02 as ELEMENT_M1_02,
  DEMO_ELEMENT_GALERIA as ELEMENT_GALERIA,
  DEMO_ELEMENT_MOSTRADOR as ELEMENT_MOSTRADOR,
  DEMO_POSITION_M1_01_RF_P01 as POSITION_M1_01_RF_P01,
  DEMO_POSITION_M1_01_RF_P03 as POSITION_M1_01_RF_P03,
  DEMO_POSITION_M1_01_RI_P01 as POSITION_M1_01_RI_P01,
  DEMO_POSITION_M1_01_RP_P01 as POSITION_M1_01_RP_P01,
  DEMO_POSITION_M1_02_RF_P01 as POSITION_M1_02_RF_P01,
  DEMO_POSITION_MOST_V01 as POSITION_MOST_V01,
  DEMO_POSITION_MOST_V02 as POSITION_MOST_V02,
  DEMO_VARIANT_051 as VARIANT_051,
  DEMO_VARIANT_052 as VARIANT_052,
  DEMO_VARIANT_053 as VARIANT_053,
  DEMO_BRANCH_NOG as BRANCH_NOG,
};

export const UNKNOWN_BRANCH = "10000000-0000-0000-0000-000000000099";
export const UNKNOWN_VARIANT = "70000000-0000-0000-0000-000000000999";
export const UNKNOWN_LAYOUT = "A0000000-0000-0000-0000-00000000FFFF";
export const UNKNOWN_ELEMENT = "A0000000-0000-0000-0000-00000000EEEE";
export const UNKNOWN_POSITION = "A0000000-0000-0000-0000-00000000DDDD";

export const READER = ["layout.read"];
export const EDITOR = ["layout.read", "layout.edit"];
export const PUBLISHER = ["layout.read", "layout.publish"];
export const MANAGER = ["layout.read", "layout.edit", "layout.publish"];
export const ADMIN = [
  "layout.read",
  "layout.edit",
  "layout.publish",
  "layout.manage",
];

export function actor(
  permissions: readonly string[] = [],
  organizationId: string = ORG_A,
  userId: string = USER_EDITOR
): LayoutActor {
  return createLayoutActor({
    userId,
    organizationId,
    permissions,
  });
}

export function makeContext(): LayoutContext & {
  auditRepository: NoopLayoutAuditRepository;
} {
  return {
    layoutRepository: new DemoLayoutRepository(),
    auditRepository: new NoopLayoutAuditRepository(),
    referenceCatalog: new DemoLayoutReferenceCatalog(),
    stockProvider: new DemoLayoutStockProvider(),
  };
}

/** Fresh context with no seeded layout (create-layout flows). */
export function makeEmptyContext(): LayoutContext & {
  layoutRepository: DemoLayoutRepository;
  auditRepository: NoopLayoutAuditRepository;
} {
  return {
    layoutRepository: new DemoLayoutRepository({ seed: false }),
    auditRepository: new NoopLayoutAuditRepository(),
    referenceCatalog: new DemoLayoutReferenceCatalog(),
    stockProvider: new DemoLayoutStockProvider(),
  };
}

export function makeDemoContext(): LayoutContext & {
  layoutRepository: DemoLayoutRepository;
  auditRepository: NoopLayoutAuditRepository;
} {
  return makeContext() as LayoutContext & {
    layoutRepository: DemoLayoutRepository;
    auditRepository: NoopLayoutAuditRepository;
  };
}
