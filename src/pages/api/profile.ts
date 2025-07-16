import type { APIRoute } from "astro";
import { getProfile } from "../../lib/services/profile.service";
import { ErrorResponseSchema } from "../../lib/schemas/profile.schemas";

// Ensure dynamic rendering for API routes
export const prerender = false;

/**
 * Helper function to create JSON error responses with consistent format
 */
function createErrorResponse(message: string, status: number) {
  const errorData = { error: message };

  // Validate error response structure
  const validationResult = ErrorResponseSchema.safeParse(errorData);
  if (!validationResult.success) {
    console.error("Error response validation failed:", validationResult.error);
    // Fallback to basic error structure
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify(validationResult.data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * GET /api/profile
 *
 * Retrieves the profile and settings for the authenticated user.
 * Returns the user's profile data including default counts for topics and subtopics.
 *
 * @returns 200 OK with profile data
 * @returns 401 Unauthorized if user is not authenticated
 * @returns 404 Not Found if profile doesn't exist
 * @returns 500 Internal Server Error for unexpected errors
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    // Check if user is authenticated (middleware should have set this)
    if (!locals.user) {
      return createErrorResponse("Unauthorized - authentication required", 401);
    }

    // Check if Supabase client is available
    if (!locals.supabase) {
      console.error("Supabase client not available in locals");
      return createErrorResponse("Internal server error - database client unavailable", 500);
    }

    // Retrieve the user's profile
    const profile = await getProfile(locals.supabase, locals.user.id);

    if (!profile) {
      return createErrorResponse("Profile not found", 404);
    }

    // Return successful response with profile data
    // The profile data is already validated in the service layer
    return new Response(JSON.stringify(profile), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Log the error for debugging (in production, consider using a proper logging service)
    console.error("Error in GET /api/profile:", error);

    // Return generic error message to client
    return createErrorResponse("Internal server error", 500);
  }
};
