import type { APIRoute } from "astro";
import { listArticles } from "../../../lib/services/article.service";
import {
  createErrorResponse,
  createValidationErrorResponse,
  DatabaseError,
  InternalDataValidationError,
  logError,
  UnauthorizedError,
} from "../../../lib/errors";
import { listArticlesQuerySchema } from "../../../lib/schemas/article.schemas";
import { validateAuth } from "../../../lib/utils";

export const prerender = false;

/**
 * GET /api/articles
 *
 * Retrieves a paginated and filtered list of articles belonging to the authenticated user.
 * For performance reasons, the response does not include the full content (`content`) of each article.
 *
 * @param topic_cluster_id (required) - UUID of the topic cluster to filter articles by
 * @param status (optional) - Filter articles by status: concept, in_progress, moved
 * @param sort_by (optional) - Field to sort by: name, created_at, updated_at, status (default: created_at)
 * @param order (optional) - Sort direction: asc, desc (default: desc)
 * @param page (optional) - Page number to fetch (default: 1)
 * @param limit (optional) - Number of results per page (default: 10, max: 100)
 *
 * @returns 200 OK - with paginated list of articles and pagination metadata
 * @returns 400 Bad Request - if query parameter validation fails
 * @returns 401 Unauthorized - if user is not authenticated
 * @returns 500 Internal Server Error - for database errors or other unexpected issues
 */
export const GET: APIRoute = async ({ locals, url }) => {
  try {
    const { supabase } = validateAuth(locals, "GET /api/articles");

    // Parse query parameters from URL
    const searchParams = url.searchParams;
    const queryParams = {
      topic_cluster_id: searchParams.get("topic_cluster_id"),
      status: searchParams.get("status"),
      sort_by: searchParams.get("sort_by"),
      order: searchParams.get("order"),
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
    };

    // Filter out null values for cleaner validation
    const filteredParams = Object.fromEntries(Object.entries(queryParams).filter(([, value]) => value !== null));

    // Validate query parameters
    const validationResult = listArticlesQuerySchema.safeParse(filteredParams);

    if (!validationResult.success) {
      const validationResponse = createValidationErrorResponse(
        "Query parameter validation failed",
        validationResult.error
      );
      return new Response(JSON.stringify(validationResponse), {
        status: validationResponse.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Call service to get articles
    const result = await listArticles(supabase, validationResult.data);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (
      error instanceof UnauthorizedError ||
      error instanceof DatabaseError ||
      error instanceof InternalDataValidationError
    ) {
      logError(error);
      const errResponse = createErrorResponse(error.name, error.message, error.statusCode);
      return new Response(JSON.stringify(errResponse), {
        status: error.statusCode,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle any other unexpected errors
    const unexpectedError = new Error("An unexpected error occurred in GET /api/articles");
    logError(unexpectedError, { originalError: error });
    const errResponse = createErrorResponse("Internal Server Error", "An unexpected error occurred", 500);
    return new Response(JSON.stringify(errResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
