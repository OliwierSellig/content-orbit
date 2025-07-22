import type { TopicClusterDto, CreateTopicClusterCommand, TopicClusterSuggestionsDto } from "../../types";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  DatabaseError,
  InternalDataValidationError,
  MissingProfileConfigurationError,
  ProfileNotFoundError,
  TopicClusterNameConflictError,
  TopicClusterNotFoundError,
} from "../errors";
import {
  TopicClusterListResponseSchema,
  TopicClusterResponseSchema,
  TopicClusterSuggestionsDtoSchema,
} from "../schemas/topic-cluster.schemas";
import { getProfile } from "./profile.service";
import { getKnowledgeBase } from "./knowledge-base.service";
import { z } from "zod";

/**
 * MOCKED AI FUNCTION
 *
 * Simulates fetching topic suggestions from an AI service.
 * In a real implementation, this would involve a call to an external AI API.
 *
 * @param {number} count The number of topic suggestions to generate.
 * @returns {Promise<string[]>} A promise that resolves to an array of topic suggestions.
 */
async function mockGetTopicSuggestions(count: number): Promise<string[]> {
  console.log(`[MOCK AI] Generating ${count} topic suggestions`);
  const mockSuggestions = [
    "Customer Success Stories",
    "Industry Insights",
    "Product Development Updates",
    "Market Analysis & Trends",
    "Best Practices in [Your Industry]",
    "Technology Trends Explained",
    "Behind the Scenes: Team Updates",
    "Exploring Company Culture",
    "Innovation Hub: What's Next?",
    "Key Performance Metrics Deep Dive",
    "Strategic Planning for [Year]",
    "Analyzing Client Feedback",
    "Streamlining for Process Improvement",
    "Building Our Knowledge Base",
    "New Training Materials & Resources",
    "The Future of [Your Niche]",
    "Data Security & Privacy",
    "Expert Interviews & Q&As",
    "Corporate Social Responsibility",
    "Guide to Our Core Features",
    "Overcoming Common Challenges",
    "A Look at Our Competitors",
    "Software Development Lifecycle",
    "Marketing & SEO Strategies",
    "Financial Planning & Insights",
    "Recruitment & Onboarding",
    "Employee Wellness Programs",
    "Conference & Event Recaps",
    "Our Partnership Ecosystem",
    "Unlocking Customer Loyalty",
    "Advanced Analytics Techniques",
    "The Power of Automation",
    "Cloud Computing in Practice",
    "UX/UI Design Principles",
    "Content Marketing ROI",
  ];
  await new Promise((resolve) => setTimeout(resolve, 1000));
  // Shuffle and slice to get a random-like subset
  return Promise.resolve([...mockSuggestions].sort(() => 0.5 - Math.random()).slice(0, count));
}

/**
 * MOCKED AI FUNCTION for subtopics
 *
 * Simulates fetching subtopic suggestions from an AI service.
 * In a real implementation, this would involve a call to an external AI API.
 *
 * @param {string} topicName The name of the parent topic.
 * @param {number} count The number of subtopic suggestions to generate.
 * @returns {Promise<string[]>} A promise that resolves to an array of subtopic suggestions.
 */
async function mockGetSubtopicSuggestions(topicName: string, count: number): Promise<string[]> {
  console.log(`[MOCK AI] Generating ${count} subtopics for topic: "${topicName}"`);
  const subtopicTemplates = [
    "The Ultimate Guide to {topic}",
    "Understanding the Basics of {topic}",
    "Advanced Techniques in {topic}",
    "How {topic} is Changing the Industry",
    "{topic}: A Beginner's Guide",
    "Common Mistakes to Avoid in {topic}",
    "The Future of {topic}",
    "Case Study: Successful Implementation of {topic}",
    "Top 10 Tools for {topic}",
    "How to Measure the ROI of {topic}",
    "{topic} vs. [Alternative]: A Detailed Comparison",
    "Key Terminology in {topic} Explained",
    "Integrating {topic} with Your Existing Workflow",
    "The Role of AI in {topic}",
    "Data-Driven Decision Making with {topic}",
    "Best Practices for Securing {topic}",
    "How to Create a Strategy for {topic}",
    "The Impact of {topic} on Customer Experience",
    "Optimizing Performance in {topic}",
    "A Deep Dive into the Analytics of {topic}",
    "Ethical Considerations in {topic}",
    "How to Build a Team for {topic}",
    "Troubleshooting Common {topic} Issues",
    "The History and Evolution of {topic}",
    "Future-Proofing Your Skills in {topic}",
    "How {topic} Drives Business Growth",
    "Creating a Business Case for {topic}",
    "The Psychology Behind {topic}",
    "How to Get Started with {topic} in 60 Minutes",
  ];

  // Shuffle and slice to get a random-like subset of templates
  const selectedTemplates = [...subtopicTemplates].sort(() => 0.5 - Math.random()).slice(0, count);
  const mockSubtopics = selectedTemplates.map((template) => template.replace(/{topic}/g, topicName));

  await new Promise((resolve) => setTimeout(resolve, 800));
  return Promise.resolve(mockSubtopics);
}

