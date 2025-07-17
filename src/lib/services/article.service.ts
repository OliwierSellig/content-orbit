import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ArticleListItemDto,
  ListArticlesQuery,
  Pagination,
  ArticleDto,
  CreateArticleCommand,
  RunAuditResponseDto,
  AuditFindingDto,
} from "../../types";
import { DatabaseError, ArticleNotFoundError, TopicClusterNotFoundError, CustomAuditNotFoundError } from "../errors";
import type { UpdateArticleRequest } from "../schemas/article.schemas";

/**
 * MOCKED AI FUNCTION
 *
 * Simulates calling an AI service to generate article metadata.
 * In a real implementation, this would involve a call to an external AI API like OpenRouter.
 *
 * @param {string} name The name/subtopic for which to generate metadata
 * @returns {Promise<object>} A promise that resolves to generated article metadata
 */
async function mockGenerateArticleMetadata(name: string): Promise<{
  title: string;
  slug: string;
  description: string;
  seo_title: string;
  seo_description: string;
}> {
  console.log(`[MOCK AI] Generating article metadata for: "${name}"`);

  // Simulate processing delay
  await new Promise((resolve) => setTimeout(resolve, 1200));

  // Generate mock metadata based on the name
  const title = `AI-Generated: ${name}`;
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const description = `This article explores various aspects of ${name}, providing comprehensive insights and practical information.`;
  const seo_title = `${name} - Complete Guide`;
  const seo_description = `Discover everything about ${name}. Expert insights, best practices, and detailed analysis.`;

  return {
    title,
    slug,
    description,
    seo_title,
    seo_description,
  };
}

/**
 * Creates a new article concept with AI-generated metadata.
 *
 * First validates that the topic cluster exists and belongs to the user,
 * then generates AI metadata, and finally creates the complete article record.
 *
 * @param {SupabaseClient} supabase The authenticated Supabase client
 * @param {CreateArticleCommand} command The article creation data
 * @param {string} userId The ID of the user creating the article
 * @returns {Promise<ArticleDto>} A promise that resolves to the created article
 * @throws {TopicClusterNotFoundError} If the topic cluster doesn't exist or doesn't belong to the user
 * @throws {DatabaseError} If there's an issue with database operations
 */
export async function createArticleConcept(
  supabase: SupabaseClient,
  command: CreateArticleCommand,
  userId: string
): Promise<ArticleDto> {
  console.log(`[ArticleService] createArticleConcept for user: ${userId}, topic_cluster: ${command.topic_cluster_id}`);

  // 1. Verify that the topic cluster exists and belongs to the user
  const { data: topicCluster, error: clusterError } = await supabase
    .from("topic_clusters")
    .select("id")
    .eq("id", command.topic_cluster_id)
    .eq("user_id", userId)
    .single();

  if (clusterError || !topicCluster) {
    throw new TopicClusterNotFoundError("Topic cluster not found or does not belong to this user");
  }

  // 2. Generate AI metadata first
  const aiMetadata = await mockGenerateArticleMetadata(command.name);

  // 3. Create the complete article record with AI-generated data
  const { data: createdArticle, error: createError } = await supabase
    .from("articles")
    .insert({
      topic_cluster_id: command.topic_cluster_id,
      name: command.name.trim(),
      status: "concept",
      title: aiMetadata.title,
      slug: aiMetadata.slug,
      description: aiMetadata.description,
      seo_title: aiMetadata.seo_title,
      seo_description: aiMetadata.seo_description,
      content: null,
      sanity_id: null,
      moved_to_sanity_at: null,
    })
    .select("*")
    .single();

  if (createError) {
    throw new DatabaseError(`Failed to create article record for user: ${userId}`, createError);
  }

  console.log(`[ArticleService] Successfully created article concept: ${createdArticle.id}`);
  return createdArticle as ArticleDto;
}

/**
 * MOCKED AI FUNCTION for article content generation
 *
 * Simulates calling an AI service to generate full article content in Markdown format.
 * In a real implementation, this would involve a call to an external AI API like OpenRouter.
 *
 * @param {string} title The title of the article
 * @param {string} description The description of the article
 * @returns {Promise<string>} A promise that resolves to generated Markdown content
 */
