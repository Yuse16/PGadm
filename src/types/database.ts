export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
  public: {
    Enums: {},
  },
  storage: {
    Enums: {},
  },
} as const

