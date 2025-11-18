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
    PostgrestVersion: "13.0.5"
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
          expires_at: string
          is_expired: boolean
        }
        Insert: {
          amount: number
          created_at?: string
          customer_id: string
          description?: string | null
          id?: string
          expires_at?: string
          is_expired?: boolean
        }
        Update: {
          amount?: number
          created_at?: string
          customer_id?: string
          description?: string | null
          id?: string
          expires_at?: string
          is_expired?: boolean
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
          expires_at: string
          is_expired: boolean
        }
        Insert: {
          created_at?: string
          credits?: number
          customer_id: string
          id?: string
          updated_at?: string
          expires_at?: string
          is_expired?: boolean
        }
        Update: {
          created_at?: string
          credits?: number
          customer_id?: string
          id?: string
          updated_at?: string
          expires_at?: string
          is_expired?: boolean
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
          user_id: string | null
          is_banned?: boolean
        }
        Insert: {
          created_at?: string
          customer_id: string
          email: string
          updated_at?: string
          user_id?: string | null
          is_banned?: boolean
        }
        Update: {
          created_at?: string
          customer_id?: string
          email?: string
          updated_at?: string
          user_id?: string | null
          is_banned?: boolean
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
      gift_codes: {
        Row: {
          id: string
          code: string
          credits_amount: number
          max_uses: number
          current_uses: number
          expires_at: string
          is_active: boolean
          created_by: string
          created_at: string
          updated_at: string
          notes: string | null
        }
        Insert: {
          id?: string
          code: string
          credits_amount: number
          max_uses?: number
          current_uses?: number
          expires_at: string
          is_active?: boolean
          created_by: string
          created_at?: string
          updated_at?: string
          notes?: string | null
        }
        Update: {
          id?: string
          code?: string
          credits_amount?: number
          max_uses?: number
          current_uses?: number
          expires_at?: string
          is_active?: boolean
          created_by?: string
          created_at?: string
          updated_at?: string
          notes?: string | null
        }
        Relationships: []
      }
      gift_code_redemptions: {
        Row: {
          id: string
          code_id: string
          customer_id: string
          user_id: string | null
          credits_received: number
          transaction_id: string | null
          redeemed_at: string
          ip_address: string | null
          user_agent: string | null
        }
        Insert: {
          id?: string
          code_id: string
          customer_id: string
          user_id?: string | null
          credits_received: number
          transaction_id?: string | null
          redeemed_at?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: {
          id?: string
          code_id?: string
          customer_id?: string
          user_id?: string | null
          credits_received?: number
          transaction_id?: string | null
          redeemed_at?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gift_code_redemptions_code_id_fkey"
            columns: ["code_id"]
            isOneToOne: false
            referencedRelation: "gift_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gift_code_redemptions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["customer_id"]
          }
        ]
      }
      system_logs: {
        Row: {
          id: string;
          event_type: string; // 'info' | 'warning' | 'error'
          category: string; // 'usage' | 'api' | 'admin' | 'system' | 'stream-error'
          message: string;
          metadata: Json | null;
          user_id: string | null;
          customer_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_type: string;
          category: string;
          message: string;
          metadata?: Json | null;
          user_id?: string | null;
          customer_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_type?: string;
          category?: string;
          message?: string;
          metadata?: Json | null;
          user_id?: string | null;
          customer_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "system_logs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      }
      package_transaction: {
        Row: {
          transaction_id: string;       // uuid
          customer_id: string;          // fk → customers.customer_id
          pricing_tier_id: string | null; // fk → pricing_tier.id (nullable)
          created_at: string;           // timestamp with time zone
          currency: string;             // text
          payment_id: string;           // text
        };
        Insert: {
          transaction_id?: string;
          customer_id: string;
          pricing_tier_id?: string | null;
          created_at?: string;
          currency: string;
          payment_id: string;
        };
        Update: {
          transaction_id?: string;
          customer_id?: string;
          pricing_tier_id?: string | null;
          created_at?: string;
          currency?: string;
          payment_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "package_transaction_customer_id_fkey";
            columns: ["customer_id"];
            referencedRelation: "customers";
            referencedColumns: ["customer_id"];
          },
          {
            foreignKeyName: "package_transaction_pricing_tier_id_fkey";
            columns: ["pricing_tier_id"];
            referencedRelation: "pricing_tier";
            referencedColumns: ["id"];
          }
        ];
      }
      pricing_tier: {
        Row: {
          id: string;
          name: string;
          amount: number;
          credits: number;
          description: string | null;
          savings: string | null;
          currency: string;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          amount: number;
          credits: number;
          description?: string | null;
          savings?: string | null;
          currency: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          amount?: number;
          credits?: number;
          description?: string | null;
          savings?: string | null;
          currency?: string;
          created_at?: string;
        };
        Relationships: [];
      }
      billing_settings: {
        Row: {
          id: string;                 // uuid
          credit_value: number;       // numeric
          input_rate: number;         // numeric
          output_rate: number;        // numeric
          margin_multiplier: number;  // numeric
          updated_at: string;         // timestamp with time zone
          updated_by: string | null;  // uuid (auth.users)
        };
        Insert: {
          id?: string;
          credit_value: number;
          input_rate: number;
          output_rate: number;
          margin_multiplier: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          id?: string;
          credit_value?: number;
          input_rate?: number;
          output_rate?: number;
          margin_multiplier?: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "billing_settings_updated_by_fkey";
            columns: ["updated_by"];
            referencedRelation: "users"; // auth.users
            referencedColumns: ["id"];
          }
        ];
      }
      usage_transactions: {
        Row: {
          id: string;               // uuid
          customer_id: string;      // uuid FK → customers.customer_id
          tokens_used: number;      // bigint
          credits_used: number;     // numeric
          api_cost: number;         // numeric
          profit: number;           // numeric
          model: string;            // text
          created_at: string;       // timestamp
        };
        Insert: {
          id?: string;
          customer_id: string;
          tokens_used: number;
          credits_used: number;
          api_cost: number;
          profit: number;
          model: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          tokens_used?: number;
          credits_used?: number;
          api_cost?: number;
          profit?: number;
          model?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "usage_transactions_customer_id_fkey";
            columns: ["customer_id"];
            referencedRelation: "customers";
            referencedColumns: ["customer_id"];
          }
        ];
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
          chat_id: string | null
          content: string
          created_at: string
          id: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          chat_id?: string | null
          content: string
          created_at?: string
          id?: number
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          category?: string | null
          chat_id?: string | null
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
      prompt_comparisons: {
        Row: {
          created_at: string
          id: string
          max_tokens: number
          model_a: string
          model_b: string
          notes: string | null
          prompt_a_id: string
          prompt_b_id: string
          response_a: string
          response_b: string
          temperature: number
          updated_at: string
          user_id: string
          user_prompt: string
          vote_result: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          max_tokens: number
          model_a: string
          model_b: string
          notes?: string | null
          prompt_a_id: string
          prompt_b_id: string
          response_a: string
          response_b: string
          temperature: number
          updated_at?: string
          user_id?: string
          user_prompt: string
          vote_result?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          max_tokens?: number
          model_a?: string
          model_b?: string
          notes?: string | null
          prompt_a_id?: string
          prompt_b_id?: string
          response_a?: string
          response_b?: string
          temperature?: number
          updated_at?: string
          user_id?: string
          user_prompt?: string
          vote_result?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prompt_comparisons_prompt_a_id_fkey"
            columns: ["prompt_a_id"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompt_comparisons_prompt_b_id_fkey"
            columns: ["prompt_b_id"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      prompts: {
        Row: {
          created_at: string
          id: string
          name: string
          primingPrompt: string
          prompt: string
          type: string
          updated_at: string
          used: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string
          primingPrompt: string
          prompt: string
          type?: string
          updated_at?: string
          used?: boolean
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          primingPrompt?: string
          prompt?: string
          type?: string
          updated_at?: string
          used?: boolean
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_gift_code: {
        Args: {
          p_admin_user_id: string
          p_code: string
          p_credits_amount: number
          p_max_uses?: number
          p_expires_at?: string
          p_notes?: string
        }
        Returns: {
          success: boolean
          message: string
          code_id: string
        }[]
      }
      admin_bulk_gift_from_credits: {
        Args: {
          p_amount: number
        },
        Returns: void
      }
      admin_total_revenue: {
        Args: Record<string, never>;
        Returns: number;
      };
      admin_active_packages: {
        Args: Record<string, never>;
        Returns: number;
      };
      admin_growth_rate: {
        Args: Record<string, never>;
        Returns: number;
      };
      admin_revenue_trend: {
        Args: Record<string, never>;
        Returns: {
          month: string;
          revenue: number;
        }[];
      };
      admin_sales_dashboard: {
        Args: Record<string, never>;
        Returns: {
          stats: {
            total_sales: number;
            active_packages: number;
            this_month_sales: number;
            total_transactions: number;
          };
          revenue_by_package: {
            month: string;
            starter: number;
            transformation: number;
            professional: number;
          }[];
          monthly_revenue: {
            month: string;
            revenue: number;
          }[];
          package_performance: {
            package_id: string;
            package_name: string;
            credits: number;
            units_sold: number;
            total_revenue: number;
            avg_per_day: number;
          }[];
          recent_transactions: {
            transaction_id: string;
            user_email: string;
            package_name: string;
            credits: number;
            amount: number;
            date: string;
          }[];
        };
      };
      admin_package_distribution: {
        Args: Record<string, never>;
        Returns: {
          pricing_tier_id: string;
          package_count: number;
          amount_per_package: number;
        }[];
      };
      admin_financial_analytics: {
        Args: Record<string, never>;
        Returns: {
          billing_settings: Json;
          total_revenue: number;
          total_api_cost: number;
          total_profit: number;
          revenue_cost_profit: Json[];
          profit_per_user: Json[] | null;
          usage_transactions: Json[];
        };
      };

      admin_recent_transactions: {
        Args: Record<string, never>;
        Returns: {
          email: string;
          pricing_tier: string;
          amount: number;
          created_at: string;
        }[];
      };
      admin_dashboard_all: {
        Args: Record<string, never>;
        Returns: {
          total_customers: number;
          total_revenue: number;
          active_packages: number;
          growth_rate: number;
          revenue_trend: Json[];
          package_distribution: Json[];
          recent_transactions: Json[];
        };
      }
      admin_get_customers: {
        Args: {
          search_text: string;
          limit_count: number;
          offset_count: number;
        };
        Returns: Array<{
          customer_id: string;
          email: string | null;
          user_id: string | null;
          name: string | null;
          is_banned: boolean;
          credits: number | null;
          created_at: string | null;
        }>;
      }
      admin_get_customers_count: {
        Args: {
          search_text: string;
        };
        Returns: number;
      };
      admin_update_credit_expiry: {
        Args: {
          p_customer_id: string
          p_new_expiry: string
        }
        Returns: void
      }
      redeem_gift_code: {
        Args: {
          p_customer_id: string
          p_user_id: string
          p_code: string
          p_ip_address?: string
          p_user_agent?: string
        }
        Returns: {
          success: boolean
          message: string
          credits_received: number
          new_balance: number
        }[]
      }
      admin_update_billing_settings: {
        Args: {
          p_credit_value: number;
          p_input_rate: number;
          p_output_rate: number;
          p_margin_multiplier: number;
        };
        Returns: {
          id: string;
          credit_value: number;
          input_rate: number;
          output_rate: number;
          margin_multiplier: number;
          created_at: string;
          updated_at: string;
          updated_by: string | null;
        };
      }
      get_total_positive_credits: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_all_gift_codes: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          code: string
          credits_amount: number
          max_uses: number
          current_uses: number
          remaining_uses: number
          expires_at: string
          is_active: boolean
          status: string
          created_at: string
          notes: string | null
        }[]
      }

      get_gift_code_redemptions: {
        Args: {
          p_code_id?: string
        }
        Returns: {
          redemption_id: string
          code: string
          customer_email: string
          credits_received: number
          redeemed_at: string
        }[]
      }

      deactivate_gift_code: {
        Args: {
          p_code_id: string
        }
        Returns: {
          success: boolean
          message: string
        }[]
      }

      edit_gift_code: {
        Args: {
          p_code_id: string
          p_max_uses?: number
          p_expires_at?: string
          p_notes?: string
        }
        Returns: {
          success: boolean
          message: string
        }[]
      }
      add_credits: {
        Args: { p_amount: number; p_customer_id: string; p_description: string }
        Returns: undefined
      }
      check_and_deduct_credits: {
        Args: { p_customer_id: string; p_required_credits: number }
        Returns: boolean
      }
      get_expiring_credits: {
        Args: { p_days_threshold?: number }
        Returns: {
          customer_id: string
          email: string
          full_name: string | null
          credits: number
          expires_at: string
          days_left: number
        }[]
      }
      log_system_event: {
        Args: {
          p_event_type: string;
          p_category: string;
          p_message: string;
          p_metadata?: Json;
          p_user_id?: string | null;
          p_customer_id?: string | null;
        };
        Returns: void;
      }
      get_total_expiring_credits: {
        Args: { p_days_threshold?: number }
        Returns: number
      }
      log_usage_transaction: {
        Args: {
          p_customer_id: string;
          p_tokens_used: number;
          p_credits_used: number;
          p_api_cost: number;
          p_model: string;
          p_credit_value: number;
        };
        Returns: void;
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
      get_user_id_by_email: { Args: { p_email: string }; Returns: string }
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
      search_documents_by_title: {
        Args: {
          p_match_count?: number
          p_project_id: string
          p_search_term: string
          p_user_id: string
        }
        Returns: {
          content: string
          created_at: string
          id: number
          title: string
          updated_at: string
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
      update_document_and_chunks:
      | {
        Args: {
          p_chunks: Json
          p_drive_file_id: string
          p_last_modified: string
          p_name: string
          p_user_id: string
        }
        Returns: number
      }
      | {
        Args: {
          p_chunks: Json
          p_drive_file_id: string
          p_file_extension: string
          p_file_type: string
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
