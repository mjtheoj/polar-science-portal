/**
 * Phase 3 Database types — profiles + repository.
 * Regenerate after schema changes with:
 *   npx supabase gen types typescript --project-id uumartyqjyauuxwcrpqz > types/supabase.ts
 */
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          role: Database["public"]["Enums"]["user_role"];
          institution: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          email: string;
          role?: Database["public"]["Enums"]["user_role"];
          institution?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string;
          role?: Database["public"]["Enums"]["user_role"];
          institution?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      institutions: {
        Row: { id: string; name: string; short_name: string | null; country: string | null; website: string | null; created_at: string };
        Insert: { id?: string; name: string; short_name?: string | null; country?: string | null; website?: string | null; created_at?: string };
        Update: { id?: string; name?: string; short_name?: string | null; country?: string | null; website?: string | null; created_at?: string };
        Relationships: [];
      };
      expeditions: {
        Row: { id: string; code: string; name: string; description: string | null; region: string; year: number; start_date: string | null; end_date: string | null; station: string | null; leader_profile_id: string | null; created_by: string | null; created_at: string };
        Insert: { id?: string; code: string; name: string; description?: string | null; region: string; year: number; start_date?: string | null; end_date?: string | null; station?: string | null; leader_profile_id?: string | null; created_by?: string | null; created_at?: string };
        Update: { id?: string; code?: string; name?: string; description?: string | null; region?: string; year?: number; start_date?: string | null; end_date?: string | null; station?: string | null; leader_profile_id?: string | null; created_by?: string | null; created_at?: string };
        Relationships: [];
      };
      research_topics: {
        Row: { id: string; name: string; slug: string; description: string | null; parent_id: string | null; created_at: string };
        Insert: { id?: string; name: string; slug: string; description?: string | null; parent_id?: string | null; created_at?: string };
        Update: { id?: string; name?: string; slug?: string; description?: string | null; parent_id?: string | null; created_at?: string };
        Relationships: [];
      };
      locations: {
        Row: { id: string; name: string; description: string | null; latitude: number | null; longitude: number | null; region: string | null; created_at: string };
        Insert: { id?: string; name: string; description?: string | null; latitude?: number | null; longitude?: number | null; region?: string | null; created_at?: string };
        Update: { id?: string; name?: string; description?: string | null; latitude?: number | null; longitude?: number | null; region?: string | null; created_at?: string };
        Relationships: [];
      };
      documents: {
        Row: {
          id: string; title: string; description: string | null; content_type: Database["public"]["Enums"]["content_type"];
          storage_path: string | null; file_type: string | null; file_size: number | null; thumbnail_path: string | null;
          author_id: string; institution_id: string | null; expedition_id: string | null; location_id: string | null;
          publication_date: string | null; language: string; license: string | null; keywords: string[] | null;
          visibility: Database["public"]["Enums"]["visibility_level"]; approval_status: Database["public"]["Enums"]["approval_status"];
          processing_status: Database["public"]["Enums"]["processing_status"]; view_count: number; metadata: Record<string, unknown>;
          created_at: string; updated_at: string; published_at: string | null;
        };
        Insert: {
          id?: string; title: string; description?: string | null; content_type: Database["public"]["Enums"]["content_type"];
          storage_path?: string | null; file_type?: string | null; file_size?: number | null; thumbnail_path?: string | null;
          author_id: string; institution_id?: string | null; expedition_id?: string | null; location_id?: string | null;
          publication_date?: string | null; language?: string; license?: string | null; keywords?: string[] | null;
          visibility?: Database["public"]["Enums"]["visibility_level"]; approval_status?: Database["public"]["Enums"]["approval_status"];
          processing_status?: Database["public"]["Enums"]["processing_status"]; view_count?: number; metadata?: Record<string, unknown>;
          created_at?: string; updated_at?: string; published_at?: string | null;
        };
        Update: {
          id?: string; title?: string; description?: string | null; content_type?: Database["public"]["Enums"]["content_type"];
          storage_path?: string | null; file_type?: string | null; file_size?: number | null; thumbnail_path?: string | null;
          author_id?: string; institution_id?: string | null; expedition_id?: string | null; location_id?: string | null;
          publication_date?: string | null; language?: string; license?: string | null; keywords?: string[] | null;
          visibility?: Database["public"]["Enums"]["visibility_level"]; approval_status?: Database["public"]["Enums"]["approval_status"];
          processing_status?: Database["public"]["Enums"]["processing_status"]; view_count?: number; metadata?: Record<string, unknown>;
          created_at?: string; updated_at?: string; published_at?: string | null;
        };
        Relationships: [];
      };
      document_topics: { Row: { document_id: string; topic_id: string }; Insert: { document_id: string; topic_id: string }; Update: { document_id?: string; topic_id?: string }; Relationships: [] };
      document_authors: { Row: { document_id: string; profile_id: string }; Insert: { document_id: string; profile_id: string }; Update: { document_id?: string; profile_id?: string }; Relationships: [] };
      document_chunks: { Row: { id: string; document_id: string; chunk_index: number; content: string; page_number: number | null; char_count: number | null; created_at: string }; Insert: { id?: string; document_id: string; chunk_index: number; content: string; page_number?: number | null; char_count?: number | null; created_at?: string }; Update: { id?: string; document_id?: string; chunk_index?: number; content?: string; page_number?: number | null; char_count?: number | null; created_at?: string }; Relationships: [] };
      approvals: { Row: { id: string; document_id: string; reviewer_id: string | null; from_status: Database["public"]["Enums"]["approval_status"]; to_status: Database["public"]["Enums"]["approval_status"]; comment: string | null; created_at: string }; Insert: { id?: string; document_id: string; reviewer_id?: string | null; from_status: Database["public"]["Enums"]["approval_status"]; to_status: Database["public"]["Enums"]["approval_status"]; comment?: string | null; created_at?: string }; Update: { id?: string; document_id?: string; reviewer_id?: string | null; from_status?: Database["public"]["Enums"]["approval_status"]; to_status?: Database["public"]["Enums"]["approval_status"]; comment?: string | null; created_at?: string }; Relationships: [] };
      audit_logs: { Row: { id: string; action: string; entity_type: string; entity_id: string | null; actor_id: string | null; details: Record<string, unknown> | null; created_at: string }; Insert: { id?: string; action: string; entity_type: string; entity_id?: string | null; actor_id?: string | null; details?: Record<string, unknown> | null; created_at?: string }; Update: { id?: string; action?: string; entity_type?: string; entity_id?: string | null; actor_id?: string | null; details?: Record<string, unknown> | null; created_at?: string }; Relationships: [] };
    };
    Views: Record<string, never>;
    Functions: { is_admin: { Args: Record<string, never>; Returns: boolean } };
    Enums: {
      user_role: "admin" | "researcher" | "teacher" | "student" | "public";
      content_type: "expedition_report" | "publication" | "dataset" | "photograph" | "video" | "institutional_activity" | "educational_resource" | "outreach_article";
      visibility_level: "public" | "internal" | "restricted" | "draft";
      approval_status: "draft" | "submitted" | "under_review" | "approved" | "published" | "rejected" | "archived";
      processing_status: "uploading" | "processing" | "indexing" | "ready" | "failed";
    };
  };
};
