import type { APIRoute } from "astro";
import { updateAiPreference, deleteAiPreference } from "../../../lib/services/ai-preference.service";
import {
  createErrorResponse,
  createValidationErrorResponse,
  DatabaseError,
  InternalDataValidationError,
  logError,
  UnauthorizedError,
} from "../../../lib/errors";
import { validateAuth } from "../../../lib/utils";
import { UpdateAiPreferenceRequestSchema, UuidParamSchema } from "../../../lib/schemas/ai-preference.schemas";

export const prerender = false;

/**
 * PATCH /api/ai-preferences/{id}
 *
 * Updates an existing AI preference for the authenticated user.
 *
 * @returns 200 OK - with updated AI preference data.
 * @returns 400 Bad Request - if ID validation fails or request body validation fails.
 * @returns 401 Unauthorized - if user is not authenticated.
 * @returns 404 Not Found - if AI preference doesn't exist or doesn't belong to user.
 * @returns 500 Internal Server Error - for database errors or other unexpected issues.
 */
export const PATCH: APIRoute = async ({ locals, request, params }) => {
  try {
    const { user, supabase } = validateAuth(locals, "PATCH /api/ai-preferences/[id]");

    // Validate ID parameter
    const idValidation = UuidParamSchema.safeParse(params.id);
    if (!idValidation.success) {
      const validationResponse = createValidationErrorResponse("Invalid ID parameter", idValidation.error);
      return new Response(JSON.stringify(validationResponse), { status: validationResponse.status });
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
    const validationResult = UpdateAiPreferenceRequestSchema.safeParse(requestBody);

    if (!validationResult.success) {
      const validationResponse = createValidationErrorResponse("Request validation failed", validationResult.error);
      return new Response(JSON.stringify(validationResponse), { status: validationResponse.status });
    }

    // Update AI preference
    const updatedAiPreference = await updateAiPreference(supabase, user.id, idValidation.data, validationResult.data);

    if (!updatedAiPreference) {
      const errResponse = createErrorResponse("Not Found", "AI preference not found", 404);
      return new Response(JSON.stringify(errResponse), { status: 404 });
    }

    return new Response(JSON.stringify(updatedAiPreference), {
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
    const unexpectedError = new Error("An unexpected error occurred in PATCH /api/ai-preferences/[id]");
    logError(unexpectedError, { originalError: error });
    const errResponse = createErrorResponse("Internal Server Error", "An unexpected error occurred", 500);
    return new Response(JSON.stringify(errResponse), { status: 500 });
  }
};

/**
 * DELETE /api/ai-preferences/{id}
 *
 * Deletes an existing AI preference for the authenticated user.
 *
 * @returns 204 No Content - if AI preference was successfully deleted.
 * @returns 400 Bad Request - if ID validation fails.
 * @returns 401 Unauthorized - if user is not authenticated.
 * @returns 404 Not Found - if AI preference doesn't exist or doesn't belong to user.
 * @returns 500 Internal Server Error - for database errors or other unexpected issues.
 */
export const DELETE: APIRoute = async ({ locals, params }) => {
  try {
    const { user, supabase } = validateAuth(locals, "DELETE /api/ai-preferences/[id]");

    // Validate ID parameter
    const idValidation = UuidParamSchema.safeParse(params.id);
    if (!idValidation.success) {
      const validationResponse = createValidationErrorResponse("Invalid ID parameter", idValidation.error);
      return new Response(JSON.stringify(validationResponse), { status: validationResponse.status });
    }

    // Delete AI preference
    const deleteResult = await deleteAiPreference(supabase, user.id, idValidation.data);

    if (!deleteResult.success) {
      const errResponse = createErrorResponse("Not Found", "AI preference not found", 404);
      return new Response(JSON.stringify(errResponse), { status: 404 });
    }

    // Return 204 No Content for successful deletion
    return new Response(null, { status: 204 });
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
    const unexpectedError = new Error("An unexpected error occurred in DELETE /api/ai-preferences/[id]");
    logError(unexpectedError, { originalError: error });
    const errResponse = createErrorResponse("Internal Server Error", "An unexpected error occurred", 500);
    return new Response(JSON.stringify(errResponse), { status: 500 });
  }
};
