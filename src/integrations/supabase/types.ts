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
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      classes: {
        Row: {
          actif: boolean | null
          annee_scolaire: string
          capacite_max: number | null
          created_at: string | null
          etablissement_id: string
          id: string
          niveau: string
          nom: string
          updated_at: string | null
        }
        Insert: {
          actif?: boolean | null
          annee_scolaire?: string
          capacite_max?: number | null
          created_at?: string | null
          etablissement_id: string
          id?: string
          niveau: string
          nom: string
          updated_at?: string | null
        }
        Update: {
          actif?: boolean | null
          annee_scolaire?: string
          capacite_max?: number | null
          created_at?: string | null
          etablissement_id?: string
          id?: string
          niveau?: string
          nom?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classes_etablissement_id_fkey"
            columns: ["etablissement_id"]
            isOneToOne: false
            referencedRelation: "etablissements"
            referencedColumns: ["id"]
          },
        ]
      }
      eleve_classes: {
        Row: {
          actif: boolean | null
          annee_scolaire: string
          classe_id: string
          date_inscription: string | null
          id: string
          user_id: string
        }
        Insert: {
          actif?: boolean | null
          annee_scolaire?: string
          classe_id: string
          date_inscription?: string | null
          id?: string
          user_id: string
        }
        Update: {
          actif?: boolean | null
          annee_scolaire?: string
          classe_id?: string
          date_inscription?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "eleve_classes_classe_id_fkey"
            columns: ["classe_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      enseignant_matieres: {
        Row: {
          annee_scolaire: string
          classe_id: string | null
          created_at: string | null
          id: string
          matiere_id: string
          principal: boolean | null
          user_id: string
        }
        Insert: {
          annee_scolaire?: string
          classe_id?: string | null
          created_at?: string | null
          id?: string
          matiere_id: string
          principal?: boolean | null
          user_id: string
        }
        Update: {
          annee_scolaire?: string
          classe_id?: string | null
          created_at?: string | null
          id?: string
          matiere_id?: string
          principal?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enseignant_matieres_classe_id_fkey"
            columns: ["classe_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enseignant_matieres_matiere_id_fkey"
            columns: ["matiere_id"]
            isOneToOne: false
            referencedRelation: "matieres"
            referencedColumns: ["id"]
          },
        ]
      }
      etablissements: {
        Row: {
          actif: boolean | null
          adresse: string | null
          code: string | null
          created_at: string
          email: string | null
          id: string
          logo_url: string | null
          niveaux: string[] | null
          nom: string
          params: Json | null
          telephone: string | null
          updated_at: string
        }
        Insert: {
          actif?: boolean | null
          adresse?: string | null
          code?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          niveaux?: string[] | null
          nom: string
          params?: Json | null
          telephone?: string | null
          updated_at?: string
        }
        Update: {
          actif?: boolean | null
          adresse?: string | null
          code?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          niveaux?: string[] | null
          nom?: string
          params?: Json | null
          telephone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      matieres: {
        Row: {
          actif: boolean | null
          code: string | null
          coefficient: number | null
          couleur: string | null
          created_at: string | null
          etablissement_id: string
          id: string
          niveau: string
          nom: string
          updated_at: string | null
        }
        Insert: {
          actif?: boolean | null
          code?: string | null
          coefficient?: number | null
          couleur?: string | null
          created_at?: string | null
          etablissement_id: string
          id?: string
          niveau: string
          nom: string
          updated_at?: string | null
        }
        Update: {
          actif?: boolean | null
          code?: string | null
          coefficient?: number | null
          couleur?: string | null
          created_at?: string | null
          etablissement_id?: string
          id?: string
          niveau?: string
          nom?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matieres_etablissement_id_fkey"
            columns: ["etablissement_id"]
            isOneToOne: false
            referencedRelation: "etablissements"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_eleves: {
        Row: {
          contact_prioritaire: boolean | null
          created_at: string | null
          eleve_id: string
          id: string
          lien_parente: string
          parent_id: string
        }
        Insert: {
          contact_prioritaire?: boolean | null
          created_at?: string | null
          eleve_id: string
          id?: string
          lien_parente: string
          parent_id: string
        }
        Update: {
          contact_prioritaire?: boolean | null
          created_at?: string | null
          eleve_id?: string
          id?: string
          lien_parente?: string
          parent_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          date_naissance: string | null
          first_name: string
          id: string
          last_name: string
          onboarding_completed: boolean | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          date_naissance?: string | null
          first_name: string
          id: string
          last_name: string
          onboarding_completed?: boolean | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          date_naissance?: string | null
          first_name?: string
          id?: string
          last_name?: string
          onboarding_completed?: boolean | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          etablissement_id: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          etablissement_id?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          etablissement_id?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_etablissement_id_fkey"
            columns: ["etablissement_id"]
            isOneToOne: false
            referencedRelation: "etablissements"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_roles: {
        Args: { _user_id: string }
        Returns: {
          etablissement_id: string
          role: Database["public"]["Enums"]["app_role"]
        }[]
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
      app_role:
        | "ELEVE"
        | "ENSEIGNANT"
        | "PARENT"
        | "ADMIN_ECOLE"
        | "ADMIN_SYSTEME"
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
      app_role: [
        "ELEVE",
        "ENSEIGNANT",
        "PARENT",
        "ADMIN_ECOLE",
        "ADMIN_SYSTEME",
      ],
    },
  },
} as const
