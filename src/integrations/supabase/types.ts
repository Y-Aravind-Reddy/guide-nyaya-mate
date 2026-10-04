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
      activity_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          metadata: Json
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          metadata?: Json
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          metadata?: Json
          user_id?: string
        }
        Relationships: []
      }
      ai_feedback: {
        Row: {
          comment: string | null
          created_at: string
          feedback_comment: string | null
          id: string
          message_id: string
          query: string | null
          rating: string
          response: string | null
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          feedback_comment?: string | null
          id?: string
          message_id: string
          query?: string | null
          rating: string
          response?: string | null
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          feedback_comment?: string | null
          id?: string
          message_id?: string
          query?: string | null
          rating?: string
          response?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_feedback_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_usage_events: {
        Row: {
          completion_tokens: number
          cost_estimate: number
          created_at: string
          event_type: string
          guest_key: string | null
          id: string
          model: string | null
          prompt_tokens: number
          rate_limited: boolean
          response_time_ms: number
          succeeded: boolean
          total_tokens: number
          user_id: string | null
        }
        Insert: {
          completion_tokens?: number
          cost_estimate?: number
          created_at?: string
          event_type?: string
          guest_key?: string | null
          id?: string
          model?: string | null
          prompt_tokens?: number
          rate_limited?: boolean
          response_time_ms?: number
          succeeded?: boolean
          total_tokens?: number
          user_id?: string | null
        }
        Update: {
          completion_tokens?: number
          cost_estimate?: number
          created_at?: string
          event_type?: string
          guest_key?: string | null
          id?: string
          model?: string | null
          prompt_tokens?: number
          rate_limited?: boolean
          response_time_ms?: number
          succeeded?: boolean
          total_tokens?: number
          user_id?: string | null
        }
        Relationships: []
      }
      bookmarks: {
        Row: {
          created_at: string
          id: string
          topic_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          topic_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          topic_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "legal_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      complaint_templates: {
        Row: {
          created_at: string
          description: string | null
          fields: Json | null
          id: string
          jurisdiction: string | null
          template_body: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          fields?: Json | null
          id?: string
          jurisdiction?: string | null
          template_body: string
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          fields?: Json | null
          id?: string
          jurisdiction?: string | null
          template_body?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          subject: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          subject: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          subject?: string
        }
        Relationships: []
      }
      content_feedback: {
        Row: {
          comment: string | null
          content_slug: string
          content_title: string | null
          content_type: string
          created_at: string
          helpful: boolean
          id: string
          user_id: string | null
        }
        Insert: {
          comment?: string | null
          content_slug: string
          content_title?: string | null
          content_type: string
          created_at?: string
          helpful: boolean
          id?: string
          user_id?: string | null
        }
        Update: {
          comment?: string | null
          content_slug?: string
          content_title?: string | null
          content_type?: string
          created_at?: string
          helpful?: boolean
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          context_slug: string | null
          context_type: string | null
          created_at: string
          id: string
          is_favorite: boolean
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          context_slug?: string | null
          context_type?: string | null
          created_at?: string
          id?: string
          is_favorite?: boolean
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          context_slug?: string | null
          context_type?: string | null
          created_at?: string
          id?: string
          is_favorite?: boolean
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      document_versions: {
        Row: {
          change_log: string | null
          created_at: string
          created_by: string | null
          description: string | null
          document_id: string
          id: string
          published_at: string | null
          snapshot: Json | null
          title: string | null
          version: string
        }
        Insert: {
          change_log?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          document_id: string
          id?: string
          published_at?: string | null
          snapshot?: Json | null
          title?: string | null
          version: string
        }
        Update: {
          change_log?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          document_id?: string
          id?: string
          published_at?: string | null
          snapshot?: Json | null
          title?: string | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_versions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "knowledge_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      faqs: {
        Row: {
          answer: string
          category: string | null
          created_at: string
          id: string
          jurisdiction: string | null
          question: string
          source_id: string | null
          updated_at: string
          verification_status: Database["public"]["Enums"]["content_verification_status"]
        }
        Insert: {
          answer: string
          category?: string | null
          created_at?: string
          id?: string
          jurisdiction?: string | null
          question: string
          source_id?: string | null
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["content_verification_status"]
        }
        Update: {
          answer?: string
          category?: string | null
          created_at?: string
          id?: string
          jurisdiction?: string | null
          question?: string
          source_id?: string | null
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["content_verification_status"]
        }
        Relationships: [
          {
            foreignKeyName: "faqs_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "official_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      glossary: {
        Row: {
          category: string | null
          created_at: string
          definition: string
          id: string
          source_id: string | null
          term: string
          updated_at: string
          verification_status: Database["public"]["Enums"]["content_verification_status"]
        }
        Insert: {
          category?: string | null
          created_at?: string
          definition: string
          id?: string
          source_id?: string | null
          term: string
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["content_verification_status"]
        }
        Update: {
          category?: string | null
          created_at?: string
          definition?: string
          id?: string
          source_id?: string | null
          term?: string
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["content_verification_status"]
        }
        Relationships: [
          {
            foreignKeyName: "glossary_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "official_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      government_services: {
        Row: {
          category: string
          created_at: string
          description: string
          eligibility: string | null
          fees: string | null
          icon: string
          id: string
          processing_time: string | null
          slug: string
          source_id: string | null
          title: string
          verification_status: Database["public"]["Enums"]["content_verification_status"]
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          eligibility?: string | null
          fees?: string | null
          icon?: string
          id?: string
          processing_time?: string | null
          slug: string
          source_id?: string | null
          title: string
          verification_status?: Database["public"]["Enums"]["content_verification_status"]
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          eligibility?: string | null
          fees?: string | null
          icon?: string
          id?: string
          processing_time?: string | null
          slug?: string
          source_id?: string | null
          title?: string
          verification_status?: Database["public"]["Enums"]["content_verification_status"]
        }
        Relationships: [
          {
            foreignKeyName: "government_services_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "official_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      ingestion_jobs: {
        Row: {
          attempts: number
          completed_at: string | null
          created_at: string
          document_id: string
          error_message: string | null
          id: string
          last_error: string | null
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          document_id: string
          error_message?: string | null
          id?: string
          last_error?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          document_id?: string
          error_message?: string | null
          id?: string
          last_error?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingestion_jobs_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "knowledge_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      knowledge_documents: {
        Row: {
          author: string | null
          category: string | null
          change_log: string | null
          chunk_count: number
          content_trust_level: Database["public"]["Enums"]["content_trust_level"]
          country: string | null
          created_at: string
          description: string | null
          district: string | null
          embedding_model: string
          file_hash: string | null
          file_path: string | null
          file_size: number | null
          file_type: string | null
          id: string
          is_latest: boolean
          jurisdiction: string | null
          jurisdiction_type: string | null
          language: string
          last_processed_at: string | null
          last_verified_date: string | null
          model_version: string | null
          next_review_date: string | null
          previous_document_id: string | null
          published_at: string | null
          review_frequency: string | null
          review_status: Database["public"]["Enums"]["doc_review_status"]
          reviewed_by: string | null
          sha256: string | null
          slug: string | null
          source: string
          source_url: string | null
          state: string | null
          status: string
          tags: string[]
          title: string
          updated_at: string
          uploaded_by: string | null
          version: string
          visibility: string
        }
        Insert: {
          author?: string | null
          category?: string | null
          change_log?: string | null
          chunk_count?: number
          content_trust_level?: Database["public"]["Enums"]["content_trust_level"]
          country?: string | null
          created_at?: string
          description?: string | null
          district?: string | null
          embedding_model?: string
          file_hash?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          is_latest?: boolean
          jurisdiction?: string | null
          jurisdiction_type?: string | null
          language?: string
          last_processed_at?: string | null
          last_verified_date?: string | null
          model_version?: string | null
          next_review_date?: string | null
          previous_document_id?: string | null
          published_at?: string | null
          review_frequency?: string | null
          review_status?: Database["public"]["Enums"]["doc_review_status"]
          reviewed_by?: string | null
          sha256?: string | null
          slug?: string | null
          source?: string
          source_url?: string | null
          state?: string | null
          status?: string
          tags?: string[]
          title: string
          updated_at?: string
          uploaded_by?: string | null
          version?: string
          visibility?: string
        }
        Update: {
          author?: string | null
          category?: string | null
          change_log?: string | null
          chunk_count?: number
          content_trust_level?: Database["public"]["Enums"]["content_trust_level"]
          country?: string | null
          created_at?: string
          description?: string | null
          district?: string | null
          embedding_model?: string
          file_hash?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          is_latest?: boolean
          jurisdiction?: string | null
          jurisdiction_type?: string | null
          language?: string
          last_processed_at?: string | null
          last_verified_date?: string | null
          model_version?: string | null
          next_review_date?: string | null
          previous_document_id?: string | null
          published_at?: string | null
          review_frequency?: string | null
          review_status?: Database["public"]["Enums"]["doc_review_status"]
          reviewed_by?: string | null
          sha256?: string | null
          slug?: string | null
          source?: string
          source_url?: string | null
          state?: string | null
          status?: string
          tags?: string[]
          title?: string
          updated_at?: string
          uploaded_by?: string | null
          version?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_documents_previous_document_id_fkey"
            columns: ["previous_document_id"]
            isOneToOne: false
            referencedRelation: "knowledge_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_health_metrics: {
        Row: {
          captured_at: string
          details: Json | null
          id: string
          metric_key: string
          metric_value: number | null
        }
        Insert: {
          captured_at?: string
          details?: Json | null
          id?: string
          metric_key: string
          metric_value?: number | null
        }
        Update: {
          captured_at?: string
          details?: Json | null
          id?: string
          metric_key?: string
          metric_value?: number | null
        }
        Relationships: []
      }
      knowledge_sources: {
        Row: {
          citation_text: string | null
          created_at: string
          created_by: string | null
          document_id: string | null
          id: string
          last_verified_at: string | null
          official_authority: string | null
          source_title: string
          source_type: Database["public"]["Enums"]["knowledge_source_type"]
          source_url: string | null
          updated_at: string
        }
        Insert: {
          citation_text?: string | null
          created_at?: string
          created_by?: string | null
          document_id?: string | null
          id?: string
          last_verified_at?: string | null
          official_authority?: string | null
          source_title: string
          source_type?: Database["public"]["Enums"]["knowledge_source_type"]
          source_url?: string | null
          updated_at?: string
        }
        Update: {
          citation_text?: string | null
          created_at?: string
          created_by?: string | null
          document_id?: string | null
          id?: string
          last_verified_at?: string | null
          official_authority?: string | null
          source_title?: string
          source_type?: Database["public"]["Enums"]["knowledge_source_type"]
          source_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_sources_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "knowledge_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      law_sections: {
        Row: {
          created_at: string
          id: string
          law_id: string
          section_number: string
          sort_order: number
          summary: string
          title: string
          topic_tags: Json
        }
        Insert: {
          created_at?: string
          id?: string
          law_id: string
          section_number: string
          sort_order?: number
          summary: string
          title: string
          topic_tags?: Json
        }
        Update: {
          created_at?: string
          id?: string
          law_id?: string
          section_number?: string
          sort_order?: number
          summary?: string
          title?: string
          topic_tags?: Json
        }
        Relationships: [
          {
            foreignKeyName: "law_sections_law_id_fkey"
            columns: ["law_id"]
            isOneToOne: false
            referencedRelation: "laws"
            referencedColumns: ["id"]
          },
        ]
      }
      laws: {
        Row: {
          category: string | null
          created_at: string
          description: string
          enacted_year: number | null
          id: string
          last_updated: string
          official_url: string | null
          related_topics: Json
          short_name: string
          slug: string
          sort_order: number
          source_id: string | null
          title: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description: string
          enacted_year?: number | null
          id?: string
          last_updated?: string
          official_url?: string | null
          related_topics?: Json
          short_name: string
          slug: string
          sort_order?: number
          source_id?: string | null
          title: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string
          enacted_year?: number | null
          id?: string
          last_updated?: string
          official_url?: string | null
          related_topics?: Json
          short_name?: string
          slug?: string
          sort_order?: number
          source_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "laws_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "official_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_topics: {
        Row: {
          category: string
          created_at: string
          description: string
          documents: Json
          faq: Json
          icon: string
          id: string
          important_sections: Json
          key_rights: Json
          last_updated: string
          overview: string | null
          procedure: string | null
          related: Json
          slug: string
          source_id: string | null
          title: string
          verification_status: Database["public"]["Enums"]["content_verification_status"]
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          documents?: Json
          faq?: Json
          icon?: string
          id?: string
          important_sections?: Json
          key_rights?: Json
          last_updated?: string
          overview?: string | null
          procedure?: string | null
          related?: Json
          slug: string
          source_id?: string | null
          title: string
          verification_status?: Database["public"]["Enums"]["content_verification_status"]
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          documents?: Json
          faq?: Json
          icon?: string
          id?: string
          important_sections?: Json
          key_rights?: Json
          last_updated?: string
          overview?: string | null
          procedure?: string | null
          related?: Json
          slug?: string
          source_id?: string | null
          title?: string
          verification_status?: Database["public"]["Enums"]["content_verification_status"]
        }
        Relationships: [
          {
            foreignKeyName: "legal_topics_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "official_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      link_check_history: {
        Row: {
          checked_at: string
          created_at: string
          error_message: string | null
          http_code: number | null
          id: string
          redirect_url: string | null
          source_id: string | null
          status: string
          url: string
          url_kind: string
        }
        Insert: {
          checked_at?: string
          created_at?: string
          error_message?: string | null
          http_code?: number | null
          id?: string
          redirect_url?: string | null
          source_id?: string | null
          status: string
          url: string
          url_kind?: string
        }
        Update: {
          checked_at?: string
          created_at?: string
          error_message?: string | null
          http_code?: number | null
          id?: string
          redirect_url?: string | null
          source_id?: string | null
          status?: string
          url?: string
          url_kind?: string
        }
        Relationships: [
          {
            foreignKeyName: "link_check_history_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "official_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content?: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      official_link_clicks: {
        Row: {
          action: string
          created_at: string
          id: string
          service_slug: string | null
          service_title: string | null
          source_id: string | null
          target_url: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          service_slug?: string | null
          service_title?: string | null
          source_id?: string | null
          target_url?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          service_slug?: string | null
          service_title?: string | null
          source_id?: string | null
          target_url?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "official_link_clicks_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "official_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      official_sources: {
        Row: {
          apply_http_code: number | null
          apply_link_status: string | null
          apply_online_url: string | null
          appointment_url: string | null
          authority: string
          category: string | null
          complaint_url: string | null
          created_at: string
          created_by: string | null
          department: string | null
          email: string | null
          forms_http_code: number | null
          forms_link_status: string | null
          forms_url: string | null
          government_level: string | null
          help_centre_url: string | null
          helpline: string | null
          id: string
          is_active: boolean
          jurisdiction: string | null
          last_verified_at: string | null
          link_status: string | null
          links_checked_at: string | null
          locate_office_url: string | null
          ministry: string | null
          mobile_app_url: string | null
          office_address: string | null
          source_type: string | null
          source_url: string
          state: string | null
          status: string
          title: string
          track_status_url: string | null
          update_url: string | null
          updated_at: string
          website_http_code: number | null
          website_link_status: string | null
        }
        Insert: {
          apply_http_code?: number | null
          apply_link_status?: string | null
          apply_online_url?: string | null
          appointment_url?: string | null
          authority: string
          category?: string | null
          complaint_url?: string | null
          created_at?: string
          created_by?: string | null
          department?: string | null
          email?: string | null
          forms_http_code?: number | null
          forms_link_status?: string | null
          forms_url?: string | null
          government_level?: string | null
          help_centre_url?: string | null
          helpline?: string | null
          id?: string
          is_active?: boolean
          jurisdiction?: string | null
          last_verified_at?: string | null
          link_status?: string | null
          links_checked_at?: string | null
          locate_office_url?: string | null
          ministry?: string | null
          mobile_app_url?: string | null
          office_address?: string | null
          source_type?: string | null
          source_url: string
          state?: string | null
          status?: string
          title: string
          track_status_url?: string | null
          update_url?: string | null
          updated_at?: string
          website_http_code?: number | null
          website_link_status?: string | null
        }
        Update: {
          apply_http_code?: number | null
          apply_link_status?: string | null
          apply_online_url?: string | null
          appointment_url?: string | null
          authority?: string
          category?: string | null
          complaint_url?: string | null
          created_at?: string
          created_by?: string | null
          department?: string | null
          email?: string | null
          forms_http_code?: number | null
          forms_link_status?: string | null
          forms_url?: string | null
          government_level?: string | null
          help_centre_url?: string | null
          helpline?: string | null
          id?: string
          is_active?: boolean
          jurisdiction?: string | null
          last_verified_at?: string | null
          link_status?: string | null
          links_checked_at?: string | null
          locate_office_url?: string | null
          ministry?: string | null
          mobile_app_url?: string | null
          office_address?: string | null
          source_type?: string | null
          source_url?: string
          state?: string | null
          status?: string
          title?: string
          track_status_url?: string | null
          update_url?: string | null
          updated_at?: string
          website_http_code?: number | null
          website_link_status?: string | null
        }
        Relationships: []
      }
      procedures: {
        Row: {
          description: string
          id: string
          service_id: string
          step_number: number
          title: string
        }
        Insert: {
          description: string
          id?: string
          service_id: string
          step_number: number
          title: string
        }
        Update: {
          description?: string
          id?: string
          service_id?: string
          step_number?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "procedures_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "government_services"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          preferred_language: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          preferred_language?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          preferred_language?: string
          updated_at?: string
        }
        Relationships: []
      }
      rag_chunks: {
        Row: {
          chunk_index: number
          chunk_status: string
          chunk_text: string
          chunk_title: string | null
          chunk_type: Database["public"]["Enums"]["chunk_type"] | null
          confidence_score: number | null
          created_at: string
          document_id: string
          embedding: string | null
          embedding_model: string | null
          embedding_status: string
          id: string
          metadata: Json
          model_version: string | null
          quality_score: number | null
          source_section: string | null
          token_count: number | null
          updated_at: string
        }
        Insert: {
          chunk_index?: number
          chunk_status?: string
          chunk_text: string
          chunk_title?: string | null
          chunk_type?: Database["public"]["Enums"]["chunk_type"] | null
          confidence_score?: number | null
          created_at?: string
          document_id: string
          embedding?: string | null
          embedding_model?: string | null
          embedding_status?: string
          id?: string
          metadata?: Json
          model_version?: string | null
          quality_score?: number | null
          source_section?: string | null
          token_count?: number | null
          updated_at?: string
        }
        Update: {
          chunk_index?: number
          chunk_status?: string
          chunk_text?: string
          chunk_title?: string | null
          chunk_type?: Database["public"]["Enums"]["chunk_type"] | null
          confidence_score?: number | null
          created_at?: string
          document_id?: string
          embedding?: string | null
          embedding_model?: string | null
          embedding_status?: string
          id?: string
          metadata?: Json
          model_version?: string | null
          quality_score?: number | null
          source_section?: string | null
          token_count?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rag_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "knowledge_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      required_documents: {
        Row: {
          document_name: string
          id: string
          service_id: string
        }
        Insert: {
          document_name: string
          id?: string
          service_id: string
        }
        Update: {
          document_name?: string
          id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "required_documents_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "government_services"
            referencedColumns: ["id"]
          },
        ]
      }
      retrieval_logs: {
        Row: {
          confidence_score: number | null
          created_at: string
          id: string
          model_used: string | null
          query: string
          response_time_ms: number | null
          retrieval_time_ms: number | null
          retrieved_chunk_ids: string[] | null
          succeeded: boolean
          user_id: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          id?: string
          model_used?: string | null
          query: string
          response_time_ms?: number | null
          retrieval_time_ms?: number | null
          retrieved_chunk_ids?: string[] | null
          succeeded?: boolean
          user_id?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          id?: string
          model_used?: string | null
          query?: string
          response_time_ms?: number | null
          retrieval_time_ms?: number | null
          retrieved_chunk_ids?: string[] | null
          succeeded?: boolean
          user_id?: string | null
        }
        Relationships: []
      }
      review_tasks: {
        Row: {
          assigned_to: string | null
          created_at: string
          document_id: string
          due_date: string | null
          id: string
          notes: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["doc_review_status"]
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          document_id: string
          due_date?: string | null
          id?: string
          notes?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["doc_review_status"]
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          document_id?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["doc_review_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_tasks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "knowledge_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_items: {
        Row: {
          created_at: string
          id: string
          service_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          service_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          service_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "government_services"
            referencedColumns: ["id"]
          },
        ]
      }
      schemes: {
        Row: {
          application_process: string | null
          benefits: string | null
          category: string | null
          created_at: string
          description: string | null
          eligibility: string | null
          id: string
          jurisdiction: string | null
          slug: string
          source_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          application_process?: string | null
          benefits?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          eligibility?: string | null
          id?: string
          jurisdiction?: string | null
          slug: string
          source_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          application_process?: string | null
          benefits?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          eligibility?: string | null
          id?: string
          jurisdiction?: string | null
          slug?: string
          source_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schemes_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "official_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      seed_service_content: {
        Row: {
          category: string | null
          description: string | null
          docs: string[]
          eligibility: string | null
          fees: string | null
          icon: string | null
          processing_time: string | null
          slug: string
          src: string | null
          steps: string[]
          title: string | null
        }
        Insert: {
          category?: string | null
          description?: string | null
          docs?: string[]
          eligibility?: string | null
          fees?: string | null
          icon?: string | null
          processing_time?: string | null
          slug: string
          src?: string | null
          steps?: string[]
          title?: string | null
        }
        Update: {
          category?: string | null
          description?: string | null
          docs?: string[]
          eligibility?: string | null
          fees?: string | null
          icon?: string | null
          processing_time?: string | null
          slug?: string
          src?: string | null
          steps?: string[]
          title?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      match_chunks: {
        Args: {
          filter_state?: string
          match_count?: number
          query_embedding: string
        }
        Returns: {
          chunk_id: string
          chunk_text: string
          confidence_score: number
          content_trust_level: string
          doc_title: string
          document_id: string
          last_verified_date: string
          rank_score: number
          similarity: number
          source: string
          source_section: string
          source_url: string
          state: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user"
      chunk_type:
        | "procedure"
        | "faq"
        | "document"
        | "legal_topic"
        | "scheme"
        | "glossary"
        | "template"
      content_trust_level:
        | "official"
        | "verified"
        | "reviewed"
        | "draft"
        | "community"
        | "imported"
      content_verification_status: "verified" | "under_review" | "draft"
      doc_review_status: "up_to_date" | "needs_review" | "expired" | "archived"
      knowledge_source_type:
        | "official_government"
        | "government_portal"
        | "legal_authority"
        | "court"
        | "verified_source"
        | "internal_content"
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
      chunk_type: [
        "procedure",
        "faq",
        "document",
        "legal_topic",
        "scheme",
        "glossary",
        "template",
      ],
      content_trust_level: [
        "official",
        "verified",
        "reviewed",
        "draft",
        "community",
        "imported",
      ],
      content_verification_status: ["verified", "under_review", "draft"],
      doc_review_status: ["up_to_date", "needs_review", "expired", "archived"],
      knowledge_source_type: [
        "official_government",
        "government_portal",
        "legal_authority",
        "court",
        "verified_source",
        "internal_content",
      ],
    },
  },
} as const
