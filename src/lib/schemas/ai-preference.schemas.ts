import { z } from "zod";

/**
 * Schema for validating the response structure of AI preferences.
 * This ensures type safety when retrieving AI preference data from the database.
 * Omits user_id, created_at, and updated_at fields for client-side use.
 */
export const AiPreferenceDtoSchema = z.object({
  id: z.uuid("AI preference ID must be a valid UUID"),
  title: z.string().min(1, "Title cannot be empty"),
  prompt: z.string().min(1, "Prompt cannot be empty"),
});

/**
 * Schema for validating incoming POST requests to create AI preferences.
 * Uses strict validation to prevent mass assignment attacks.
 * Both fields are required for creating new AI preferences.
 */
export const CreateAiPreferenceRequestSchema = z
  .object({
    title: z
      .string("Title must be a valid string")
      .trim()
      .min(1, "Title cannot be empty")
      .max(255, "Title cannot exceed 255 characters"),
    prompt: z
      .string("Prompt must be a valid string")
      .trim()
      .min(1, "Prompt cannot be empty")
      .max(5000, "Prompt cannot exceed 5000 characters"),
  })
  .strict();

/**
 * Schema for validating incoming PATCH requests to update AI preferences.
 * Uses partial validation allowing either title, prompt, or both fields.
 * At least one field must be provided for the update to be valid.
 */
export const UpdateAiPreferenceRequestSchema = z
  .object({
    title: z
      .string("Title must be a valid string")
      .trim()
      .min(1, "Title cannot be empty")
      .max(255, "Title cannot exceed 255 characters")
      .optional(),
    prompt: z
      .string("Prompt must be a valid string")
      .trim()
      .min(1, "Prompt cannot be empty")
      .max(5000, "Prompt cannot exceed 5000 characters")
      .optional(),
  })
  .strict();

/**
 * Schema for validating UUID parameters in URL paths.
 */
export const UuidParamSchema = z.string().uuid("ID must be a valid UUID");

/**
 * Schema for validating an array of AI preferences response.
 * Used when fetching multiple AI preferences for a user.
 */
export const AiPreferencesListSchema = z.array(AiPreferenceDtoSchema);

/**
 * Type inference for AiPreferenceDto
 */
export type AiPreferenceResponse = z.infer<typeof AiPreferenceDtoSchema>;

/**
 * Type inference for CreateAiPreferenceRequest
 */
export type CreateAiPreferenceRequest = z.infer<typeof CreateAiPreferenceRequestSchema>;

/**
 * Type inference for UpdateAiPreferenceRequest
 */
export type UpdateAiPreferenceRequest = z.infer<typeof UpdateAiPreferenceRequestSchema>;

/**
 * Type inference for AiPreferences list
 */
export type AiPreferencesListResponse = z.infer<typeof AiPreferencesListSchema>;
