export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      activities: {
        Row: {
          challenge_id: string | null;
          created_at: string;
          duplicate_of_activity_id: string | null;
          elevation_m: number | null;
          gpx_path: string | null;
          group_ride_id: string | null;
          id: string;
          km: number;
          note: string | null;
          proof_path: string | null;
          ride_date: string;
          source: string;
          status: Database["public"]["Enums"]["activity_status"];
          strava_activity_id: number | null;
          strava_link: string | null;
          user_id: string;
          validated_at: string | null;
        };
        ComputedFields: never;
        Insert: {
          challenge_id?: string | null;
          created_at?: string;
          duplicate_of_activity_id?: string | null;
          elevation_m?: number | null;
          gpx_path?: string | null;
          group_ride_id?: string | null;
          id?: string;
          km: number;
          note?: string | null;
          proof_path?: string | null;
          ride_date?: string;
          source?: string;
          status?: Database["public"]["Enums"]["activity_status"];
          strava_activity_id?: number | null;
          strava_link?: string | null;
          user_id: string;
          validated_at?: string | null;
        };
        Update: {
          challenge_id?: string | null;
          created_at?: string;
          duplicate_of_activity_id?: string | null;
          elevation_m?: number | null;
          gpx_path?: string | null;
          group_ride_id?: string | null;
          id?: string;
          km?: number;
          note?: string | null;
          proof_path?: string | null;
          ride_date?: string;
          source?: string;
          status?: Database["public"]["Enums"]["activity_status"];
          strava_activity_id?: number | null;
          strava_link?: string | null;
          user_id?: string;
          validated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "activities_challenge_id_fkey";
            columns: ["challenge_id"];
            isOneToOne: false;
            referencedRelation: "scout_challenges";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activities_duplicate_of_activity_id_fkey";
            columns: ["duplicate_of_activity_id"];
            isOneToOne: false;
            referencedRelation: "activities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activities_duplicate_of_activity_id_fkey";
            columns: ["duplicate_of_activity_id"];
            isOneToOne: false;
            referencedRelation: "activities_public";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activities_group_ride_id_fkey";
            columns: ["group_ride_id"];
            isOneToOne: false;
            referencedRelation: "group_rides";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activities_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activities_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles_public";
            referencedColumns: ["id"];
          },
        ];
      };
      activity_corrections: {
        Row: {
          action: string;
          activity_id: string | null;
          admin_id: string | null;
          changes: NonNullable<Json>;
          created_at: string;
          id: string;
          km: number | null;
          ride_date: string | null;
          seen_at: string | null;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          action: string;
          activity_id?: string | null;
          admin_id?: string | null;
          changes?: NonNullable<Json>;
          created_at?: string;
          id?: string;
          km?: number | null;
          ride_date?: string | null;
          seen_at?: string | null;
          user_id: string;
        };
        Update: {
          action?: string;
          activity_id?: string | null;
          admin_id?: string | null;
          changes?: NonNullable<Json>;
          created_at?: string;
          id?: string;
          km?: number | null;
          ride_date?: string | null;
          seen_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      app_installations: {
        Row: {
          first_seen_at: string;
          id: string;
          installation_id: string;
          last_seen_at: string;
          platform: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          first_seen_at?: string;
          id?: string;
          installation_id: string;
          last_seen_at?: string;
          platform: string;
          user_id: string;
        };
        Update: {
          first_seen_at?: string;
          id?: string;
          installation_id?: string;
          last_seen_at?: string;
          platform?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      app_notification_settings: {
        Row: {
          distance_body: string;
          distance_enabled: boolean;
          distance_interval_km: number;
          distance_title: string;
          individual_distance_body: string;
          individual_distance_enabled: boolean;
          individual_distance_interval_km: number;
          individual_distance_title: string;
          singleton: boolean;
          updated_at: string;
          weekly_body: string;
          weekly_enabled: boolean;
          weekly_hour: number;
          weekly_title: string;
        };
        ComputedFields: never;
        Insert: {
          distance_body?: string;
          distance_enabled?: boolean;
          distance_interval_km?: number;
          distance_title?: string;
          individual_distance_body?: string;
          individual_distance_enabled?: boolean;
          individual_distance_interval_km?: number;
          individual_distance_title?: string;
          singleton?: boolean;
          updated_at?: string;
          weekly_body?: string;
          weekly_enabled?: boolean;
          weekly_hour?: number;
          weekly_title?: string;
        };
        Update: {
          distance_body?: string;
          distance_enabled?: boolean;
          distance_interval_km?: number;
          distance_title?: string;
          individual_distance_body?: string;
          individual_distance_enabled?: boolean;
          individual_distance_interval_km?: number;
          individual_distance_title?: string;
          singleton?: boolean;
          updated_at?: string;
          weekly_body?: string;
          weekly_enabled?: boolean;
          weekly_hour?: number;
          weekly_title?: string;
        };
        Relationships: [];
      };
      app_notifications: {
        Row: {
          body: string;
          created_at: string;
          dedupe_key: string | null;
          href: string;
          id: string;
          kind: string;
          push_attempts: number;
          push_last_error: string | null;
          push_sent_at: string | null;
          read_at: string | null;
          title: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          body: string;
          created_at?: string;
          dedupe_key?: string | null;
          href?: string;
          id?: string;
          kind: string;
          push_attempts?: number;
          push_last_error?: string | null;
          push_sent_at?: string | null;
          read_at?: string | null;
          title: string;
          user_id: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          dedupe_key?: string | null;
          href?: string;
          id?: string;
          kind?: string;
          push_attempts?: number;
          push_last_error?: string | null;
          push_sent_at?: string | null;
          read_at?: string | null;
          title?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      app_push_subscriptions: {
        Row: {
          created_at: string;
          endpoint: string;
          subscription: NonNullable<Json>;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          endpoint: string;
          subscription: NonNullable<Json>;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          endpoint?: string;
          subscription?: NonNullable<Json>;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      cleanup_runs: {
        Row: {
          details: NonNullable<Json>;
          id: string;
          ran_at: string;
          trigger_source: string;
        };
        ComputedFields: never;
        Insert: {
          details?: NonNullable<Json>;
          id?: string;
          ran_at?: string;
          trigger_source?: string;
        };
        Update: {
          details?: NonNullable<Json>;
          id?: string;
          ran_at?: string;
          trigger_source?: string;
        };
        Relationships: [];
      };
      countdowns: {
        Row: {
          created_at: string | null;
          id: string;
          is_active: boolean | null;
          subtitle: string | null;
          target_date: string;
          title: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          subtitle?: string | null;
          target_date: string;
          title: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          subtitle?: string | null;
          target_date?: string;
          title?: string;
        };
        Relationships: [];
      };
      distance_awards: {
        Row: {
          created_at: string;
          id: string;
          kind: string;
          sport: string;
          threshold_km: number;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          kind: string;
          sport: string;
          threshold_km: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          kind?: string;
          sport?: string;
          threshold_km?: number;
        };
        Relationships: [];
      };
      expedition_waypoints: {
        Row: {
          badge_emoji: string;
          badge_name: string;
          created_at: string | null;
          description: string;
          id: string;
          name: string;
          subtitle: string;
          target_km: number;
          x: number;
          y: number;
        };
        ComputedFields: never;
        Insert: {
          badge_emoji?: string;
          badge_name?: string;
          created_at?: string | null;
          description?: string;
          id: string;
          name: string;
          subtitle?: string;
          target_km?: number;
          x?: number;
          y?: number;
        };
        Update: {
          badge_emoji?: string;
          badge_name?: string;
          created_at?: string | null;
          description?: string;
          id?: string;
          name?: string;
          subtitle?: string;
          target_km?: number;
          x?: number;
          y?: number;
        };
        Relationships: [];
      };
      group_ride_members: {
        Row: {
          added_at: string;
          group_id: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          added_at?: string;
          group_id: string;
          user_id: string;
        };
        Update: {
          added_at?: string;
          group_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "group_ride_members_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "group_rides";
            referencedColumns: ["id"];
          },
        ];
      };
      group_rides: {
        Row: {
          created_at: string;
          created_by: string;
          id: string;
          ride_date: string;
          sport: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          created_by?: string;
          id?: string;
          ride_date: string;
          sport?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          id?: string;
          ride_date?: string;
          sport?: string;
        };
        Relationships: [];
      };
      member_links: {
        Row: {
          key: string;
          label: string | null;
          updated_at: string;
          updated_by: string | null;
          url: string;
        };
        ComputedFields: never;
        Insert: {
          key: string;
          label?: string | null;
          updated_at?: string;
          updated_by?: string | null;
          url: string;
        };
        Update: {
          key?: string;
          label?: string | null;
          updated_at?: string;
          updated_by?: string | null;
          url?: string;
        };
        Relationships: [];
      };
      patrols: {
        Row: {
          category: Database["public"]["Enums"]["patrol_category"];
          created_at: string;
          id: string;
          name: string;
        };
        ComputedFields: never;
        Insert: {
          category: Database["public"]["Enums"]["patrol_category"];
          created_at?: string;
          id?: string;
          name: string;
        };
        Update: {
          category?: Database["public"]["Enums"]["patrol_category"];
          created_at?: string;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      planned_ride_responses: {
        Row: {
          ride_id: string;
          status: string;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          ride_id: string;
          status: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          ride_id?: string;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "planned_ride_responses_ride_id_fkey";
            columns: ["ride_id"];
            isOneToOne: false;
            referencedRelation: "planned_rides";
            referencedColumns: ["id"];
          },
        ];
      };
      planned_rides: {
        Row: {
          cancelled: boolean;
          created_at: string;
          created_by: string;
          distance_km: number | null;
          elevation_m: number | null;
          id: string;
          level: string;
          max_participants: number | null;
          meeting_point: string;
          meeting_url: string | null;
          notes: string | null;
          ride_date: string;
          sport: string;
          start_time: string;
          title: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          cancelled?: boolean;
          created_at?: string;
          created_by: string;
          distance_km?: number | null;
          elevation_m?: number | null;
          id?: string;
          level?: string;
          max_participants?: number | null;
          meeting_point: string;
          meeting_url?: string | null;
          notes?: string | null;
          ride_date: string;
          sport?: string;
          start_time: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          cancelled?: boolean;
          created_at?: string;
          created_by?: string;
          distance_km?: number | null;
          elevation_m?: number | null;
          id?: string;
          level?: string;
          max_participants?: number | null;
          meeting_point?: string;
          meeting_url?: string | null;
          notes?: string | null;
          ride_date?: string;
          sport?: string;
          start_time?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          birth_day: number | null;
          birth_month: number | null;
          created_at: string;
          email: string | null;
          full_name: string | null;
          id: string;
          is_admin: boolean;
          onboarded: boolean;
          patrol_id: string | null;
          phone: string | null;
          quali: string | null;
          scout_year: number | null;
          strava_url: string | null;
          totem: string | null;
        };
        ComputedFields: never;
        Insert: {
          birth_day?: number | null;
          birth_month?: number | null;
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id: string;
          is_admin?: boolean;
          onboarded?: boolean;
          patrol_id?: string | null;
          phone?: string | null;
          quali?: string | null;
          scout_year?: number | null;
          strava_url?: string | null;
          totem?: string | null;
        };
        Update: {
          birth_day?: number | null;
          birth_month?: number | null;
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          is_admin?: boolean;
          onboarded?: boolean;
          patrol_id?: string | null;
          phone?: string | null;
          quali?: string | null;
          scout_year?: number | null;
          strava_url?: string | null;
          totem?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_patrol_id_fkey";
            columns: ["patrol_id"];
            isOneToOne: false;
            referencedRelation: "patrols";
            referencedColumns: ["id"];
          },
        ];
      };
      proposed_routes: {
        Row: {
          created_at: string | null;
          description: string | null;
          gpx_url: string;
          id: string;
          title: string;
          user_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string | null;
          description?: string | null;
          gpx_url: string;
          id?: string;
          title: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          gpx_url?: string;
          id?: string;
          title?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      scout_challenge_participants: {
        Row: {
          activity_id: string | null;
          challenge_id: string;
          created_at: string;
          id: string;
          status: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          activity_id?: string | null;
          challenge_id: string;
          created_at?: string;
          id?: string;
          status?: string;
          user_id: string;
        };
        Update: {
          activity_id?: string | null;
          challenge_id?: string;
          created_at?: string;
          id?: string;
          status?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "scout_challenge_participants_activity_id_fkey";
            columns: ["activity_id"];
            isOneToOne: true;
            referencedRelation: "activities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "scout_challenge_participants_activity_id_fkey";
            columns: ["activity_id"];
            isOneToOne: true;
            referencedRelation: "activities_public";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "scout_challenge_participants_challenge_id_fkey";
            columns: ["challenge_id"];
            isOneToOne: false;
            referencedRelation: "scout_challenges";
            referencedColumns: ["id"];
          },
        ];
      };
      scout_challenges: {
        Row: {
          activity_id: string | null;
          awarded_points: number | null;
          challenged_id: string | null;
          challenger_id: string;
          created_at: string;
          description: string | null;
          exact_distance: boolean;
          gpx_template_path: string | null;
          id: string;
          manual_validation: boolean;
          proposed_points: number;
          route_validation: boolean;
          sport: string;
          status: string;
          target_elevation: number | null;
          target_km: number | null;
          title: string;
          validated_at: string | null;
          winner_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          activity_id?: string | null;
          awarded_points?: number | null;
          challenged_id?: string | null;
          challenger_id: string;
          created_at?: string;
          description?: string | null;
          exact_distance?: boolean;
          gpx_template_path?: string | null;
          id?: string;
          manual_validation?: boolean;
          proposed_points: number;
          route_validation?: boolean;
          sport: string;
          status?: string;
          target_elevation?: number | null;
          target_km?: number | null;
          title: string;
          validated_at?: string | null;
          winner_id?: string | null;
        };
        Update: {
          activity_id?: string | null;
          awarded_points?: number | null;
          challenged_id?: string | null;
          challenger_id?: string;
          created_at?: string;
          description?: string | null;
          exact_distance?: boolean;
          gpx_template_path?: string | null;
          id?: string;
          manual_validation?: boolean;
          proposed_points?: number;
          route_validation?: boolean;
          sport?: string;
          status?: string;
          target_elevation?: number | null;
          target_km?: number | null;
          title?: string;
          validated_at?: string | null;
          winner_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "scout_challenges_activity_id_fkey";
            columns: ["activity_id"];
            isOneToOne: true;
            referencedRelation: "activities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "scout_challenges_activity_id_fkey";
            columns: ["activity_id"];
            isOneToOne: true;
            referencedRelation: "activities_public";
            referencedColumns: ["id"];
          },
        ];
      };
      site_settings: {
        Row: {
          key: string;
          updated_at: string;
          value: string;
        };
        ComputedFields: never;
        Insert: {
          key: string;
          updated_at?: string;
          value: string;
        };
        Update: {
          key?: string;
          updated_at?: string;
          value?: string;
        };
        Relationships: [];
      };
      solidarity_goals: {
        Row: {
          created_at: string;
          description: string;
          goal_km: number;
          icon: string;
          id: string;
          sort_order: number;
          subtitle: string | null;
          title: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          description?: string;
          goal_km: number;
          icon?: string;
          id?: string;
          sort_order?: number;
          subtitle?: string | null;
          title: string;
        };
        Update: {
          created_at?: string;
          description?: string;
          goal_km?: number;
          icon?: string;
          id?: string;
          sort_order?: number;
          subtitle?: string | null;
          title?: string;
        };
        Relationships: [];
      };
      strava_connections: {
        Row: {
          access_token: string;
          athlete_id: number;
          connected_at: string;
          expires_at: number;
          refresh_token: string;
          scope: string;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          access_token: string;
          athlete_id: number;
          connected_at?: string;
          expires_at: number;
          refresh_token: string;
          scope?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          access_token?: string;
          athlete_id?: number;
          connected_at?: string;
          expires_at?: number;
          refresh_token?: string;
          scope?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "strava_connections_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "strava_connections_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles_public";
            referencedColumns: ["id"];
          },
        ];
      };
      strava_oauth_states: {
        Row: {
          expires_at: string;
          state_hash: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          expires_at: string;
          state_hash: string;
          user_id: string;
        };
        Update: {
          expires_at?: string;
          state_hash?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "strava_oauth_states_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "strava_oauth_states_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles_public";
            referencedColumns: ["id"];
          },
        ];
      };
      timeline: {
        Row: {
          created_at: string;
          date_str: string;
          description: string | null;
          drive_url: string | null;
          id: string;
          image_url: string | null;
          tag: string | null;
          title: string;
          year: number;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          date_str: string;
          description?: string | null;
          drive_url?: string | null;
          id?: string;
          image_url?: string | null;
          tag?: string | null;
          title: string;
          year?: number;
        };
        Update: {
          created_at?: string;
          date_str?: string;
          description?: string | null;
          drive_url?: string | null;
          id?: string;
          image_url?: string | null;
          tag?: string | null;
          title?: string;
          year?: number;
        };
        Relationships: [];
      };
      timeline_distance_milestone_overrides: {
        Row: {
          date_str: string | null;
          description: string | null;
          is_hidden: boolean;
          milestone_km: number;
          title: string | null;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          date_str?: string | null;
          description?: string | null;
          is_hidden?: boolean;
          milestone_km: number;
          title?: string | null;
          updated_at?: string;
        };
        Update: {
          date_str?: string | null;
          description?: string | null;
          is_hidden?: boolean;
          milestone_km?: number;
          title?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
      weekly_badges: {
        Row: {
          awarded_date: string;
          badge_title: string;
          category: string | null;
          created_at: string | null;
          id: string;
          km: number | null;
          user_id: string;
          week_start: string | null;
        };
        ComputedFields: never;
        Insert: {
          awarded_date?: string;
          badge_title: string;
          category?: string | null;
          created_at?: string | null;
          id?: string;
          km?: number | null;
          user_id: string;
          week_start?: string | null;
        };
        Update: {
          awarded_date?: string;
          badge_title?: string;
          category?: string | null;
          created_at?: string | null;
          id?: string;
          km?: number | null;
          user_id?: string;
          week_start?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      activities_public: {
        Row: {
          created_at: string;
          elevation_m: number | null;
          group_ride_id: string | null;
          id: string;
          km: number;
          note: string | null;
          ride_date: string;
          status: Database["public"]["Enums"]["activity_status"];
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string | null;
          elevation_m?: number | null;
          group_ride_id?: string | null;
          id?: string | null;
          km?: number | null;
          note?: never;
          ride_date?: string | null;
          status?: Database["public"]["Enums"]["activity_status"] | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          elevation_m?: number | null;
          group_ride_id?: string | null;
          id?: string | null;
          km?: number | null;
          note?: never;
          ride_date?: string | null;
          status?: Database["public"]["Enums"]["activity_status"] | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "activities_group_ride_id_fkey";
            columns: ["group_ride_id"];
            isOneToOne: false;
            referencedRelation: "group_rides";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activities_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activities_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles_public";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles_public: {
        Row: {
          created_at: string;
          full_name: string | null;
          id: string;
          is_admin: boolean;
          patrol_id: string | null;
          quali: string | null;
          scout_year: number | null;
          strava_url: string | null;
          totem: string | null;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string | null;
          full_name?: never;
          id?: string | null;
          is_admin?: boolean | null;
          patrol_id?: string | null;
          quali?: string | null;
          scout_year?: number | null;
          strava_url?: never;
          totem?: string | null;
        };
        Update: {
          created_at?: string | null;
          full_name?: never;
          id?: string | null;
          is_admin?: boolean | null;
          patrol_id?: string | null;
          quali?: string | null;
          scout_year?: number | null;
          strava_url?: never;
          totem?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_patrol_id_fkey";
            columns: ["patrol_id"];
            isOneToOne: false;
            referencedRelation: "patrols";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Functions: {
      activity_sport: { Args: { _note: string }; Returns: string };
      admin_delete_scout_challenge: { Args: { _challenge_id: string }; Returns: undefined };
      admin_set_password: { Args: { _password: string; _user_id: string }; Returns: undefined };
      admin_update_scout_challenge: {
        Args: {
          _challenge_id: string;
          _description: string;
          _exact_distance: boolean;
          _proposed_points: number;
          _route_validation: boolean;
          _sport: string;
          _target_elevation: number;
          _target_km: number;
          _title: string;
        };
        Returns: undefined;
      };
      can_read_scout_challenge: { Args: { _challenge_id: string }; Returns: boolean };
      claim_pending_activity_alert: { Args: { _pending_count: number }; Returns: Json };
      cleanup_check_secret: { Args: { _secret: string }; Returns: boolean };
      cleanup_database: { Args: { _dry?: boolean }; Returns: Json };
      create_scout_challenge: {
        Args: {
          _description: string;
          _exact_distance: boolean;
          _gpx_template_path: string;
          _participant_ids: string[];
          _proposed_points: number;
          _sport: string;
          _target_elevation: number;
          _target_km: number;
          _title: string;
        };
        Returns: string;
      };
      has_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"]; _user_id: string };
        Returns: boolean;
      };
      leaderboard: {
        Args: { _from: string; _to: string };
        Returns: {
          category: Database["public"]["Enums"]["patrol_category"];
          display_name: string;
          km: number;
          patrol_id: string;
          patrol_name: string;
          user_id: string;
        }[];
      };
      mark_corrections_seen: { Args: Record<PropertyKey, never>; Returns: number };
      normalize_strava_url: { Args: { _url: string }; Returns: string };
      owns_proof_object: { Args: { _name: string }; Returns: boolean };
      public_display_name: { Args: { _full_name: string }; Returns: string };
      release_pending_activity_alert: { Args: Record<PropertyKey, never>; Returns: undefined };
      review_scout_challenge_entry: {
        Args: { _approve: boolean; _awarded_points?: number; _participant_id: string };
        Returns: undefined;
      };
      scout_challenge_leaderboard: {
        Args: Record<PropertyKey, never>;
        Returns: {
          challenges_won: number;
          display_name: string;
          patrol_name: string;
          points: number;
          user_id: string;
        }[];
      };
      set_admin_by_email: { Args: { _email: string; _make_admin: boolean }; Returns: undefined };
      staff_birthday_dates: {
        Args: Record<PropertyKey, never>;
        Returns: {
          birth_day: number;
          birth_month: number;
        }[];
      };
      upcoming_birthdays: {
        Args: { _days?: number };
        Returns: {
          birth_day: number;
          birth_month: number;
          days_until: number;
          display_name: string;
          patrol_name: string;
          user_id: string;
        }[];
      };
    };
    Enums: {
      activity_status: "pending" | "approved" | "rejected";
      app_role: "admin" | "user";
      patrol_category: "homme" | "femme" | "staff";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      activity_status: ["pending", "approved", "rejected"],
      app_role: ["admin", "user"],
      patrol_category: ["homme", "femme", "staff"],
    },
  },
} as const;