async function mockGenerateArticleContent(title: string, description: string): Promise<string> {
  console.log(`[MOCK AI] Generating article content for title: "${title}"`);

  // Simulate processing delay
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Generate mock Markdown content based on title and description
  const content = `# ${title}

## Introduction

${description}

## Overview

This comprehensive guide explores the key concepts and practical applications related to the topic. Our analysis is based on extensive research and real-world experience in the field.

### Key Points

- **Point 1**: Understanding the fundamental principles is crucial for success
- **Point 2**: Implementation requires careful planning and execution
- **Point 3**: Best practices ensure optimal results and minimize risks

## Main Content

### Section 1: Getting Started

To begin with this topic, it's important to understand the basic requirements and prerequisites. The following steps will guide you through the initial setup process:

1. **Preparation**: Gather all necessary resources and tools
2. **Planning**: Create a detailed implementation strategy
3. **Execution**: Follow the step-by-step guidelines carefully

### Section 2: Advanced Techniques

Once you've mastered the basics, you can explore more advanced approaches:

\`\`\`
// Example code block
function example() {
  return "This is a sample code snippet";
}
\`\`\`

### Section 3: Best Practices

Here are some proven strategies for achieving optimal results:

> **Important Note**: Always test your implementation in a controlled environment before deploying to production.

- Regular monitoring and maintenance
- Documentation of all processes
- Continuous improvement and optimization

## Conclusion

In summary, this topic requires a thorough understanding of both theoretical concepts and practical implementation details. By following the guidelines outlined in this article, you can achieve successful results.

### Next Steps

1. Review the key concepts covered
2. Plan your implementation approach
3. Begin with small-scale testing
4. Scale up gradually based on results

For more information and advanced topics, consider exploring additional resources and staying updated with the latest developments in the field.`;

  return content;
}

/**
 * Generates article content using AI and updates the article in the database.
 *
 * Retrieves the article, validates ownership, generates content using AI,
 * and updates the article's content field with the generated Markdown.
 *
 * @param {SupabaseClient} supabase The authenticated Supabase client
 * @param {string} articleId The ID of the article to generate content for
 * @param {string} userId The ID of the user requesting the generation
 * @returns {Promise<ArticleDto>} A promise that resolves to the updated article
 * @throws {ArticleNotFoundError} If the article doesn't exist or doesn't belong to the user
 * @throws {DatabaseError} If there's an issue with database operations
 */
export async function generateArticleBody(
  supabase: SupabaseClient,
  articleId: string,
  userId: string
): Promise<ArticleDto> {
  console.log(`[ArticleService] generateArticleBody for user: ${userId}, article: ${articleId}`);

  // 1. Fetch the article and verify ownership
  const { data: article, error: fetchError } = await supabase.from("articles").select("*").eq("id", articleId).single();

  if (fetchError || !article) {
    throw new ArticleNotFoundError("Article not found or does not belong to this user");
  }

  // 2. Verify that the article's topic cluster belongs to the user
  const { data: topicCluster, error: clusterError } = await supabase
    .from("topic_clusters")
    .select("id")
    .eq("id", article.topic_cluster_id)
    .eq("user_id", userId)
    .single();

  if (clusterError || !topicCluster) {
    throw new ArticleNotFoundError("Article not found or does not belong to this user");
  }

  // 3. Ensure article has title and description for content generation
  if (!article.title || !article.description) {
    throw new DatabaseError("Article must have title and description before generating content");
  }

  // 3. Generate content using mocked AI
  const generatedContent = await mockGenerateArticleContent(article.title, article.description);

  // 4. Update the article with generated content
  const { data: updatedArticle, error: updateError } = await supabase
    .from("articles")
    .update({
      content: generatedContent,
    })
    .eq("id", articleId)
    .select("*")
    .single();

  if (updateError) {
    throw new DatabaseError(`Failed to update article content for article: ${articleId}`, updateError);
  }

  console.log(`[ArticleService] Successfully generated content for article: ${articleId}`);
  return updatedArticle as ArticleDto;
}

/**
 * MOCKED AI FUNCTION for custom audit
 *
 * Simulates running a custom audit on article content using AI.
 * In a real implementation, this would involve a call to an external AI API.
 *
 * @param {string} content The article content to audit
 * @param {string} prompt The custom audit prompt
 * @returns {Promise<AuditFindingDto[]>} A promise that resolves to audit findings
 */
