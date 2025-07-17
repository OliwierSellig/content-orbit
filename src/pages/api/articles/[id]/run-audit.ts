import type { APIRoute } from "astro";
import { runCustomAudit } from "../../../../lib/services/article.service";
import {
  createErrorResponse,
  createValidationErrorResponse,
  DatabaseError,
  InternalDataValidationError,
  logError,
  ArticleNotFoundError,
  CustomAuditNotFoundError,
  UnauthorizedError,
} from "../../../../lib/errors";
import { ArticleIdSchema, RunAuditRequestSchema } from "../../../../lib/schemas/article.schemas";
import { validateAuth } from "../../../../lib/utils";

export const prerender = false;

/**
 * POST /api/articles/{id}/run-audit
 *
 * Runs a custom audit on an article's content using AI.
 * Analyzes the article content against a custom audit prompt
 * and returns a list of findings and suggestions.
 *
 * @param id - UUID of the article to audit (from URL path)
 * @param audit_id - UUID of the custom audit to run (from request body)
 * @returns 200 OK - with audit findings.
 * @returns 400 Bad Request - if the article ID or audit ID are not valid UUIDs.
 * @returns 401 Unauthorized - if user is not authenticated.
 * @returns 404 Not Found - if the article or custom audit do not exist or don't belong to the user.
 * @returns 500 Internal Server Error - for database errors or other unexpected issues.
 */
export const POST: APIRoute = async ({ locals, params, request }) => {
  try {
    const { user, supabase } = validateAuth(locals, "POST /api/articles/{id}/run-audit");

    // Validate the article ID parameter from URL
    const paramsValidation = ArticleIdSchema.safeParse(params);

    if (!paramsValidation.success) {
      const validationResponse = createValidationErrorResponse("Invalid article ID format", paramsValidation.error);
      return new Response(JSON.stringify(validationResponse), {
        status: validationResponse.status,
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
    const bodyValidation = RunAuditRequestSchema.safeParse(requestBody);

    if (!bodyValidation.success) {
      const validationResponse = createValidationErrorResponse("Request body validation failed", bodyValidation.error);
      return new Response(JSON.stringify(validationResponse), { status: validationResponse.status });
    }

    const { id } = paramsValidation.data;
    const { audit_id } = bodyValidation.data;

    // Run custom audit
    const auditResult = await runCustomAudit(supabase, id, audit_id, user.id);

    return new Response(JSON.stringify(auditResult), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (
      error instanceof UnauthorizedError ||
      error instanceof ArticleNotFoundError ||
      error instanceof CustomAuditNotFoundError ||
      error instanceof DatabaseError ||
      error instanceof InternalDataValidationError
    ) {
      logError(error);
      const errResponse = createErrorResponse(error.name, error.message, error.statusCode);
      return new Response(JSON.stringify(errResponse), { status: error.statusCode });
    }

    // Handle any other unexpected errors
    const unexpectedError = new Error("An unexpected error occurred in POST /api/articles/{id}/run-audit");
    logError(unexpectedError, { originalError: error });
    const errResponse = createErrorResponse("Internal Server Error", "An unexpected error occurred", 500);
    return new Response(JSON.stringify(errResponse), { status: 500 });
  }
};
