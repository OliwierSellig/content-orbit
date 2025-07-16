import { z } from "zod";

/**
 * Schema for validating the response structure of a user profile.
 * This ensures type safety when retrieving profile data from the database.
 */
export const ProfileResponseSchema = z.object({
  id: z.uuid(),
  created_at: z.string(),
  updated_at: z.string(),
  default_topics_count: z.number().int().positive(),
  default_subtopics_count: z.number().int().positive(),
});

/**
 * Schema for validating incoming PATCH requests to update profile settings.
 * Uses strict validation to prevent mass assignment attacks.
 * Both fields are optional since PATCH allows partial updates.
 *
 * Custom error messages are added at each validation step for better UX.
 */
export const UpdateProfileRequestSchema = z
  .object({
    default_topics_count: z
      .number("Topics count must be a valid number")
      .int("Topics count must be a whole number")
      .min(1, "Topics count must be at least 1")
      .max(10, "Topics count cannot exceed 10")
      .optional(),
    default_subtopics_count: z
      .number("Subtopics count must be a valid number")
      .int("Subtopics count must be a whole number")
      .min(1, "Subtopics count must be at least 1")
      .max(10, "Subtopics count cannot exceed 10")
      .optional(),
  })
  .strict();

/**
 * Schema for validating error response structure.
 * Ensures consistent error response format across the API.
 */
export const ErrorResponseSchema = z.object({
  error: z.string().min(1, "Error message cannot be empty"),
});

/**
 * Type inference for ProfileResponse
 */
export type ProfileResponse = z.infer<typeof ProfileResponseSchema>;

/**
 * Type inference for ErrorResponse
 */
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
