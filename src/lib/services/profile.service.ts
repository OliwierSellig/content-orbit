import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/types";
import type { ProfileDto } from "../../types";
import { ProfileResponseSchema } from "../schemas/profile.schemas";

/**
 * Retrieves the profile for the specified user.
 *
 * @param supabase - The authenticated Supabase client
 * @param userId - The UUID of the user whose profile to retrieve
 * @returns Promise resolving to the user's profile or null if not found
 * @throws Error if database operation fails or data validation fails
 */
export async function getProfile(supabase: SupabaseClient<Database>, userId: string): Promise<ProfileDto | null> {
  try {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();

    if (error) {
      // If no rows returned, that's a legitimate "not found" case
      if (error.code === "PGRST116") {
        return null;
      }
      // For other database errors, re-throw
      throw new Error(`Database error while fetching profile: ${error.message}`);
    }

    // Validate the data structure before returning
    const validationResult = ProfileResponseSchema.safeParse(data);
    if (!validationResult.success) {
      console.error("Profile data validation failed:", validationResult.error);
      throw new Error("Invalid profile data structure received from database");
    }

    return validationResult.data;
  } catch (error) {
    // Re-throw database errors for the handler to manage
    if (error instanceof Error) {
      throw error;
    }
    // Handle unexpected error types
    throw new Error("Unknown error occurred while fetching profile");
  }
}
