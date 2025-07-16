import type { SupabaseClient } from "@supabase/supabase-js";
import { DatabaseError, InternalDataValidationError, ProfileNotFoundError } from "./../errors";
import type { Database } from "../../db/types";
import type { ProfileDto, UpdateProfileCommand } from "../../types";
import { ProfileResponseSchema } from "./../schemas/profile.schemas";

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
      validationResult.error
    );
  }

  return validationResult.data;
}

/**
 * Updates the profile settings for the specified user.
 *
 * @param supabase - The authenticated Supabase client.
 * @param userId - The UUID of the user whose profile to update.
 * @param data - The profile fields to update.
 * @returns A promise resolving to the updated profile.
 * @throws {ProfileNotFoundError} If the profile does not exist.
 * @throws {DatabaseError} If any database-related error occurs.
 * @throws {InternalDataValidationError} If the returned data from the database is malformed.
 */
export async function updateProfile(
  supabase: SupabaseClient<Database>,
  userId: string,
  data: UpdateProfileCommand
): Promise<ProfileDto> {
  const { data: updatedData, error } = await supabase.from("profiles").update(data).eq("id", userId).select().single();

  if (error) {
    // Handle "not found" error specifically
    if (error.code === "PGRST116") {
      throw new ProfileNotFoundError();
    }
    // For all other database errors, throw a specific, logged error.
    throw new DatabaseError(`Database error while updating profile for user: ${userId}`, error);
  }

  // Check if data is null (shouldn't happen with .single() but being defensive)
  if (!updatedData) {
    throw new ProfileNotFoundError();
  }

  // Validate the returned data structure
  const validationResult = ProfileResponseSchema.safeParse(updatedData);
  if (!validationResult.success) {
    // This indicates a critical mismatch between the DB schema and our Zod schema.
    throw new InternalDataValidationError(
      "Invalid profile data structure received from database after update",
      validationResult.error
    );
  }

  return validationResult.data;
}
