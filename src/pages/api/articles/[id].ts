import type { APIRoute } from "astro";
import { getArticleById, updateArticle, deleteArticle } from "../../../lib/services/article.service";
import {
  createErrorResponse,
  createValidationErrorResponse,
  DatabaseError,
  InternalDataValidationError,
  logError,
  UnauthorizedError,
  ArticleNotFoundError,
} from "../../../lib/errors";
import {
  getArticleParamsSchema,
  updateArticleParamsSchema,
  updateArticleRequestSchema,
  deleteArticleParamsSchema,
} from "../../../lib/schemas/article.schemas";
import { validateAuth } from "../../../lib/utils";

export const prerender = false;

/**
 * GET /api/articles/{id}
 *
 * Retrieves detailed information about a single article based on its unique identifier (ID).
 * The response includes all fields of the article object, including its full content.
 *
 * @param id (required) - UUID of the article to retrieve
 *
 * @returns 200 OK - with full article object
 * @returns 400 Bad Request - if ID validation fails (not a valid UUID)
 * @returns 401 Unauthorized - if user is not authenticated
 * @returns 404 Not Found - if article with given ID doesn't exist or user has no access
 * @returns 500 Internal Server Error - for database errors or other unexpected issues
 */
export const GET: APIRoute = async ({ locals, params }) => {
  try {
    const { supabase } = validateAuth(locals, "GET /api/articles/{id}");

    // Validate article ID from path parameters
    const validationResult = getArticleParamsSchema.safeParse(params);

    if (!validationResult.success) {
      const validationResponse = createValidationErrorResponse("Article ID validation failed", validationResult.error);
      return new Response(JSON.stringify(validationResponse), {
        status: validationResponse.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get article by ID
    const article = await getArticleById(supabase, validationResult.data.id);

    return new Response(JSON.stringify(article), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      logError(error);
      const errResponse = createErrorResponse(error.name, error.message, error.statusCode);
      return new Response(JSON.stringify(errResponse), {
        status: error.statusCode,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (error instanceof ArticleNotFoundError) {
      const errResponse = createErrorResponse(error.name, error.message, error.statusCode);
      return new Response(JSON.stringify(errResponse), {
        status: error.statusCode,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (error instanceof DatabaseError || error instanceof InternalDataValidationError) {
      logError(error);
      const errResponse = createErrorResponse(error.name, error.message, error.statusCode);
      return new Response(JSON.stringify(errResponse), {
        status: error.statusCode,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle any other unexpected errors
    const unexpectedError = new Error("An unexpected error occurred in GET /api/articles/{id}");
    logError(unexpectedError, { originalError: error });
    const errResponse = createErrorResponse("Internal Server Error", "An unexpected error occurred", 500);
    return new Response(JSON.stringify(errResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * PATCH /api/articles/{id}
 *
 * Allows partial update of an existing article. Enables modification of selected fields
 * such as name, content, or status without needing to send the entire object.
 *
 * @param id (required) - UUID of the article to update
 * @param body - JSON object containing fields to update (all fields are optional)
 *
 * @returns 200 OK - with updated full article object
 * @returns 400 Bad Request - if ID validation or request body validation fails
 * @returns 401 Unauthorized - if user is not authenticated
 * @returns 404 Not Found - if article with given ID doesn't exist
 * @returns 500 Internal Server Error - for database errors or other unexpected issues
 */
export const PATCH: APIRoute = async ({ locals, params, request }) => {
  try {
    const { supabase } = validateAuth(locals, "PATCH /api/articles/{id}");

    // Validate article ID from path parameters
    const paramsValidation = updateArticleParamsSchema.safeParse(params);

    if (!paramsValidation.success) {
      const validationResponse = createValidationErrorResponse("Article ID validation failed", paramsValidation.error);
      return new Response(JSON.stringify(validationResponse), {
        status: validationResponse.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse request body
    let requestBody;
    try {
      requestBody = await request.json();
    } catch {
      const errResponse = createErrorResponse("Bad Request", "Invalid JSON in request body", 400);
      return new Response(JSON.stringify(errResponse), { status: 400 });
    }

    // Validate request body
    const bodyValidation = updateArticleRequestSchema.safeParse(requestBody);

    if (!bodyValidation.success) {
      const validationResponse = createValidationErrorResponse("Request body validation failed", bodyValidation.error);
      return new Response(JSON.stringify(validationResponse), {
        status: validationResponse.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Update article
    const updatedArticle = await updateArticle(supabase, paramsValidation.data.id, bodyValidation.data);

    return new Response(JSON.stringify(updatedArticle), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      logError(error);
      const errResponse = createErrorResponse(error.name, error.message, error.statusCode);
      return new Response(JSON.stringify(errResponse), {
        status: error.statusCode,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (error instanceof ArticleNotFoundError) {
      const errResponse = createErrorResponse(error.name, error.message, error.statusCode);
      return new Response(JSON.stringify(errResponse), {
        status: error.statusCode,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (error instanceof DatabaseError || error instanceof InternalDataValidationError) {
      logError(error);
      const errResponse = createErrorResponse(error.name, error.message, error.statusCode);
      return new Response(JSON.stringify(errResponse), {
        status: error.statusCode,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle any other unexpected errors
    const unexpectedError = new Error("An unexpected error occurred in PATCH /api/articles/{id}");
    logError(unexpectedError, { originalError: error });
    const errResponse = createErrorResponse("Internal Server Error", "An unexpected error occurred", 500);
    return new Response(JSON.stringify(errResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * DELETE /api/articles/{id}
 *
 * Permanently deletes a single article based on its unique identifier (ID).
 * This operation is irreversible.
 *
 * @param id (required) - UUID of the article to delete
 *
 * @returns 204 No Content - when deletion is successful
 * @returns 400 Bad Request - if ID validation fails
 * @returns 401 Unauthorized - if user is not authenticated
 * @returns 404 Not Found - if article with given ID doesn't exist or user has no access
 * @returns 500 Internal Server Error - for database errors or other unexpected issues
 */
export const DELETE: APIRoute = async ({ locals, params }) => {
  try {
    const { supabase } = validateAuth(locals, "DELETE /api/articles/{id}");

    // Validate article ID from path parameters
    const validationResult = deleteArticleParamsSchema.safeParse(params);

    if (!validationResult.success) {
      const validationResponse = createValidationErrorResponse("Article ID validation failed", validationResult.error);
      return new Response(JSON.stringify(validationResponse), {
        status: validationResponse.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Delete article
    await deleteArticle(supabase, validationResult.data.id);

    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      logError(error);
      const errResponse = createErrorResponse(error.name, error.message, error.statusCode);
      return new Response(JSON.stringify(errResponse), {
        status: error.statusCode,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (error instanceof ArticleNotFoundError) {
      const errResponse = createErrorResponse(error.name, error.message, error.statusCode);
      return new Response(JSON.stringify(errResponse), {
        status: error.statusCode,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (error instanceof DatabaseError || error instanceof InternalDataValidationError) {
      logError(error);
      const errResponse = createErrorResponse(error.name, error.message, error.statusCode);
      return new Response(JSON.stringify(errResponse), {
        status: error.statusCode,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle any other unexpected errors
    const unexpectedError = new Error("An unexpected error occurred in DELETE /api/articles/{id}");
    logError(unexpectedError, { originalError: error });
    const errResponse = createErrorResponse("Internal Server Error", "An unexpected error occurred", 500);
    return new Response(JSON.stringify(errResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
