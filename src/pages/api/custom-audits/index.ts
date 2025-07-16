import type { APIRoute } from "astro";
import { getCustomAudits, createCustomAudit } from "../../../lib/services/custom-audit.service";
import {
  createErrorResponse,
  createValidationErrorResponse,
  DatabaseError,
  InternalDataValidationError,
  logError,
  UnauthorizedError,
} from "../../../lib/errors";
import { validateAuth } from "../../../lib/utils";
import { CreateCustomAuditRequestSchema } from "../../../lib/schemas/custom-audit.schemas";

export const prerender = false;

/**
 * GET /api/custom-audits
 *
 * Retrieves all custom audits for the authenticated user.
 *
 * @returns 200 OK - with array of custom audits data.
 * @returns 401 Unauthorized - if user is not authenticated.
 * @returns 500 Internal Server Error - for database errors or other unexpected issues.
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    const { user, supabase } = validateAuth(locals, "GET /api/custom-audits");

    const customAudits = await getCustomAudits(supabase, user.id);

    return new Response(JSON.stringify(customAudits), {
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
      return new Response(JSON.stringify(errResponse), { status: error.statusCode });
    }

    // Handle Response objects thrown by validateAuth
    if (error instanceof Response) {
      return error;
    }

    // Handle any other unexpected errors
    const unexpectedError = new Error("An unexpected error occurred in GET /api/custom-audits");
    logError(unexpectedError, { originalError: error });
    const errResponse = createErrorResponse("Internal Server Error", "An unexpected error occurred", 500);
    return new Response(JSON.stringify(errResponse), { status: 500 });
  }
};

/**
 * POST /api/custom-audits
 *
 * Creates a new custom audit for the authenticated user.
 *
 * @returns 201 Created - with newly created custom audit data.
 * @returns 400 Bad Request - if request body validation fails.
 * @returns 401 Unauthorized - if user is not authenticated.
 * @returns 500 Internal Server Error - for database errors or other unexpected issues.
 */
export const POST: APIRoute = async ({ locals, request }) => {
  try {
    const { user, supabase } = validateAuth(locals, "POST /api/custom-audits");

    // Parse request body
    let requestBody;
    try {
      requestBody = await request.json();
    } catch {
      const errResponse = createErrorResponse("Bad Request", "Invalid JSON in request body", 400);
      return new Response(JSON.stringify(errResponse), { status: 400 });
    }

    // Validate request body
    const validationResult = CreateCustomAuditRequestSchema.safeParse(requestBody);

    if (!validationResult.success) {
      const validationResponse = createValidationErrorResponse("Request validation failed", validationResult.error);
      return new Response(JSON.stringify(validationResponse), { status: validationResponse.status });
    }

    // Create custom audit
    const newCustomAudit = await createCustomAudit(supabase, user.id, validationResult.data);

    return new Response(JSON.stringify(newCustomAudit), {
      status: 201,
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
      return new Response(JSON.stringify(errResponse), { status: error.statusCode });
    }

    // Handle Response objects thrown by validateAuth
    if (error instanceof Response) {
      return error;
    }

    // Handle any other unexpected errors
    const unexpectedError = new Error("An unexpected error occurred in POST /api/custom-audits");
    logError(unexpectedError, { originalError: error });
    const errResponse = createErrorResponse("Internal Server Error", "An unexpected error occurred", 500);
    return new Response(JSON.stringify(errResponse), { status: 500 });
  }
};
