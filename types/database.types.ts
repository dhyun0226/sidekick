export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

type GenericTable = {
  Row: Record<string, unknown>
  Insert: Record<string, unknown>
  Update: Record<string, unknown>
  Relationships: []
}

type GenericSchema = {
  Tables: Record<string, GenericTable>
  Views: Record<string, GenericTable>
  Functions: Record<string, never>
  Enums: Record<string, string>
  CompositeTypes: Record<string, never>
}

// Placeholder until Supabase generated types are wired for the active project.
// Replace this file with `supabase gen types typescript` output when the
// development/production database source of truth is finalized.
export type Database = {
  public: GenericSchema
}
