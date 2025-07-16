/// <reference types="astro/client" />
import type { SupabaseClient, Session, User } from "@supabase/supabase-js";
import type { Database } from "./db/types";

interface ImportMetaEnv {
  readonly PUBLIC_SUPABASE_URL: string;
  readonly PUBLIC_SUPABASE_ANON_KEY: string;
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly OPENROUTER_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace App {
  interface Locals {
    supabase: SupabaseClient<Database>;
    session: Session | null;
    user: User | null;
  }
}
