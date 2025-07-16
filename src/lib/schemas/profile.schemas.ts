import { z } from "zod";

/**
 * Schema for validating profile response data structure.
 * Ensures the API returns correctly formatted profile data.
 */
export const ProfileResponseSchema = z.object({
  id: z.uuid("Invalid user ID format"),
  created_at: z.string().min(1, "Creation date is required"),
  updated_at: z.string().min(1, "Update date is required"),
  default_topics_count: z
    .number()
    .int("Default topics count must be an integer")
    .min(1, "Default topics count must be at least 1")
    .max(20, "Default topics count cannot exceed 20"),
  default_subtopics_count: z
    .number()
    .int("Default subtopics count must be an integer")
    .min(1, "Default subtopics count must be at least 1")
    .max(50, "Default subtopics count cannot exceed 50"),
});

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
