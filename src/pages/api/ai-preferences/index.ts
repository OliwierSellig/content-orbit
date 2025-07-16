import type { APIRoute } from "astro";
import { getAiPreferences, createAiPreference } from "../../../lib/services/ai-preference.service";
import {
  createErrorResponse,
  createValidationErrorResponse,
  DatabaseError,
  InternalDataValidationError,
  logError,
  UnauthorizedError,
} from "../../../lib/errors";
import { validateAuth } from "../../../lib/utils";
import { CreateAiPreferenceRequestSchema } from "../../../lib/schemas/ai-preference.schemas";

export const prerender = false;

/**
 * GET /api/ai-preferences
 *
 * Retrieves all AI preferences for the authenticated user.
 *
 * @returns 200 OK - with array of AI preferences data.
 * @returns 401 Unauthorized - if user is not authenticated.
 * @returns 500 Internal Server Error - for database errors or other unexpected issues.
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    const { user, supabase } = validateAuth(locals, "GET /api/ai-preferences");

    const aiPreferences = await getAiPreferences(supabase, user.id);

    // Return empty array if no preferences found (maintains API contract)
    const response = aiPreferences || [];

    return new Response(JSON.stringify(response), {
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

    // Handle any other unexpected errors
    const unexpectedError = new Error("An unexpected error occurred in GET /api/ai-preferences");
    logError(unexpectedError, { originalError: error });
    const errResponse = createErrorResponse("Internal Server Error", "An unexpected error occurred", 500);
    return new Response(JSON.stringify(errResponse), { status: 500 });
  }
};

/**
 * POST /api/ai-preferences
 *
 * Creates a new AI preference for the authenticated user.
 *
 * @returns 201 Created - with newly created AI preference data.
 * @returns 400 Bad Request - if request body validation fails.
 * @returns 401 Unauthorized - if user is not authenticated.
 * @returns 500 Internal Server Error - for database errors or other unexpected issues.
 */
export const POST: APIRoute = async ({ locals, request }) => {
  try {
    const { user, supabase } = validateAuth(locals, "POST /api/ai-preferences");

    // Parse request body
    let requestBody;
    try {
      requestBody = await request.json();
    } catch {
      const errResponse = createErrorResponse("Bad Request", "Invalid JSON in request body", 400);
      return new Response(JSON.stringify(errResponse), { status: 400 });
    }

    // Validate request body
    const validationResult = CreateAiPreferenceRequestSchema.safeParse(requestBody);

    if (!validationResult.success) {
      const validationResponse = createValidationErrorResponse("Request validation failed", validationResult.error);
      return new Response(JSON.stringify(validationResponse), { status: validationResponse.status });
    }

    // Create AI preference
    const newAiPreference = await createAiPreference(supabase, user.id, validationResult.data);

    return new Response(JSON.stringify(newAiPreference), {
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

    // Handle any other unexpected errors
    const unexpectedError = new Error("An unexpected error occurred in POST /api/ai-preferences");
    logError(unexpectedError, { originalError: error });
    const errResponse = createErrorResponse("Internal Server Error", "An unexpected error occurred", 500);
    return new Response(JSON.stringify(errResponse), { status: 500 });
  }
};
