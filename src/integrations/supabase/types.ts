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
      agencies: {
        Row: {
          contact_email: string | null
          created_at: string
          footer_note: string | null
          id: string
          logo_url: string | null
          name: string
          owner_id: string
          primary_color: string | null
          updated_at: string
        }
        Insert: {
          contact_email?: string | null
          created_at?: string
          footer_note?: string | null
          id?: string
          logo_url?: string | null
          name: string
          owner_id: string
          primary_color?: string | null
          updated_at?: string
        }
        Update: {
          contact_email?: string | null
          created_at?: string
          footer_note?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          owner_id?: string
          primary_color?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      fixtures: {
        Row: {
          away_score: number | null
          away_team_id: number | null
          home_score: number | null
          home_team_id: number | null
          id: number
          matchday: number | null
          season: number | null
          stage: string | null
          status: string
          updated_at: string
          utc_date: string
        }
        Insert: {
          away_score?: number | null
          away_team_id?: number | null
          home_score?: number | null
          home_team_id?: number | null
          id: number
          matchday?: number | null
          season?: number | null
          stage?: string | null
          status: string
          updated_at?: string
          utc_date: string
        }
        Update: {
          away_score?: number | null
          away_team_id?: number | null
          home_score?: number | null
          home_team_id?: number | null
          id?: number
          matchday?: number | null
          season?: number | null
          stage?: string | null
          status?: string
          updated_at?: string
          utc_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "fixtures_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixtures_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      last_refresh: {
        Row: {
          id: boolean
          ran_at: string
        }
        Insert: {
          id?: boolean
          ran_at?: string
        }
        Update: {
          id?: boolean
          ran_at?: string
        }
        Relationships: []
      }
      link_clicks: {
        Row: {
          created_at: string
          href: string | null
          id: string
          link_key: string
          referrer: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          href?: string | null
          id?: string
          link_key: string
          referrer?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          href?: string | null
          id?: string
          link_key?: string
          referrer?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      marquee_players: {
        Row: {
          created_at: string
          id: string
          player_name: string
          team_id: number
          tier: Database["public"]["Enums"]["player_tier"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          player_name: string
          team_id: number
          tier: Database["public"]["Enums"]["player_tier"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          player_name?: string
          team_id?: number
          tier?: Database["public"]["Enums"]["player_tier"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marquee_players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      refresh_log: {
        Row: {
          error: string | null
          fixtures_count: number | null
          id: number
          ran_at: string
          standings_count: number | null
          success: boolean
        }
        Insert: {
          error?: string | null
          fixtures_count?: number | null
          id?: number
          ran_at?: string
          standings_count?: number | null
          success: boolean
        }
        Update: {
          error?: string | null
          fixtures_count?: number | null
          id?: number
          ran_at?: string
          standings_count?: number | null
          success?: boolean
        }
        Relationships: []
      }
      sponsor_profiles: {
        Row: {
          agency_id: string | null
          brand_name: string
          category: string
          created_at: string
          id: string
          is_example: boolean
          notes: string | null
          rival_brands: string[]
          rival_categories: string[]
          sponsorship_type: string
          team_ids: number[]
          updated_at: string
        }
        Insert: {
          agency_id?: string | null
          brand_name: string
          category: string
          created_at?: string
          id?: string
          is_example?: boolean
          notes?: string | null
          rival_brands?: string[]
          rival_categories?: string[]
          sponsorship_type: string
          team_ids?: number[]
          updated_at?: string
        }
        Update: {
          agency_id?: string | null
          brand_name?: string
          category?: string
          created_at?: string
          id?: string
          is_example?: boolean
          notes?: string | null
          rival_brands?: string[]
          rival_categories?: string[]
          sponsorship_type?: string
          team_ids?: number[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsor_profiles_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      standings: {
        Row: {
          draw: number
          form: string | null
          goal_difference: number
          goals_against: number
          goals_for: number
          lost: number
          played_games: number
          points: number
          position: number
          team_id: number
          updated_at: string
          won: number
        }
        Insert: {
          draw?: number
          form?: string | null
          goal_difference?: number
          goals_against?: number
          goals_for?: number
          lost?: number
          played_games?: number
          points?: number
          position: number
          team_id: number
          updated_at?: string
          won?: number
        }
        Update: {
          draw?: number
          form?: string | null
          goal_difference?: number
          goals_against?: number
          goals_for?: number
          lost?: number
          played_games?: number
          points?: number
          position?: number
          team_id?: number
          updated_at?: string
          won?: number
        }
        Relationships: [
          {
            foreignKeyName: "standings_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: true
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          crest: string | null
          id: number
          name: string
          short_name: string | null
          tla: string | null
          updated_at: string
        }
        Insert: {
          crest?: string | null
          id: number
          name: string
          short_name?: string | null
          tla?: string | null
          updated_at?: string
        }
        Update: {
          crest?: string | null
          id?: number
          name?: string
          short_name?: string | null
          tla?: string | null
          updated_at?: string
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
          role: Database["public"]["Enums"]["app_role"]
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
      waitlist_signups: {
        Row: {
          company: string | null
          created_at: string
          email: string
          id: string
          referrer: string | null
          role: string | null
          tier: string
          utm_source: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          id?: string
          referrer?: string | null
          role?: string | null
          tier: string
          utm_source?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          referrer?: string | null
          role?: string | null
          tier?: string
          utm_source?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_sponsor_engagement: {
        Args: { _sponsor_id: string }
        Returns: {
          angle_clicks: number
          avg_angle_dwell_ms: number
          avg_card_dwell_ms: number
          card_clicks: number
          fixture_id: number
          matchup: string
          total_clicks: number
          utc_date: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user"
      player_tier: "tier1" | "tier2"
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
      player_tier: ["tier1", "tier2"],
    },
  },
} as const
