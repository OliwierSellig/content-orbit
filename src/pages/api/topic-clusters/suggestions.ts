import type { APIRoute } from "astro";
import { getTopicClusterSuggestions } from "../../../lib/services/topic-cluster.service";
import {
  createErrorResponse,
  DatabaseError,
  InternalDataValidationError,
  logError,
  ProfileNotFoundError,
  UnauthorizedError,
} from "../../../lib/errors";
import { validateAuth } from "../../../lib/utils";

export const prerender = false;

/**
 * GET /api/topic-clusters/suggestions
 *
 * Generates AI-powered topic cluster suggestions for the authenticated user.
 * Uses the user's default_topics_count from their profile.
 *
 * @returns 200 OK - with topic cluster suggestions.
 * @returns 401 Unauthorized - if user is not authenticated.
 * @returns 404 Not Found - if the user's profile does not exist.
 * @returns 500 Internal Server Error - for database errors or other unexpected issues.
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    const { user, supabase } = validateAuth(locals, "GET /api/topic-clusters/suggestions");

    // Generate suggestions
    const suggestions = await getTopicClusterSuggestions(supabase, user.id);

    return new Response(JSON.stringify(suggestions), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (
      error instanceof UnauthorizedError ||
      error instanceof ProfileNotFoundError ||
      error instanceof DatabaseError ||
      error instanceof InternalDataValidationError
    ) {
      logError(error);
      const errResponse = createErrorResponse(error.name, error.message, error.statusCode);
      return new Response(JSON.stringify(errResponse), { status: error.statusCode });
    }

    // Handle any other unexpected errors
    const unexpectedError = new Error("An unexpected error occurred in GET /api/topic-clusters/suggestions");
    logError(unexpectedError, { originalError: error });
    const errResponse = createErrorResponse("Internal Server Error", "An unexpected error occurred", 500);
    return new Response(JSON.stringify(errResponse), { status: 500 });
  }
};