// ############################################################################
// #
// # TOPIC CLUSTER SERVICE
// #
// ############################################################################

/**
 * Retrieves a list of all topic clusters for a given user.
 *
 * @param supabase - The authenticated Supabase client.
 * @param userId - The UUID of the user.
 * @returns A promise resolving to a list of topic clusters.
 * @throws {DatabaseError} If any database-related error occurs.
 * @throws {InternalDataValidationError} If the data from the database is malformed.
 */
export async function getTopicClusters(supabase: SupabaseClient, userId: string): Promise<TopicClusterDto[]> {
  console.log(`[TopicClusterService] getTopicClusters for user: ${userId}`);
  const { data, error } = await supabase.from("topic_clusters").select("*").eq("user_id", userId).order("name");

  if (error) {
    throw new DatabaseError(`Database error while fetching topic clusters for user: ${userId}`, error);
  }

  const validation = TopicClusterListResponseSchema.safeParse(data);
  if (!validation.success) {
    throw new InternalDataValidationError(
      "Invalid data structure for topic clusters received from database",
      validation.error
    );
  }

  return validation.data;
}

/**
 * Generates topic suggestions using a (mocked) AI service.
 *
 * @param {SupabaseClient} supabase The Supabase client instance.
 * @param {string} userId The ID of the user requesting suggestions.
 * @returns {Promise<TopicClusterSuggestionsDto>} A promise that resolves to a DTO containing topic suggestions.
 * @throws {ProfileNotFoundError} If the user's profile cannot be found.
 * @throws {DatabaseError} If there's an issue communicating with the database.
 * @throws {InternalDataValidationError} If the generated data fails validation.
 */
export async function getTopicSuggestions(
  supabase: SupabaseClient,
  userId: string
): Promise<TopicClusterSuggestionsDto> {
  console.log(`[TopicClusterService] getTopicSuggestions for user: ${userId}`);

  const profile = await getProfile(supabase, userId);

  if (!profile) {
    throw new ProfileNotFoundError();
  }

  // Use mocked AI function to get suggestions
  const suggestions = await mockGetTopicSuggestions(profile.default_topics_count);

  const result: TopicClusterSuggestionsDto = { suggestions };

  // Validate the final DTO before returning
  const validation = TopicClusterSuggestionsDtoSchema.safeParse(result);
  if (!validation.success) {
    // This indicates a mismatch between our logic and the expected output format.
    throw new InternalDataValidationError("Failed to validate topic suggestions DTO", validation.error);
  }

  return validation.data;
}

/**
 * Generates subtopic suggestions for a given topic name using a (mocked) AI service.
 *
 * @param {SupabaseClient} supabase The Supabase client instance.
 * @param {string} userId The ID of the user requesting suggestions.
 * @param {string} topicName The name of the parent topic.
 * @returns {Promise<TopicClusterSuggestionsDto>} A promise that resolves to a DTO containing subtopic suggestions.
 * @throws {ProfileNotFoundError} If the user's profile cannot be found.
 * @throws {MissingProfileConfigurationError} If the default_subtopics_count is not set on the profile.
 * @throws {DatabaseError} If there's an issue communicating with the database.
 * @throws {InternalDataValidationError} If the generated data fails validation.
 */
export async function getSubtopicSuggestions(
  supabase: SupabaseClient,
  userId: string,
  topicName: string
): Promise<TopicClusterSuggestionsDto> {
  console.log(`[TopicClusterService] getSubtopicSuggestions for user: ${userId}, topic: "${topicName}"`);

  // 1. Fetch user's profile to get the default number of subtopics
  const profile = await getProfile(supabase, userId);

  if (!profile) {
    throw new ProfileNotFoundError();
  }

  if (profile.default_subtopics_count === null || profile.default_subtopics_count <= 0) {
    throw new MissingProfileConfigurationError("Default subtopics count is not configured in the user profile.");
  }

  // 2. Use mocked AI function to get subtopic suggestions
  const suggestions = await mockGetSubtopicSuggestions(topicName, profile.default_subtopics_count);

  const result: TopicClusterSuggestionsDto = { suggestions };

  // 3. Validate the final DTO before returning
  const validation = TopicClusterSuggestionsDtoSchema.safeParse(result);
  if (!validation.success) {
    throw new InternalDataValidationError("Failed to validate subtopic suggestions DTO", validation.error);
  }

  return validation.data;
}

