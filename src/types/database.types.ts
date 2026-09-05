// =============================================================================
// database.types.ts
// -----------------------------------------------------------------------------
// Tipos TypeScript generados automáticamente desde el schema de Supabase.
//
// REGENERAR cuando cambien las migraciones:
//   - Vía MCP de Cursor:  herramienta `generate_typescript_types` del MCP
//                          `user-supabase` (escribe el resultado aquí).
//   - Vía CLI Supabase:   `supabase gen types typescript --project-id <ref> \
//                            --schema public > src/types/database.types.ts`
//
// NO EDITAR a mano — cualquier cambio se sobreescribe en la próxima regeneración.
// Si necesitas tipos derivados (ej. con relaciones expandidas), créalos en
// `src/types/db-aliases.ts` o en `src/features/<dominio>/types.ts`.
// =============================================================================
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      app_settings: {
        Row: {
          key: string;
          updated_at: string;
          value: Json;
        };
        Insert: {
          key: string;
          updated_at?: string;
          value?: Json;
        };
        Update: {
          key?: string;
          updated_at?: string;
          value?: Json;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          action: string;
          actor_id: string | null;
          created_at: string;
          entity_id: string | null;
          entity_type: string | null;
          id: number;
          metadata: Json;
        };
        Insert: {
          action: string;
          actor_id?: string | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string | null;
          id?: never;
          metadata?: Json;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string | null;
          id?: never;
          metadata?: Json;
        };
        Relationships: [];
      };
      availability_blocks: {
        Row: {
          created_at: string;
          created_by: string | null;
          end_date: string;
          id: string;
          property_id: string;
          reason: string;
          start_date: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          end_date: string;
          id?: string;
          property_id: string;
          reason?: string;
          start_date: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          end_date?: string;
          id?: string;
          property_id?: string;
          reason?: string;
          start_date?: string;
        };
        Relationships: [
          {
            foreignKeyName: "availability_blocks_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
        ];
      };
      cleaning_tasks: {
        Row: {
          assigned_to: string | null;
          bed_setup_notes: string;
          check_in: string | null;
          check_out: string | null;
          cleaning_price: number | null;
          created_at: string;
          estimated_time_label: string;
          guest_name: string;
          guests: number;
          id: string;
          notes: string;
          property_id: string;
          reservation_id: string | null;
          source: string;
          status: string;
          task_date: string;
          type: string;
          updated_at: string;
        };
        Insert: {
          assigned_to?: string | null;
          bed_setup_notes?: string;
          check_in?: string | null;
          check_out?: string | null;
          cleaning_price?: number | null;
          created_at?: string;
          estimated_time_label?: string;
          guest_name?: string;
          guests?: number;
          id?: string;
          notes?: string;
          property_id: string;
          reservation_id?: string | null;
          source?: string;
          status?: string;
          task_date: string;
          type: string;
          updated_at?: string;
        };
        Update: {
          assigned_to?: string | null;
          bed_setup_notes?: string;
          check_in?: string | null;
          check_out?: string | null;
          cleaning_price?: number | null;
          created_at?: string;
          estimated_time_label?: string;
          guest_name?: string;
          guests?: number;
          id?: string;
          notes?: string;
          property_id?: string;
          reservation_id?: string | null;
          source?: string;
          status?: string;
          task_date?: string;
          type?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cleaning_tasks_assigned_to_fkey";
            columns: ["assigned_to"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cleaning_tasks_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cleaning_tasks_reservation_id_fkey";
            columns: ["reservation_id"];
            isOneToOne: false;
            referencedRelation: "reservations";
            referencedColumns: ["id"];
          },
        ];
      };
      cotizaciones: {
        Row: {
          check_in: string;
          check_out: string;
          created_at: string;
          created_by: string | null;
          guest_name: string;
          guests: number;
          id: number;
          loft_id: string;
          metadata: Json;
          notes: string;
          price_per_night: number;
          status: string;
          total: number;
          updated_at: string;
        };
        Insert: {
          check_in: string;
          check_out: string;
          created_at?: string;
          created_by?: string | null;
          guest_name?: string;
          guests?: number;
          id?: never;
          loft_id?: string;
          metadata?: Json;
          notes?: string;
          price_per_night?: number;
          status?: string;
          total?: number;
          updated_at?: string;
        };
        Update: {
          check_in?: string;
          check_out?: string;
          created_at?: string;
          created_by?: string | null;
          guest_name?: string;
          guests?: number;
          id?: never;
          loft_id?: string;
          metadata?: Json;
          notes?: string;
          price_per_night?: number;
          status?: string;
          total?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      expense_files: {
        Row: {
          created_at: string;
          drive_backup_status: string;
          drive_file_id: string | null;
          drive_last_error: string | null;
          drive_retry_count: number;
          drive_url: string | null;
          expense_id: string;
          file_size: number;
          id: string;
          mime_type: string;
          original_filename: string;
          storage_path: string;
          supabase_url: string | null;
        };
        Insert: {
          created_at?: string;
          drive_backup_status?: string;
          drive_file_id?: string | null;
          drive_last_error?: string | null;
          drive_retry_count?: number;
          drive_url?: string | null;
          expense_id: string;
          file_size?: number;
          id?: string;
          mime_type?: string;
          original_filename: string;
          storage_path: string;
          supabase_url?: string | null;
        };
        Update: {
          created_at?: string;
          drive_backup_status?: string;
          drive_file_id?: string | null;
          drive_last_error?: string | null;
          drive_retry_count?: number;
          drive_url?: string | null;
          expense_id?: string;
          file_size?: number;
          id?: string;
          mime_type?: string;
          original_filename?: string;
          storage_path?: string;
          supabase_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "expense_files_expense_id_fkey";
            columns: ["expense_id"];
            isOneToOne: false;
            referencedRelation: "expenses";
            referencedColumns: ["id"];
          },
        ];
      };
      expenses: {
        Row: {
          amount: number;
          category: string;
          created_at: string;
          created_by: string | null;
          currency: string;
          description: string;
          expense_date: string;
          gastos_sheet_last_error: string | null;
          gastos_sheet_synced_at: string | null;
          id: string;
          notes: string;
          payment_method: string;
          responsible: string;
          updated_at: string;
          vendor_name: string;
        };
        Insert: {
          amount: number;
          category?: string;
          created_at?: string;
          created_by?: string | null;
          currency?: string;
          description?: string;
          expense_date: string;
          gastos_sheet_last_error?: string | null;
          gastos_sheet_synced_at?: string | null;
          id?: string;
          notes?: string;
          payment_method?: string;
          responsible?: string;
          updated_at?: string;
          vendor_name?: string;
        };
        Update: {
          amount?: number;
          category?: string;
          created_at?: string;
          created_by?: string | null;
          currency?: string;
          description?: string;
          expense_date?: string;
          gastos_sheet_last_error?: string | null;
          gastos_sheet_synced_at?: string | null;
          id?: string;
          notes?: string;
          payment_method?: string;
          responsible?: string;
          updated_at?: string;
          vendor_name?: string;
        };
        Relationships: [];
      };
      ical_sources: {
        Row: {
          created_at: string;
          id: string;
          last_sync: string | null;
          property_id: string;
          updated_at: string;
          url: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          last_sync?: string | null;
          property_id: string;
          updated_at?: string;
          url: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          last_sync?: string | null;
          property_id?: string;
          updated_at?: string;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ical_sources_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
        ];
      };
      inventario_items: {
        Row: {
          cantidad: number;
          created_at: string;
          estado: string;
          id: number;
          loft_id: string;
          nombre: string;
          notas: string;
          ultima_revision_at: string;
          ultima_revision_por: string | null;
          updated_at: string;
        };
        Insert: {
          cantidad?: number;
          created_at?: string;
          estado?: string;
          id?: never;
          loft_id: string;
          nombre: string;
          notas?: string;
          ultima_revision_at?: string;
          ultima_revision_por?: string | null;
          updated_at?: string;
        };
        Update: {
          cantidad?: number;
          created_at?: string;
          estado?: string;
          id?: never;
          loft_id?: string;
          nombre?: string;
          notas?: string;
          ultima_revision_at?: string;
          ultima_revision_por?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      inventario_revision_fotos: {
        Row: {
          caption: string;
          created_at: string;
          created_by: string | null;
          file_size: number;
          id: string;
          item_id: string;
          mime_type: string;
          storage_path: string;
        };
        Insert: {
          caption?: string;
          created_at?: string;
          created_by?: string | null;
          file_size?: number;
          id?: string;
          item_id: string;
          mime_type?: string;
          storage_path: string;
        };
        Update: {
          caption?: string;
          created_at?: string;
          created_by?: string | null;
          file_size?: number;
          id?: string;
          item_id?: string;
          mime_type?: string;
          storage_path?: string;
        };
        Relationships: [
          {
            foreignKeyName: "inventario_revision_fotos_item_id_fkey";
            columns: ["item_id"];
            isOneToOne: false;
            referencedRelation: "inventario_revision_items";
            referencedColumns: ["id"];
          },
        ];
      };
      inventario_revision_items: {
        Row: {
          created_at: string;
          detalles: string;
          estado: string;
          funciona: string;
          id: string;
          item: string;
          orden: number;
          requiere_atencion: boolean;
          revision_id: string;
          zona: string;
        };
        Insert: {
          created_at?: string;
          detalles?: string;
          estado?: string;
          funciona?: string;
          id?: string;
          item: string;
          orden?: number;
          requiere_atencion?: boolean;
          revision_id: string;
          zona: string;
        };
        Update: {
          created_at?: string;
          detalles?: string;
          estado?: string;
          funciona?: string;
          id?: string;
          item?: string;
          orden?: number;
          requiere_atencion?: boolean;
          revision_id?: string;
          zona?: string;
        };
        Relationships: [
          {
            foreignKeyName: "inventario_revision_items_revision_id_fkey";
            columns: ["revision_id"];
            isOneToOne: false;
            referencedRelation: "inventario_revisiones";
            referencedColumns: ["id"];
          },
        ];
      };
      inventario_revisiones: {
        Row: {
          created_at: string;
          created_by: string | null;
          fecha: string;
          id: string;
          loft_id: string;
          persona: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          fecha: string;
          id?: string;
          loft_id: string;
          persona?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          fecha?: string;
          id?: string;
          loft_id?: string;
          persona?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          created_at: string;
          id: string;
          message: string;
          read: boolean;
          title: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          message: string;
          read?: boolean;
          title: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          message?: string;
          read?: boolean;
          title?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          allowed_modules: string[];
          created_at: string;
          email: string | null;
          full_name: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          status: string;
          updated_at: string;
        };
        Insert: {
          allowed_modules?: string[];
          created_at?: string;
          email?: string | null;
          full_name?: string;
          id: string;
          role?: Database["public"]["Enums"]["app_role"];
          status?: string;
          updated_at?: string;
        };
        Update: {
          allowed_modules?: string[];
          created_at?: string;
          email?: string | null;
          full_name?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          status?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      properties: {
        Row: {
          created_at: string;
          ical_token: string;
          id: string;
          name: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          ical_token?: string;
          id?: string;
          name: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          ical_token?: string;
          id?: string;
          name?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      reservations: {
        Row: {
          check_in: string;
          check_out: string;
          commission_amount: number | null;
          created_at: string;
          external_id: string | null;
          guest_name: string;
          guest_phone: string;
          guests: number;
          ical_source_id: string | null;
          ical_summary: string | null;
          id: string;
          notes: string;
          price: number | null;
          property_id: string;
          referrer_name: string;
          source: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          check_in: string;
          check_out: string;
          commission_amount?: number | null;
          created_at?: string;
          external_id?: string | null;
          guest_name?: string;
          guest_phone?: string;
          guests?: number;
          ical_source_id?: string | null;
          ical_summary?: string | null;
          id?: string;
          notes?: string;
          price?: number | null;
          property_id: string;
          referrer_name?: string;
          source?: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          check_in?: string;
          check_out?: string;
          commission_amount?: number | null;
          created_at?: string;
          external_id?: string | null;
          guest_name?: string;
          guest_phone?: string;
          guests?: number;
          ical_source_id?: string | null;
          ical_summary?: string | null;
          id?: string;
          notes?: string;
          price?: number | null;
          property_id?: string;
          referrer_name?: string;
          source?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reservations_ical_source_id_fkey";
            columns: ["ical_source_id"];
            isOneToOne: false;
            referencedRelation: "ical_sources";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reservations_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_active_staff: { Args: never; Returns: boolean };
      is_admin_or_super: { Args: never; Returns: boolean };
      is_cleaning_supervisor: { Args: never; Returns: boolean };
      is_staff_user: { Args: never; Returns: boolean };
      is_super_admin: { Args: never; Returns: boolean };
      regenerate_all_cleaning_tasks: { Args: never; Returns: undefined };
      regenerate_cleaning_tasks_for_reservation: {
        Args: { p_reservation_id: string };
        Returns: undefined;
      };
    };
    Enums: {
      app_role: "super_admin" | "admin" | "staff";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
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
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
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
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["super_admin", "admin", "staff"],
    },
  },
} as const;
