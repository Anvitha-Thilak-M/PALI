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
      appointments: {
        Row: {
          caregiver_id: string | null
          created_at: string
          date: string
          doctor_id: string
          id: string
          notes: string | null
          patient_id: string
          status: string
          time_slot: string
          updated_at: string
        }
        Insert: {
          caregiver_id?: string | null
          created_at?: string
          date: string
          doctor_id: string
          id?: string
          notes?: string | null
          patient_id: string
          status?: string
          time_slot: string
          updated_at?: string
        }
        Update: {
          caregiver_id?: string | null
          created_at?: string
          date?: string
          doctor_id?: string
          id?: string
          notes?: string | null
          patient_id?: string
          status?: string
          time_slot?: string
          updated_at?: string
        }
        Relationships: []
      }
      caregiver_availability: {
        Row: {
          available_slots: string[]
          booked_slots: string[]
          caregiver_id: string
          created_at: string
          date: string
          id: string
          updated_at: string
        }
        Insert: {
          available_slots?: string[]
          booked_slots?: string[]
          caregiver_id: string
          created_at?: string
          date: string
          id?: string
          updated_at?: string
        }
        Update: {
          available_slots?: string[]
          booked_slots?: string[]
          caregiver_id?: string
          created_at?: string
          date?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      doctor_availability: {
        Row: {
          available_slots: string[]
          booked_slots: string[]
          created_at: string
          date: string
          doctor_id: string
          id: string
          updated_at: string
        }
        Insert: {
          available_slots?: string[]
          booked_slots?: string[]
          created_at?: string
          date: string
          doctor_id: string
          id?: string
          updated_at?: string
        }
        Update: {
          available_slots?: string[]
          booked_slots?: string[]
          created_at?: string
          date?: string
          doctor_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      medical_records: {
        Row: {
          created_at: string
          diagnosis: string | null
          id: string
          last_updated: string
          medicines: string | null
          patient_id: string
          treatment: string | null
        }
        Insert: {
          created_at?: string
          diagnosis?: string | null
          id?: string
          last_updated?: string
          medicines?: string | null
          patient_id: string
          treatment?: string | null
        }
        Update: {
          created_at?: string
          diagnosis?: string | null
          id?: string
          last_updated?: string
          medicines?: string | null
          patient_id?: string
          treatment?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          age: number | null
          assigned_caregiver_id: string | null
          assigned_doctor_id: string | null
          avatar_url: string | null
          blood_group: string | null
          bystander_name: string | null
          bystander_phone: string | null
          bystander_relation: string | null
          created_at: string
          date_of_birth: string | null
          department: string | null
          diagnosed_year: number | null
          disease: string | null
          email: string
          emergency_contact: string | null
          gender: string | null
          id: string
          name: string
          phone: string | null
          specialization: string | null
          treatment_status: string | null
          updated_at: string
          username: string
          years_of_treatment: number | null
        }
        Insert: {
          address?: string | null
          age?: number | null
          assigned_caregiver_id?: string | null
          assigned_doctor_id?: string | null
          avatar_url?: string | null
          blood_group?: string | null
          bystander_name?: string | null
          bystander_phone?: string | null
          bystander_relation?: string | null
          created_at?: string
          date_of_birth?: string | null
          department?: string | null
          diagnosed_year?: number | null
          disease?: string | null
          email: string
          emergency_contact?: string | null
          gender?: string | null
          id: string
          name: string
          phone?: string | null
          specialization?: string | null
          treatment_status?: string | null
          updated_at?: string
          username: string
          years_of_treatment?: number | null
        }
        Update: {
          address?: string | null
          age?: number | null
          assigned_caregiver_id?: string | null
          assigned_doctor_id?: string | null
          avatar_url?: string | null
          blood_group?: string | null
          bystander_name?: string | null
          bystander_phone?: string | null
          bystander_relation?: string | null
          created_at?: string
          date_of_birth?: string | null
          department?: string | null
          diagnosed_year?: number | null
          disease?: string | null
          email?: string
          emergency_contact?: string | null
          gender?: string | null
          id?: string
          name?: string
          phone?: string | null
          specialization?: string | null
          treatment_status?: string | null
          updated_at?: string
          username?: string
          years_of_treatment?: number | null
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
      book_slot: {
        Args: {
          _date: string
          _provider_id: string
          _slot: string
          _table_name: string
        }
        Returns: undefined
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "doctor" | "patient" | "caregiver"
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
      app_role: ["admin", "doctor", "patient", "caregiver"],
    },
  },
} as const
