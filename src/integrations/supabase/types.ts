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
      analytics_events: {
        Row: {
          created_at: string | null
          id: string
          name: string
          props: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          props?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          props?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
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
      attendance: {
        Row: {
          created_at: string | null
          date: string
          decision: string | null
          declared_by: string | null
          etablissement_id: string
          id: string
          justification_url: string | null
          reason: string | null
          status: string
          student_id: string
          updated_at: string | null
          validated: boolean | null
          validated_by: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          decision?: string | null
          declared_by?: string | null
          etablissement_id: string
          id?: string
          justification_url?: string | null
          reason?: string | null
          status: string
          student_id: string
          updated_at?: string | null
          validated?: boolean | null
          validated_by?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          decision?: string | null
          declared_by?: string | null
          etablissement_id?: string
          id?: string
          justification_url?: string | null
          reason?: string | null
          status?: string
          student_id?: string
          updated_at?: string | null
          validated?: boolean | null
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_etablissement_id_fkey"
            columns: ["etablissement_id"]
            isOneToOne: false
            referencedRelation: "etablissements"
            referencedColumns: ["id"]
          },
        ]
      }
      audio_jobs: {
        Row: {
          audio_url: string | null
          created_at: string | null
          error_message: string | null
          id: string
          rate: number | null
          resource_id: string
          section_id: string | null
          status: string
          updated_at: string | null
          voice: string | null
        }
        Insert: {
          audio_url?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          rate?: number | null
          resource_id: string
          section_id?: string | null
          status?: string
          updated_at?: string | null
          voice?: string | null
        }
        Update: {
          audio_url?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          rate?: number | null
          resource_id?: string
          section_id?: string | null
          status?: string
          updated_at?: string | null
          voice?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audio_jobs_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audio_jobs_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "resource_sections"
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
      etab_settings: {
        Row: {
          created_at: string
          description: string | null
          etablissement_id: string
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          etablissement_id: string
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          etablissement_id?: string
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "etab_settings_etablissement_id_fkey"
            columns: ["etablissement_id"]
            isOneToOne: false
            referencedRelation: "etablissements"
            referencedColumns: ["id"]
          },
        ]
      }
      etablissements: {
        Row: {
          actif: boolean | null
          adresse: string | null
          code: string | null
          contact: Json | null
          created_at: string
          email: string | null
          id: string
          logo_url: string | null
          niveaux: string[] | null
          nom: string
          params: Json | null
          telephone: string | null
          updated_at: string
          ville: string | null
        }
        Insert: {
          actif?: boolean | null
          adresse?: string | null
          code?: string | null
          contact?: Json | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          niveaux?: string[] | null
          nom: string
          params?: Json | null
          telephone?: string | null
          updated_at?: string
          ville?: string | null
        }
        Update: {
          actif?: boolean | null
          adresse?: string | null
          code?: string | null
          contact?: Json | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          niveaux?: string[] | null
          nom?: string
          params?: Json | null
          telephone?: string | null
          updated_at?: string
          ville?: string | null
        }
        Relationships: []
      }
      generated_qcms: {
        Row: {
          created_at: string
          grade: string | null
          id: string
          items: Json
          session_id: string | null
          subject: string
          theme: string
          user_id: string
        }
        Insert: {
          created_at?: string
          grade?: string | null
          id?: string
          items: Json
          session_id?: string | null
          subject: string
          theme: string
          user_id: string
        }
        Update: {
          created_at?: string
          grade?: string | null
          id?: string
          items?: Json
          session_id?: string | null
          subject?: string
          theme?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_qcms_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "tutor_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      grades: {
        Row: {
          coefficient: number | null
          comment: string | null
          created_at: string | null
          etablissement_id: string
          id: string
          matiere_id: string
          period: string
          score: number
          student_id: string
          teacher_id: string
          updated_at: string | null
          validated: boolean | null
        }
        Insert: {
          coefficient?: number | null
          comment?: string | null
          created_at?: string | null
          etablissement_id: string
          id?: string
          matiere_id: string
          period: string
          score: number
          student_id: string
          teacher_id: string
          updated_at?: string | null
          validated?: boolean | null
        }
        Update: {
          coefficient?: number | null
          comment?: string | null
          created_at?: string | null
          etablissement_id?: string
          id?: string
          matiere_id?: string
          period?: string
          score?: number
          student_id?: string
          teacher_id?: string
          updated_at?: string | null
          validated?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "grades_etablissement_id_fkey"
            columns: ["etablissement_id"]
            isOneToOne: false
            referencedRelation: "etablissements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_matiere_id_fkey"
            columns: ["matiere_id"]
            isOneToOne: false
            referencedRelation: "matieres"
            referencedColumns: ["id"]
          },
        ]
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
          read_by: string[] | null
          thread_id: string
          updated_at: string | null
        }
        Insert: {
          author_id?: string | null
          contenu: string
          created_at?: string | null
          id?: string
          read_by?: string[] | null
          thread_id: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string | null
          contenu?: string
          created_at?: string | null
          id?: string
          read_by?: string[] | null
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
          graded_at: string | null
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
          graded_at?: string | null
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
          graded_at?: string | null
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
      report_cards: {
        Row: {
          average: number | null
          created_at: string | null
          etablissement_id: string
          id: string
          pdf_url: string | null
          period: string
          rank: number | null
          remarks: string | null
          student_id: string
          total_students: number | null
          updated_at: string | null
        }
        Insert: {
          average?: number | null
          created_at?: string | null
          etablissement_id: string
          id?: string
          pdf_url?: string | null
          period: string
          rank?: number | null
          remarks?: string | null
          student_id: string
          total_students?: number | null
          updated_at?: string | null
        }
        Update: {
          average?: number | null
          created_at?: string | null
          etablissement_id?: string
          id?: string
          pdf_url?: string | null
          period?: string
          rank?: number | null
          remarks?: string | null
          student_id?: string
          total_students?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "report_cards_etablissement_id_fkey"
            columns: ["etablissement_id"]
            isOneToOne: false
            referencedRelation: "etablissements"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_assets: {
        Row: {
          bytes: number | null
          checksum: string | null
          created_at: string | null
          id: string
          kind: string
          mime: string | null
          resource_id: string
          url: string
        }
        Insert: {
          bytes?: number | null
          checksum?: string | null
          created_at?: string | null
          id?: string
          kind: string
          mime?: string | null
          resource_id: string
          url: string
        }
        Update: {
          bytes?: number | null
          checksum?: string | null
          created_at?: string | null
          id?: string
          kind?: string
          mime?: string | null
          resource_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_assets_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_embeddings: {
        Row: {
          created_at: string | null
          embedding: string | null
          id: string
          resource_id: string
          section_id: string | null
          text_excerpt: string | null
        }
        Insert: {
          created_at?: string | null
          embedding?: string | null
          id?: string
          resource_id: string
          section_id?: string | null
          text_excerpt?: string | null
        }
        Update: {
          created_at?: string | null
          embedding?: string | null
          id?: string
          resource_id?: string
          section_id?: string | null
          text_excerpt?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resource_embeddings_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_embeddings_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "resource_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_sections: {
        Row: {
          created_at: string | null
          end_locator: string | null
          id: string
          index: number
          resource_id: string
          start_locator: string | null
          text_content: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          end_locator?: string | null
          id?: string
          index: number
          resource_id: string
          start_locator?: string | null
          text_content?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          end_locator?: string | null
          id?: string
          index?: number
          resource_id?: string
          start_locator?: string | null
          text_content?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_sections_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          audio_available: boolean | null
          author: string
          cover_url: string | null
          created_at: string | null
          etablissement_id: string | null
          file_type: string | null
          file_url: string | null
          id: string
          is_public: boolean | null
          language: string
          level: string
          subject: string
          summary: string | null
          tags: string[] | null
          title: string
          type: string
          updated_at: string | null
          views_count: number | null
        }
        Insert: {
          audio_available?: boolean | null
          author: string
          cover_url?: string | null
          created_at?: string | null
          etablissement_id?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_public?: boolean | null
          language?: string
          level: string
          subject: string
          summary?: string | null
          tags?: string[] | null
          title: string
          type: string
          updated_at?: string | null
          views_count?: number | null
        }
        Update: {
          audio_available?: boolean | null
          author?: string
          cover_url?: string | null
          created_at?: string | null
          etablissement_id?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_public?: boolean | null
          language?: string
          level?: string
          subject?: string
          summary?: string | null
          tags?: string[] | null
          title?: string
          type?: string
          updated_at?: string | null
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "resources_etablissement_id_fkey"
            columns: ["etablissement_id"]
            isOneToOne: false
            referencedRelation: "etablissements"
            referencedColumns: ["id"]
          },
        ]
      }
      revision_plans: {
        Row: {
          completed_days: number | null
          created_at: string
          end_date: string
          grade: string
          id: string
          plan: Json
          start_date: string
          subject: string
          target: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_days?: number | null
          created_at?: string
          end_date: string
          grade: string
          id?: string
          plan: Json
          start_date: string
          subject: string
          target?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_days?: number | null
          created_at?: string
          end_date?: string
          grade?: string
          id?: string
          plan?: Json
          start_date?: string
          subject?: string
          target?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      schedule: {
        Row: {
          classe_id: string
          created_at: string | null
          day: string
          end_time: string
          etablissement_id: string
          id: string
          matiere_id: string
          room: string | null
          start_time: string
          teacher_id: string | null
          updated_at: string | null
          week_type: string | null
        }
        Insert: {
          classe_id: string
          created_at?: string | null
          day: string
          end_time: string
          etablissement_id: string
          id?: string
          matiere_id: string
          room?: string | null
          start_time: string
          teacher_id?: string | null
          updated_at?: string | null
          week_type?: string | null
        }
        Update: {
          classe_id?: string
          created_at?: string | null
          day?: string
          end_time?: string
          etablissement_id?: string
          id?: string
          matiere_id?: string
          room?: string | null
          start_time?: string
          teacher_id?: string | null
          updated_at?: string | null
          week_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schedule_classe_id_fkey"
            columns: ["classe_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_etablissement_id_fkey"
            columns: ["etablissement_id"]
            isOneToOne: false
            referencedRelation: "etablissements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_matiere_id_fkey"
            columns: ["matiere_id"]
            isOneToOne: false
            referencedRelation: "matieres"
            referencedColumns: ["id"]
          },
        ]
      }
      search_logs: {
        Row: {
          clicked_resource_id: string | null
          created_at: string | null
          filters: Json | null
          id: string
          query: string
          user_id: string | null
        }
        Insert: {
          clicked_resource_id?: string | null
          created_at?: string | null
          filters?: Json | null
          id?: string
          query: string
          user_id?: string | null
        }
        Update: {
          clicked_resource_id?: string | null
          created_at?: string | null
          filters?: Json | null
          id?: string
          query?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "search_logs_clicked_resource_id_fkey"
            columns: ["clicked_resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      skill_progress: {
        Row: {
          attempts: number | null
          created_at: string
          id: string
          last_practiced_at: string | null
          mastery_level: number | null
          skill_code: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attempts?: number | null
          created_at?: string
          id?: string
          last_practiced_at?: string | null
          mastery_level?: number | null
          skill_code: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attempts?: number | null
          created_at?: string
          id?: string
          last_practiced_at?: string | null
          mastery_level?: number | null
          skill_code?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      tutor_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          metadata: Json | null
          mode: string | null
          role: string
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          metadata?: Json | null
          mode?: string | null
          role: string
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          mode?: string | null
          role?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tutor_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "tutor_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      tutor_sessions: {
        Row: {
          created_at: string
          id: string
          language: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          language?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          language?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_highlights: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          locator: string
          note: string | null
          resource_id: string
          text: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          locator: string
          note?: string | null
          resource_id: string
          text?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          locator?: string
          note?: string | null
          resource_id?: string
          text?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_highlights_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      user_reading: {
        Row: {
          id: string
          last_locator: string | null
          progress_percent: number | null
          resource_id: string
          seconds_read: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          last_locator?: string | null
          progress_percent?: number | null
          resource_id: string
          seconds_read?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          last_locator?: string | null
          progress_percent?: number | null
          resource_id?: string
          seconds_read?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_reading_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
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
      user_shelves: {
        Row: {
          created_at: string | null
          id: string
          resource_id: string
          shelf: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          resource_id: string
          shelf: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          resource_id?: string
          shelf?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_shelves_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      parents_view: {
        Row: {
          avatar_url: string | null
          children_count: number | null
          children_ids: string[] | null
          etablissement_id: string | null
          etablissement_nom: string | null
          first_name: string | null
          id: string | null
          last_name: string | null
          phone: string | null
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
      students_view: {
        Row: {
          annee_scolaire: string | null
          avatar_url: string | null
          classe_id: string | null
          classe_niveau: string | null
          classe_nom: string | null
          date_naissance: string | null
          etablissement_id: string | null
          first_name: string | null
          id: string | null
          last_name: string | null
          matricule: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classes_etablissement_id_fkey"
            columns: ["etablissement_id"]
            isOneToOne: false
            referencedRelation: "etablissements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eleve_classes_classe_id_fkey"
            columns: ["classe_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers_view: {
        Row: {
          avatar_url: string | null
          classes: string[] | null
          etablissement_id: string | null
          etablissement_nom: string | null
          first_name: string | null
          id: string | null
          last_name: string | null
          matieres: string[] | null
          phone: string | null
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
    Functions: {
      calculate_attendance_rate: {
        Args: { p_end_date: string; p_start_date: string; p_student_id: string }
        Returns: number
      }
      calculate_class_average: {
        Args: { p_classe_id: string; p_matiere_id: string; p_period: string }
        Returns: number
      }
      get_admin_etablissement: { Args: { _user_id: string }; Returns: string }
      get_parent_children: {
        Args: { p_parent_id: string }
        Returns: {
          classe_id: string
          classe_nom: string
          eleve_id: string
          first_name: string
          last_name: string
          relation: string
        }[]
      }
      get_student_average: {
        Args: { p_period: string; p_student_id: string }
        Returns: number
      }
      get_teacher_classes: {
        Args: { p_teacher_id: string }
        Returns: {
          classe_id: string
          classe_nom: string
          matiere_id: string
          matiere_nom: string
        }[]
      }
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
      is_parent_of_student: {
        Args: { p_parent_id: string; p_student_id: string }
        Returns: boolean
      }
      lock_grading_period: {
        Args: { _etablissement_id: string; _period: string }
        Returns: undefined
      }
      resources_search_text: {
        Args: { r: Database["public"]["Tables"]["resources"]["Row"] }
        Returns: unknown
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
