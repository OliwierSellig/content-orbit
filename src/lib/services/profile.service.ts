import type { SupabaseClient } from "@supabase/supabase-js";
import { DatabaseError, InternalDataValidationError } from "./../errors";
import type { Database } from "../../db/types";
import type { ProfileDto } from "../../types";
import { ProfileResponseSchema } from "./../schemas/profile.schemas";
import type { ZodError } from "zod-validation-error";

/**
 * Retrieves the profile for the specified user.
 *
 * @param supabase - The authenticated Supabase client.
 * @param userId - The UUID of the user whose profile to retrieve.
 * @returns A promise resolving to the user's profile or null if not found.
 * @throws {DatabaseError} If any database-related error occurs.
 * @throws {InternalDataValidationError} If the data from the database is malformed.
 */
export async function getProfile(supabase: SupabaseClient<Database>, userId: string): Promise<ProfileDto | null> {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();

  if (error) {
    // A "not found" error is a legitimate case where no record exists.
    // The API layer will handle turning this into a 404.
    if (error.code === "PGRST116") {
      return null;
    }
    // For all other database errors, throw a specific, logged error.
    throw new DatabaseError(`Database error while fetching profile for user: ${userId}`, error);
  }

  // Validate the data structure before returning.
  const validationResult = ProfileResponseSchema.safeParse(data);
  if (!validationResult.success) {
    // This indicates a critical mismatch between the DB schema and our Zod schema.
    // It is a server-side issue, not a client error.
    throw new InternalDataValidationError(
      "Invalid profile data structure received from database",
      validationResult.error as unknown as ZodError
    );
  }

  return validationResult.data;
}
