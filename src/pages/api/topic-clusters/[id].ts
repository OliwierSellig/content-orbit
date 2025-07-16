import type { APIRoute } from "astro";
import { getTopicClusterById, deleteTopicCluster } from "../../../lib/services/topic-cluster.service";
import {
  createErrorResponse,
  createValidationErrorResponse,
  DatabaseError,
  InternalDataValidationError,
  logError,
  UnauthorizedError,
  TopicClusterNotFoundError,
} from "../../../lib/errors";
import { TopicClusterIdSchema } from "../../../lib/schemas/topic-cluster.schemas";
import { validateAuth } from "../../../lib/utils";

export const prerender = false;

/**
 * GET /api/topic-clusters/{id}
 *
 * Retrieves a single topic cluster by ID for the authenticated user.
 *
 * @returns 200 OK - with topic cluster data
 * @returns 400 Bad Request - if ID parameter is invalid
 * @returns 401 Unauthorized - if user is not authenticated
 * @returns 404 Not Found - if topic cluster doesn't exist or doesn't belong to user
 * @returns 500 Internal Server Error - for database errors or other unexpected issues
 */
export const GET: APIRoute = async ({ locals, params }) => {
  try {
    const { user, supabase } = validateAuth(locals, "GET /api/topic-clusters/[id]");

    // Validate ID parameter
    const validationResult = TopicClusterIdSchema.safeParse({ id: params.id });

    if (!validationResult.success) {
      const validationResponse = createValidationErrorResponse("Invalid topic cluster ID", validationResult.error);
      return new Response(JSON.stringify(validationResponse), {
        status: validationResponse.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get topic cluster from service
    const topicCluster = await getTopicClusterById(supabase, user.id, validationResult.data.id);

    if (!topicCluster) {
      throw new TopicClusterNotFoundError();
    }

    return new Response(JSON.stringify(topicCluster), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (
      error instanceof UnauthorizedError ||
      error instanceof DatabaseError ||
      error instanceof InternalDataValidationError ||
      error instanceof TopicClusterNotFoundError
    ) {
      logError(error);
      const errResponse = createErrorResponse(error.name, error.message, error.statusCode);
      return new Response(JSON.stringify(errResponse), {
        status: error.statusCode,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle any other unexpected errors
    const unexpectedError = new Error("An unexpected error occurred in GET /api/topic-clusters/[id]");
    logError(unexpectedError, { originalError: error });
    const errResponse = createErrorResponse("Internal Server Error", "An unexpected error occurred", 500);
    return new Response(JSON.stringify(errResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * DELETE /api/topic-clusters/{id}
 *
 * Permanently deletes a topic cluster and all associated articles.
 * This is a destructive operation that cannot be undone.
 *
 * @returns 204 No Content - successful deletion
 * @returns 400 Bad Request - if ID parameter is invalid
 * @returns 401 Unauthorized - if user is not authenticated
 * @returns 404 Not Found - if topic cluster doesn't exist or doesn't belong to user
 * @returns 500 Internal Server Error - for database errors or other unexpected issues
 */
export const DELETE: APIRoute = async ({ locals, params }) => {
  try {
    const { user, supabase } = validateAuth(locals, "DELETE /api/topic-clusters/[id]");

    // Validate ID parameter
    const validationResult = TopicClusterIdSchema.safeParse({ id: params.id });

    if (!validationResult.success) {
      const validationResponse = createValidationErrorResponse("Invalid topic cluster ID", validationResult.error);
      return new Response(JSON.stringify(validationResponse), {
        status: validationResponse.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Delete the topic cluster
    await deleteTopicCluster(supabase, user.id, validationResult.data.id);

    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    if (
      error instanceof UnauthorizedError ||
      error instanceof DatabaseError ||
      error instanceof InternalDataValidationError ||
      error instanceof TopicClusterNotFoundError
    ) {
      logError(error);
      const errResponse = createErrorResponse(error.name, error.message, error.statusCode);
      return new Response(JSON.stringify(errResponse), {
        status: error.statusCode,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle any other unexpected errors
    const unexpectedError = new Error("An unexpected error occurred in DELETE /api/topic-clusters/[id]");
    logError(unexpectedError, { originalError: error });
    const errResponse = createErrorResponse("Internal Server Error", "An unexpected error occurred", 500);
    return new Response(JSON.stringify(errResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
