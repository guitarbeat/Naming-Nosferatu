type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)";
  };
  public: {
    Tables: {
      audit_log: {
        Row: {
          created_at: string | null;
          id: string;
          new_values: Json | null;
          old_values: Json | null;
          operation: string;
          table_name: string;
          user_name: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          new_values?: Json | null;
          old_values?: Json | null;
          operation: string;
          table_name: string;
          user_name?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          new_values?: Json | null;
          old_values?: Json | null;
          operation?: string;
          table_name?: string;
          user_name?: string | null;
        };
        Relationships: [];
      };
      cat_app_users: {
        Row: {
          created_at: string;
          preferences: Json | null;
          tournament_data: Json | null;
          updated_at: string;
          user_name: string;
          user_role: string | null;
        };
        Insert: {
          created_at?: string;
          preferences?: Json | null;
          tournament_data?: Json | null;
          updated_at?: string;
          user_name: string;
          user_role?: string | null;
        };
        Update: {
          created_at?: string;
          preferences?: Json | null;
          tournament_data?: Json | null;
          updated_at?: string;
          user_name?: string;
          user_role?: string | null;
        };
        Relationships: [];
      };
      cat_name_options: {
        Row: {
          avg_rating: number | null;
          categories: string[] | null;
          created_at: string;
          description: string | null;
          id: string;
          is_active: boolean | null;
          name: string;
          popularity_score: number | null;
          total_tournaments: number | null;
        };
        Insert: {
          avg_rating?: number | null;
          categories?: string[] | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          name: string;
          popularity_score?: number | null;
          total_tournaments?: number | null;
        };
        Update: {
          avg_rating?: number | null;
          categories?: string[] | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          popularity_score?: number | null;
          total_tournaments?: number | null;
        };
        Relationships: [];
      };
      cat_name_ratings: {
        Row: {
          is_hidden: boolean | null;
          losses: number | null;
          name_id: string;
          rating: number | null;
          rating_history: Json | null;
          updated_at: string;
          user_name: string;
          wins: number | null;
        };
        Insert: {
          is_hidden?: boolean | null;
          losses?: number | null;
          name_id: string;
          rating?: number | null;
          rating_history?: Json | null;
          updated_at?: string;
          user_name: string;
          wins?: number | null;
        };
        Update: {
          is_hidden?: boolean | null;
          losses?: number | null;
          name_id?: string;
          rating?: number | null;
          rating_history?: Json | null;
          updated_at?: string;
          user_name?: string;
          wins?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "cat_name_ratings_name_id_fkey";
            columns: ["name_id"];
            isOneToOne: false;
            referencedRelation: "cat_name_options";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cat_name_ratings_user_name_fkey";
            columns: ["user_name"];
            isOneToOne: false;
            referencedRelation: "cat_app_users";
            referencedColumns: ["user_name"];
          },
        ];
      };
      site_settings: {
        Row: {
          created_at: string | null;
          id: string;
          key: string;
          updated_at: string | null;
          updated_by: string | null;
          value: Json;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          key: string;
          updated_at?: string | null;
          updated_by?: string | null;
          value: Json;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          key?: string;
          updated_at?: string | null;
          updated_by?: string | null;
          value?: Json;
        };
        Relationships: [];
      };
      tournament_selections: {
        Row: {
          created_at: string;
          id: number;
          name: string;
          name_id: string;
          selected_at: string;
          selection_type: string | null;
          tournament_id: string;
          user_name: string;
        };
        Insert: {
          created_at?: string;
          id?: number;
          name: string;
          name_id: string;
          selected_at?: string;
          selection_type?: string | null;
          tournament_id: string;
          user_name: string;
        };
        Update: {
          created_at?: string;
          id?: number;
          name?: string;
          name_id?: string;
          selected_at?: string;
          selection_type?: string | null;
          tournament_id?: string;
          user_name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tournament_selections_name_id_fkey";
            columns: ["name_id"];
            isOneToOne: false;
            referencedRelation: "cat_name_options";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      add_app_access_to_user: {
        Args: { app_name: string };
        Returns: undefined;
      };
      calculate_elo_change: {
        Args: {
          current_rating: number;
          opponent_rating: number;
          result: number;
        };
        Returns: number;
      };
      change_user_role: {
        Args: {
          new_role: Database["public"]["Enums"]["app_role"];
          target_user_id: string;
        };
        Returns: boolean;
      };
      check_current_user_admin: { Args: never; Returns: boolean };
      check_profile_access_rate_limit: { Args: never; Returns: boolean };
      check_user_role_by_name: {
        Args: { required_role: string; user_name_param: string };
        Returns: boolean;
      };
      cleanup_orphaned_auth_users: { Args: never; Returns: undefined };
      delete_user_complete: {
        Args: { target_user_id: string };
        Returns: boolean;
      };
      get_all_users_with_roles: {
        Args: never;
        Returns: {
          avatar_url: string;
          created_at: string;
          display_name: string;
          email: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
          username: string;
        }[];
      };
      get_current_user_name: { Args: never; Returns: string };
      get_current_user_role: {
        Args: never;
        Returns: Database["public"]["Enums"]["app_role"];
      };
      get_existing_usernames: {
        Args: never;
        Returns: {
          avatar_url: string;
          display_name: string;
          username: string;
        }[];
      };
      get_safe_profile_data: {
        Args: { profile_user_id: string };
        Returns: {
          avatar_url: string;
          created_at: string;
          display_name: string;
          id: string;
          username: string;
        }[];
      };
      get_secure_profile: { Args: { target_user_id: string }; Returns: Json };
      get_top_names_by_category: {
        Args: { p_category: string; p_limit?: number };
        Returns: {
          avg_rating: number;
          category: string;
          description: string;
          id: string;
          name: string;
          total_ratings: number;
        }[];
      };
      get_user_flo_data_admin: {
        Args: { target_user_id: string };
        Returns: {
          created_at: string;
          date: string;
          id: string;
          is_period_day: boolean;
          updated_at: string;
        }[];
      };
      get_user_profile_by_id: {
        Args: { user_id: string };
        Returns: {
          avatar_url: string;
          created_at: string;
          display_name: string;
          email: string;
          first_name: string;
          id: string;
          username: string;
        }[];
      };
      get_user_stats: {
        Args: { p_user_name: string };
        Returns: {
          avg_rating: number;
          hidden_count: number;
          total_losses: number;
          total_ratings: number;
          total_wins: number;
          win_rate: number;
        }[];
      };
      get_users_with_flo_data: {
        Args: never;
        Returns: {
          display_name: string;
          email: string;
          first_name: string;
          flo_entries: Json;
          user_id: string;
        }[];
      };
      has_role:
      | { Args: { _role?: string; _user_name: string }; Returns: boolean }
      | { Args: { required_role: string }; Returns: boolean }
      | {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      increment_selection: {
        Args: { p_name_id: string; p_user_name: string };
        Returns: undefined;
      };
      is_admin: { Args: never; Returns: boolean };
      is_user_admin: { Args: { user_id_to_check: string }; Returns: boolean };
      merge_user_accounts: {
        Args: { p_new_user_id: string; p_username: string };
        Returns: undefined;
      };
      set_user_context: {
        Args: { user_name_param: string };
        Returns: undefined;
      };
      user_exists_by_username: {
        Args: { p_username: string };
        Returns: {
          avatar_url: string;
          display_name: string;
          first_name: string;
          id: string;
          username: string;
        }[];
      };
      user_has_app_access: {
        Args: { app_name: string; user_id_param: string };
        Returns: boolean;
      };
      validate_environment_setup: { Args: never; Returns: boolean };
      validate_username: { Args: { p_username: string }; Returns: Json };
    };
    Enums: {
      app_role: "admin" | "user";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
  ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
  ? R
  : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
    DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
    DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R;
    }
  ? R
  : never
  : never;

type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I;
  }
  ? I
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Insert: infer I;
  }
  ? I
  : never
  : never;

type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U;
  }
  ? U
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Update: infer U;
  }
  ? U
  : never
  : never;

type Enums<
  DefaultSchemaEnumNameOrOptions extends
  | keyof DefaultSchema["Enums"]
  | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never;

type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema["CompositeTypes"]
  | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
  ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never;

const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const;
