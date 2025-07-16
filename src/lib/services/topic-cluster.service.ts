import type { SupabaseClient } from "@supabase/supabase-js";
import {
  DatabaseError,
  InternalDataValidationError,
  TopicClusterNameConflictError,
  TopicClusterNotFoundError,
} from "../errors";
import type { Database } from "../../db/types";
import type { TopicClusterDto, CreateTopicClusterCommand, TopicClusterSuggestionsDto } from "../../types";
import type { ListTopicClustersQuery } from "../schemas/topic-cluster.schemas";
import { getProfile } from "./profile.service";
import { ProfileNotFoundError } from "../errors";
import { getKnowledgeBase } from "./knowledge-base.service";
import { z } from "zod";

/**
 * Schema for validating topic cluster data from the database.
 */
const TopicClusterResponseSchema = z.object({
  id: z.string().uuid(),
  created_at: z.string(),
  updated_at: z.string(),
  name: z.string(),
});

/**
 * Response structure for paginated topic clusters list.
 */
export interface ListTopicClustersResponse {
  data: TopicClusterDto[];
  pagination: {
    total_items: number;
    total_pages: number;
    current_page: number;
    page_size: number;
  };
}

/**
 * Retrieves a paginated list of topic clusters for the specified user.
 *
 * @param supabase - The authenticated Supabase client.
 * @param userId - The UUID of the user whose topic clusters to retrieve.
 * @param options - Query options for sorting and pagination.
 * @returns A promise resolving to the paginated list of topic clusters.
 * @throws {DatabaseError} If any database-related error occurs.
 * @throws {InternalDataValidationError} If the data from the database is malformed.
 */
export async function getTopicClusters(
  supabase: SupabaseClient<Database>,
  userId: string,
  options: ListTopicClustersQuery
): Promise<ListTopicClustersResponse> {
  const { sort_by, order, page, limit } = options;
  const offset = (page - 1) * limit;

  // First, get the total count for pagination
  const { count, error: countError } = await supabase
    .from("topic_clusters")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (countError) {
    throw new DatabaseError(`Database error while counting topic clusters for user: ${userId}`, countError);
  }

  const totalItems = count || 0;
  const totalPages = Math.ceil(totalItems / limit);

  // Get the actual data with pagination and sorting
  const { data, error } = await supabase
    .from("topic_clusters")
    .select("id, created_at, updated_at, name")
    .eq("user_id", userId)
    .order(sort_by, { ascending: order === "asc" })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new DatabaseError(`Database error while fetching topic clusters for user: ${userId}`, error);
  }

  // Validate each topic cluster
  const validatedTopicClusters: TopicClusterDto[] = [];

  for (const cluster of data || []) {
    const validationResult = TopicClusterResponseSchema.safeParse(cluster);
    if (!validationResult.success) {
      throw new InternalDataValidationError(
        "Invalid topic cluster data structure received from database",
        validationResult.error
      );
    }
    validatedTopicClusters.push(validationResult.data);
  }

  return {
    data: validatedTopicClusters,
    pagination: {
      total_items: totalItems,
      total_pages: totalPages,
      current_page: page,
      page_size: limit,
    },
  };
}

/**
 * Creates a new topic cluster for the specified user.
 *
 * @param supabase - The authenticated Supabase client.
 * @param userId - The UUID of the user creating the topic cluster.
 * @param command - The data for creating the topic cluster.
 * @returns A promise resolving to the created topic cluster.
 * @throws {DatabaseError} If any database-related error occurs.
 * @throws {InternalDataValidationError} If the data from the database is malformed.
 * @throws {TopicClusterNameConflictError} If a topic cluster with the same name already exists.
 */