async function mockRunCustomAudit(content: string, prompt: string): Promise<AuditFindingDto[]> {
  console.log(`[MOCK AI] Running custom audit with prompt: "${prompt.substring(0, 50)}..."`);

  // Simulate processing delay
  await new Promise((resolve) => setTimeout(resolve, 1800));

  // Generate mock audit findings based on content and prompt
  const findings: AuditFindingDto[] = [
    {
      type: "warning",
      message: "This sentence uses passive voice which may reduce clarity and engagement.",
      offending_text: "The implementation was completed by the development team.",
    },
    {
      type: "suggestion",
      message: "Consider adding more specific examples to illustrate this concept.",
      offending_text: "This approach provides several benefits for users.",
    },
    {
      type: "warning",
      message: "This paragraph contains a very long sentence that might be difficult to read.",
      offending_text:
        "The comprehensive solution that we have developed includes multiple components that work together to provide a seamless experience for all users regardless of their technical background or expertise level.",
    },
    {
      type: "suggestion",
      message: "Consider using more descriptive headings to improve content structure.",
      offending_text: "## Overview",
    },
  ];

  // Return a subset of findings to simulate variable audit results
  const numberOfFindings = Math.floor(Math.random() * findings.length) + 1;
  return findings.slice(0, numberOfFindings);
}

/**
 * Runs a custom audit on an article using AI and returns findings.
 *
 * Retrieves the article and custom audit, validates ownership,
 * and uses AI to analyze the content against the audit criteria.
 *
 * @param {SupabaseClient} supabase The authenticated Supabase client
 * @param {string} articleId The ID of the article to audit
 * @param {string} auditId The ID of the custom audit to run
 * @param {string} userId The ID of the user requesting the audit
 * @returns {Promise<RunAuditResponseDto>} A promise that resolves to audit findings
 * @throws {ArticleNotFoundError} If the article doesn't exist or doesn't belong to the user
 * @throws {CustomAuditNotFoundError} If the custom audit doesn't exist or doesn't belong to the user
 * @throws {DatabaseError} If there's an issue with database operations
 */
export async function runCustomAudit(
  supabase: SupabaseClient,
  articleId: string,
  auditId: string,
  userId: string
): Promise<RunAuditResponseDto> {
  console.log(`[ArticleService] runCustomAudit for user: ${userId}, article: ${articleId}, audit: ${auditId}`);

  // 1. Fetch the article and verify ownership
  const { data: article, error: articleError } = await supabase
    .from("articles")
    .select("*")
    .eq("id", articleId)
    .single();

  if (articleError || !article) {
    throw new ArticleNotFoundError("Article not found or does not belong to this user");
  }

  // 2. Verify that the article's topic cluster belongs to the user
  const { data: topicCluster, error: clusterError } = await supabase
    .from("topic_clusters")
    .select("id")
    .eq("id", article.topic_cluster_id)
    .eq("user_id", userId)
    .single();

  if (clusterError || !topicCluster) {
    throw new ArticleNotFoundError("Article not found or does not belong to this user");
  }

  // 3. Fetch the custom audit and verify ownership
  const { data: customAudit, error: auditError } = await supabase
    .from("custom_audits")
    .select("*")
    .eq("id", auditId)
    .eq("user_id", userId)
    .single();

  if (auditError || !customAudit) {
    throw new CustomAuditNotFoundError("Custom audit not found or does not belong to this user");
  }

  // 4. Ensure article has content to audit
  if (!article.content) {
    throw new DatabaseError("Article must have content before running an audit");
  }

  // 5. Run the custom audit using mocked AI
  const findings = await mockRunCustomAudit(article.content, customAudit.prompt);

  const result: RunAuditResponseDto = { findings };

  console.log(`[ArticleService] Custom audit completed with ${findings.length} findings`);
  return result;
}

/**
 * MOCKED SANITY API FUNCTION
 *
 * Simulates uploading an article to Sanity CMS.
 * In a real implementation, this would involve a call to the Sanity API.
 *
 * @param {ArticleDto} article The article data to upload to Sanity
 * @returns {Promise<string>} A promise that resolves to a mock Sanity document ID
 */
