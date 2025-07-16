import type { APIRoute } from "astro";
import { getProfile, updateProfile } from "../../lib/services/profile.service";
import {
  createErrorResponse,
  createValidationErrorResponse,
  DatabaseError,
  InternalDataValidationError,
  logError,
  ProfileNotFoundError,
  UnauthorizedError,
} from "../../lib/errors";
import { UpdateProfileRequestSchema } from "../../lib/schemas/profile.schemas";
import { validateAuth } from "../../lib/utils";

export const prerender = false;

/**
 * GET /api/profile
 *
 * Retrieves the profile and settings for the authenticated user.
 *
 * @returns 200 OK - with profile data.
 * @returns 401 Unauthorized - if user is not authenticated.
 * @returns 404 Not Found - if the user's profile does not exist.
 * @returns 500 Internal Server Error - for database errors or other unexpected issues.
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    const { user, supabase } = validateAuth(locals, "GET /api/profile");

    const profile = await getProfile(supabase, user.id);

    if (!profile) {
      throw new ProfileNotFoundError();
    }

    return new Response(JSON.stringify(profile), {
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
    const unexpectedError = new Error("An unexpected error occurred in GET /api/profile");
    logError(unexpectedError, { originalError: error });
    const errResponse = createErrorResponse("Internal Server Error", "An unexpected error occurred", 500);
    return new Response(JSON.stringify(errResponse), { status: 500 });
  }
};

/**
 * PATCH /api/profile
 *
 * Updates the profile settings for the authenticated user.
 *
 * @returns 200 OK - with updated profile data.
 * @returns 400 Bad Request - if request body validation fails.
 * @returns 401 Unauthorized - if user is not authenticated.
 * @returns 404 Not Found - if the user's profile does not exist.
 * @returns 500 Internal Server Error - for database errors or other unexpected issues.
 */
export const PATCH: APIRoute = async ({ locals, request }) => {
  try {
    const { user, supabase } = validateAuth(locals, "PATCH /api/profile");

    // Parse request body
    let requestBody;
    try {
      requestBody = await request.json();
    } catch {
      const errResponse = createErrorResponse("Bad Request", "Invalid JSON in request body", 400);
      return new Response(JSON.stringify(errResponse), { status: 400 });
    }

    // Validate request body
    const validationResult = UpdateProfileRequestSchema.safeParse(requestBody);

    if (!validationResult.success) {
      const validationResponse = createValidationErrorResponse("Request validation failed", validationResult.error);
      return new Response(JSON.stringify(validationResponse), { status: validationResponse.status });
    }

    // Update profile
    const updatedProfile = await updateProfile(supabase, user.id, validationResult.data);

    return new Response(JSON.stringify(updatedProfile), {
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
    const unexpectedError = new Error("An unexpected error occurred in PATCH /api/profile");
    logError(unexpectedError, { originalError: error });
    const errResponse = createErrorResponse("Internal Server Error", "An unexpected error occurred", 500);
    return new Response(JSON.stringify(errResponse), { status: 500 });
  }
};
