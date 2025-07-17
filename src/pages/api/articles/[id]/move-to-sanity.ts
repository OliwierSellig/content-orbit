import type { APIRoute } from "astro";
import { moveArticleToSanity } from "../../../../lib/services/article.service";
import {
  createErrorResponse,
  createValidationErrorResponse,
  DatabaseError,
  InternalDataValidationError,
  logError,
  ArticleNotFoundError,
  UnauthorizedError,
} from "../../../../lib/errors";
import { ArticleIdSchema } from "../../../../lib/schemas/article.schemas";
import { validateAuth } from "../../../../lib/utils";

export const prerender = false;

/**
 * POST /api/articles/{id}/move-to-sanity
 *
 * Moves an article to Sanity CMS and updates its status to 'moved'.
 * This is an irreversible operation that uploads the article to Sanity
 * and records the Sanity ID and timestamp in the database.
 *
 * @param id - UUID of the article to move to Sanity (from URL path)
 * @returns 200 OK - with the updated article data including Sanity ID.
 * @returns 400 Bad Request - if the article ID is not a valid UUID.
 * @returns 401 Unauthorized - if user is not authenticated.
 * @returns 404 Not Found - if the article does not exist or doesn't belong to the user.
 * @returns 409 Conflict - if the article has already been moved to Sanity.
 * @returns 500 Internal Server Error - for database errors or other unexpected issues.
 */
export const POST: APIRoute = async ({ locals, params }) => {
  try {
    const { user, supabase } = validateAuth(locals, "POST /api/articles/{id}/move-to-sanity");

    // Validate the article ID parameter from URL
    const validationResult = ArticleIdSchema.safeParse(params);

    if (!validationResult.success) {
      const validationResponse = createValidationErrorResponse("Invalid article ID format", validationResult.error);
      return new Response(JSON.stringify(validationResponse), {
        status: validationResponse.status,
      });
    }

    const { id } = validationResult.data;

    // Move article to Sanity
    const updatedArticle = await moveArticleToSanity(supabase, id, user.id);

    return new Response(JSON.stringify(updatedArticle), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle specific error for article already moved (409 Conflict)
    if (error instanceof DatabaseError && error.message.includes("already been moved")) {
      logError(error);
      const errResponse = createErrorResponse("Conflict", "Article has already been moved to Sanity", 409);
      return new Response(JSON.stringify(errResponse), { status: 409 });
    }

    if (
      error instanceof UnauthorizedError ||
      error instanceof ArticleNotFoundError ||
      error instanceof DatabaseError ||
      error instanceof InternalDataValidationError
    ) {
      logError(error);
      const errResponse = createErrorResponse(error.name, error.message, error.statusCode);
      return new Response(JSON.stringify(errResponse), { status: error.statusCode });
    }

    // Handle any other unexpected errors
    const unexpectedError = new Error("An unexpected error occurred in POST /api/articles/{id}/move-to-sanity");
    logError(unexpectedError, { originalError: error });
    const errResponse = createErrorResponse("Internal Server Error", "An unexpected error occurred", 500);
    return new Response(JSON.stringify(errResponse), { status: 500 });
  }
};
