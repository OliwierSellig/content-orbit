import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../db/types";
import { UnauthorizedError, logError, createErrorResponse } from "./errors";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function stripHtmlTags(html: string | null | undefined): string {
  if (!html) return "";
  return html.replace(/<\/?(strong|em)>/g, "");
}

/**
 * Authentication and authorization result for API endpoints.
 */
export interface AuthResult {
  user: { id: string };
  supabase: SupabaseClient<Database>;
}

/**
 * Validates authentication and authorization for API endpoints.
 *
 * @param locals - The Astro locals object containing user and supabase client
 * @param operation - The operation name for logging purposes
 * @returns AuthResult with validated user and supabase client
 * @throws {UnauthorizedError} If user is not authenticated
 * @throws {Response} If supabase client is not available (server configuration error)
 */
export function validateAuth(
  locals: { user?: { id: string }; supabase?: SupabaseClient<Database> },
  operation: string
): AuthResult {
  if (!locals.user) {
    throw new UnauthorizedError();
  }

  if (!locals.supabase) {
    // This is a server configuration issue, so we log it as a critical error.
    const error = new Error("Supabase client not available in locals");
    logError(error, { operation });
    const errResponse = createErrorResponse("Internal Server Error", "Server configuration error", 500);
    throw new Response(JSON.stringify(errResponse), { status: 500 });
  }

  return {
    user: locals.user,
    supabase: locals.supabase,
  };
}
