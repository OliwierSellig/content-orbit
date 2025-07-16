import type { SupabaseClient } from "@supabase/supabase-js";
import { DatabaseError, InternalDataValidationError } from "./../errors";
import type { Database } from "../../db/types";
import type { AiPreferenceDto, CreateAiPreferenceCommand, UpdateAiPreferenceCommand } from "../../types";
import { AiPreferencesListSchema, AiPreferenceDtoSchema } from "./../schemas/ai-preference.schemas";

/**
 * Retrieves all AI preferences for the specified user.
 *
 * @param supabase - The authenticated Supabase client.
 * @param userId - The UUID of the user whose AI preferences to retrieve.
 * @returns A promise resolving to an array of the user's AI preferences.
 * @throws {DatabaseError} If any database-related error occurs.
 * @throws {InternalDataValidationError} If the data from the database is malformed.
 */
export async function getAiPreferences(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<AiPreferenceDto[] | null> {
  const { data, error } = await supabase
    .from("ai_preferences")
    .select("id, title, prompt")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    // For all database errors, throw a specific, logged error.
    throw new DatabaseError(`Database error while fetching AI preferences for user: ${userId}`, error);
  }

  // Return null if no data found
  if (!data || data.length === 0) {
    return null;
  }

  // Validate the data structure before returning.
  const validationResult = AiPreferencesListSchema.safeParse(data);
  if (!validationResult.success) {
    // This indicates a critical mismatch between the DB schema and our Zod schema.
    // It is a server-side issue, not a client error.
    throw new InternalDataValidationError(
      "Invalid AI preferences data structure received from database",
      validationResult.error
    );
  }

  return validationResult.data;
}

/**
 * Creates a new AI preference for the specified user.
 *
 * @param supabase - The authenticated Supabase client.
 * @param userId - The UUID of the user creating the AI preference.
 * @param data - The AI preference data to create.
 * @returns A promise resolving to the newly created AI preference.
 * @throws {DatabaseError} If any database-related error occurs.
 * @throws {InternalDataValidationError} If the data from the database is malformed.
 */
export async function createAiPreference(
  supabase: SupabaseClient<Database>,
  userId: string,
  data: CreateAiPreferenceCommand
): Promise<AiPreferenceDto> {
  const { data: insertedData, error } = await supabase
    .from("ai_preferences")
    .insert({
      user_id: userId,
      title: data.title,
      prompt: data.prompt,
    })
    .select("id, title, prompt")
    .single();

  if (error) {
    // For all database errors, throw a specific, logged error.
    throw new DatabaseError(`Database error while creating AI preference for user: ${userId}`, error);
  }

  // Validate the data structure before returning.
  const validationResult = AiPreferenceDtoSchema.safeParse(insertedData);
  if (!validationResult.success) {
    // This indicates a critical mismatch between the DB schema and our Zod schema.
    // It is a server-side issue, not a client error.
    throw new InternalDataValidationError(
      "Invalid AI preference data structure received from database after creation",
      validationResult.error
    );
  }

  return validationResult.data;
}

/**
 * Updates an existing AI preference for the specified user.
 *
 * @param supabase - The authenticated Supabase client.
 * @param userId - The UUID of the user who owns the AI preference.
 * @param id - The UUID of the AI preference to update.
 * @param data - The AI preference data to update.
 * @returns A promise resolving to the updated AI preference or null if not found.
 * @throws {DatabaseError} If any database-related error occurs.
 * @throws {InternalDataValidationError} If the data from the database is malformed.
 */
export async function updateAiPreference(
  supabase: SupabaseClient<Database>,
  userId: string,
  id: string,
  data: UpdateAiPreferenceCommand
): Promise<AiPreferenceDto | null> {
  const { data: updatedData, error } = await supabase
    .from("ai_preferences")
    .update(data)
    .eq("id", id)
    .eq("user_id", userId)
    .select("id, title, prompt")
    .single();

  if (error) {
    // A "not found" error is a legitimate case where no record exists or doesn't belong to user.
    if (error.code === "PGRST116") {
      return null;
    }
    // For all other database errors, throw a specific, logged error.
    throw new DatabaseError(`Database error while updating AI preference ${id} for user: ${userId}`, error);
  }

  // Validate the data structure before returning.
  const validationResult = AiPreferenceDtoSchema.safeParse(updatedData);
  if (!validationResult.success) {
    // This indicates a critical mismatch between the DB schema and our Zod schema.
    // It is a server-side issue, not a client error.
    throw new InternalDataValidationError(
      "Invalid AI preference data structure received from database after update",
      validationResult.error
    );
  }

  return validationResult.data;
}

/**
 * Deletes an existing AI preference for the specified user.
 *
 * @param supabase - The authenticated Supabase client.
 * @param userId - The UUID of the user who owns the AI preference.
 * @param id - The UUID of the AI preference to delete.
 * @returns A promise resolving to true if deleted, false if not found.
 * @throws {DatabaseError} If any database-related error occurs.
 */
export async function deleteAiPreference(
  supabase: SupabaseClient<Database>,
  userId: string,
  id: string
): Promise<{ success: boolean }> {
  const { error, count } = await supabase
    .from("ai_preferences")
    .delete({ count: "exact" })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    // For all database errors, throw a specific, logged error.
    throw new DatabaseError(`Database error while deleting AI preference ${id} for user: ${userId}`, error);
  }

  // Return true if a record was deleted, false if nothing was found
  return { success: (count ?? 0) > 0 };
}
