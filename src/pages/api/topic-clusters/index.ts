import type { APIRoute } from "astro";
import { getTopicClusters, createTopicCluster } from "../../../lib/services/topic-cluster.service";
import {
  createErrorResponse,
  createValidationErrorResponse,
  DatabaseError,
  InternalDataValidationError,
  logError,
  UnauthorizedError,
  TopicClusterNameConflictError,
} from "../../../lib/errors";
import {
  ListTopicClustersQuerySchema,
  CreateTopicClusterRequestSchema,
} from "../../../lib/schemas/topic-cluster.schemas";
import { validateAuth } from "../../../lib/utils";

export const prerender = false;

/**
 * GET /api/topic-clusters
 *
 * Retrieves a list of topic clusters for the authenticated user.
 * Supports pagination, sorting, search, and optional article inclusion.
 *
 * Query Parameters:
 * - sort_by (optional): Field to sort by. Allowed values: 'name', 'created_at'. Default: 'created_at'
 * - order (optional): Sort direction. Allowed values: 'asc', 'desc'. Default: 'desc'
 * - page (optional): Page number to retrieve. Default: 1 (ignored when search is provided)
 * - limit (optional): Number of items per page. Default: 10 (ignored when search is provided)
 * - includeArticles (optional): If 'true', includes articles for each cluster. Default: false
 * - search (optional): Search term to filter clusters (and articles if includeArticles=true) by name
 *
 * Note: When search parameter is provided, pagination is disabled and all matching results are returned.
 *
 * @returns 200 OK - with topic clusters data (paginated if no search, all results if search provided)
 * @returns 400 Bad Request - if query parameters are invalid
 * @returns 401 Unauthorized - if user is not authenticated
 * @returns 500 Internal Server Error - for database errors or other unexpected issues
 */
export const GET: APIRoute = async ({ locals, url }) => {
  try {
    const { user, supabase } = validateAuth(locals, "GET /api/topic-clusters");

    // Extract and validate query parameters
    const queryParams = {
      sort_by: url.searchParams.get("sort_by") || undefined,
      order: url.searchParams.get("order") || undefined,
      page: url.searchParams.get("page") || undefined,
      limit: url.searchParams.get("limit") || undefined,
      includeArticles: url.searchParams.get("includeArticles") || undefined,
      search: url.searchParams.get("search") || undefined,
      fetchAll: url.searchParams.get("fetchAll") || undefined,
    };

    const validationResult = ListTopicClustersQuerySchema.safeParse(queryParams);

    if (!validationResult.success) {
      const validationResponse = createValidationErrorResponse("Invalid query parameters", validationResult.error);
      return new Response(JSON.stringify(validationResponse), {
        status: validationResponse.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { includeArticles, search, page, limit, sort_by, order, fetchAll } = validationResult.data;

    if (search) {
      // Search logic returns a flat array
      const topicClusters = await getTopicClusters(supabase, user.id, {
        includeArticles,
        search,
        sortBy: sort_by,
        order,
      });

      return new Response(JSON.stringify(topicClusters), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Paginated logic returns { clusters, total }
    const result = await getTopicClusters(supabase, user.id, {
      includeArticles,
      page,
      limit,
      sortBy: sort_by,
      order,
      fetchAll,
    });

    // We need to type guard here because getTopicClusters has a complex return type
    if ("clusters" in result && "total" in result) {
      return new Response(JSON.stringify({ data: result.clusters, total: result.total }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fallback for unexpected return type, though it shouldn't be reached in paginated path
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
    const unexpectedError = new Error("An unexpected error occurred in GET /api/topic-clusters");
    logError(unexpectedError, { originalError: error });
    const errResponse = createErrorResponse("Internal Server Error", "An unexpected error occurred", 500);
    return new Response(JSON.stringify(errResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * POST /api/topic-clusters
 *
 * Creates a new topic cluster for the authenticated user.
 *
 * Request Body:
 * - name (required): The name of the topic cluster. Must be unique (case-insensitive) for the user.
 *
 * @returns 201 Created - with the created topic cluster data
 * @returns 400 Bad Request - if request body validation fails
 * @returns 401 Unauthorized - if user is not authenticated
 * @returns 409 Conflict - if a topic cluster with the same name already exists
 * @returns 500 Internal Server Error - for database errors or other unexpected issues
 */
export const POST: APIRoute = async ({ locals, request }) => {
  try {
    const { user, supabase } = validateAuth(locals, "POST /api/topic-clusters");

    // Parse request body
    let requestBody;
    try {
      requestBody = await request.json();
    } catch {
      const errResponse = createErrorResponse("Bad Request", "Invalid JSON in request body", 400);
      return new Response(JSON.stringify(errResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate request body
    const validationResult = CreateTopicClusterRequestSchema.safeParse(requestBody);

    if (!validationResult.success) {
      const validationResponse = createValidationErrorResponse("Request validation failed", validationResult.error);
      return new Response(JSON.stringify(validationResponse), {
        status: validationResponse.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create the topic cluster
    const newTopicCluster = await createTopicCluster(supabase, user.id, validationResult.data);

    return new Response(JSON.stringify(newTopicCluster), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (
      error instanceof UnauthorizedError ||
      error instanceof DatabaseError ||
      error instanceof InternalDataValidationError ||
      error instanceof TopicClusterNameConflictError
    ) {
      logError(error);
      const errResponse = createErrorResponse(error.name, error.message, error.statusCode);
      return new Response(JSON.stringify(errResponse), {
        status: error.statusCode,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle any other unexpected errors
    const unexpectedError = new Error("An unexpected error occurred in POST /api/topic-clusters");
    logError(unexpectedError, { originalError: error });
    const errResponse = createErrorResponse("Internal Server Error", "An unexpected error occurred", 500);
    return new Response(JSON.stringify(errResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
