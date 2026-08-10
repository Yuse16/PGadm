export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  _audit: {
    Tables: {
      catalog_events: {
        Row: {
          action: string
          actor_user_id: string
          detail: string
          entity_id: string
          entity_type: string
          id: string
          occurred_at: string
          organization_id: string
        }
        Insert: {
          action: string
          actor_user_id: string
          detail?: string
          entity_id: string
          entity_type: string
          id?: string
          occurred_at?: string
          organization_id: string
        }
        Update: {
          action?: string
          actor_user_id?: string
          detail?: string
          entity_id?: string
          entity_type?: string
          id?: string
          occurred_at?: string
          organization_id?: string
        }
        Relationships: []
      }
      inventory_events: {
        Row: {
          action: string
          actor_user_id: string
          detail: string
          entity_id: string
          entity_type: string
          id: string
          occurred_at: string
          organization_id: string
        }
        Insert: {
          action: string
          actor_user_id: string
          detail?: string
          entity_id: string
          entity_type: string
          id?: string
          occurred_at?: string
          organization_id: string
        }
        Update: {
          action?: string
          actor_user_id?: string
          detail?: string
          entity_id?: string
          entity_type?: string
          id?: string
          occurred_at?: string
          organization_id?: string
        }
        Relationships: []
      }
      layout_events: {
        Row: {
          action: string
          actor_user_id: string
          detail: string
          entity_id: string
          entity_type: string
          id: string
          occurred_at: string
          organization_id: string
        }
        Insert: {
          action: string
          actor_user_id: string
          detail?: string
          entity_id: string
          entity_type: string
          id?: string
          occurred_at?: string
          organization_id: string
        }
        Update: {
          action?: string
          actor_user_id?: string
          detail?: string
          entity_id?: string
          entity_type?: string
          id?: string
          occurred_at?: string
          organization_id?: string
        }
        Relationships: []
      }
      sales_events: {
        Row: {
          action: string
          actor_user_id: string
          detail: string
          entity_id: string
          entity_type: string
          id: string
          new_data: Json | null
          occurred_at: string
          organization_id: string
          previous_data: Json | null
        }
        Insert: {
          action: string
          actor_user_id: string
          detail?: string
          entity_id: string
          entity_type: string
          id?: string
          new_data?: Json | null
          occurred_at?: string
          organization_id: string
          previous_data?: Json | null
        }
        Update: {
          action?: string
          actor_user_id?: string
          detail?: string
          entity_id?: string
          entity_type?: string
          id?: string
          new_data?: Json | null
          occurred_at?: string
          organization_id?: string
          previous_data?: Json | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      branch_warehouse_relations: {
        Row: {
          active: boolean
          branch_id: string
          created_at: string
          id: string
          organization_id: string
          priority: number
          relationship_type: string
          special_rules: string | null
          updated_at: string
          valid_from: string
          valid_to: string | null
          warehouse_id: string
        }
        Insert: {
          active?: boolean
          branch_id: string
          created_at?: string
          id?: string
          organization_id: string
          priority?: number
          relationship_type: string
          special_rules?: string | null
          updated_at?: string
          valid_from?: string
          valid_to?: string | null
          warehouse_id: string
        }
        Update: {
          active?: boolean
          branch_id?: string
          created_at?: string
          id?: string
          organization_id?: string
          priority?: number
          relationship_type?: string
          special_rules?: string | null
          updated_at?: string
          valid_from?: string
          valid_to?: string | null
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bwr_branch_organization_fk"
            columns: ["organization_id", "branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "bwr_warehouse_organization_fk"
            columns: ["organization_id", "warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      branches: {
        Row: {
          address_line: string | null
          branch_type: string
          city: string | null
          code: string
          country: string
          created_at: string
          external_id: string | null
          external_source: string | null
          id: string
          name: string
          organization_id: string
          postal_code: string | null
          state_province: string | null
          status: string
          timezone: string | null
          updated_at: string
        }
        Insert: {
          address_line?: string | null
          branch_type: string
          city?: string | null
          code: string
          country?: string
          created_at?: string
          external_id?: string | null
          external_source?: string | null
          id?: string
          name: string
          organization_id: string
          postal_code?: string | null
          state_province?: string | null
          status?: string
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          address_line?: string | null
          branch_type?: string
          city?: string | null
          code?: string
          country?: string
          created_at?: string
          external_id?: string | null
          external_source?: string | null
          id?: string
          name?: string
          organization_id?: string
          postal_code?: string | null
          state_province?: string | null
          status?: string
          timezone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "branches_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      cedis_requests: {
        Row: {
          branch_id: string
          created_at: string
          id: string
          observations: string | null
          organization_id: string
          quotation_id: string | null
          requested_date: string
          requested_quantity: number
          required_date: string | null
          seller_id: string
          status: string
          updated_at: string
          variant_id: string
        }
        Insert: {
          branch_id: string
          created_at?: string
          id?: string
          observations?: string | null
          organization_id: string
          quotation_id?: string | null
          requested_date: string
          requested_quantity: number
          required_date?: string | null
          seller_id: string
          status?: string
          updated_at?: string
          variant_id: string
        }
        Update: {
          branch_id?: string
          created_at?: string
          id?: string
          observations?: string | null
          organization_id?: string
          quotation_id?: string | null
          requested_date?: string
          requested_quantity?: number
          required_date?: string | null
          seller_id?: string
          status?: string
          updated_at?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cedis_requests_branch_organization_fk"
            columns: ["organization_id", "branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "cedis_requests_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cedis_requests_quotation_organization_fk"
            columns: ["organization_id", "quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "cedis_requests_seller_fk"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cedis_requests_variant_organization_fk"
            columns: ["organization_id", "variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      customers: {
        Row: {
          assigned_seller_id: string | null
          created_at: string
          id: string
          name: string
          organization_id: string
          phone: string | null
          status: string
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          assigned_seller_id?: string | null
          created_at?: string
          id?: string
          name: string
          organization_id: string
          phone?: string | null
          status?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          assigned_seller_id?: string | null
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          phone?: string | null
          status?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_assigned_seller_fk"
            columns: ["assigned_seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      import_templates: {
        Row: {
          column_mapping: Json
          created_at: string
          id: string
          name: string
          organization_id: string
          sheet_name: string | null
          status: string
          updated_at: string
          warehouse_rules: Json | null
        }
        Insert: {
          column_mapping: Json
          created_at?: string
          id?: string
          name: string
          organization_id: string
          sheet_name?: string | null
          status?: string
          updated_at?: string
          warehouse_rules?: Json | null
        }
        Update: {
          column_mapping?: Json
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          sheet_name?: string | null
          status?: string
          updated_at?: string
          warehouse_rules?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "import_templates_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_changes: {
        Row: {
          change_type: string
          created_at: string
          detected_at: string
          difference: number
          id: string
          new_quantity: number
          organization_id: string
          previous_quantity: number
          source_snapshot_id: string
          variant_id: string
          warehouse_id: string
        }
        Insert: {
          change_type: string
          created_at?: string
          detected_at?: string
          difference?: number
          id?: string
          new_quantity: number
          organization_id: string
          previous_quantity: number
          source_snapshot_id: string
          variant_id: string
          warehouse_id: string
        }
        Update: {
          change_type?: string
          created_at?: string
          detected_at?: string
          difference?: number
          id?: string
          new_quantity?: number
          organization_id?: string
          previous_quantity?: number
          source_snapshot_id?: string
          variant_id?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_changes_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_changes_snapshot_organization_fk"
            columns: ["organization_id", "source_snapshot_id"]
            isOneToOne: false
            referencedRelation: "inventory_snapshots"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "inventory_changes_variant_organization_fk"
            columns: ["organization_id", "variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "inventory_changes_warehouse_organization_fk"
            columns: ["organization_id", "warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      inventory_observations: {
        Row: {
          created_at: string
          created_by: string
          evidence_url: string | null
          id: string
          note: string | null
          observation_type: string
          observed_quantity: number | null
          organization_id: string
          updated_at: string
          variant_id: string
          warehouse_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          evidence_url?: string | null
          id?: string
          note?: string | null
          observation_type: string
          observed_quantity?: number | null
          organization_id: string
          updated_at?: string
          variant_id: string
          warehouse_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          evidence_url?: string | null
          id?: string
          note?: string | null
          observation_type?: string
          observed_quantity?: number | null
          organization_id?: string
          updated_at?: string
          variant_id?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_observations_created_by_fk"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_observations_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_observations_variant_organization_fk"
            columns: ["organization_id", "variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "inventory_observations_warehouse_organization_fk"
            columns: ["organization_id", "warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      inventory_snapshot_items: {
        Row: {
          boxes: number | null
          created_at: string
          id: string
          organization_id: string
          quantity: number
          snapshot_id: string
          square_meters: number | null
          variant_id: string
        }
        Insert: {
          boxes?: number | null
          created_at?: string
          id?: string
          organization_id: string
          quantity: number
          snapshot_id: string
          square_meters?: number | null
          variant_id: string
        }
        Update: {
          boxes?: number | null
          created_at?: string
          id?: string
          organization_id?: string
          quantity?: number
          snapshot_id?: string
          square_meters?: number | null
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_snapshot_items_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_snapshot_items_snapshot_organization_fk"
            columns: ["organization_id", "snapshot_id"]
            isOneToOne: false
            referencedRelation: "inventory_snapshots"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "inventory_snapshot_items_variant_organization_fk"
            columns: ["organization_id", "variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      inventory_snapshots: {
        Row: {
          created_at: string
          id: string
          imported_at: string
          imported_by: string | null
          is_baseline: boolean
          organization_id: string
          report_date: string
          source: string
          source_file: string | null
          updated_at: string
          warehouse_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          imported_at?: string
          imported_by?: string | null
          is_baseline?: boolean
          organization_id: string
          report_date: string
          source: string
          source_file?: string | null
          updated_at?: string
          warehouse_id: string
        }
        Update: {
          created_at?: string
          id?: string
          imported_at?: string
          imported_by?: string | null
          is_baseline?: boolean
          organization_id?: string
          report_date?: string
          source?: string
          source_file?: string | null
          updated_at?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_snapshots_imported_by_fk"
            columns: ["imported_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_snapshots_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_snapshots_warehouse_organization_fk"
            columns: ["organization_id", "warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      layout_elements: {
        Row: {
          code: string
          created_at: string
          element_type: string
          height: number
          id: string
          label: string | null
          layout_id: string
          locked: boolean
          metadata: Json | null
          organization_id: string
          rotation: number
          updated_at: string
          width: number
          x: number
          y: number
          z_index: number
        }
        Insert: {
          code: string
          created_at?: string
          element_type: string
          height?: number
          id?: string
          label?: string | null
          layout_id: string
          locked?: boolean
          metadata?: Json | null
          organization_id: string
          rotation?: number
          updated_at?: string
          width?: number
          x?: number
          y?: number
          z_index?: number
        }
        Update: {
          code?: string
          created_at?: string
          element_type?: string
          height?: number
          id?: string
          label?: string | null
          layout_id?: string
          locked?: boolean
          metadata?: Json | null
          organization_id?: string
          rotation?: number
          updated_at?: string
          width?: number
          x?: number
          y?: number
          z_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "layout_elements_layout_organization_fk"
            columns: ["organization_id", "layout_id"]
            isOneToOne: false
            referencedRelation: "layouts"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "layout_elements_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      layout_positions: {
        Row: {
          active_from: string | null
          active_to: string | null
          created_at: string
          element_id: string
          id: string
          organization_id: string
          position_code: string
          review_status: string
          updated_at: string
          variant_id: string | null
        }
        Insert: {
          active_from?: string | null
          active_to?: string | null
          created_at?: string
          element_id: string
          id?: string
          organization_id: string
          position_code: string
          review_status?: string
          updated_at?: string
          variant_id?: string | null
        }
        Update: {
          active_from?: string | null
          active_to?: string | null
          created_at?: string
          element_id?: string
          id?: string
          organization_id?: string
          position_code?: string
          review_status?: string
          updated_at?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "layout_positions_element_organization_fk"
            columns: ["organization_id", "element_id"]
            isOneToOne: false
            referencedRelation: "layout_elements"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "layout_positions_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "layout_positions_variant_organization_fk"
            columns: ["organization_id", "variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      layout_version_history: {
        Row: {
          change_type: string
          changed_by: string
          created_at: string
          destination: string | null
          element_id: string | null
          id: string
          layout_id: string
          new_variant_id: string | null
          organization_id: string
          origin: string | null
          position_id: string | null
          previous_variant_id: string | null
          reason: string | null
          version: number
        }
        Insert: {
          change_type: string
          changed_by: string
          created_at?: string
          destination?: string | null
          element_id?: string | null
          id?: string
          layout_id: string
          new_variant_id?: string | null
          organization_id: string
          origin?: string | null
          position_id?: string | null
          previous_variant_id?: string | null
          reason?: string | null
          version: number
        }
        Update: {
          change_type?: string
          changed_by?: string
          created_at?: string
          destination?: string | null
          element_id?: string | null
          id?: string
          layout_id?: string
          new_variant_id?: string | null
          organization_id?: string
          origin?: string | null
          position_id?: string | null
          previous_variant_id?: string | null
          reason?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "layout_version_history_changed_by_fk"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "layout_version_history_element_organization_fk"
            columns: ["organization_id", "element_id"]
            isOneToOne: false
            referencedRelation: "layout_elements"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "layout_version_history_layout_organization_fk"
            columns: ["organization_id", "layout_id"]
            isOneToOne: false
            referencedRelation: "layouts"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "layout_version_history_new_variant_organization_fk"
            columns: ["organization_id", "new_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "layout_version_history_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "layout_version_history_position_organization_fk"
            columns: ["organization_id", "position_id"]
            isOneToOne: false
            referencedRelation: "layout_positions"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "layout_version_history_previous_variant_organization_fk"
            columns: ["organization_id", "previous_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      layouts: {
        Row: {
          background_reference: string | null
          branch_id: string
          created_at: string
          height: number | null
          id: string
          name: string
          organization_id: string
          status: string
          updated_at: string
          version: number
          width: number | null
        }
        Insert: {
          background_reference?: string | null
          branch_id: string
          created_at?: string
          height?: number | null
          id?: string
          name: string
          organization_id: string
          status?: string
          updated_at?: string
          version?: number
          width?: number | null
        }
        Update: {
          background_reference?: string | null
          branch_id?: string
          created_at?: string
          height?: number | null
          id?: string
          name?: string
          organization_id?: string
          status?: string
          updated_at?: string
          version?: number
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "layouts_branch_organization_fk"
            columns: ["organization_id", "branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "layouts_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      manual_sale_entries: {
        Row: {
          branch_id: string
          comment: string | null
          created_at: string
          id: string
          organization_id: string
          returns_amount: number
          sale_date: string
          sales_amount: number
          seller_id: string
          tickets_count: number
          updated_at: string
        }
        Insert: {
          branch_id: string
          comment?: string | null
          created_at?: string
          id?: string
          organization_id: string
          returns_amount?: number
          sale_date: string
          sales_amount?: number
          seller_id: string
          tickets_count?: number
          updated_at?: string
        }
        Update: {
          branch_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          organization_id?: string
          returns_amount?: number
          sale_date?: string
          sales_amount?: number
          seller_id?: string
          tickets_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "manual_sale_entries_branch_organization_fk"
            columns: ["organization_id", "branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "manual_sale_entries_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manual_sale_entries_seller_fk"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_memberships: {
        Row: {
          created_at: string
          organization_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          organization_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          organization_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_memberships_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_memberships_user_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          code: string
          created_at: string
          currency: string
          external_id: string | null
          external_source: string | null
          id: string
          language: string
          legal_name: string | null
          name: string
          status: string
          timezone: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          currency?: string
          external_id?: string | null
          external_source?: string | null
          id?: string
          language?: string
          legal_name?: string | null
          name: string
          status?: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          currency?: string
          external_id?: string | null
          external_source?: string | null
          id?: string
          language?: string
          legal_name?: string | null
          name?: string
          status?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      permissions: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          status: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          status?: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_barcodes: {
        Row: {
          barcode: string
          created_at: string
          id: string
          is_primary: boolean
          organization_id: string
          updated_at: string
          variant_id: string
        }
        Insert: {
          barcode: string
          created_at?: string
          id?: string
          is_primary?: boolean
          organization_id: string
          updated_at?: string
          variant_id: string
        }
        Update: {
          barcode?: string
          created_at?: string
          id?: string
          is_primary?: boolean
          organization_id?: string
          updated_at?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_barcodes_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_barcodes_variant_organization_fk"
            columns: ["organization_id", "variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      product_brands: {
        Row: {
          code: string
          created_at: string
          id: string
          name: string
          organization_id: string
          status: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          name: string
          organization_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_brands_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          code: string
          created_at: string
          id: string
          name: string
          organization_id: string
          parent_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          name: string
          organization_id: string
          parent_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          parent_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_categories_parent_organization_fk"
            columns: ["organization_id", "parent_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      product_lines: {
        Row: {
          created_at: string
          external_id: string | null
          id: string
          name: string
          organization_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          external_id?: string | null
          id?: string
          name: string
          organization_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          external_id?: string | null
          id?: string
          name?: string
          organization_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_lines_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          base_unit_id: string
          base_units_per_sale_unit: number
          created_at: string
          display_name: string | null
          finish: string | null
          format: string | null
          id: string
          organization_id: string
          pieces_per_box: number | null
          product_id: string
          reference_price: number | null
          sale_unit_id: string
          sku: string
          square_meters_per_box: number | null
          status: string
          updated_at: string
        }
        Insert: {
          base_unit_id: string
          base_units_per_sale_unit?: number
          created_at?: string
          display_name?: string | null
          finish?: string | null
          format?: string | null
          id?: string
          organization_id: string
          pieces_per_box?: number | null
          product_id: string
          reference_price?: number | null
          sale_unit_id: string
          sku: string
          square_meters_per_box?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          base_unit_id?: string
          base_units_per_sale_unit?: number
          created_at?: string
          display_name?: string | null
          finish?: string | null
          format?: string | null
          id?: string
          organization_id?: string
          pieces_per_box?: number | null
          product_id?: string
          reference_price?: number | null
          sale_unit_id?: string
          sku?: string
          square_meters_per_box?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_base_unit_organization_fk"
            columns: ["organization_id", "base_unit_id"]
            isOneToOne: false
            referencedRelation: "units_of_measure"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "product_variants_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variants_product_organization_fk"
            columns: ["organization_id", "product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "product_variants_sale_unit_organization_fk"
            columns: ["organization_id", "sale_unit_id"]
            isOneToOne: false
            referencedRelation: "units_of_measure"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      products: {
        Row: {
          brand_id: string | null
          category_id: string | null
          created_at: string
          description: string
          external_id: string | null
          id: string
          line_id: string | null
          organization_id: string
          short_name: string | null
          status: string
          technical_description: string | null
          updated_at: string
        }
        Insert: {
          brand_id?: string | null
          category_id?: string | null
          created_at?: string
          description: string
          external_id?: string | null
          id?: string
          line_id?: string | null
          organization_id: string
          short_name?: string | null
          status?: string
          technical_description?: string | null
          updated_at?: string
        }
        Update: {
          brand_id?: string | null
          category_id?: string | null
          created_at?: string
          description?: string
          external_id?: string | null
          id?: string
          line_id?: string | null
          organization_id?: string
          short_name?: string | null
          status?: string
          technical_description?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_organization_fk"
            columns: ["organization_id", "brand_id"]
            isOneToOne: false
            referencedRelation: "product_brands"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "products_category_organization_fk"
            columns: ["organization_id", "category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "products_line_organization_fk"
            columns: ["organization_id", "line_id"]
            isOneToOne: false
            referencedRelation: "product_lines"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "products_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      quotation_items: {
        Row: {
          area_square_meters: number | null
          base_units_per_sale_unit: number
          box_quantity: number | null
          complement_of_id: string | null
          created_at: string
          id: string
          line_total: number
          organization_id: string
          pieces_per_box: number | null
          quotation_id: string
          reference_price: number | null
          sale_unit_id: string
          sort_order: number
          square_meters_per_box: number | null
          unit_price: number | null
          updated_at: string
          variant_id: string
          waste_percent: number | null
        }
        Insert: {
          area_square_meters?: number | null
          base_units_per_sale_unit?: number
          box_quantity?: number | null
          complement_of_id?: string | null
          created_at?: string
          id?: string
          line_total?: number
          organization_id: string
          pieces_per_box?: number | null
          quotation_id: string
          reference_price?: number | null
          sale_unit_id: string
          sort_order?: number
          square_meters_per_box?: number | null
          unit_price?: number | null
          updated_at?: string
          variant_id: string
          waste_percent?: number | null
        }
        Update: {
          area_square_meters?: number | null
          base_units_per_sale_unit?: number
          box_quantity?: number | null
          complement_of_id?: string | null
          created_at?: string
          id?: string
          line_total?: number
          organization_id?: string
          pieces_per_box?: number | null
          quotation_id?: string
          reference_price?: number | null
          sale_unit_id?: string
          sort_order?: number
          square_meters_per_box?: number | null
          unit_price?: number | null
          updated_at?: string
          variant_id?: string
          waste_percent?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quotation_items_complement_organization_fk"
            columns: ["organization_id", "complement_of_id"]
            isOneToOne: false
            referencedRelation: "quotation_items"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "quotation_items_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotation_items_quotation_organization_fk"
            columns: ["organization_id", "quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "quotation_items_sale_unit_organization_fk"
            columns: ["organization_id", "sale_unit_id"]
            isOneToOne: false
            referencedRelation: "units_of_measure"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "quotation_items_variant_organization_fk"
            columns: ["organization_id", "variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      quotations: {
        Row: {
          branch_id: string
          created_at: string
          customer_id: string | null
          delivery_status: string
          folio: string
          id: string
          observations: string | null
          organization_id: string
          seller_id: string
          status: string
          subtotal: number
          total: number
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          branch_id: string
          created_at?: string
          customer_id?: string | null
          delivery_status?: string
          folio: string
          id?: string
          observations?: string | null
          organization_id: string
          seller_id: string
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          branch_id?: string
          created_at?: string
          customer_id?: string | null
          delivery_status?: string
          folio?: string
          id?: string
          observations?: string | null
          organization_id?: string
          seller_id?: string
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotations_branch_organization_fk"
            columns: ["organization_id", "branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "quotations_customer_organization_fk"
            columns: ["organization_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "quotations_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotations_seller_fk"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string
          id: string
          permission_id: string
          role_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          permission_id: string
          role_id: string
        }
        Update: {
          created_at?: string
          id?: string
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_fk"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_fk"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          code: string
          created_at: string
          id: string
          name: string
          organization_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          name: string
          organization_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name?: string
          organization_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "roles_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_budgets: {
        Row: {
          amount: number
          branch_id: string
          created_at: string
          id: string
          organization_id: string
          period: string
          seller_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          branch_id: string
          created_at?: string
          id?: string
          organization_id: string
          period: string
          seller_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          branch_id?: string
          created_at?: string
          id?: string
          organization_id?: string
          period?: string
          seller_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_budgets_branch_organization_fk"
            columns: ["organization_id", "branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "sales_budgets_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_budgets_seller_fk"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      units_of_measure: {
        Row: {
          code: string
          created_at: string
          id: string
          kind: string
          name: string
          organization_id: string
          status: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          kind: string
          name: string
          organization_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          kind?: string
          name?: string
          organization_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "units_of_measure_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_role_assignments: {
        Row: {
          branch_id: string | null
          created_at: string
          id: string
          organization_id: string
          role_id: string
          status: string
          updated_at: string
          user_id: string
          valid_from: string
          valid_to: string | null
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          id?: string
          organization_id: string
          role_id: string
          status?: string
          updated_at?: string
          user_id: string
          valid_from?: string
          valid_to?: string | null
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          id?: string
          organization_id?: string
          role_id?: string
          status?: string
          updated_at?: string
          user_id?: string
          valid_from?: string
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_role_assignments_branch_fk"
            columns: ["organization_id", "branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "user_role_assignments_membership_fk"
            columns: ["organization_id", "user_id"]
            isOneToOne: false
            referencedRelation: "organization_memberships"
            referencedColumns: ["organization_id", "user_id"]
          },
          {
            foreignKeyName: "user_role_assignments_role_fk"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouses: {
        Row: {
          branch_id: string
          code: string
          created_at: string
          external_id: string | null
          external_source: string | null
          id: string
          is_primary: boolean
          name: string
          organization_id: string
          status: string
          updated_at: string
          warehouse_type: string
        }
        Insert: {
          branch_id: string
          code: string
          created_at?: string
          external_id?: string | null
          external_source?: string | null
          id?: string
          is_primary?: boolean
          name: string
          organization_id: string
          status?: string
          updated_at?: string
          warehouse_type: string
        }
        Update: {
          branch_id?: string
          code?: string
          created_at?: string
          external_id?: string | null
          external_source?: string | null
          id?: string
          is_primary?: boolean
          name?: string
          organization_id?: string
          status?: string
          updated_at?: string
          warehouse_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouses_branch_organization_fk"
            columns: ["organization_id", "branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "warehouses_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_user_permissions: {
        Args: never
        Returns: {
          code: string
          description: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  storage: {
    Tables: {
      buckets: {
        Row: {
          created_at: string | null
          id: string
          name: string
          owner: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          name: string
          owner?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          owner?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          metadata: Json | null
          name: string | null
          owner: string | null
          updated_at: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          updated_at?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      extension: { Args: { name: string }; Returns: string }
      filename: { Args: { name: string }; Returns: string }
      foldername: { Args: { name: string }; Returns: string[] }
      search: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  _audit: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
  storage: {
    Enums: {},
  },
} as const

