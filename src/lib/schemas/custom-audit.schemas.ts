import { z } from "zod";

/**
 * Schema for validating the response structure of custom audits.
 * This ensures type safety when retrieving custom audit data from the database.
 * Omits user_id, created_at, and updated_at fields for client-side use.
 */
export const CustomAuditDtoSchema = z.object({
  id: z.uuid("Custom audit ID must be a valid UUID"),
  title: z.string().min(1, "Title cannot be empty"),
  prompt: z.string().min(1, "Prompt cannot be empty"),
});

/**
 * Schema for validating arrays of custom audits returned from the database.
 */
export const CustomAuditsListSchema = z.array(CustomAuditDtoSchema);

/**
 * Schema for validating incoming POST requests to create custom audits.
 * Uses strict validation to prevent mass assignment attacks.
 * Both fields are required for creating new custom audits.
 */
export const CreateCustomAuditRequestSchema = z
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
 * Schema for validating incoming PATCH requests to update custom audits.
 * Uses strict validation to prevent mass assignment attacks.
 * Both fields are optional for updates (partial updates allowed).
 */
export const UpdateCustomAuditRequestSchema = z
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
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field (title or prompt) must be provided for update",
  });

/**
 * Schema for validating UUID parameters (e.g., custom audit ID in URL path).
 */
export const UuidParamSchema = z.object({
  id: z.uuid("ID must be a valid UUID"),
});
