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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          body: string
          created_at: string
          created_by: string | null
          emoji: string
          id: string
          is_active: boolean
          priority: number
          title: string
          updated_at: string
        }
        Insert: {
          body?: string
          created_at?: string
          created_by?: string | null
          emoji?: string
          id?: string
          is_active?: boolean
          priority?: number
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string | null
          emoji?: string
          id?: string
          is_active?: boolean
          priority?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          booking_date: string
          created_at: string
          experience_id: string
          guests: number
          id: string
          member_id: string
          notes: string | null
          start_time: string
          status: string
        }
        Insert: {
          booking_date: string
          created_at?: string
          experience_id: string
          guests?: number
          id?: string
          member_id: string
          notes?: string | null
          start_time?: string
          status?: string
        }
        Update: {
          booking_date?: string
          created_at?: string
          experience_id?: string
          guests?: number
          id?: string
          member_id?: string
          notes?: string | null
          start_time?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      check_ins: {
        Row: {
          checked_in_at: string
          checked_in_by: string | null
          id: string
          member_id: string
        }
        Insert: {
          checked_in_at?: string
          checked_in_by?: string | null
          id?: string
          member_id: string
        }
        Update: {
          checked_in_at?: string
          checked_in_by?: string | null
          id?: string
          member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "check_ins_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      event_tickets: {
        Row: {
          checked_in: boolean
          checked_in_at: string | null
          created_at: string
          event_id: string
          id: string
          member_id: string
          quantity: number
          status: string
        }
        Insert: {
          checked_in?: boolean
          checked_in_at?: string | null
          created_at?: string
          event_id: string
          id?: string
          member_id: string
          quantity?: number
          status?: string
        }
        Update: {
          checked_in?: boolean
          checked_in_at?: string | null
          created_at?: string
          event_id?: string
          id?: string
          member_id?: string
          quantity?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_tickets_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          capacity: number
          created_at: string
          created_by: string | null
          description: string
          end_time: string | null
          event_date: string
          id: string
          image_url: string | null
          is_published: boolean
          location: string | null
          price: number
          start_time: string
          title: string
          updated_at: string
        }
        Insert: {
          capacity?: number
          created_at?: string
          created_by?: string | null
          description?: string
          end_time?: string | null
          event_date: string
          id?: string
          image_url?: string | null
          is_published?: boolean
          location?: string | null
          price?: number
          start_time?: string
          title: string
          updated_at?: string
        }
        Update: {
          capacity?: number
          created_at?: string
          created_by?: string | null
          description?: string
          end_time?: string | null
          event_date?: string
          id?: string
          image_url?: string | null
          is_published?: boolean
          location?: string | null
          price?: number
          start_time?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      experiences: {
        Row: {
          capacity: number
          category: string
          created_at: string
          description: string
          duration_minutes: number
          emoji: string
          id: string
          image_url: string | null
          is_active: boolean
          price: number
          title: string
        }
        Insert: {
          capacity?: number
          category?: string
          created_at?: string
          description?: string
          duration_minutes?: number
          emoji?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          price?: number
          title: string
        }
        Update: {
          capacity?: number
          category?: string
          created_at?: string
          description?: string
          duration_minutes?: number
          emoji?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          price?: number
          title?: string
        }
        Relationships: []
      }
      jotform_submissions: {
        Row: {
          address: string | null
          created_at: string
          date_of_birth: string | null
          email: string
          emergency_contact: string
          first_name: string
          id: string
          jotform_submission_id: string | null
          last_name: string
          license_plate: string | null
          matched_member_id: string | null
          membership_tier: string | null
          phone: string
          photo_url: string | null
          pma_agreed: boolean
          pma_agreed_at: string | null
          raw_payload: Json | null
          referral_source: string | null
          waiver_signed: boolean
          waiver_signed_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          date_of_birth?: string | null
          email: string
          emergency_contact?: string
          first_name?: string
          id?: string
          jotform_submission_id?: string | null
          last_name?: string
          license_plate?: string | null
          matched_member_id?: string | null
          membership_tier?: string | null
          phone?: string
          photo_url?: string | null
          pma_agreed?: boolean
          pma_agreed_at?: string | null
          raw_payload?: Json | null
          referral_source?: string | null
          waiver_signed?: boolean
          waiver_signed_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string
          emergency_contact?: string
          first_name?: string
          id?: string
          jotform_submission_id?: string | null
          last_name?: string
          license_plate?: string | null
          matched_member_id?: string | null
          membership_tier?: string | null
          phone?: string
          photo_url?: string | null
          pma_agreed?: boolean
          pma_agreed_at?: string | null
          raw_payload?: Json | null
          referral_source?: string | null
          waiver_signed?: boolean
          waiver_signed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jotform_submissions_matched_member_id_fkey"
            columns: ["matched_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      member_bookings: {
        Row: {
          booking_date: string
          booking_time: string | null
          created_at: string
          guest_names: string[] | null
          id: string
          is_member_pass: boolean | null
          member_id: string
          service_id: string | null
          service_name: string
          simplybook_booking_id: string | null
          status: string
        }
        Insert: {
          booking_date: string
          booking_time?: string | null
          created_at?: string
          guest_names?: string[] | null
          id?: string
          is_member_pass?: boolean | null
          member_id: string
          service_id?: string | null
          service_name: string
          simplybook_booking_id?: string | null
          status?: string
        }
        Update: {
          booking_date?: string
          booking_time?: string | null
          created_at?: string
          guest_names?: string[] | null
          id?: string
          is_member_pass?: boolean | null
          member_id?: string
          service_id?: string | null
          service_name?: string
          simplybook_booking_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_bookings_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          authnet_customer_profile_id: string | null
          authnet_payment_profile_id: string | null
          created_at: string
          email: string
          emergency_contact: string
          first_name: string
          id: string
          last_name: string
          license_plate: string | null
          membership_end: string
          membership_start: string
          membership_tier: string
          phone: string
          photo_url: string | null
          pma_agreed: boolean
          pma_agreed_at: string | null
          saved_card_last4: string | null
          simplybook_client_id: string | null
          source: string
          subscription_active: boolean | null
          subscription_end: string | null
          subscription_start: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string
          welcome_credits_issued: boolean
          welcome_pass_redeemed: boolean
        }
        Insert: {
          authnet_customer_profile_id?: string | null
          authnet_payment_profile_id?: string | null
          created_at?: string
          email: string
          emergency_contact?: string
          first_name: string
          id?: string
          last_name: string
          license_plate?: string | null
          membership_end?: string
          membership_start?: string
          membership_tier?: string
          phone: string
          photo_url?: string | null
          pma_agreed?: boolean
          pma_agreed_at?: string | null
          saved_card_last4?: string | null
          simplybook_client_id?: string | null
          source?: string
          subscription_active?: boolean | null
          subscription_end?: string | null
          subscription_start?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id: string
          welcome_credits_issued?: boolean
          welcome_pass_redeemed?: boolean
        }
        Update: {
          authnet_customer_profile_id?: string | null
          authnet_payment_profile_id?: string | null
          created_at?: string
          email?: string
          emergency_contact?: string
          first_name?: string
          id?: string
          last_name?: string
          license_plate?: string | null
          membership_end?: string
          membership_start?: string
          membership_tier?: string
          phone?: string
          photo_url?: string | null
          pma_agreed?: boolean
          pma_agreed_at?: string | null
          saved_card_last4?: string | null
          simplybook_client_id?: string | null
          source?: string
          subscription_active?: boolean | null
          subscription_end?: string | null
          subscription_start?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string
          welcome_credits_issued?: boolean
          welcome_pass_redeemed?: boolean
        }
        Relationships: []
      }
      site_bookings: {
        Row: {
          check_in: string
          check_out: string
          created_at: string
          guest_name: string
          ical_summary: string | null
          ical_uid: string
          id: string
          platform: string
          site_name: string
          updated_at: string
        }
        Insert: {
          check_in: string
          check_out: string
          created_at?: string
          guest_name?: string
          ical_summary?: string | null
          ical_uid: string
          id?: string
          platform?: string
          site_name: string
          updated_at?: string
        }
        Update: {
          check_in?: string
          check_out?: string
          created_at?: string
          guest_name?: string
          ical_summary?: string | null
          ical_uid?: string
          id?: string
          platform?: string
          site_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      jotform_email_exists: { Args: { _email: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
