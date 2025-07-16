import type { APIRoute } from "astro";
import { getKnowledgeBase } from "../../lib/services/knowledge-base.service";
import {
  createErrorResponse,
  DatabaseError,
  InternalDataValidationError,
  logError,
  KnowledgeBaseNotFoundError,
  UnauthorizedError,
} from "../../lib/errors";
import { validateAuth } from "../../lib/utils";

export const prerender = false;

/**
 * GET /api/knowledge-base
 *
 * Retrieves the knowledge base for the authenticated user.
 *
 * @returns 200 OK - with knowledge base data.
 * @returns 401 Unauthorized - if user is not authenticated.
 * @returns 404 Not Found - if the user's knowledge base does not exist.
 * @returns 500 Internal Server Error - for database errors or other unexpected issues.
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    const { user, supabase } = validateAuth(locals, "GET /api/knowledge-base");

    const knowledgeBase = await getKnowledgeBase(supabase, user.id);

    if (!knowledgeBase) {
      throw new KnowledgeBaseNotFoundError();
    }

    return new Response(JSON.stringify(knowledgeBase), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (
      error instanceof UnauthorizedError ||
      error instanceof KnowledgeBaseNotFoundError ||
      error instanceof DatabaseError ||
      error instanceof InternalDataValidationError
    ) {
      logError(error);
      const errResponse = createErrorResponse(error.name, error.message, error.statusCode);
      return new Response(JSON.stringify(errResponse), { status: error.statusCode });
    }

    // Handle any other unexpected errors
    const unexpectedError = new Error("An unexpected error occurred in GET /api/knowledge-base");
    logError(unexpectedError, { originalError: error });
    const errResponse = createErrorResponse("Internal Server Error", "An unexpected error occurred", 500);
    return new Response(JSON.stringify(errResponse), { status: 500 });
  }
};
