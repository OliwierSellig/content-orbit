import type { APIRoute } from "astro";
import { updateCustomAudit, deleteCustomAudit } from "../../../lib/services/custom-audit.service";
import {
  createErrorResponse,
  createValidationErrorResponse,
  CustomAuditNotFoundError,
  DatabaseError,
  InternalDataValidationError,
  logError,
  UnauthorizedError,
} from "../../../lib/errors";
import { validateAuth } from "../../../lib/utils";
import { UpdateCustomAuditRequestSchema, UuidParamSchema } from "../../../lib/schemas/custom-audit.schemas";

export const prerender = false;

/**
 * PATCH /api/custom-audits/{id}
 *
 * Updates an existing custom audit for the authenticated user.
 *
 * @returns 200 OK - with updated custom audit data.
 * @returns 400 Bad Request - if request body or ID validation fails.
 * @returns 401 Unauthorized - if user is not authenticated.
 * @returns 404 Not Found - if the custom audit does not exist or doesn't belong to the user.
 * @returns 500 Internal Server Error - for database errors or other unexpected issues.
 */
export const PATCH: APIRoute = async ({ locals, request, params }) => {
  try {
    const { user, supabase } = validateAuth(locals, "PATCH /api/custom-audits/[id]");

    // Validate ID parameter
    const idValidationResult = UuidParamSchema.safeParse({ id: params.id });
    if (!idValidationResult.success) {
      const validationResponse = createValidationErrorResponse("Invalid audit ID", idValidationResult.error);
      return new Response(JSON.stringify(validationResponse), { status: validationResponse.status });
    }

    const auditId = idValidationResult.data.id;

    // Parse request body
    let requestBody;
    try {
      requestBody = await request.json();
    } catch {
      const errResponse = createErrorResponse("Bad Request", "Invalid JSON in request body", 400);
      return new Response(JSON.stringify(errResponse), { status: 400 });
    }

    // Validate request body
    const validationResult = UpdateCustomAuditRequestSchema.safeParse(requestBody);

    if (!validationResult.success) {
      const validationResponse = createValidationErrorResponse("Request validation failed", validationResult.error);
      return new Response(JSON.stringify(validationResponse), { status: validationResponse.status });
    }

    // Update custom audit
    const updatedCustomAudit = await updateCustomAudit(supabase, user.id, auditId, validationResult.data);

    if (!updatedCustomAudit) {
      throw new CustomAuditNotFoundError();
    }

    return new Response(JSON.stringify(updatedCustomAudit), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (
      error instanceof UnauthorizedError ||
      error instanceof CustomAuditNotFoundError ||
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
    const unexpectedError = new Error("An unexpected error occurred in PATCH /api/custom-audits/[id]");
    logError(unexpectedError, { originalError: error });
    const errResponse = createErrorResponse("Internal Server Error", "An unexpected error occurred", 500);
    return new Response(JSON.stringify(errResponse), { status: 500 });
  }
};

/**
 * DELETE /api/custom-audits/{id}
 *
 * Deletes an existing custom audit for the authenticated user.
 *
 * @returns 204 No Content - if the custom audit was successfully deleted.
 * @returns 400 Bad Request - if ID validation fails.
 * @returns 401 Unauthorized - if user is not authenticated.
 * @returns 404 Not Found - if the custom audit does not exist or doesn't belong to the user.
 * @returns 500 Internal Server Error - for database errors or other unexpected issues.
 */
export const DELETE: APIRoute = async ({ locals, params }) => {
  try {
    const { user, supabase } = validateAuth(locals, "DELETE /api/custom-audits/[id]");

    // Validate ID parameter
    const idValidationResult = UuidParamSchema.safeParse({ id: params.id });
    if (!idValidationResult.success) {
      const validationResponse = createValidationErrorResponse("Invalid audit ID", idValidationResult.error);
      return new Response(JSON.stringify(validationResponse), { status: validationResponse.status });
    }

    const auditId = idValidationResult.data.id;

    // Delete custom audit
    const deleted = await deleteCustomAudit(supabase, user.id, auditId);

    if (!deleted) {
      throw new CustomAuditNotFoundError();
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    if (
      error instanceof UnauthorizedError ||
      error instanceof CustomAuditNotFoundError ||
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
    const unexpectedError = new Error("An unexpected error occurred in DELETE /api/custom-audits/[id]");
    logError(unexpectedError, { originalError: error });
    const errResponse = createErrorResponse("Internal Server Error", "An unexpected error occurred", 500);
    return new Response(JSON.stringify(errResponse), { status: 500 });
  }
};
