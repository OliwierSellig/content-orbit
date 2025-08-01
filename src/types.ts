import type { Tables, TablesInsert, TablesUpdate } from "./db/types";

// ############################################################################
// #
// # PROFILES
// #
// ############################################################################

/**
 * Represents the structure of a single validation error detail.
 */
export interface ValidationErrorDetail {
  path: (string | number)[];
  message: string;
}

/**
 * Represents the structure of a standard API error response.
 */
export interface ErrorResponse {
  error: string;
  message: string;
  status: number;
}

/**
 * Represents the structure of a validation error response,
 * including detailed error fields.
 */
export interface ValidationErrorResponse extends ErrorResponse {
  errors: ValidationErrorDetail[];
}

/**
 * Data Transfer Object (DTO) for a user's profile.
 * This is the shape of the data sent to the client.
 */
export interface ProfileDto {
  id: string;
  created_at: string;
  updated_at: string;
  default_topics_count: number;
  default_subtopics_count: number;
}

/**
 * Command model for updating a user's profile settings.
 * Derived from the database update type to ensure consistency.
 */
export type UpdateProfileCommand = Pick<TablesUpdate<"profiles">, "default_topics_count" | "default_subtopics_count">;

// ############################################################################
// #
// # KNOWLEDGE BASE
// #
// ############################################################################

/**
 * DTO for the user's knowledge base.
 */
export type KnowledgeBaseDto = Tables<"knowledge_bases">;

/**
 * Command model for updating the knowledge base.
 */
export type UpdateKnowledgeBaseCommand = Pick<TablesUpdate<"knowledge_bases">, "about_us" | "team" | "offer">;

// ############################################################################
// #
// # AI PREFERENCES
// #
// ############################################################################

/**
 * DTO for an AI preference, omitting user and timestamp details for client-side use.
 */
export type AiPreferenceDto = Omit<Tables<"ai_preferences">, "user_id" | "created_at" | "updated_at">;

/**
 * Command model for creating a new AI preference.
 */
export type CreateAiPreferenceCommand = Pick<TablesInsert<"ai_preferences">, "title" | "prompt">;

/**
 * Command model for updating an existing AI preference.
 */
export type UpdateAiPreferenceCommand = Pick<TablesUpdate<"ai_preferences">, "title" | "prompt">;

// ############################################################################
// #
// # CUSTOM AUDITS
// #
// ############################################################################

/**
 * DTO for a custom audit, omitting user and timestamp details.
 */
export type CustomAuditDto = Omit<Tables<"custom_audits">, "user_id" | "created_at" | "updated_at">;

/**
 * Command model for creating a new custom audit.
 */
export type CreateCustomAuditCommand = Pick<TablesInsert<"custom_audits">, "title" | "prompt">;

/**
 * Command model for updating an existing custom audit.
 */
export type UpdateCustomAuditCommand = Pick<TablesUpdate<"custom_audits">, "title" | "prompt">;

// ############################################################################
// #
// # TOPIC CLUSTERS
// #
// ############################################################################

/**
 * DTO for a topic cluster, omitting the user_id.
 */
export type TopicClusterDto = Omit<Tables<"topic_clusters">, "user_id">;

/**
 * DTO for AI-generated topic cluster suggestions.
 */
export interface TopicClusterSuggestionsDto {
  suggestions: string[];
}

/**
 * Command model for creating a new topic cluster.
 */
export type CreateTopicClusterCommand = Pick<TablesInsert<"topic_clusters">, "name">;

// ############################################################################
// #
// # ARTICLES
// #
// ############################################################################

/**
 * DTO for a full article, directly mapping the database row.
 */
export type ArticleDto = Tables<"articles">;

/**
 * DTO for an article item in a list, containing only essential information for listing.
 * Omits content, SEO fields, and other detailed information for performance.
 */
export type ArticleListItemDto = Pick<
  Tables<"articles">,
  "id" | "topic_cluster_id" | "created_at" | "updated_at" | "status" | "name" | "slug"
>;

/**
 * Command model for creating a new article from a subtopic.
 */
export type CreateArticleCommand = Pick<TablesInsert<"articles">, "topic_cluster_id" | "name">;

/**
 * Represents an article stub immediately after creation, before the AI has populated
 * the main fields.
 *
 * NOTE: This type diverges from the `articles` table schema where fields like `title`
 * are non-nullable. The API returns these as `null` initially, and this type
 * reflects the actual API response shape during this specific state.
 */
export type ArticleStubDto = Omit<ArticleDto, "title" | "slug" | "description" | "seo_title" | "seo_description"> & {
  title: string | null;
  slug: string | null;
  description: string | null;
  seo_title: string | null;
  seo_description: string | null;
};

/**
 * Command model for updating an article's details.
 */
export type UpdateArticleCommand = Pick<TablesUpdate<"articles">, "name" | "content" | "status">;

/**
 * Command model for running a custom audit on an article.
 */
export interface RunAuditCommand {
  audit_id: string;
}

/**
 * DTO for a single finding from a custom audit report.
 */
export interface AuditFindingDto {
  type: "warning" | "suggestion";
  message: string;
  offending_text: string;
}

/**
 * DTO for the response of a custom audit run on an article.
 */
export interface RunAuditResponseDto {
  findings: AuditFindingDto[];
}

// ############################################################################
// #
// # PAGINATION AND QUERIES
// #
// ############################################################################

/**
 * Generic pagination metadata for list responses.
 */
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Query parameters for listing articles.
 */
export interface ListArticlesQuery {
  topic_cluster_id: string;
  status?: "concept" | "in_progress" | "moved";
  sort_by?: "name" | "created_at" | "updated_at" | "status";
  order?: "asc" | "desc";
  page?: number;
  limit?: number;
}
