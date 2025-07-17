import type { APIRoute } from "astro";
import { getTopicSuggestions, getSubtopicSuggestions } from "../../../lib/services/topic-cluster.service";
import {
  createErrorResponse,
  createValidationErrorResponse,
  DatabaseError,
  InternalDataValidationError,
  logError,
  MissingProfileConfigurationError,
  ProfileNotFoundError,
  UnauthorizedError,
} from "../../../lib/errors";
import { GetTopicClusterSuggestionsRequestSchema } from "../../../lib/schemas/topic-cluster.schemas";
import { validateAuth } from "../../../lib/utils";

export const prerender = false;

/**
 * GET /api/topic-clusters/suggestions
 *
 * Generates AI-powered suggestions.
 * - If `topic_name` query parameter is provided, it generates subtopic suggestions for that topic.
 * - Otherwise, it generates general topic cluster suggestions.
 *
 * @returns 200 OK - with a list of suggestions.
 * @returns 400 Bad Request - if `topic_name` is invalid.
 * @returns 401 Unauthorized - if user is not authenticated.
 * @returns 404 Not Found - if the user's profile does not exist.
 * @returns 500 Internal Server Error - for database errors or other unexpected issues.
 */
export const GET: APIRoute = async ({ locals, url }) => {
  try {
    const { user, supabase } = validateAuth(locals, "GET /api/topic-clusters/suggestions");

    const queryParams = {
      topic_name: url.searchParams.get("topic_name") || undefined,
    };

    const validationResult = GetTopicClusterSuggestionsRequestSchema.safeParse(queryParams);

    if (!validationResult.success) {
      const validationResponse = createValidationErrorResponse("Request validation failed", validationResult.error);
      return new Response(JSON.stringify(validationResponse), {
        status: validationResponse.status,
      });
    }

    const { topic_name } = validationResult.data;
    let suggestions;

    if (topic_name) {
      // Generate subtopic suggestions
      suggestions = await getSubtopicSuggestions(supabase, user.id, topic_name);
    } else {
      // Generate main topic suggestions
      suggestions = await getTopicSuggestions(supabase, user.id);
    }

    return new Response(JSON.stringify(suggestions), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (
      error instanceof UnauthorizedError ||
      error instanceof ProfileNotFoundError ||
      error instanceof MissingProfileConfigurationError ||
      error instanceof DatabaseError ||
      error instanceof InternalDataValidationError
    ) {
      logError(error);
      const errResponse = createErrorResponse(error.name, error.message, error.statusCode);
      return new Response(JSON.stringify(errResponse), {
        status: error.statusCode,
      });
    }

    // Handle any other unexpected errors
    const unexpectedError = new Error("An unexpected error occurred in GET /api/topic-clusters/suggestions");
    logError(unexpectedError, { originalError: error });
    const errResponse = createErrorResponse("Internal Server Error", "An unexpected error occurred", 500);
    return new Response(JSON.stringify(errResponse), { status: 500 });
  }
};
