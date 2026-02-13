export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      cat_name_options: {
        Row: {
          id: number
          name: string
          description: string | null
          created_at: string
          updated_at: string | null
          is_active: boolean
          is_hidden: boolean
          avg_rating: number
          status: string
          provenance: Json
        }
        Insert: {
          id?: number
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string | null
          is_active?: boolean
          is_hidden?: boolean
          avg_rating?: number
          status?: string
          provenance?: Json
        }
        Update: {
          id?: number
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string | null
          is_active?: boolean
          is_hidden?: boolean
          avg_rating?: number
          status?: string
          provenance?: Json
        }
      }
      cat_name_ratings: {
        Row: {
          id: number
          user_name: string
          name_id: number
          rating: number
          wins: number
          losses: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_name: string
          name_id: number
          rating: number
          wins?: number
          losses?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_name?: string
          name_id?: number
          rating?: number
          wins?: number
          losses?: number
          created_at?: string
          updated_at?: string
        }
      }
      cat_chosen_name: {
        Row: {
          id: number
          first_name: string
          middle_names: string[] | null
          last_name: string | null
          greeting_text: string | null
          display_name: string | null
          is_set: boolean
          show_banner: boolean
          created_at: string
        }
        Insert: {
          id?: number
          first_name: string
          middle_names?: string[] | null
          last_name?: string | null
          greeting_text?: string | null
          display_name?: string | null
          is_set?: boolean
          show_banner?: boolean
          created_at?: string
        }
        Update: {
          id?: number
          first_name?: string
          middle_names?: string[] | null
          last_name?: string | null
          greeting_text?: string | null
          display_name?: string | null
          is_set?: boolean
          show_banner?: boolean
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_user_account: {
        Args: {
          p_user_name: string
        }
        Returns: void
      }
      set_user_context: {
        Args: {
          user_name_param: string
        }
        Returns: void
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
