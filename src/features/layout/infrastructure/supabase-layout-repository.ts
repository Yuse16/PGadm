import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/schemas/env";
import type { Database, Json } from "@/types/database";
import type {
  Layout,
  LayoutElement,
  LayoutPosition,
  LayoutRepository,
  LayoutVersionEntry,
  LayoutListOptions,
  PositionListOptions,
} from "../domain";
import {
  RepositoryConfigurationError,
  assertLayoutChangeType,
  assertLayoutElementType,
  assertLayoutReviewStatus,
  assertLayoutStatus,
} from "../domain";

const LAYOUT_COLUMNS =
  "id, organization_id, branch_id, name, status, version, width, height, background_reference, created_at, updated_at" as const;

const ELEMENT_COLUMNS =
  "id, organization_id, layout_id, element_type, code, label, x, y, width, height, rotation, locked, z_index, metadata, created_at, updated_at" as const;

const POSITION_COLUMNS =
  "id, organization_id, element_id, position_code, variant_id, active_from, active_to, review_status, created_at, updated_at" as const;

const HISTORY_COLUMNS =
  "id, organization_id, layout_id, version, change_type, element_id, position_id, previous_variant_id, new_variant_id, origin, destination, reason, changed_by, created_at" as const;

type LayoutsInsert = Database["public"]["Tables"]["layouts"]["Insert"];
type LayoutsUpdate = Database["public"]["Tables"]["layouts"]["Update"];
type ElementsInsert = Database["public"]["Tables"]["layout_elements"]["Insert"];
type ElementsUpdate = Database["public"]["Tables"]["layout_elements"]["Update"];
type PositionsInsert = Database["public"]["Tables"]["layout_positions"]["Insert"];
type PositionsUpdate = Database["public"]["Tables"]["layout_positions"]["Update"];
type HistoryInsert =
  Database["public"]["Tables"]["layout_version_history"]["Insert"];

/**
 * Supabase implementation of the layout aggregate repository (3.2 schema,
 * migration 011). Every access goes through the RLS-scoped server client (the
 * user's own session, never service_role, D09/T09): the database re-checks org
 * scoping and permissions on each statement via composite FKs + RLS. Read
 * methods use `layout.read`; writes are guarded by the grants in migration 011
 * plus the actor's `requirePermission` in the use cases (defense in depth).
 * Version history is append-only (LA-28): only insert is exposed, never
 * update/delete.
 */
export class SupabaseLayoutRepository implements LayoutRepository {
  async listLayouts(
    organizationId: string,
    options?: LayoutListOptions
  ): Promise<Layout[]> {
    const client = await this.createClient();
    let query = client
      .from("layouts")
      .select(LAYOUT_COLUMNS)
      .eq("organization_id", organizationId)
      .order("updated_at", { ascending: false });
    if (options?.branchId !== undefined) {
      query = query.eq("branch_id", options.branchId);
    }
    if (options?.includeArchived !== true) {
      query = query.neq("status", "archived");
    }
    const { data, error } = await query;
    if (error) {
      throw new Error(`Failed to list layouts: ${error.message}`);
    }
    return data.map(mapLayout);
  }

  async findLayoutById(
    organizationId: string,
    layoutId: string
  ): Promise<Layout | null> {
    const client = await this.createClient();
    const { data, error } = await client
      .from("layouts")
      .select(LAYOUT_COLUMNS)
      .eq("organization_id", organizationId)
      .eq("id", layoutId)
      .maybeSingle();
    if (error) {
      throw new Error(`Failed to find layout: ${error.message}`);
    }
    return data ? mapLayout(data) : null;
  }

  async findLayoutByBranchAndName(
    organizationId: string,
    branchId: string,
    name: string
  ): Promise<Layout | null> {
    const client = await this.createClient();
    const { data, error } = await client
      .from("layouts")
      .select(LAYOUT_COLUMNS)
      .eq("organization_id", organizationId)
      .eq("branch_id", branchId)
      .eq("name", name)
      .maybeSingle();
    if (error) {
      throw new Error(`Failed to find layout by branch and name: ${error.message}`);
    }
    return data ? mapLayout(data) : null;
  }

  async insertLayout(layout: Layout): Promise<Layout> {
    const client = await this.createClient();
    const row: LayoutsInsert = {
      id: layout.id,
      organization_id: layout.organizationId,
      branch_id: layout.branchId,
      name: layout.name,
      status: layout.status,
      version: layout.version,
      width: layout.width,
      height: layout.height,
      background_reference: layout.backgroundReference,
    };
    const { data, error } = await client
      .from("layouts")
      .insert(row)
      .select(LAYOUT_COLUMNS)
      .single();
    if (error) {
      throw new Error(`Failed to insert layout: ${error.message}`);
    }
    return mapLayout(data);
  }

