export type { InventoryContext } from "./inventory-context";
export {
  requireInventoryPermission,
  requireInventoryRead,
  requireInventoryImport,
  requireInventoryApprove,
  requireInventoryObserve,
  inventoryActorFromIdentitySession,
  assertActorOrganization,
} from "./guards";
export {
  newId,
  nowIso,
  validateReportDate,
  requireVariantReference,
  requireWarehouseReference,
} from "./shared";
export {
  approveImport,
  listSnapshots,
  getSnapshot,
  listChanges,
  computeChanges,
} from "./import-use-cases";
export type {
  ApproveImportItemInput,
  ApproveImportInput,
  ApproveImportResult,
  ListSnapshotsInput,
  GetSnapshotInput,
  SnapshotDetail,
  ListChangesInput,
} from "./import-use-cases";
export { getInventoryHistory } from "./history-use-cases";
export type { GetInventoryHistoryInput } from "./history-use-cases";
export {
  createObservation,
  confirmObservation,
  listObservations,
} from "./observation-use-cases";
export type {
  CreateObservationInput,
  ConfirmObservationInput,
  ListObservationsInput,
} from "./observation-use-cases";
export {
  createTemplate,
  updateTemplate,
  deactivateTemplate,
  listTemplates,
  getTemplate,
  validateColumnMapping,
} from "./template-use-cases";
export type {
  CreateTemplateInput,
  UpdateTemplateInput,
  DeactivateTemplateInput,
  ListTemplatesInput,
  GetTemplateInput,
} from "./template-use-cases";
export { computeInventoryAlerts, DEFAULT_ALERT_THRESHOLDS, isInventoryAlertType } from "./alerts";
export type { InventoryAlert, InventoryAlertThresholds, InventoryAlertType } from "./alerts";
