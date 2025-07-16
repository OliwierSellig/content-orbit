import type { Tables, TablesInsert, TablesUpdate } from "./db/types";

// ############################################################################
// #
// # PROFILES
// #
// ############################################################################

/**
 * DTO for a user's profile, directly mapping the database row structure.
 */
export type ProfileDto = Tables<"profiles">;

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
 * DTO for an article item in a list, omitting the bulky `content` field for performance.
 */
export type ArticleListItemDto = Omit<Tables<"articles">, "content">;

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
