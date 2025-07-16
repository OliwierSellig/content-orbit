import { z } from "zod";

/**
 * Schema for validating query parameters when listing topic clusters.
 */
export const ListTopicClustersQuerySchema = z.object({
  sort_by: z.enum(["name", "created_at"]).default("created_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

/**
 * Schema for validating topic cluster ID parameter.
 */
export const TopicClusterIdSchema = z.object({
  id: z.uuid("Invalid topic cluster ID format"),
});

/**
 * Schema for validating topic cluster creation request.
 */
export const CreateTopicClusterRequestSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name must be 255 characters or less"),
});

/**
 * Inferred TypeScript types from schemas
 */
export type ListTopicClustersQuery = z.infer<typeof ListTopicClustersQuerySchema>;
export type TopicClusterIdParams = z.infer<typeof TopicClusterIdSchema>;
export type CreateTopicClusterRequest = z.infer<typeof CreateTopicClusterRequestSchema>;
