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
      [_ in never]: never
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