  async updateLayout(layout: Layout): Promise<Layout> {
    const client = await this.createClient();
    const row: LayoutsUpdate = {
      name: layout.name,
      status: layout.status,
      version: layout.version,
      width: layout.width,
      height: layout.height,
      background_reference: layout.backgroundReference,
    };
    const { data, error } = await client
      .from("layouts")
      .update(row)
      .eq("organization_id", layout.organizationId)
      .eq("id", layout.id)
      .select(LAYOUT_COLUMNS)
      .single();
    if (error) {
      throw new Error(`Failed to update layout: ${error.message}`);
    }
    return mapLayout(data);
  }

  async listElements(
    organizationId: string,
    layoutId: string
  ): Promise<LayoutElement[]> {
    const client = await this.createClient();
    const { data, error } = await client
      .from("layout_elements")
      .select(ELEMENT_COLUMNS)
      .eq("organization_id", organizationId)
      .eq("layout_id", layoutId)
      .order("z_index", { ascending: true })
      .order("code", { ascending: true });
    if (error) {
      throw new Error(`Failed to list layout elements: ${error.message}`);
    }
    return data.map(mapElement);
  }

  async findElementById(
    organizationId: string,
    elementId: string
  ): Promise<LayoutElement | null> {
    const client = await this.createClient();
    const { data, error } = await client
      .from("layout_elements")
      .select(ELEMENT_COLUMNS)
      .eq("organization_id", organizationId)
      .eq("id", elementId)
      .maybeSingle();
    if (error) {
      throw new Error(`Failed to find layout element: ${error.message}`);
    }
    return data ? mapElement(data) : null;
  }

  async findElementByCode(
    organizationId: string,
    layoutId: string,
    code: string
  ): Promise<LayoutElement | null> {
    const client = await this.createClient();
    const { data, error } = await client
      .from("layout_elements")
      .select(ELEMENT_COLUMNS)
      .eq("organization_id", organizationId)
      .eq("layout_id", layoutId)
      .eq("code", code)
      .maybeSingle();
    if (error) {
      throw new Error(`Failed to find layout element by code: ${error.message}`);
    }
    return data ? mapElement(data) : null;
  }

  async insertElement(element: LayoutElement): Promise<LayoutElement> {
    const client = await this.createClient();
    const row: ElementsInsert = {
      id: element.id,
      organization_id: element.organizationId,
      layout_id: element.layoutId,
      element_type: element.elementType,
      code: element.code,
      label: element.label,
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
      rotation: element.rotation,
      locked: element.locked,
      z_index: element.zIndex,
      metadata: element.metadata as unknown as Json,
    };
    const { data, error } = await client
      .from("layout_elements")
      .insert(row)
      .select(ELEMENT_COLUMNS)
      .single();
    if (error) {
      throw new Error(`Failed to insert layout element: ${error.message}`);
    }
    return mapElement(data);
  }

  async updateElement(element: LayoutElement): Promise<LayoutElement> {
    const client = await this.createClient();
    const row: ElementsUpdate = {
      label: element.label,
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
      rotation: element.rotation,
      locked: element.locked,
      z_index: element.zIndex,
      metadata: element.metadata as unknown as Json,
    };
    const { data, error } = await client
      .from("layout_elements")
      .update(row)
      .eq("organization_id", element.organizationId)
      .eq("id", element.id)
      .select(ELEMENT_COLUMNS)
      .single();
    if (error) {
      throw new Error(`Failed to update layout element: ${error.message}`);
    }
    return mapElement(data);
  }

  async listPositions(
    organizationId: string,
    options?: PositionListOptions
  ): Promise<LayoutPosition[]> {
    const client = await this.createClient();
    let query = client
      .from("layout_positions")
      .select(POSITION_COLUMNS)
      .eq("organization_id", organizationId)
      .order("position_code", { ascending: true });
    if (options?.elementId !== undefined) {
      query = query.eq("element_id", options.elementId);
    }
    if (options?.reviewStatus !== undefined) {
      query = query.eq("review_status", options.reviewStatus);
    }
    const { data, error } = await query;
    if (error) {
      throw new Error(`Failed to list layout positions: ${error.message}`);
    }
    return data.map(mapPosition);
  }

  async findPositionById(
    organizationId: string,
    positionId: string
  ): Promise<LayoutPosition | null> {
    const client = await this.createClient();
    const { data, error } = await client
      .from("layout_positions")
      .select(POSITION_COLUMNS)
      .eq("organization_id", organizationId)
      .eq("id", positionId)
      .maybeSingle();
    if (error) {
      throw new Error(`Failed to find layout position: ${error.message}`);
    }
    return data ? mapPosition(data) : null;
  }

  async findPositionByCode(
    organizationId: string,
    elementId: string,
    positionCode: string
  ): Promise<LayoutPosition | null> {
    const client = await this.createClient();
    const { data, error } = await client
      .from("layout_positions")
      .select(POSITION_COLUMNS)
      .eq("organization_id", organizationId)
      .eq("element_id", elementId)
      .eq("position_code", positionCode)
      .maybeSingle();
    if (error) {
      throw new Error(`Failed to find layout position by code: ${error.message}`);
    }
    return data ? mapPosition(data) : null;
  }

