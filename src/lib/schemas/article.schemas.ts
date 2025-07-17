import { z } from "zod";

/**
 * Schema for validating query parameters when listing articles.
 * Includes validation for required topic_cluster_id and optional filtering/pagination parameters.
 */
export const listArticlesQuerySchema = z.object({
  // Required parameters
  topic_cluster_id: z.string().uuid("topic_cluster_id must be a valid UUID"),

  // Optional filtering parameters
  status: z.enum(["concept", "in_progress", "moved"]).optional(),

  // Optional sorting parameters
  sort_by: z.enum(["name", "created_at", "updated_at", "status"]).default("created_at"),
  order: z.enum(["asc", "desc"]).default("desc"),

  // Optional pagination parameters
  page: z.coerce.number().int().min(1, "Page must be at least 1").default(1),
  limit: z.coerce.number().int().min(1, "Limit must be at least 1").max(100, "Limit cannot exceed 100").default(10),
});

/**
 * Type inference for the validated query parameters.
 */
export type ListArticlesQueryParams = z.infer<typeof listArticlesQuerySchema>;

/**
 * Schema for validating article ID path parameter.
 */
export const getArticleParamsSchema = z.object({
  id: z.uuid("Article ID must be a valid UUID"),
});

/**
 * Schema for validating article ID path parameter for updates.
 */
export const updateArticleParamsSchema = z.object({
  id: z.uuid("Article ID must be a valid UUID"),
});

/**
 * Schema for validating article ID path parameter for deletion.
 */
export const deleteArticleParamsSchema = z.object({
  id: z.uuid("Article ID must be a valid UUID"),
});

/**
 * Schema for validating update article request body.
 * All fields are optional for partial updates.
 */
export const updateArticleRequestSchema = z
  .object({
    name: z.string().min(1, "Name cannot be empty").optional(),
    content: z.string().optional(),
    status: z.enum(["concept", "in_progress", "moved"]).optional(),
    title: z.string().optional(),
    slug: z.string().optional(),
    description: z.string().optional(),
    seo_title: z.string().optional(),
    seo_description: z.string().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

/**
 * Type inference for the validated path parameters.
 */
export type GetArticleParams = z.infer<typeof getArticleParamsSchema>;
export type UpdateArticleParams = z.infer<typeof updateArticleParamsSchema>;
export type DeleteArticleParams = z.infer<typeof deleteArticleParamsSchema>;
export type UpdateArticleRequest = z.infer<typeof updateArticleRequestSchema>;
