import type { APIRoute } from "astro";
import {
  getArticleParamsSchema,
  updateArticleParamsSchema,
  regenerateArticleConceptRequestSchema,
} from "../../../../lib/schemas/article.schemas";
import { validateAuth } from "../../../../lib/utils";
import { createErrorResponse } from "../../../../lib/errors";
import { logError } from "../../../../lib/errors";
import { regenerateArticleConcept } from "../../../../lib/services/article.service";

/**
 * GET /api/articles/{id}
 *
 * Retrieves a single article by its ID.
 *
 * @param id (required) - UUID of the article to retrieve
 *
 * @returns 200 OK - with the full article object
 * @returns 400 Bad Request - if ID validation fails
 * @returns 401 Unauthorized - if user is not authenticated
 * @returns 404 Not Found - if article with given ID doesn't exist
 * @returns 500 Internal Server Error - for database errors
 */
export const GET: APIRoute = async ({ locals, params }) => {
  try {
    const { supabase } = validateAuth(locals, "GET /api/articles/{id}");

    const paramsValidation = getArticleParamsSchema.safeParse(params);
    if (!paramsValidation.success) {
      const errResponse = createErrorResponse("Bad Request", "Invalid article ID", 400);
      return new Response(JSON.stringify(errResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data, error } = await supabase.from("articles").select("*").eq("id", paramsValidation.data.id).single();

    if (error) {
      logError(error, { originalError: error });
      const errResponse = createErrorResponse("Internal Server Error", "Failed to retrieve article", 500);
      return new Response(JSON.stringify(errResponse), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!data) {
      const errResponse = createErrorResponse("Not Found", "Article not found", 404);
      return new Response(JSON.stringify(errResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const errResponse = createErrorResponse("Internal Server Error", "An unexpected error occurred", 500);
    return new Response(JSON.stringify(errResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * POST /api/articles/{id}/regenerate-concept
 *
 * Regenerates the core metadata of an article concept using AI based on a
 * potentially new name (subtopic). This overwrites existing title, description,
 * slug, and SEO fields.
 *
 * @param id (required) - UUID of the article to regenerate
 * @param body - JSON object containing the name to base the regeneration on
 *
 * @returns 200 OK - with the updated full article object
 * @returns 400 Bad Request - if ID validation or request body validation fails
 * @returns 401 Unauthorized - if user is not authenticated
 * @returns 404 Not Found - if article with given ID doesn't exist
 * @returns 500 Internal Server Error - for database or AI service errors
 */
export const POST: APIRoute = async ({ locals, params, request }) => {
  try {
    const { supabase } = validateAuth(locals, "POST /api/articles/{id}/regenerate-concept");

    const paramsValidation = updateArticleParamsSchema.safeParse(params);
    if (!paramsValidation.success) {
      const errResponse = createErrorResponse("Bad Request", "Invalid article ID", 400);
      return new Response(JSON.stringify(errResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    let requestBody;
    try {
      requestBody = await request.json();
    } catch {
      const errResponse = createErrorResponse("Bad Request", "Invalid JSON body", 400);
      return new Response(JSON.stringify(errResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const bodyValidation = regenerateArticleConceptRequestSchema.safeParse(requestBody);
    if (!bodyValidation.success) {
      const errResponse = createErrorResponse("Bad Request", "Invalid request body", 400);
      return new Response(JSON.stringify(errResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const regeneratedArticle = await regenerateArticleConcept(
      supabase,
      paramsValidation.data.id,
      bodyValidation.data.name
    );

    return new Response(JSON.stringify(regeneratedArticle), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    logError(new Error("An unexpected error occurred in POST regenerate-concept"), { originalError: error });
    const errResponse = createErrorResponse("Internal Server Error", "An unexpected error occurred", 500);
    return new Response(JSON.stringify(errResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