async function mockUploadToSanity(article: ArticleDto): Promise<string> {
  console.log(`[MOCK SANITY] Uploading article to Sanity: "${article.title}"`);

  // Simulate processing delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Generate a mock Sanity ID
  const mockSanityId = `sanity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  console.log(`[MOCK SANITY] Article uploaded successfully with ID: ${mockSanityId}`);
  return mockSanityId;
}

/**
 * Moves an article to Sanity CMS and updates its status.
 *
 * Retrieves the article, validates ownership and status, uploads to Sanity,
 * and updates the article with the Sanity ID and moved status.
 *
 * @param {SupabaseClient} supabase The authenticated Supabase client
 * @param {string} articleId The ID of the article to move to Sanity
 * @param {string} userId The ID of the user requesting the move
 * @returns {Promise<ArticleDto>} A promise that resolves to the updated article
 * @throws {ArticleNotFoundError} If the article doesn't exist or doesn't belong to the user
 * @throws {DatabaseError} If there's an issue with database operations or if article is already moved
 */
export async function moveArticleToSanity(
  supabase: SupabaseClient,
  articleId: string,
  userId: string
): Promise<ArticleDto> {
  console.log(`[ArticleService] moveArticleToSanity for user: ${userId}, article: ${articleId}`);

  // 1. Fetch the article and verify ownership
  const { data: article, error: fetchError } = await supabase.from("articles").select("*").eq("id", articleId).single();

  if (fetchError || !article) {
    throw new ArticleNotFoundError("Article not found or does not belong to this user");
  }

  // 2. Verify that the article's topic cluster belongs to the user
  const { data: topicCluster, error: clusterError } = await supabase
    .from("topic_clusters")
    .select("id")
    .eq("id", article.topic_cluster_id)
    .eq("user_id", userId)
    .single();

  if (clusterError || !topicCluster) {
    throw new ArticleNotFoundError("Article not found or does not belong to this user");
  }

  // 3. Check if article is already moved
  if (article.status === "moved") {
    throw new DatabaseError("Article has already been moved to Sanity", undefined);
  }

  // 3. Upload to Sanity using mocked API
  const sanityId = await mockUploadToSanity(article as ArticleDto);

  // 4. Update the article with Sanity information
  const { data: updatedArticle, error: updateError } = await supabase
    .from("articles")
    .update({
      status: "moved",
      sanity_id: sanityId,
      moved_to_sanity_at: new Date().toISOString(),
    })
    .eq("id", articleId)
    .select("*")
    .single();

  if (updateError) {
    throw new DatabaseError(`Failed to update article after Sanity upload for article: ${articleId}`, updateError);
  }

  console.log(`[ArticleService] Successfully moved article to Sanity: ${articleId}`);
  return updatedArticle as ArticleDto;
}

/**
 * Response type for the listArticles function.
 */
interface ListArticlesResponse {
  data: ArticleListItemDto[];
  pagination: Pagination;
}

/**
 * Retrieves a paginated list of articles for a user, filtered by topic cluster.
 * Returns only essential fields (id, topic_cluster_id, timestamps, status, name, slug)
 * for optimal performance. Excludes content, SEO fields, and other detailed information.
 *
 * @param supabase - Authenticated Supabase client with user context
 * @param query - Validated query parameters for filtering, sorting, and pagination
 * @returns Promise resolving to articles list with pagination metadata
 * @throws {DatabaseError} When database operations fail
 */
export async function listArticles(supabase: SupabaseClient, query: ListArticlesQuery): Promise<ListArticlesResponse> {
  try {
    // Build the base query with minimal field selection for performance
    let articlesQuery = supabase
      .from("articles")
      .select(
        `
        id,
        topic_cluster_id,
        created_at,
        updated_at,
        status,
        name,
        slug
      `
      )
      .eq("topic_cluster_id", query.topic_cluster_id);

    // Add optional status filter
    if (query.status) {
      articlesQuery = articlesQuery.eq("status", query.status);
    }

    // Add sorting
    const sortColumn = query.sort_by || "created_at";
    const sortOrder = query.order || "desc";
    articlesQuery = articlesQuery.order(sortColumn, { ascending: sortOrder === "asc" });

    // Build count query with same filters
    let countQuery = supabase
      .from("articles")
      .select("*", { count: "exact", head: true })
      .eq("topic_cluster_id", query.topic_cluster_id);

    if (query.status) {
      countQuery = countQuery.eq("status", query.status);
    }

    // Execute count query for pagination metadata
    const { count, error: countError } = await countQuery;

    if (countError) {
      throw new DatabaseError("Failed to retrieve articles count", new Error(countError.message));
    }

    // Calculate pagination
    const page = query.page || 1;
    const limit = query.limit || 10;
    const total = count || 0;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;

    // Execute paginated query
    const { data: articles, error: articlesError } = await articlesQuery.range(offset, offset + limit - 1);

    if (articlesError) {
      throw new DatabaseError("Failed to retrieve articles", new Error(articlesError.message));
    }

    // Ensure data is in expected format
    const articlesList: ArticleListItemDto[] = articles || [];

    return {
      data: articlesList,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }

    // Handle any unexpected errors
    throw new DatabaseError("An unexpected error occurred while retrieving articles", error as Error);
  }
}

/**
 * Retrieves a single article by its ID.
 *
 * @param supabase - Authenticated Supabase client with user context
 * @param articleId - UUID of the article to retrieve
 * @returns Promise resolving to the full article data
 * @throws {ArticleNotFoundError} When article is not found or user has no access
 * @throws {DatabaseError} When database operations fail
 */
export async function getArticleById(supabase: SupabaseClient, articleId: string): Promise<ArticleDto> {
  try {
    const { data: article, error } = await supabase.from("articles").select("*").eq("id", articleId).single();

    if (error) {
      // PGRST116 = Not Found - either doesn't exist or user has no access (RLS)
      if (error.code === "PGRST116") {
        throw new ArticleNotFoundError();
      }
      throw new DatabaseError("Failed to retrieve article", new Error(error.message));
    }

    return article;
  } catch (error) {
    if (error instanceof ArticleNotFoundError || error instanceof DatabaseError) {
      throw error;
    }

    // Handle any unexpected errors
    throw new DatabaseError("An unexpected error occurred while retrieving article", error as Error);
  }
}

/**
 * Updates an existing article with the provided data.
 *
 * @param supabase - Authenticated Supabase client with user context
 * @param articleId - UUID of the article to update
 * @param updateData - Partial article data to update
 * @returns Promise resolving to the updated article
 * @throws {ArticleNotFoundError} When article is not found or user has no access
 * @throws {DatabaseError} When database operations fail
 */
export async function updateArticle(
  supabase: SupabaseClient,
  articleId: string,
  updateData: UpdateArticleRequest
): Promise<ArticleDto> {
  try {
    // First check if article exists to provide proper 404 error
    await getArticleById(supabase, articleId);

    // Perform the update with automatic updated_at timestamp
    const { data: updatedArticle, error } = await supabase
      .from("articles")
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", articleId)
      .select("*")
      .single();

    if (error) {
      throw new DatabaseError("Failed to update article", new Error(error.message));
    }

    return updatedArticle;
  } catch (error) {
    if (error instanceof ArticleNotFoundError || error instanceof DatabaseError) {
      throw error;
    }

    // Handle any unexpected errors
    throw new DatabaseError("An unexpected error occurred while updating article", error as Error);
  }
}

/**
 * Deletes an article by its ID.
 *
 * @param supabase - Authenticated Supabase client with user context
 * @param articleId - UUID of the article to delete
 * @returns Promise that resolves when deletion is complete
 * @throws {ArticleNotFoundError} When article is not found or user has no access
 * @throws {DatabaseError} When database operations fail
 */
export async function deleteArticle(supabase: SupabaseClient, articleId: string): Promise<void> {
  try {
    // First check if article exists to provide proper 404 error
    await getArticleById(supabase, articleId);

    // Perform the deletion
    const { error } = await supabase.from("articles").delete().eq("id", articleId);

    if (error) {
      throw new DatabaseError("Failed to delete article", new Error(error.message));
    }
  } catch (error) {
    if (error instanceof ArticleNotFoundError || error instanceof DatabaseError) {
      throw error;
    }

    // Handle any unexpected errors
    throw new DatabaseError("An unexpected error occurred while deleting article", error as Error);
  }
}