/**
 * Creates a new topic cluster for a user.
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
  supabase: SupabaseClient,
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
 * Deletes a topic cluster by its ID.
 *
 * @param supabase - The authenticated Supabase client.
 * @param userId - The UUID of the user who owns the topic cluster.
 * @param topicClusterId - The UUID of the topic cluster to delete.
 * @returns A promise that resolves when the operation is complete.
 * @throws {DatabaseError} If any database-related error occurs.
 * @throws {TopicClusterNotFoundError} If the topic cluster does not exist or belong to the user.
 */
export async function deleteTopicCluster(
  supabase: SupabaseClient,
  userId: string,
  topicClusterId: string
): Promise<void> {
  console.log(`[TopicClusterService] deleteTopicCluster for user: ${userId}, topicClusterId: ${topicClusterId}`);
  const { error, count } = await supabase
    .from("topic_clusters")
    .delete()
    .eq("user_id", userId)
    .eq("id", topicClusterId);

  if (error) {
    throw new DatabaseError(`Database error while deleting topic cluster ${topicClusterId}`, error);
  }

  if (count === 0) {
    throw new TopicClusterNotFoundError(`Topic cluster with ID ${topicClusterId} not found for user ${userId}`);
  }
}

/**
 * Generates SEO-optimized titles for a list of subtopics within a topic cluster.
 *
 * This function orchestrates fetching knowledge base context, generating titles via a mocked AI service,
 * and creating corresponding articles in the database.
 *
 * @param {SupabaseClient} supabase - The Supabase client for database interactions.
 * @param {string} userId - The ID of the user performing the action.
 * @param {string} topicClusterId - The ID of the parent topic cluster.
 * @param {string[]} subtopics - An array of subtopic names to generate titles for.
 * @returns {Promise<void>} A promise that resolves when all articles have been created.
 * @throws {DatabaseError} if there are issues with database operations.
 * @throws {InternalDataValidationError} if the AI's response or database results are malformed.
 */
export async function generateTitlesForSubtopics(
  supabase: SupabaseClient,
  userId: string,
  topicClusterId: string,
  subtopics: string[]
): Promise<void> {
  console.log(`[TopicClusterService] generateTitlesForSubtopics for user: ${userId}, topic: ${topicClusterId}`);

  // 1. Get Knowledge Base context for the user
  const knowledgeBase = await getKnowledgeBase(supabase, userId);
  const context = knowledgeBase
    ? `About Us: ${knowledgeBase.about_us}\nTeam: ${knowledgeBase.team}\nOffer: ${knowledgeBase.offer}`
    : "No context provided.";

  // 2. Mock AI call to generate titles
  const generatedTitles = await mockGenerateSeoTitles(subtopics, context);

  // 3. Validate the AI response
  const validationResult = z.array(z.string()).safeParse(generatedTitles);
  if (!validationResult.success) {
    throw new InternalDataValidationError(
      "Malformed response from AI title generation service",
      validationResult.error
    );
  }

  const validatedTitles = validationResult.data;

  // 4. Create an article for each generated title
  const articlesToInsert = validatedTitles.map((title, index) => ({
    user_id: userId,
    topic_cluster_id: topicClusterId,
    name: subtopics[index], // Original subtopic name
    title: title, // SEO-optimized title from AI
    status: "concept" as const, // Default status
  }));

  const { error } = await supabase.from("articles").insert(articlesToInsert);

  if (error) {
    throw new DatabaseError("Failed to insert new articles with generated titles", error);
  }

  console.log(`Successfully created ${articlesToInsert.length} articles for topic cluster ${topicClusterId}.`);
}

/**
 * MOCKED AI FUNCTION
 * Simulates calling an AI service to generate SEO-optimized titles.
 * @param subtopics - An array of subtopic names.
 * @param context - The user's knowledge base context.
 * @returns A promise that resolves to an array of SEO-optimized titles.
 */
async function mockGenerateSeoTitles(subtopics: string[], context: string): Promise<string[]> {
  console.log("[MOCK AI] Generating SEO titles with context:", context.substring(0, 100) + "...");
  await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate network and processing delay
  return subtopics.map((subtopic) => `SEO Title for: ${subtopic}`);
}
