/**
 * Phase 2 Database types — profiles + user_role.
 * After Phase 3+ schema changes, regenerate with:
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
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: {
      user_role: "admin" | "researcher" | "teacher" | "student" | "public";
    };
  };
};
