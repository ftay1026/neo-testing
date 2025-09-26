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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
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
      chats: {
        Row: {
          created_at: string
          id: string
          inheritance_summary: string | null
          parent_chat_id: string | null
          project_id: string
          title: string
          user_id: string
          visibility: string
        }
        Insert: {
          created_at?: string
          id?: string
          inheritance_summary?: string | null
          parent_chat_id?: string | null
          project_id: string
          title: string
          user_id?: string
          visibility?: string
        }
        Update: {
          created_at?: string
          id?: string
          inheritance_summary?: string | null
          parent_chat_id?: string | null
          project_id?: string
          title?: string
          user_id?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "chats_parent_chat_id_fkey"
            columns: ["parent_chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_transactions: {
        Row: {
          amount: number
          created_at: string
          customer_id: string
          description: string | null
          id: string
        }
        Insert: {
          amount: number
          created_at?: string
          customer_id: string
          description?: string | null
          id?: string
        }
        Update: {
          amount?: number
          created_at?: string
          customer_id?: string
          description?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      credits: {
        Row: {
          created_at: string
          credits: number
          customer_id: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          credits?: number
          customer_id: string
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          credits?: number
          customer_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "credits_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "customers"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      customers: {
        Row: {
          created_at: string
          customer_id: string
          email: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          email: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          email?: string
          updated_at?: string
        }
        Relationships: []
      }
      document_sections: {
        Row: {
          chunk_index: number
          content: string
          created_at: string
          document_id: number
          embedding: string | null
          id: number
        }
        Insert: {
          chunk_index: number
          content: string
          created_at?: string
          document_id: number
          embedding?: string | null
          id?: never
        }
        Update: {
          chunk_index?: number
          content?: string
          created_at?: string
          document_id?: number
          embedding?: string | null
          id?: never
        }
        Relationships: [
          {
            foreignKeyName: "document_sections_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          content: string | null
          created_at: string
          drive_file_id: string | null
          file_extension: string
          file_type: string
          id: number
          is_direct_file: boolean | null
          last_modified: string | null
          name: string
          project_id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          drive_file_id?: string | null
          file_extension?: string
          file_type?: string
          id?: never
          is_direct_file?: boolean | null
          last_modified?: string | null
          name: string
          project_id: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          drive_file_id?: string | null
          file_extension?: string
          file_type?: string
          id?: never
          is_direct_file?: boolean | null
          last_modified?: string | null
          name?: string
          project_id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      drive_connections: {
        Row: {
          created_at: string
          folder_id: string
          id: string
          refresh_token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          folder_id: string
          id?: string
          refresh_token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          folder_id?: string
          id?: string
          refresh_token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      interaction_logs: {
        Row: {
          chat_id: string
          content: string
          created_at: string
          id: number
          log_period_end: string
          log_period_start: string
          project_id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          chat_id: string
          content: string
          created_at?: string
          id?: number
          log_period_end: string
          log_period_start: string
          project_id: string
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          chat_id?: string
          content?: string
          created_at?: string
          id?: number
          log_period_end?: string
          log_period_start?: string
          project_id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interaction_logs_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interaction_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      memories: {
        Row: {
          category: string | null
          chat_id: string
          content: string
          created_at: string
          id: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          chat_id: string
          content: string
          created_at?: string
          id?: number
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          category?: string | null
          chat_id?: string
          content?: string
          created_at?: string
          id?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memories_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      memory_sections: {
        Row: {
          chunk_index: number
          content: string
          created_at: string
          embedding: string | null
          id: number
          memory_id: number
        }
        Insert: {
          chunk_index: number
          content: string
          created_at?: string
          embedding?: string | null
          id?: never
          memory_id: number
        }
        Update: {
          chunk_index?: number
          content?: string
          created_at?: string
          embedding?: string | null
          id?: never
          memory_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "memory_sections_memory_id_fkey"
            columns: ["memory_id"]
            isOneToOne: false
            referencedRelation: "memories"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachments: Json
          chat_id: string
          created_at: string
          id: string
          parts: Json
          role: string
        }
        Insert: {
          attachments?: Json
          chat_id: string
          created_at?: string
          id?: string
          parts: Json
          role: string
        }
        Update: {
          attachments?: Json
          chat_id?: string
          created_at?: string
          id?: string
          parts?: Json
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          full_name: string | null
          id: string
          updated_at: string | null
          username: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_default: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean
          name: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_credits: {
        Args: { p_amount: number; p_customer_id: string; p_description: string }
        Returns: undefined
      }
      check_and_deduct_credits: {
        Args: { p_customer_id: string; p_required_credits: number }
        Returns: boolean
      }
      create_direct_file_and_chunks: {
        Args: {
          p_chunks: Json
          p_content: string
          p_title: string
          p_user_id: string
        }
        Returns: number
      }
      create_direct_file_and_chunks_by_project: {
        Args: {
          p_chunks: Json
          p_content: string
          p_project_id: string
          p_title: string
          p_user_id: string
        }
        Returns: number
      }
      create_memory_and_chunks: {
        Args: {
          p_category: string
          p_chat_id: string
          p_chunks: Json
          p_content: string
          p_title: string
          p_user_id: string
        }
        Returns: number
      }
      get_credit_summary: {
        Args: { p_customer_id: string }
        Returns: {
          current_balance: number
          total_purchased: number
          total_used: number
        }[]
      }
      get_monthly_credit_data: {
        Args: { p_customer_id: string }
        Returns: {
          month_year: string
          net_credits: number
          purchased: number
          used: number
        }[]
      }
      get_recent_projects_with_activity: {
        Args: { p_limit?: number }
        Returns: {
          chat_count: number
          created_at: string
          description: string
          id: string
          is_default: boolean
          last_activity: string
          name: string
          updated_at: string
        }[]
      }
      match_document_sections_by_project: {
        Args: {
          match_count?: number
          match_threshold?: number
          p_project_id?: string
          p_user_id?: string
          query_embedding: string
        }
        Returns: {
          content: string
          filename: string
          id: number
          similarity: number
        }[]
      }
      match_user_memories: {
        Args: {
          match_count?: number
          match_threshold?: number
          p_user_id?: string
          query_embedding: string
        }
        Returns: {
          category: string
          content: string
          id: number
          similarity: number
          title: string
        }[]
      }
      update_direct_file_and_chunks: {
        Args: {
          p_chunks: Json
          p_content: string
          p_document_id: number
          p_title: string
          p_user_id: string
        }
        Returns: number
      }
      update_document_and_chunks: {
        Args:
          | {
              p_chunks: Json
              p_drive_file_id: string
              p_file_extension: string
              p_file_type: string
              p_last_modified: string
              p_name: string
              p_user_id: string
            }
          | {
              p_chunks: Json
              p_drive_file_id: string
              p_last_modified: string
              p_name: string
              p_user_id: string
            }
        Returns: number
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