export async function createTopicCluster(
  supabase: SupabaseClient<Database>,
  userId: string,
  command: CreateTopicClusterCommand
): Promise<TopicClusterDto> {
  const { name } = command;

  // Trim whitespace and normalize the name
  const normalizedName = name.trim();

  // Check if a topic cluster with the same name (case-insensitive) already exists
  const { data: existingCluster, error: checkError } = await supabase
    .from("topic_clusters")
    .select("id")
    .eq("user_id", userId)
    .ilike("name", normalizedName)
    .single();

  if (checkError && checkError.code !== "PGRST116") {
    // PGRST116 is "not found" which is what we want
    throw new DatabaseError(
      `Database error while checking topic cluster name uniqueness for user: ${userId}`,
      checkError
    );
  }

  if (existingCluster) {
    throw new TopicClusterNameConflictError("A topic cluster with this name already exists");
  }

  // Create the new topic cluster
  const { data, error } = await supabase
    .from("topic_clusters")
    .insert({
      user_id: userId,
      name: normalizedName,
    })
    .select("id, created_at, updated_at, name")
    .single();

  if (error) {
    // Handle potential race condition where unique constraint is violated at DB level
    if (error.code === "23505") {
      // PostgreSQL unique violation
      throw new TopicClusterNameConflictError("A topic cluster with this name already exists");
    }
    throw new DatabaseError(`Database error while creating topic cluster for user: ${userId}`, error);
  }

  // Validate the created data
  const validationResult = TopicClusterResponseSchema.safeParse(data);
  if (!validationResult.success) {
    throw new InternalDataValidationError(
      "Invalid topic cluster data structure received from database after creation",
      validationResult.error
    );
  }

  return validationResult.data;
}

/**
 * Retrieves a single topic cluster by ID for the specified user.
 *
 * @param supabase - The authenticated Supabase client.
 * @param userId - The UUID of the user whose topic cluster to retrieve.
 * @param clusterId - The UUID of the topic cluster to retrieve.
 * @returns A promise resolving to the topic cluster or null if not found.
 * @throws {DatabaseError} If any database-related error occurs.
 * @throws {InternalDataValidationError} If the data from the database is malformed.
 */
export async function getTopicClusterById(
  supabase: SupabaseClient<Database>,
  userId: string,
  clusterId: string
): Promise<TopicClusterDto | null> {
  const { data, error } = await supabase
    .from("topic_clusters")
    .select("id, created_at, updated_at, name")
    .eq("user_id", userId)
    .eq("id", clusterId)
    .single();

  if (error) {
    // A "not found" error is a legitimate case where no record exists.
    if (error.code === "PGRST116") {
      return null;
    }
    // For all other database errors, throw a specific, logged error.
    throw new DatabaseError(`Database error while fetching topic cluster: ${clusterId} for user: ${userId}`, error);
  }

  // Validate the data structure before returning.
  const validationResult = TopicClusterResponseSchema.safeParse(data);
  if (!validationResult.success) {
    throw new InternalDataValidationError(
      "Invalid topic cluster data structure received from database",
      validationResult.error
    );
  }

  return validationResult.data;
}

/**
 * Deletes a topic cluster and all associated articles for the specified user.
 * This is a destructive operation that cannot be undone.
 *
 * @param supabase - The authenticated Supabase client.
 * @param userId - The UUID of the user who owns the topic cluster.
 * @param clusterId - The UUID of the topic cluster to delete.
 * @returns A promise that resolves when deletion is complete.
 * @throws {DatabaseError} If any database-related error occurs.
 * @throws {TopicClusterNotFoundError} If the topic cluster does not exist or doesn't belong to the user.
 */
export async function deleteTopicCluster(
  supabase: SupabaseClient<Database>,
  userId: string,
  clusterId: string
): Promise<void> {
  const { count, error } = await supabase
    .from("topic_clusters")
    .delete({ count: "exact" })
    .eq("user_id", userId)
    .eq("id", clusterId);

  if (error) {
    throw new DatabaseError(`Database error while deleting topic cluster: ${clusterId} for user: ${userId}`, error);
  }

  // Check if any rows were actually deleted
  if (count === 0) {
    throw new TopicClusterNotFoundError("Topic cluster not found or does not belong to this user");
  }
}

