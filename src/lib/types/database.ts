export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name?: string;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
        };
      };
      clubs: {
        Row: {
          id: string;
          slug: string;
          name: string;
          badge_url: string | null;
          founded_date: string | null;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          badge_url?: string | null;
          founded_date?: string | null;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          badge_url?: string | null;
          founded_date?: string | null;
          description?: string | null;
          created_at?: string;
        };
      };
      memberships: {
        Row: {
          id: string;
          user_id: string;
          club_id: string;
          role: "admin" | "member";
          status: "active" | "pending";
          number: number | null;
          position: "GK" | "DF" | "MF" | "FW" | null;
          joined_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          club_id: string;
          role?: "admin" | "member";
          status?: "active" | "pending";
          number?: number | null;
          position?: "GK" | "DF" | "MF" | "FW" | null;
          joined_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          club_id?: string;
          role?: "admin" | "member";
          status?: "active" | "pending";
          number?: number | null;
          position?: "GK" | "DF" | "MF" | "FW" | null;
          joined_at?: string;
        };
      };
      invitations: {
        Row: {
          id: string;
          club_id: string;
          code: string;
          created_by: string;
          expires_at: string | null;
          max_uses: number | null;
          use_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          club_id: string;
          code: string;
          created_by: string;
          expires_at?: string | null;
          max_uses?: number | null;
          use_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          club_id?: string;
          code?: string;
          created_by?: string;
          expires_at?: string | null;
          max_uses?: number | null;
          use_count?: number;
          created_at?: string;
        };
      };
      albums: {
        Row: {
          id: string;
          club_id: string;
          title: string;
          cover_url: string | null;
          description: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          club_id: string;
          title: string;
          cover_url?: string | null;
          description?: string | null;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          club_id?: string;
          title?: string;
          cover_url?: string | null;
          description?: string | null;
          created_by?: string;
          created_at?: string;
        };
      };
      photos: {
        Row: {
          id: string;
          album_id: string;
          url: string;
          caption: string | null;
          uploaded_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          album_id: string;
          url: string;
          caption?: string | null;
          uploaded_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          album_id?: string;
          url?: string;
          caption?: string | null;
          uploaded_by?: string;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_club_admin: {
        Args: { p_club_id: string };
        Returns: boolean;
      };
      is_club_member: {
        Args: { p_club_id: string };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
  };
}
