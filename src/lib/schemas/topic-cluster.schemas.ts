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
 * Zod schema for a single Topic Cluster, used for validating database query results.
 */
export const TopicClusterResponseSchema = z.object({
  id: z.uuid(),
  created_at: z.string(),
  updated_at: z.string(),
  name: z.string(),
});

/**
 * Zod schema for an array of Topic Clusters.
 */
export const TopicClusterListResponseSchema = z.array(TopicClusterResponseSchema);

/**
 * Zod schema for the Topic Cluster ID path parameter.
 */
export const TopicClusterIdSchema = z.object({
  id: z.uuid("Invalid UUID for topic cluster ID"),
});

/**
 * Zod schema for the Topic Cluster suggestions response DTO.
 */
export const TopicClusterSuggestionsDtoSchema = z.object({
  suggestions: z.array(z.string()),
});

/**
 * Schema for validating topic cluster creation request.
 */
export const CreateTopicClusterRequestSchema = z.object({
  name: z.string().min(1, "Topic cluster name cannot be empty"),
});

export const GetTopicClusterSuggestionsRequestSchema = z.object({
  topic_name: z.string().min(1, "Topic name cannot be empty").optional(),
});

/**
 * Inferred TypeScript types from schemas
 */
export type ListTopicClustersQuery = z.infer<typeof ListTopicClustersQuerySchema>;
export type TopicClusterIdParams = z.infer<typeof TopicClusterIdSchema>;
export type CreateTopicClusterRequest = z.infer<typeof CreateTopicClusterRequestSchema>;
