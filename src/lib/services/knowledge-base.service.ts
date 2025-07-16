import type { SupabaseClient } from "@supabase/supabase-js";
import type { KnowledgeBaseDto } from "../../types";
import { DatabaseError, InternalDataValidationError } from "../errors";
import { KnowledgeBaseDtoSchema } from "../schemas/knowledge-base.schemas";

/**
 * Fetches the knowledge base for a specific user.
 *
 * @param supabase - The Supabase client instance.
 * @param userId - The ID of the user whose knowledge base is to be fetched.
 * @returns A promise that resolves to the user's knowledge base DTO, or null if not found.
 * @throws {DatabaseError} If there's an error during the database query.
 * @throws {InternalDataValidationError} If the data from the database doesn't match the expected schema.
 */
export async function getKnowledgeBase(supabase: SupabaseClient, userId: string): Promise<KnowledgeBaseDto | null> {
  const { data, error } = await supabase.from("knowledge_bases").select("*").eq("user_id", userId).single();

  console.log(error);

  // "PGRST116" means "exact one row not found", which is a valid case.
  if (error && error.code !== "PGRST116") {
    throw new DatabaseError("Failed to fetch knowledge base from database", error);
  }

  if (!data) {
    return null;
  }

  const validationResult = KnowledgeBaseDtoSchema.safeParse(data);

  if (!validationResult.success) {
    throw new InternalDataValidationError("Knowledge base data from database is invalid", validationResult.error);
  }

  return validationResult.data;
}
