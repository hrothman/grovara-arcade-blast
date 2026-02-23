// Database types for Supabase
// Auto-generated types matching our schema

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
      users: {
        Row: {
          id: string
          device_id: string
          username: string | null
          email: string | null
          user_type: 'buyer' | 'brand' | null
          is_anonymous: boolean
          total_score: number
          best_score: number
          games_played: number
          created_at: string
          updated_at: string
          last_active_at: string
        }
        Insert: {
          id?: string
          device_id: string
          username?: string | null
          email?: string | null
          user_type?: 'buyer' | 'brand' | null
          is_anonymous?: boolean
          total_score?: number
          best_score?: number
          games_played?: number
          created_at?: string
          updated_at?: string
          last_active_at?: string
        }
        Update: {
          id?: string
          device_id?: string
          username?: string | null
          email?: string | null
          user_type?: 'buyer' | 'brand' | null
          is_anonymous?: boolean
          total_score?: number
          best_score?: number
          games_played?: number
          created_at?: string
          updated_at?: string
          last_active_at?: string
        }
        Relationships: []
      }
      game_sessions: {
        Row: {
          id: string
          user_id: string
          session_id: string
          booth_source: string | null
          campaign: string | null
          device_type: string | null
          user_type: 'buyer' | 'brand' | null
          total_score: number
          final_score: number | null
          lives_remaining: number
          levels_completed: number
          total_enemies_killed: number
          total_products_placed: number
          total_ultra_rares: number
          status: 'in_progress' | 'completed' | 'abandoned'
          started_at: string
          completed_at: string | null
          duration_seconds: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          session_id: string
          booth_source?: string | null
          campaign?: string | null
          device_type?: string | null
          user_type?: 'buyer' | 'brand' | null
          total_score?: number
          final_score?: number | null
          lives_remaining?: number
          levels_completed?: number
          total_enemies_killed?: number
          total_products_placed?: number
          total_ultra_rares?: number
          status?: 'in_progress' | 'completed' | 'abandoned'
          started_at?: string
          completed_at?: string | null
          duration_seconds?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          session_id?: string
          booth_source?: string | null
          campaign?: string | null
          device_type?: string | null
          user_type?: 'buyer' | 'brand' | null
          total_score?: number
          final_score?: number | null
          lives_remaining?: number
          levels_completed?: number
          total_enemies_killed?: number
          total_products_placed?: number
          total_ultra_rares?: number
          status?: 'in_progress' | 'completed' | 'abandoned'
          started_at?: string
          completed_at?: string | null
          duration_seconds?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      level_results: {
        Row: {
          id: string
          session_id: string
          user_id: string
          level_number: number
          score: number
          enemies_killed: number
          products_on_shelf: number
          ultra_rare_count: number
          completed: boolean
          duration_seconds: number | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          user_id: string
          level_number: number
          score?: number
          enemies_killed?: number
          products_on_shelf?: number
          ultra_rare_count?: number
          completed?: boolean
          duration_seconds?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          user_id?: string
          level_number?: number
          score?: number
          enemies_killed?: number
          products_on_shelf?: number
          ultra_rare_count?: number
          completed?: boolean
          duration_seconds?: number | null
          created_at?: string
        }
        Relationships: []
      }
      swipe_actions: {
        Row: {
          id: string
          session_id: string
          user_id: string
          item_id: string
          item_name: string | null
          item_type: 'brand' | 'buyer' | null
          direction: 'left' | 'right'
          swipe_position: number | null
          level_after: number | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          user_id: string
          item_id: string
          item_name?: string | null
          item_type?: 'brand' | 'buyer' | null
          direction: 'left' | 'right'
          swipe_position?: number | null
          level_after?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          user_id?: string
          item_id?: string
          item_name?: string | null
          item_type?: 'brand' | 'buyer' | null
          direction?: 'left' | 'right'
          swipe_position?: number | null
          level_after?: number | null
          created_at?: string
        }
        Relationships: []
      }
      user_matches: {
        Row: {
          id: string
          user_id: string
          item_id: string
          item_name: string | null
          item_type: 'brand' | 'buyer' | null
          match_count: number
          first_matched_at: string
          last_matched_at: string
        }
        Insert: {
          id?: string
          user_id: string
          item_id: string
          item_name?: string | null
          item_type?: 'brand' | 'buyer' | null
          match_count?: number
          first_matched_at?: string
          last_matched_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          item_id?: string
          item_name?: string | null
          item_type?: 'brand' | 'buyer' | null
          match_count?: number
          first_matched_at?: string
          last_matched_at?: string
        }
        Relationships: []
      }
      leaderboard_entries: {
        Row: {
          id: string
          user_id: string
          username: string
          score: number
          rank: number | null
          session_id: string | null
          achieved_at: string
          is_fake: boolean
        }
        Insert: {
          id?: string
          user_id: string
          username: string
          score: number
          rank?: number | null
          session_id?: string | null
          achieved_at?: string
          is_fake?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          username?: string
          score?: number
          rank?: number | null
          session_id?: string | null
          achieved_at?: string
          is_fake?: boolean
        }
        Relationships: []
      }
    }
    Views: {
      active_users: {
        Row: {
          id: string
          username: string | null
          email: string | null
          user_type: 'buyer' | 'brand' | null
          is_anonymous: boolean
          best_score: number
          games_played: number
          last_active_at: string
        }
        Insert: {
          [key: string]: never
        }
        Update: {
          [key: string]: never
        }
        Relationships: []
      }
      popular_items: {
        Row: {
          item_id: string
          item_name: string | null
          item_type: 'brand' | 'buyer' | null
          match_count: number
          unique_users: number
        }
        Insert: {
          [key: string]: never
        }
        Update: {
          [key: string]: never
        }
        Relationships: []
      }
      session_statistics: {
        Row: {
          total_sessions: number
          completed_sessions: number
          abandoned_sessions: number
          completion_rate: number
          avg_final_score: number
          avg_duration_seconds: number
        }
        Insert: {
          [key: string]: never
        }
        Update: {
          [key: string]: never
        }
        Relationships: []
      }
    }
    Functions: {}
    Enums: {}
    CompositeTypes: {}
  }
}