/**
 * Mock AI function that generates topic cluster suggestions based on user's context.
 * In a future implementation, this will call a real AI service.
 *
 * @param knowledgeBase - User's knowledge base content.
 * @param existingClusters - Array of existing topic clusters.
 * @param count - Number of suggestions to generate.
 * @returns Array of suggested topic cluster names.
 */
function mockAiSuggestions(
  knowledgeBase: { about_us: string | null; team: string | null; offer: string | null } | null,
  existingClusters: TopicClusterDto[],
  count: number
): string[] {
  // Base suggestions that work for most businesses
  const baseSuggestions = [
    "Customer Success Stories",
    "Industry Insights",
    "Product Development",
    "Market Analysis",
    "Best Practices",
    "Technology Trends",
    "Team Updates",
    "Company Culture",
    "Innovation Hub",
    "Performance Metrics",
    "Strategic Planning",
    "Client Feedback",
    "Process Improvement",
    "Knowledge Base",
    "Training Materials",
  ];

  // Filter out suggestions that match existing cluster names (case-insensitive)
  const existingNames = existingClusters.map((cluster) => cluster.name.toLowerCase());
  const availableSuggestions = baseSuggestions.filter(
    (suggestion) => !existingNames.includes(suggestion.toLowerCase())
  );

  // If we have knowledge base content, try to add contextual suggestions
  const contextualSuggestions: string[] = [];
  if (knowledgeBase?.offer) {
    const offer = knowledgeBase.offer.toLowerCase();
    if (offer.includes("software") || offer.includes("development")) {
      contextualSuggestions.push("Software Development", "Code Quality", "API Documentation");
    }
    if (offer.includes("consulting")) {
      contextualSuggestions.push("Client Consulting", "Advisory Services", "Business Solutions");
    }
    if (offer.includes("marketing")) {
      contextualSuggestions.push("Marketing Strategies", "Campaign Analysis", "Brand Development");
    }
  }

  // Combine and filter contextual suggestions
  const filteredContextual = contextualSuggestions.filter(
    (suggestion) => !existingNames.includes(suggestion.toLowerCase())
  );

  // Merge contextual suggestions with base suggestions, prioritizing contextual ones
  const allSuggestions = [...filteredContextual, ...availableSuggestions];

  // Return the requested number of suggestions, or all available if fewer than requested
  return allSuggestions.slice(0, Math.min(count, allSuggestions.length));
}

/**
 * Generates AI-powered topic cluster suggestions for the specified user.
 *
 * @param supabase - The authenticated Supabase client.
 * @param userId - The UUID of the user for whom to generate suggestions.
 * @returns A promise resolving to topic cluster suggestions.
 * @throws {DatabaseError} If any database-related error occurs.
 * @throws {InternalDataValidationError} If the data from the database is malformed.
 * @throws {ProfileNotFoundError} If the user's profile does not exist.
 */
export async function getTopicClusterSuggestions(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<TopicClusterSuggestionsDto> {
  // Get suggestions count from user's profile
  const profile = await getProfile(supabase, userId);
  if (!profile) {
    throw new ProfileNotFoundError();
  }

  const suggestionsCount = profile.default_topics_count;

  // Get user's knowledge base for context
  const knowledgeBase = await getKnowledgeBase(supabase, userId);

  // Get existing topic clusters to avoid duplicates
  const existingClusters = await getTopicClusters(supabase, userId, {
    sort_by: "created_at",
    order: "desc",
    page: 1,
    limit: 100, // Get all clusters to check for duplicates
  });

  // Generate AI suggestions (mocked for now)
  const suggestions = mockAiSuggestions(knowledgeBase, existingClusters.data, suggestionsCount);

  return {
    suggestions,
  };
}