  async insertPosition(position: LayoutPosition): Promise<LayoutPosition> {
    const client = await this.createClient();
    const row: PositionsInsert = {
      id: position.id,
      organization_id: position.organizationId,
      element_id: position.elementId,
      position_code: position.positionCode,
      variant_id: position.variantId,
      active_from: position.activeFrom,
      active_to: position.activeTo,
      review_status: position.reviewStatus,
    };
    const { data, error } = await client
      .from("layout_positions")
      .insert(row)
      .select(POSITION_COLUMNS)
      .single();
    if (error) {
      throw new Error(`Failed to insert layout position: ${error.message}`);
    }
    return mapPosition(data);
  }

  async updatePosition(position: LayoutPosition): Promise<LayoutPosition> {
    const client = await this.createClient();
    const row: PositionsUpdate = {
      variant_id: position.variantId,
      active_from: position.activeFrom,
      active_to: position.activeTo,
      review_status: position.reviewStatus,
    };
    const { data, error } = await client
      .from("layout_positions")
      .update(row)
      .eq("organization_id", position.organizationId)
      .eq("id", position.id)
      .select(POSITION_COLUMNS)
      .single();
    if (error) {
      throw new Error(`Failed to update layout position: ${error.message}`);
    }
    return mapPosition(data);
  }

  async listVersionHistory(
    organizationId: string,
    layoutId: string
  ): Promise<LayoutVersionEntry[]> {
    const client = await this.createClient();
    const { data, error } = await client
      .from("layout_version_history")
      .select(HISTORY_COLUMNS)
      .eq("organization_id", organizationId)
      .eq("layout_id", layoutId)
      .order("created_at", { ascending: true });
    if (error) {
      throw new Error(`Failed to list layout version history: ${error.message}`);
    }
    return data.map(mapHistoryEntry);
  }

  async insertVersionEntry(entry: LayoutVersionEntry): Promise<LayoutVersionEntry> {
    const client = await this.createClient();
    const row: HistoryInsert = {
      id: entry.id,
      organization_id: entry.organizationId,
      layout_id: entry.layoutId,
      version: entry.version,
      change_type: entry.changeType,
      element_id: entry.elementId,
      position_id: entry.positionId,
      previous_variant_id: entry.previousVariantId,
      new_variant_id: entry.newVariantId,
      origin: entry.origin,
      destination: entry.destination,
      reason: entry.reason,
      changed_by: entry.changedBy,
    };
    const { data, error } = await client
      .from("layout_version_history")
      .insert(row)
      .select(HISTORY_COLUMNS)
      .single();
    if (error) {
      throw new Error(`Failed to insert layout version entry: ${error.message}`);
    }
    return mapHistoryEntry(data);
  }

  private async createClient() {
    if (!hasSupabaseConfig()) {
      throw new RepositoryConfigurationError();
    }
    return createSupabaseServerClient();
  }
}

function mapLayout(
  row: Database["public"]["Tables"]["layouts"]["Row"]
): Layout {
  return {
    id: row.id,
    organizationId: row.organization_id,
    branchId: row.branch_id,
    name: row.name,
    status: assertLayoutStatus(row.status),
    version: row.version,
    width: row.width,
    height: row.height,
    backgroundReference: row.background_reference,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapElement(
  row: Database["public"]["Tables"]["layout_elements"]["Row"]
): LayoutElement {
  return {
    id: row.id,
    organizationId: row.organization_id,
    layoutId: row.layout_id,
    elementType: assertLayoutElementType(row.element_type),
    code: row.code,
    label: row.label,
    x: row.x,
    y: row.y,
    width: row.width,
    height: row.height,
    rotation: row.rotation,
    locked: row.locked,
    zIndex: row.z_index,
    metadata: metadataFromJson(row.metadata),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapPosition(
  row: Database["public"]["Tables"]["layout_positions"]["Row"]
): LayoutPosition {
  return {
    id: row.id,
    organizationId: row.organization_id,
    elementId: row.element_id,
    positionCode: row.position_code,
    variantId: row.variant_id,
    activeFrom: row.active_from,
    activeTo: row.active_to,
    reviewStatus: assertLayoutReviewStatus(row.review_status),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapHistoryEntry(
  row: Database["public"]["Tables"]["layout_version_history"]["Row"]
): LayoutVersionEntry {
  return {
    id: row.id,
    organizationId: row.organization_id,
    layoutId: row.layout_id,
    version: row.version,
    changeType: assertLayoutChangeType(row.change_type),
    elementId: row.element_id,
    positionId: row.position_id,
    previousVariantId: row.previous_variant_id,
    newVariantId: row.new_variant_id,
    origin: row.origin,
    destination: row.destination,
    reason: row.reason,
    changedBy: row.changed_by,
    createdAt: row.created_at,
  };
}

function metadataFromJson(
  value: Json | null
): Record<string, unknown> | null {
  if (value === null) {
    return null;
  }
  if (typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}
