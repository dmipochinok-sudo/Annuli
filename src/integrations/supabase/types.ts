export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      base_access_grants: {
        Row: {
          consent_at: string
          created_at: string
          expires_at: string | null
          grantee_id: string
          id: string
          level: string
          owner_id: string
          revoked_at: string | null
          updated_at: string
        }
        Insert: {
          consent_at?: string
          created_at?: string
          expires_at?: string | null
          grantee_id: string
          id?: string
          level?: string
          owner_id: string
          revoked_at?: string | null
          updated_at?: string
        }
        Update: {
          consent_at?: string
          created_at?: string
          expires_at?: string | null
          grantee_id?: string
          id?: string
          level?: string
          owner_id?: string
          revoked_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      book_projects: {
        Row: {
          amount: number
          created_at: string
          due_date: string | null
          id: string
          notes: string
          order_no: string
          owner_id: string
          paid_amount: number
          plan: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          due_date?: string | null
          id?: string
          notes?: string
          order_no?: string
          owner_id: string
          paid_amount?: number
          plan?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          due_date?: string | null
          id?: string
          notes?: string
          order_no?: string
          owner_id?: string
          paid_amount?: number
          plan?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      genealogy_bases: {
        Row: {
          created_at: string
          id: string
          owner_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          owner_id: string
          title?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          owner_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          plan: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          plan?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          plan?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          body: string
          created_at: string
          id: string
          is_read: boolean
          project_id: string | null
          sender_id: string
          updated_at: string
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          is_read?: boolean
          project_id?: string | null
          sender_id: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_read?: boolean
          project_id?: string | null
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "book_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          kind: string
          read_at: string | null
          user_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          kind?: string
          read_at?: string | null
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          kind?: string
          read_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      persons: {
        Row: {
          base_id: string | null
          created_at: string
          data: Json
          full_name: string
          id: string
          owner_id: string
          person_index: string
          updated_at: string
        }
        Insert: {
          base_id?: string | null
          created_at?: string
          data?: Json
          full_name?: string
          id: string
          owner_id: string
          person_index?: string
          updated_at?: string
        }
        Update: {
          base_id?: string | null
          created_at?: string
          data?: Json
          full_name?: string
          id?: string
          owner_id?: string
          person_index?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "persons_base_id_fkey"
            columns: ["base_id"]
            isOneToOne: false
            referencedRelation: "genealogy_bases"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string
          city: string
          created_at: string
          display_name: string
          email: string
          id: string
          is_blocked: boolean
          note: string
          phone: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string
          city?: string
          created_at?: string
          display_name?: string
          email?: string
          id: string
          is_blocked?: boolean
          note?: string
          phone?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string
          city?: string
          created_at?: string
          display_name?: string
          email?: string
          id?: string
          is_blocked?: boolean
          note?: string
          phone?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_stages: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          position: number
          project_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          position?: number
          project_id: string
          status?: string
          title?: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          position?: number
          project_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_stages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "book_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      role_audit_logs: {
        Row: {
          action: string
          actor: string | null
          actor_email: string
          category: string
          created_at: string
          details: Json
          id: string
          target: string | null
          target_email: string
        }
        Insert: {
          action: string
          actor?: string | null
          actor_email?: string
          category?: string
          created_at?: string
          details?: Json
          id?: string
          target?: string | null
          target_email?: string
        }
        Update: {
          action?: string
          actor?: string | null
          actor_email?: string
          category?: string
          created_at?: string
          details?: Json
          id?: string
          target?: string | null
          target_email?: string
        }
        Relationships: []
      }
      site_addons: {
        Row: {
          code: string
          created_at: string
          desc_en: string
          desc_ru: string
          id: string
          is_visible: boolean
          name_en: string
          name_ru: string
          note_en: string
          note_ru: string
          price_en: string
          price_ru: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          code?: string
          created_at?: string
          desc_en?: string
          desc_ru?: string
          id?: string
          is_visible?: boolean
          name_en?: string
          name_ru?: string
          note_en?: string
          note_ru?: string
          price_en?: string
          price_ru?: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          desc_en?: string
          desc_ru?: string
          id?: string
          is_visible?: boolean
          name_en?: string
          name_ru?: string
          note_en?: string
          note_ru?: string
          price_en?: string
          price_ru?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      site_assets: {
        Row: {
          alt_en: string
          alt_ru: string
          key: string
          updated_at: string
          url: string
        }
        Insert: {
          alt_en?: string
          alt_ru?: string
          key: string
          updated_at?: string
          url?: string
        }
        Update: {
          alt_en?: string
          alt_ru?: string
          key?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      site_content: {
        Row: {
          en: string
          key: string
          ru: string
          updated_at: string
        }
        Insert: {
          en?: string
          key: string
          ru?: string
          updated_at?: string
        }
        Update: {
          en?: string
          key?: string
          ru?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_sections: {
        Row: {
          key: string
          sort_order: number
          updated_at: string
          visible: boolean
        }
        Insert: {
          key: string
          sort_order?: number
          updated_at?: string
          visible?: boolean
        }
        Update: {
          key?: string
          sort_order?: number
          updated_at?: string
          visible?: boolean
        }
        Relationships: []
      }
      specialist_profiles: {
        Row: {
          about_en: string
          about_ru: string
          accepts_clients: boolean
          activities_en: string
          activities_ru: string
          archives_en: string
          archives_ru: string
          avatar_url: string
          bases_limit: number
          created_at: string
          featured: boolean
          featured_order: number
          is_visible: boolean
          plan: string
          regions_en: string
          regions_ru: string
          specialization_en: string
          specialization_ru: string
          storage_limit_mb: number
          updated_at: string
          user_id: string
        }
        Insert: {
          about_en?: string
          about_ru?: string
          accepts_clients?: boolean
          activities_en?: string
          activities_ru?: string
          archives_en?: string
          archives_ru?: string
          avatar_url?: string
          bases_limit?: number
          created_at?: string
          featured?: boolean
          featured_order?: number
          is_visible?: boolean
          plan?: string
          regions_en?: string
          regions_ru?: string
          specialization_en?: string
          specialization_ru?: string
          storage_limit_mb?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          about_en?: string
          about_ru?: string
          accepts_clients?: boolean
          activities_en?: string
          activities_ru?: string
          archives_en?: string
          archives_ru?: string
          avatar_url?: string
          bases_limit?: number
          created_at?: string
          featured?: boolean
          featured_order?: number
          is_visible?: boolean
          plan?: string
          regions_en?: string
          regions_ru?: string
          specialization_en?: string
          specialization_ru?: string
          storage_limit_mb?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      specialist_rates: {
        Row: {
          created_at: string
          id: string
          includes_en: string
          includes_ru: string
          kind: string
          name_en: string
          name_ru: string
          price_en: string
          price_ru: string
          sort_order: number
          term_en: string
          term_ru: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          includes_en?: string
          includes_ru?: string
          kind?: string
          name_en?: string
          name_ru?: string
          price_en?: string
          price_ru?: string
          sort_order?: number
          term_en?: string
          term_ru?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          includes_en?: string
          includes_ru?: string
          kind?: string
          name_en?: string
          name_ru?: string
          price_en?: string
          price_ru?: string
          sort_order?: number
          term_en?: string
          term_ru?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      specialist_reviews: {
        Row: {
          body: string
          client_id: string | null
          client_name: string
          created_at: string
          id: string
          is_published: boolean
          order_confirmed: boolean
          reply: string
          specialist_id: string
          updated_at: string
        }
        Insert: {
          body?: string
          client_id?: string | null
          client_name?: string
          created_at?: string
          id?: string
          is_published?: boolean
          order_confirmed?: boolean
          reply?: string
          specialist_id: string
          updated_at?: string
        }
        Update: {
          body?: string
          client_id?: string | null
          client_name?: string
          created_at?: string
          id?: string
          is_published?: boolean
          order_confirmed?: boolean
          reply?: string
          specialist_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_owner_flags: {
        Row: {
          created_at: string
          is_owner: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          is_owner?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          is_owner?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_product_roles: {
        Row: {
          created_at: string
          product_role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          product_role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          product_role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bases_limit_for: { Args: { _user: string }; Returns: number }
      current_app_role: { Args: never; Returns: string }
      has_base_access: { Args: { _owner: string }; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      is_owner: { Args: never; Returns: boolean }
      list_audit_logs: {
        Args: { _category?: string; _limit?: number; _offset?: number }
        Returns: {
          action: string
          actor_email: string
          category: string
          created_at: string
          details: Json
          id: string
          target_email: string
        }[]
      }
      list_featured_specialists: {
        Args: never
        Returns: {
          about_en: string
          about_ru: string
          accepts_clients: boolean
          activities_en: string
          activities_ru: string
          archives_en: string
          archives_ru: string
          avatar_url: string
          featured_order: number
          full_name: string
          rates: Json
          regions_en: string
          regions_ru: string
          reviews: Json
          specialization_en: string
          specialization_ru: string
          user_id: string
        }[]
      }
      list_specialists: {
        Args: never
        Returns: {
          display_name: string
          id: string
        }[]
      }
      log_action: {
        Args: {
          _action: string
          _category: string
          _details?: Json
          _target?: string
        }
        Returns: undefined
      }
      owner_list_users: {
        Args: never
        Returns: {
          avatar_url: string
          created_at: string
          display_name: string
          email: string
          id: string
          is_admin: boolean
          is_blocked: boolean
          is_owner: boolean
          product_role: string
        }[]
      }
      register_product_role: {
        Args: { requested_role: string }
        Returns: undefined
      }
      set_user_admin: {
        Args: { make_admin: boolean; target_user: string }
        Returns: undefined
      }
      set_user_owner: {
        Args: { make_owner: boolean; target_user: string }
        Returns: undefined
      }
      set_user_product_role: {
        Args: { new_role: string; target_user: string }
        Returns: undefined
      }
      staff_list_specialists: {
        Args: never
        Returns: {
          accepts_clients: boolean
          bases_count: number
          bases_limit: number
          email: string
          featured: boolean
          featured_order: number
          full_name: string
          has_card: boolean
          is_visible: boolean
          plan: string
          user_id: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
