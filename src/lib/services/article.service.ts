import type { SupabaseClient } from "@supabase/supabase-js";
import type { ArticleListItemDto, ListArticlesQuery, Pagination, ArticleDto } from "../../types";
import { DatabaseError, ArticleNotFoundError } from "../errors";
import type { UpdateArticleRequest } from "../schemas/article.schemas";

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
