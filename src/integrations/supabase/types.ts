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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          created_at: string | null
          id: string
          new_values: Json | null
          old_values: Json | null
          operation: string
          table_name: string
          user_name: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          operation: string
          table_name: string
          user_name?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          operation?: string
          table_name?: string
          user_name?: string | null
        }
        Relationships: []
      }
      cat_app_users: {
        Row: {
          created_at: string
          preferences: Json | null
          updated_at: string
          user_name: string
        }
        Insert: {
          created_at?: string
          preferences?: Json | null
          updated_at?: string
          user_name: string
        }
        Update: {
          created_at?: string
          preferences?: Json | null
          updated_at?: string
          user_name?: string
        }
        Relationships: []
      }
      cat_name_options: {
        Row: {
          avg_rating: number | null
          categories: string[] | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          is_hidden: boolean
          name: string
        }
        Insert: {
          avg_rating?: number | null
          categories?: string[] | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_hidden?: boolean
          name: string
        }
        Update: {
          avg_rating?: number | null
          categories?: string[] | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_hidden?: boolean
          name?: string
        }
        Relationships: []
      }
      cat_name_ratings: {
        Row: {
          is_hidden: boolean | null
          losses: number | null
          name_id: string
          rating: number | null
          rating_history: Json | null
          updated_at: string
          user_name: string
          wins: number | null
        }
        Insert: {
          is_hidden?: boolean | null
          losses?: number | null
          name_id: string
          rating?: number | null
          rating_history?: Json | null
          updated_at?: string
          user_name: string
          wins?: number | null
        }
        Update: {
          is_hidden?: boolean | null
          losses?: number | null
          name_id?: string
          rating?: number | null
          rating_history?: Json | null
          updated_at?: string
          user_name?: string
          wins?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cat_name_ratings_name_id_fkey"
            columns: ["name_id"]
            isOneToOne: false
            referencedRelation: "cat_name_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cat_name_ratings_user_name_fkey"
            columns: ["user_name"]
            isOneToOne: false
            referencedRelation: "cat_app_users"
            referencedColumns: ["user_name"]
          },
        ]
      }
      charts: {
        Row: {
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      flo_entries: {
        Row: {
          created_at: string
          date: string
          id: string
          is_period_day: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          is_period_day?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          is_period_day?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flo_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      flo_shares: {
        Row: {
          created_at: string
          id: string
          owner_id: string
          shared_with_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          owner_id: string
          shared_with_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          owner_id?: string
          shared_with_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "flo_shares_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flo_shares_shared_with_id_fkey"
            columns: ["shared_with_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          apps: string[] | null
          avatar_url: string | null
          created_at: string | null
          display_name: string | null
          email: string | null
          first_name: string | null
          id: string
          updated_at: string | null
          username: string | null
        }
        Insert: {
          apps?: string[] | null
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          apps?: string[] | null
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      reflect_daily: {
        Row: {
          created_at: string
          id: string
          is_user: boolean
          message: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_user?: boolean
          message: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_user?: boolean
          message?: string
          user_id?: string
        }
        Relationships: []
      }
      reflect_retrospectives: {
        Row: {
          content: Json | null
          created_at: string
          id: string
          retrospective_date: string
          retrospective_type: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: Json | null
          created_at?: string
          id?: string
          retrospective_date?: string
          retrospective_type?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: Json | null
          created_at?: string
          id?: string
          retrospective_date?: string
          retrospective_type?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          created_at: string | null
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          created_at?: string | null
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          created_at?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      tournament_selections: {
        Row: {
          created_at: string
          id: number
          name: string
          name_id: string
          selected_at: string
          selection_type: string | null
          tournament_id: string
          user_name: string
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
          name_id: string
          selected_at?: string
          selection_type?: string | null
          tournament_id: string
          user_name: string
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
          name_id?: string
          selected_at?: string
          selection_type?: string | null
          tournament_id?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_selections_name_id_fkey"
            columns: ["name_id"]
            isOneToOne: false
            referencedRelation: "cat_name_options"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          created_at: string
          date: string
          enabled: boolean
          fin_chart_id: string | null
          id: string
          inflow: number
          name: string
          outflow: number
          person: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          enabled?: boolean
          fin_chart_id?: string | null
          id?: string
          inflow?: number
          name: string
          outflow?: number
          person: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          enabled?: boolean
          fin_chart_id?: string | null
          id?: string
          inflow?: number
          name?: string
          outflow?: number
          person?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_fin_chart_id_fkey"
            columns: ["fin_chart_id"]
            isOneToOne: false
            referencedRelation: "charts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_app_access_to_user: { Args: { app_name: string }; Returns: undefined }
      calculate_elo_change: {
        Args: {
          current_rating: number
          opponent_rating: number
          result: number
        }
        Returns: number
      }
      change_user_role: {
        Args: {
          new_role: Database["public"]["Enums"]["app_role"]
          target_user_id: string
        }
        Returns: boolean
      }
      check_current_user_admin: { Args: never; Returns: boolean }
      check_profile_access_rate_limit: { Args: never; Returns: boolean }
      check_user_role_by_name: {
        Args: { required_role: string; user_name_param: string }
        Returns: boolean
      }
      cleanup_orphaned_auth_users: { Args: never; Returns: undefined }
      create_user_account: {
        Args: {
          p_preferences?: Json
          p_user_name: string
          p_user_role?: string
        }
        Returns: undefined
      }
      delete_own_account: { Args: never; Returns: boolean }
      delete_user_complete: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      get_all_users_with_roles: {
        Args: never
        Returns: {
          avatar_url: string
          created_at: string
          display_name: string
          email: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
          username: string
        }[]
      }
      get_current_user_name: { Args: never; Returns: string }
      get_current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_existing_usernames: {
        Args: never
        Returns: {
          avatar_url: string
          display_name: string
          username: string
        }[]
      }
      get_safe_profile_data: {
        Args: { profile_user_id: string }
        Returns: {
          avatar_url: string
          created_at: string
          display_name: string
          id: string
          username: string
        }[]
      }
      get_secure_profile: { Args: { target_user_id: string }; Returns: Json }
      get_top_names_by_category: {
        Args: { p_category: string; p_limit?: number }
        Returns: {
          avg_rating: number
          category: string
          description: string
          id: string
          name: string
          total_ratings: number
        }[]
      }
      get_user_flo_data_admin: {
        Args: { target_user_id: string }
        Returns: {
          created_at: string
          date: string
          id: string
          is_period_day: boolean
          updated_at: string
        }[]
      }
      get_user_profile_by_id: {
        Args: { user_id: string }
        Returns: {
          avatar_url: string
          created_at: string
          display_name: string
          email: string
          first_name: string
          id: string
          username: string
        }[]
      }
      get_user_stats: {
        Args: { p_user_name: string }
        Returns: {
          avg_rating: number
          hidden_count: number
          total_losses: number
          total_ratings: number
          total_wins: number
          win_rate: number
        }[]
      }
      get_users_with_flo_data: {
        Args: never
        Returns: {
          display_name: string
          email: string
          first_name: string
          flo_entries: Json
          user_id: string
        }[]
      }
      has_role:
        | { Args: { _role?: string; _user_name: string }; Returns: boolean }
        | {
            Args: {
              p_role: Database["public"]["Enums"]["app_role"]
              p_user_name: string
            }
            Returns: boolean
          }
        | {
            Args: {
              _role: Database["public"]["Enums"]["app_role"]
              _user_id: string
            }
            Returns: boolean
          }
      increment_selection: {
        Args: { p_name_id: string; p_user_name: string }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
      is_user_admin: { Args: { user_id_to_check: string }; Returns: boolean }
      merge_user_accounts: {
        Args: { p_new_user_id: string; p_username: string }
        Returns: undefined
      }
      refresh_materialized_views: { Args: never; Returns: undefined }
      set_user_context: {
        Args: { user_name_param: string }
        Returns: undefined
      }
      toggle_name_visibility:
        | { Args: { p_hide: boolean; p_name_id: string }; Returns: boolean }
        | {
            Args: { p_hide: boolean; p_name_id: string; p_user_name?: string }
            Returns: boolean
          }
      update_user_tournament_data: {
        Args: { p_tournament_data: Json; p_user_name: string }
        Returns: undefined
      }
      user_exists_by_username: {
        Args: { p_username: string }
        Returns: {
          avatar_url: string
          display_name: string
          first_name: string
          id: string
          username: string
        }[]
      }
      user_has_app_access: {
        Args: { app_name: string; user_id_param: string }
        Returns: boolean
      }
      validate_environment_setup: { Args: never; Returns: boolean }
      validate_username: { Args: { p_username: string }; Returns: Json }
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
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
