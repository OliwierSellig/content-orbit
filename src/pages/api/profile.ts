import type { APIRoute } from "astro";
import { getProfile } from "../../lib/services/profile.service";
import {
  createErrorResponse,
  DatabaseError,
  InternalDataValidationError,
  logError,
  ProfileNotFoundError,
  UnauthorizedError,
} from "../../lib/errors";

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
    if (!locals.user) {
      throw new UnauthorizedError();
    }

    if (!locals.supabase) {
      // This is a server configuration issue, so we log it as a critical error.
      const error = new Error("Supabase client not available in locals");
      logError(error, { operation: "GET /api/profile" });
      const errResponse = createErrorResponse("Internal Server Error", "Server configuration error", 500);
      return new Response(JSON.stringify(errResponse), { status: 500 });
    }

    const profile = await getProfile(locals.supabase, locals.user.id);

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
