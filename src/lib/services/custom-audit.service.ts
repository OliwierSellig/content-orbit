import type { SupabaseClient } from "@supabase/supabase-js";
import { DatabaseError, InternalDataValidationError, CustomAuditTitleConflictError } from "./../errors";
import type { Database } from "../../db/types";
import type { CustomAuditDto, CreateCustomAuditCommand, UpdateCustomAuditCommand } from "../../types";
import { CustomAuditsListSchema, CustomAuditDtoSchema } from "./../schemas/custom-audit.schemas";

/**
 * Retrieves all custom audits for the specified user.
 *
 * @param supabase - The authenticated Supabase client.
 * @param userId - The UUID of the user whose custom audits to retrieve.
 * @returns A promise resolving to an array of the user's custom audits.
 * @throws {DatabaseError} If any database-related error occurs.
 * @throws {InternalDataValidationError} If the data from the database is malformed.
 */
export async function getCustomAudits(supabase: SupabaseClient<Database>, userId: string): Promise<CustomAuditDto[]> {
  const { data, error } = await supabase
    .from("custom_audits")
    .select("id, title, prompt")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    // For all database errors, throw a specific, logged error.
    throw new DatabaseError(`Database error while fetching custom audits for user: ${userId}`, error);
  }

  // Return empty array if no data found
  if (!data || data.length === 0) {
    return [];
  }

  // Validate the data structure before returning.
  const validationResult = CustomAuditsListSchema.safeParse(data);
  if (!validationResult.success) {
    // This indicates a critical mismatch between the DB schema and our Zod schema.
    // It is a server-side issue, not a client error.
    throw new InternalDataValidationError(
      "Invalid custom audits data structure received from database",
      validationResult.error
    );
  }

  return validationResult.data;
}

/**
 * Creates a new custom audit for the specified user.
 *
 * @param supabase - The authenticated Supabase client.
 * @param userId - The UUID of the user creating the custom audit.
 * @param data - The custom audit data to create.
 * @returns A promise resolving to the newly created custom audit.
 * @throws {DatabaseError} If any database-related error occurs.
 * @throws {InternalDataValidationError} If the returned data from the database is malformed.
 * @throws {CustomAuditTitleConflictError} If a custom audit with the same title already exists.
 */
export async function createCustomAudit(
  supabase: SupabaseClient<Database>,
  userId: string,
  data: CreateCustomAuditCommand
): Promise<CustomAuditDto> {
  const { title } = data;

  // Trim whitespace and normalize the title
  const normalizedTitle = title.trim();

  // Check if a custom audit with the same title (case-insensitive) already exists
  const { data: existingAudit, error: checkError } = await supabase
    .from("custom_audits")
    .select("id")
    .eq("user_id", userId)
    .ilike("title", normalizedTitle)
    .single();

  if (checkError && checkError.code !== "PGRST116") {
    // PGRST116 is "not found" which is what we want
    throw new DatabaseError(
      `Database error while checking custom audit title uniqueness for user: ${userId}`,
      checkError
    );
  }

  if (existingAudit) {
    throw new CustomAuditTitleConflictError("A custom audit with this title already exists");
  }

  // Create the new custom audit
  const { data: newAudit, error } = await supabase
    .from("custom_audits")
    .insert({
      user_id: userId,
      title: normalizedTitle,
      prompt: data.prompt,
    })
    .select("id, title, prompt")
    .single();

  if (error) {
    // Handle potential race condition where unique constraint is violated at DB level
    if (error.code === "23505") {
      // PostgreSQL unique violation
      throw new CustomAuditTitleConflictError("A custom audit with this title already exists");
    }
    throw new DatabaseError(`Database error while creating custom audit for user: ${userId}`, error);
  }

  // Validate the returned data structure
  const validationResult = CustomAuditDtoSchema.safeParse(newAudit);
  if (!validationResult.success) {
    throw new InternalDataValidationError(
      "Invalid custom audit data structure received from database after creation",
      validationResult.error
    );
  }

  return validationResult.data;
}

/**
 * Updates an existing custom audit for the specified user.
 *
 * @param supabase - The authenticated Supabase client.
 * @param userId - The UUID of the user updating the custom audit.
 * @param auditId - The UUID of the custom audit to update.
 * @param data - The partial custom audit data to update.
 * @returns A promise resolving to the updated custom audit or null if not found.
 * @throws {DatabaseError} If any database-related error occurs.
 * @throws {InternalDataValidationError} If the returned data from the database is malformed.
 * @throws {CustomAuditTitleConflictError} If a custom audit with the same title already exists.
 */
export async function updateCustomAudit(
  supabase: SupabaseClient<Database>,
  userId: string,
  auditId: string,
  data: UpdateCustomAuditCommand
): Promise<CustomAuditDto | null> {
  // If title is being updated, check for uniqueness
  if (data.title) {
    const normalizedTitle = data.title.trim();

    // Check if another custom audit with the same title (case-insensitive) already exists
    const { data: existingAudit, error: checkError } = await supabase
      .from("custom_audits")
      .select("id")
      .eq("user_id", userId)
      .neq("id", auditId) // Exclude the current audit being updated
      .ilike("title", normalizedTitle)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      throw new DatabaseError(
        `Database error while checking custom audit title uniqueness for user: ${userId}`,
        checkError
      );
    }

    if (existingAudit) {
      throw new CustomAuditTitleConflictError("A custom audit with this title already exists");
    }

    // Update the data with normalized title
    data = { ...data, title: normalizedTitle };
  }

  const { data: updatedAudit, error } = await supabase
    .from("custom_audits")
    .update(data)
    .eq("id", auditId)
    .eq("user_id", userId)
    .select("id, title, prompt")
    .single();

  if (error) {
    // Check if it's a "no rows" error (audit not found or doesn't belong to user)
    if (error.code === "PGRST116") {
      return null;
    }
    // Handle potential race condition where unique constraint is violated at DB level
    if (error.code === "23505") {
      // PostgreSQL unique violation
      throw new CustomAuditTitleConflictError("A custom audit with this title already exists");
    }
    throw new DatabaseError(`Database error while updating custom audit: ${auditId}`, error);
  }

  // Validate the returned data structure
  const validationResult = CustomAuditDtoSchema.safeParse(updatedAudit);
  if (!validationResult.success) {
    throw new InternalDataValidationError(
      "Invalid custom audit data structure received from database after update",
      validationResult.error
    );
  }

  return validationResult.data;
}

/**
 * Deletes an existing custom audit for the specified user.
 *
 * @param supabase - The authenticated Supabase client.
 * @param userId - The UUID of the user deleting the custom audit.
 * @param auditId - The UUID of the custom audit to delete.
 * @returns A promise resolving to true if deleted, false if not found.
 * @throws {DatabaseError} If any database-related error occurs.
 */
export async function deleteCustomAudit(
  supabase: SupabaseClient<Database>,
  userId: string,
  auditId: string
): Promise<boolean> {
  const { error, count } = await supabase
    .from("custom_audits")
    .delete({ count: "exact" })
    .eq("id", auditId)
    .eq("user_id", userId);

  if (error) {
    throw new DatabaseError(`Database error while deleting custom audit: ${auditId}`, error);
  }

  return (count ?? 0) > 0;
}
