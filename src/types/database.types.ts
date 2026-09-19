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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      adendas: {
        Row: {
          atencion_id: string
          contenido: string
          created_at: string
          created_by: string
          id: string
        }
        Insert: {
          atencion_id: string
          contenido: string
          created_at?: string
          created_by?: string
          id?: string
        }
        Update: {
          atencion_id?: string
          contenido?: string
          created_at?: string
          created_by?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "adendas_atencion_id_fkey"
            columns: ["atencion_id"]
            isOneToOne: false
            referencedRelation: "atenciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adendas_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      atenciones: {
        Row: {
          anamnesis: string | null
          cie10: string[]
          cita_id: string | null
          created_at: string
          diagnostico: string | null
          estado: Database["public"]["Enums"]["estado_atencion"]
          examen_fisico: string | null
          fecha: string
          firmada_at: string | null
          firmada_por: string | null
          id: string
          indicaciones: string | null
          motivo_consulta: string
          paciente_id: string
          plan_tratamiento: string | null
          profesional_id: string
          servicio_id: string | null
          updated_at: string
        }
        Insert: {
          anamnesis?: string | null
          cie10?: string[]
          cita_id?: string | null
          created_at?: string
          diagnostico?: string | null
          estado?: Database["public"]["Enums"]["estado_atencion"]
          examen_fisico?: string | null
          fecha?: string
          firmada_at?: string | null
          firmada_por?: string | null
          id?: string
          indicaciones?: string | null
          motivo_consulta: string
          paciente_id: string
          plan_tratamiento?: string | null
          profesional_id?: string
          servicio_id?: string | null
          updated_at?: string
        }
        Update: {
          anamnesis?: string | null
          cie10?: string[]
          cita_id?: string | null
          created_at?: string
          diagnostico?: string | null
          estado?: Database["public"]["Enums"]["estado_atencion"]
          examen_fisico?: string | null
          fecha?: string
          firmada_at?: string | null
          firmada_por?: string | null
          id?: string
          indicaciones?: string | null
          motivo_consulta?: string
          paciente_id?: string
          plan_tratamiento?: string | null
          profesional_id?: string
          servicio_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "atenciones_cita_id_fkey"
            columns: ["cita_id"]
            isOneToOne: true
            referencedRelation: "citas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atenciones_firmada_por_fkey"
            columns: ["firmada_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atenciones_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atenciones_profesional_id_fkey"
            columns: ["profesional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atenciones_servicio_id_fkey"
            columns: ["servicio_id"]
            isOneToOne: false
            referencedRelation: "servicios"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          accion: string
          created_at: string
          datos_antes: Json | null
          datos_despues: Json | null
          id: number
          registro_id: string | null
          tabla: string
          usuario_id: string | null
        }
        Insert: {
          accion: string
          created_at?: string
          datos_antes?: Json | null
          datos_despues?: Json | null
          id?: never
          registro_id?: string | null
          tabla: string
          usuario_id?: string | null
        }
        Update: {
          accion?: string
          created_at?: string
          datos_antes?: Json | null
          datos_despues?: Json | null
          id?: never
          registro_id?: string | null
          tabla?: string
          usuario_id?: string | null
        }
        Relationships: []
      }
      citas: {
        Row: {
          cita_origen_id: string | null
          confirmada_at: string | null
          created_at: string
          created_by: string | null
          estado: Database["public"]["Enums"]["estado_cita"]
          fin: string
          id: string
          inicio: string
          motivo_cambio: string | null
          notas_admin: string | null
          paciente_id: string
          profesional_id: string
          servicio_id: string
          updated_at: string
        }
        Insert: {
          cita_origen_id?: string | null
          confirmada_at?: string | null
          created_at?: string
          created_by?: string | null
          estado?: Database["public"]["Enums"]["estado_cita"]
          fin: string
          id?: string
          inicio: string
          motivo_cambio?: string | null
          notas_admin?: string | null
          paciente_id: string
          profesional_id: string
          servicio_id: string
          updated_at?: string
        }
        Update: {
          cita_origen_id?: string | null
          confirmada_at?: string | null
          created_at?: string
          created_by?: string | null
          estado?: Database["public"]["Enums"]["estado_cita"]
          fin?: string
          id?: string
          inicio?: string
          motivo_cambio?: string | null
          notas_admin?: string | null
          paciente_id?: string
          profesional_id?: string
          servicio_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "citas_cita_origen_id_fkey"
            columns: ["cita_origen_id"]
            isOneToOne: false
            referencedRelation: "citas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "citas_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "citas_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "citas_profesional_id_fkey"
            columns: ["profesional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "citas_servicio_id_fkey"
            columns: ["servicio_id"]
            isOneToOne: false
            referencedRelation: "servicios"
            referencedColumns: ["id"]
          },
        ]
      }
      historias_clinicas: {
        Row: {
          abortos: number | null
          alergias: string | null
          antecedentes_familiares: string | null
          antecedentes_personales: string | null
          antecedentes_quirurgicos: string | null
          cesareas: number | null
          created_at: string
          created_by: string | null
          fecha_ultima_regla: string | null
          gestas: number | null
          grupo_sanguineo: string | null
          id: string
          menarquia_edad: number | null
          metodo_anticonceptivo: string | null
          paciente_id: string
          partos: number | null
          updated_at: string
        }
        Insert: {
          abortos?: number | null
          alergias?: string | null
          antecedentes_familiares?: string | null
          antecedentes_personales?: string | null
          antecedentes_quirurgicos?: string | null
          cesareas?: number | null
          created_at?: string
          created_by?: string | null
          fecha_ultima_regla?: string | null
          gestas?: number | null
          grupo_sanguineo?: string | null
          id?: string
          menarquia_edad?: number | null
          metodo_anticonceptivo?: string | null
          paciente_id: string
          partos?: number | null
          updated_at?: string
        }
        Update: {
          abortos?: number | null
          alergias?: string | null
          antecedentes_familiares?: string | null
          antecedentes_personales?: string | null
          antecedentes_quirurgicos?: string | null
          cesareas?: number | null
          created_at?: string
          created_by?: string | null
          fecha_ultima_regla?: string | null
          gestas?: number | null
          grupo_sanguineo?: string | null
          id?: string
          menarquia_edad?: number | null
          metodo_anticonceptivo?: string | null
          paciente_id?: string
          partos?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "historias_clinicas_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historias_clinicas_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: true
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
        ]
      }
      pacientes: {
        Row: {
          acepta_recordatorios: boolean
          apellidos: string
          canal_preferido: Database["public"]["Enums"]["canal_recordatorio"]
          consentimiento_datos: boolean
          consentimiento_fecha: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          direccion: string | null
          distrito: string | null
          email: string | null
          fecha_nacimiento: string | null
          id: string
          nombres: string
          numero_documento: string
          telefono: string | null
          tipo_documento: Database["public"]["Enums"]["tipo_documento"]
          updated_at: string
        }
        Insert: {
          acepta_recordatorios?: boolean
          apellidos: string
          canal_preferido?: Database["public"]["Enums"]["canal_recordatorio"]
          consentimiento_datos?: boolean
          consentimiento_fecha?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          direccion?: string | null
          distrito?: string | null
          email?: string | null
          fecha_nacimiento?: string | null
          id?: string
          nombres: string
          numero_documento: string
          telefono?: string | null
          tipo_documento?: Database["public"]["Enums"]["tipo_documento"]
          updated_at?: string
        }
        Update: {
          acepta_recordatorios?: boolean
          apellidos?: string
          canal_preferido?: Database["public"]["Enums"]["canal_recordatorio"]
          consentimiento_datos?: boolean
          consentimiento_fecha?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          direccion?: string | null
          distrito?: string | null
          email?: string | null
          fecha_nacimiento?: string | null
          id?: string
          nombres?: string
          numero_documento?: string
          telefono?: string | null
          tipo_documento?: Database["public"]["Enums"]["tipo_documento"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pacientes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          activo: boolean
          created_at: string
          id: string
          nombre_completo: string
          rol: Database["public"]["Enums"]["app_rol"]
          updated_at: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          id: string
          nombre_completo: string
          rol?: Database["public"]["Enums"]["app_rol"]
          updated_at?: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          id?: string
          nombre_completo?: string
          rol?: Database["public"]["Enums"]["app_rol"]
          updated_at?: string
        }
        Relationships: []
      }
      recordatorios: {
        Row: {
          canal: Database["public"]["Enums"]["canal_recordatorio"]
          cita_id: string | null
          created_at: string
          created_by: string | null
          enviado_at: string | null
          error: string | null
          estado: Database["public"]["Enums"]["estado_recordatorio"]
          id: string
          mensaje: string
          paciente_id: string
          programado_para: string
          seguimiento_id: string | null
          updated_at: string
        }
        Insert: {
          canal: Database["public"]["Enums"]["canal_recordatorio"]
          cita_id?: string | null
          created_at?: string
          created_by?: string | null
          enviado_at?: string | null
          error?: string | null
          estado?: Database["public"]["Enums"]["estado_recordatorio"]
          id?: string
          mensaje: string
          paciente_id: string
          programado_para: string
          seguimiento_id?: string | null
          updated_at?: string
        }
        Update: {
          canal?: Database["public"]["Enums"]["canal_recordatorio"]
          cita_id?: string | null
          created_at?: string
          created_by?: string | null
          enviado_at?: string | null
          error?: string | null
          estado?: Database["public"]["Enums"]["estado_recordatorio"]
          id?: string
          mensaje?: string
          paciente_id?: string
          programado_para?: string
          seguimiento_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recordatorios_cita_id_fkey"
            columns: ["cita_id"]
            isOneToOne: false
            referencedRelation: "citas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recordatorios_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recordatorios_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recordatorios_seguimiento_id_fkey"
            columns: ["seguimiento_id"]
            isOneToOne: false
            referencedRelation: "seguimientos"
            referencedColumns: ["id"]
          },
        ]
      }
      seguimientos: {
        Row: {
          atencion_id: string | null
          completado_at: string | null
          created_at: string
          created_by: string | null
          descripcion: string
          estado: Database["public"]["Enums"]["estado_seguimiento"]
          fecha_objetivo: string
          id: string
          notas: string | null
          paciente_id: string
          responsable_id: string | null
          tipo: Database["public"]["Enums"]["tipo_seguimiento"]
          updated_at: string
        }
        Insert: {
          atencion_id?: string | null
          completado_at?: string | null
          created_at?: string
          created_by?: string | null
          descripcion: string
          estado?: Database["public"]["Enums"]["estado_seguimiento"]
          fecha_objetivo: string
          id?: string
          notas?: string | null
          paciente_id: string
          responsable_id?: string | null
          tipo: Database["public"]["Enums"]["tipo_seguimiento"]
          updated_at?: string
        }
        Update: {
          atencion_id?: string | null
          completado_at?: string | null
          created_at?: string
          created_by?: string | null
          descripcion?: string
          estado?: Database["public"]["Enums"]["estado_seguimiento"]
          fecha_objetivo?: string
          id?: string
          notas?: string | null
          paciente_id?: string
          responsable_id?: string | null
          tipo?: Database["public"]["Enums"]["tipo_seguimiento"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seguimientos_atencion_id_fkey"
            columns: ["atencion_id"]
            isOneToOne: false
            referencedRelation: "atenciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seguimientos_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seguimientos_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seguimientos_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      servicios: {
        Row: {
          activo: boolean
          categoria: string
          created_at: string
          duracion_min: number
          id: string
          nombre: string
          precio_referencial: number | null
          updated_at: string
        }
        Insert: {
          activo?: boolean
          categoria: string
          created_at?: string
          duracion_min?: number
          id?: string
          nombre: string
          precio_referencial?: number | null
          updated_at?: string
        }
        Update: {
          activo?: boolean
          categoria?: string
          created_at?: string
          duracion_min?: number
          id?: string
          nombre?: string
          precio_referencial?: number | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generar_recordatorios_citas: {
        Args: { p_sede?: string }
        Returns: number
      }
      kpi_resumen: { Args: { p_desde: string; p_hasta: string }; Returns: Json }
      pacientes_posibles_duplicados: {
        Args: never
        Returns: {
          apellidos: string
          cantidad: number
          fecha_nacimiento: string
          nombres: string
          paciente_ids: string[]
        }[]
      }
      registrar_acceso_historia: {
        Args: { p_paciente_id: string }
        Returns: undefined
      }
      registrar_reset_mfa: {
        Args: { p_usuario_id: string }
        Returns: undefined
      }
      reprogramar_cita: {
        Args: { p_cita_id: string; p_motivo: string; p_nuevo_inicio: string }
        Returns: string
      }
      requiere_aal2: { Args: never; Returns: boolean }
      tiene_rol: { Args: { roles: string[] }; Returns: boolean }
    }
    Enums: {
      app_rol: "admin" | "medico" | "obstetra" | "asistente" | "soporte"
      canal_recordatorio: "whatsapp_manual" | "whatsapp_api" | "email" | "sms"
      estado_atencion: "borrador" | "firmada"
      estado_cita:
        | "programada"
        | "confirmada"
        | "atendida"
        | "no_asistio"
        | "cancelada"
        | "reprogramada"
      estado_recordatorio: "pendiente" | "enviado" | "fallido" | "cancelado"
      estado_seguimiento:
        | "pendiente"
        | "contactada"
        | "completado"
        | "cancelado"
      tipo_documento: "DNI" | "CE" | "PASAPORTE"
      tipo_seguimiento:
        | "control"
        | "resultado_pendiente"
        | "procedimiento"
        | "otro"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_rol: ["admin", "medico", "obstetra", "asistente", "soporte"],
      canal_recordatorio: ["whatsapp_manual", "whatsapp_api", "email", "sms"],
      estado_atencion: ["borrador", "firmada"],
      estado_cita: [
        "programada",
        "confirmada",
        "atendida",
        "no_asistio",
        "cancelada",
        "reprogramada",
      ],
      estado_recordatorio: ["pendiente", "enviado", "fallido", "cancelado"],
      estado_seguimiento: [
        "pendiente",
        "contactada",
        "completado",
        "cancelado",
      ],
      tipo_documento: ["DNI", "CE", "PASAPORTE"],
      tipo_seguimiento: [
        "control",
        "resultado_pendiente",
        "procedimiento",
        "otro",
      ],
    },
  },
} as const
