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
      attachments: {
        Row: {
          cours_id: string | null
          created_at: string | null
          devoir_id: string | null
          id: string
          message_id: string | null
          mime_type: string
          name: string
          rendu_id: string | null
          size: number
          uploaded_by: string | null
          url: string
        }
        Insert: {
          cours_id?: string | null
          created_at?: string | null
          devoir_id?: string | null
          id?: string
          message_id?: string | null
          mime_type: string
          name: string
          rendu_id?: string | null
          size: number
          uploaded_by?: string | null
          url: string
        }
        Update: {
          cours_id?: string | null
          created_at?: string | null
          devoir_id?: string | null
          id?: string
          message_id?: string | null
          mime_type?: string
          name?: string
          rendu_id?: string | null
          size?: number
          uploaded_by?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "attachments_cours_id_fkey"
            columns: ["cours_id"]
            isOneToOne: false
            referencedRelation: "cours"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_devoir_id_fkey"
            columns: ["devoir_id"]
            isOneToOne: false
            referencedRelation: "devoirs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_rendu_id_fkey"
            columns: ["rendu_id"]
            isOneToOne: false
            referencedRelation: "rendus_devoir"
            referencedColumns: ["id"]
          },
        ]
      }
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
      cours: {
        Row: {
          contenu_json: Json | null
          created_at: string | null
          description: string | null
          enseignant_id: string
          etablissement_id: string
          id: string
          matiere_id: string
          objectifs: string[] | null
          prerequis: string[] | null
          statut: string | null
          titre: string
          updated_at: string | null
          visio_url: string | null
        }
        Insert: {
          contenu_json?: Json | null
          created_at?: string | null
          description?: string | null
          enseignant_id: string
          etablissement_id: string
          id?: string
          matiere_id: string
          objectifs?: string[] | null
          prerequis?: string[] | null
          statut?: string | null
          titre: string
          updated_at?: string | null
          visio_url?: string | null
        }
        Update: {
          contenu_json?: Json | null
          created_at?: string | null
          description?: string | null
          enseignant_id?: string
          etablissement_id?: string
          id?: string
          matiere_id?: string
          objectifs?: string[] | null
          prerequis?: string[] | null
          statut?: string | null
          titre?: string
          updated_at?: string | null
          visio_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cours_etablissement_id_fkey"
            columns: ["etablissement_id"]
            isOneToOne: false
            referencedRelation: "etablissements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cours_matiere_id_fkey"
            columns: ["matiere_id"]
            isOneToOne: false
            referencedRelation: "matieres"
            referencedColumns: ["id"]
          },
        ]
      }
      cours_classes: {
        Row: {
          classe_id: string
          cours_id: string
          created_at: string | null
          id: string
        }
        Insert: {
          classe_id: string
          cours_id: string
          created_at?: string | null
          id?: string
        }
        Update: {
          classe_id?: string
          cours_id?: string
          created_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cours_classes_classe_id_fkey"
            columns: ["classe_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cours_classes_cours_id_fkey"
            columns: ["cours_id"]
            isOneToOne: false
            referencedRelation: "cours"
            referencedColumns: ["id"]
          },
        ]
      }
      devoirs: {
        Row: {
          actif: boolean | null
          consignes: string
          cours_id: string
          created_at: string | null
          deadline: string
          etablissement_id: string
          id: string
          note_sur: number | null
          titre: string
          updated_at: string | null
        }
        Insert: {
          actif?: boolean | null
          consignes: string
          cours_id: string
          created_at?: string | null
          deadline: string
          etablissement_id: string
          id?: string
          note_sur?: number | null
          titre: string
          updated_at?: string | null
        }
        Update: {
          actif?: boolean | null
          consignes?: string
          cours_id?: string
          created_at?: string | null
          deadline?: string
          etablissement_id?: string
          id?: string
          note_sur?: number | null
          titre?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "devoirs_cours_id_fkey"
            columns: ["cours_id"]
            isOneToOne: false
            referencedRelation: "cours"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devoirs_etablissement_id_fkey"
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
      messages: {
        Row: {
          author_id: string | null
          contenu: string
          created_at: string | null
          id: string
          thread_id: string
          updated_at: string | null
        }
        Insert: {
          author_id?: string | null
          contenu: string
          created_at?: string | null
          id?: string
          thread_id: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string | null
          contenu?: string
          created_at?: string | null
          id?: string
          thread_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "threads"
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
      qcms: {
        Row: {
          affichage_feedback: string | null
          cours_id: string | null
          created_at: string | null
          cree_par_id: string
          description: string | null
          duree_minutes: number | null
          etablissement_id: string
          id: string
          melanger_options: boolean | null
          melanger_questions: boolean | null
          note_minimale: number | null
          statut: string | null
          tags: string[] | null
          tentatives_max: number | null
          titre: string
          updated_at: string | null
        }
        Insert: {
          affichage_feedback?: string | null
          cours_id?: string | null
          created_at?: string | null
          cree_par_id: string
          description?: string | null
          duree_minutes?: number | null
          etablissement_id: string
          id?: string
          melanger_options?: boolean | null
          melanger_questions?: boolean | null
          note_minimale?: number | null
          statut?: string | null
          tags?: string[] | null
          tentatives_max?: number | null
          titre: string
          updated_at?: string | null
        }
        Update: {
          affichage_feedback?: string | null
          cours_id?: string | null
          created_at?: string | null
          cree_par_id?: string
          description?: string | null
          duree_minutes?: number | null
          etablissement_id?: string
          id?: string
          melanger_options?: boolean | null
          melanger_questions?: boolean | null
          note_minimale?: number | null
          statut?: string | null
          tags?: string[] | null
          tentatives_max?: number | null
          titre?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qcms_cours_id_fkey"
            columns: ["cours_id"]
            isOneToOne: false
            referencedRelation: "cours"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qcms_etablissement_id_fkey"
            columns: ["etablissement_id"]
            isOneToOne: false
            referencedRelation: "etablissements"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          answer_index: number
          created_at: string | null
          feedback: string | null
          id: string
          options: Json
          ordre: number
          points: number | null
          qcm_id: string
          question: string
        }
        Insert: {
          answer_index: number
          created_at?: string | null
          feedback?: string | null
          id?: string
          options: Json
          ordre: number
          points?: number | null
          qcm_id: string
          question: string
        }
        Update: {
          answer_index?: number
          created_at?: string | null
          feedback?: string | null
          id?: string
          options?: Json
          ordre?: number
          points?: number | null
          qcm_id?: string
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_qcm_id_fkey"
            columns: ["qcm_id"]
            isOneToOne: false
            referencedRelation: "qcms"
            referencedColumns: ["id"]
          },
        ]
      }
      rendus_devoir: {
        Row: {
          commentaire_prof: string | null
          created_at: string | null
          devoir_id: string
          eleve_id: string
          id: string
          note: number | null
          note_at: string | null
          rendu_at: string | null
          statut: string | null
          texte: string | null
          updated_at: string | null
        }
        Insert: {
          commentaire_prof?: string | null
          created_at?: string | null
          devoir_id: string
          eleve_id: string
          id?: string
          note?: number | null
          note_at?: string | null
          rendu_at?: string | null
          statut?: string | null
          texte?: string | null
          updated_at?: string | null
        }
        Update: {
          commentaire_prof?: string | null
          created_at?: string | null
          devoir_id?: string
          eleve_id?: string
          id?: string
          note?: number | null
          note_at?: string | null
          rendu_at?: string | null
          statut?: string | null
          texte?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rendus_devoir_devoir_id_fkey"
            columns: ["devoir_id"]
            isOneToOne: false
            referencedRelation: "devoirs"
            referencedColumns: ["id"]
          },
        ]
      }
      tentatives_qcm: {
        Row: {
          duree_secondes: number | null
          eleve_id: string
          id: string
          qcm_id: string
          reponses: Json
          score: number
          started_at: string | null
          submitted_at: string | null
        }
        Insert: {
          duree_secondes?: number | null
          eleve_id: string
          id?: string
          qcm_id: string
          reponses: Json
          score: number
          started_at?: string | null
          submitted_at?: string | null
        }
        Update: {
          duree_secondes?: number | null
          eleve_id?: string
          id?: string
          qcm_id?: string
          reponses?: Json
          score?: number
          started_at?: string | null
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tentatives_qcm_qcm_id_fkey"
            columns: ["qcm_id"]
            isOneToOne: false
            referencedRelation: "qcms"
            referencedColumns: ["id"]
          },
        ]
      }
      threads: {
        Row: {
          cours_id: string | null
          created_at: string | null
          etablissement_id: string
          id: string
          participants: string[] | null
          titre: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          cours_id?: string | null
          created_at?: string | null
          etablissement_id: string
          id?: string
          participants?: string[] | null
          titre?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          cours_id?: string | null
          created_at?: string | null
          etablissement_id?: string
          id?: string
          participants?: string[] | null
          titre?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "threads_cours_id_fkey"
            columns: ["cours_id"]
            isOneToOne: false
            referencedRelation: "cours"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "threads_etablissement_id_fkey"
            columns: ["etablissement_id"]
            isOneToOne: false
            referencedRelation: "etablissements"
            referencedColumns: ["id"]
          },
        ]
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
      update_user_etablissement: {
        Args: { _etablissement_id: string; _user_id: string }
        Returns: undefined
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
