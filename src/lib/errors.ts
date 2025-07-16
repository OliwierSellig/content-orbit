/* eslint-disable no-console */
import type { ErrorResponse, ValidationErrorResponse, ValidationErrorDetail } from "../types";
import { type ZodError } from "zod";

/**
 * Base class for custom API errors that includes a status code.
 */
export abstract class BaseApiError extends Error {
  abstract readonly statusCode: number;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    // Maintains proper stack trace in V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Base class for business rule violations (400 Bad Request)
 */
export abstract class BusinessRuleError extends BaseApiError {
  public readonly statusCode = 400;
}

/**
 * Base class for resource not found errors (404 Not Found)
 */
export abstract class NotFoundError extends BaseApiError {
  public readonly statusCode = 404;
}

/**
 * 401 Unauthorized Error
 */
export class UnauthorizedError extends BaseApiError {
  public readonly statusCode = 401;
  constructor(message = "Unauthorized - authentication required") {
    super(message);
  }
}

/**
 * 404 Not Found Error - More specific implementation.
 */
export class ProfileNotFoundError extends NotFoundError {
  constructor(message = "Profile not found") {
    super(message);
  }
}

/**
 * 404 Not Found Error - for when a user's knowledge base is not found.
 */
export class KnowledgeBaseNotFoundError extends NotFoundError {
  constructor(message = "Knowledge base not found for this user") {
    super(message);
  }
}

/**
 * 500 Internal Server Error for database-related issues.
 * Includes the original error for better logging.
 */
export class DatabaseError extends BaseApiError {
  public readonly statusCode = 500;
  constructor(
    message: string,
    public originalError?: Error
  ) {
    super(message);
  }
}

/**
 * Converts a ZodError into our custom ValidationErrorDetail format
 */
function formatZodError(zodError: ZodError): ValidationErrorDetail[] {
  return zodError.issues.map((issue) => ({
    path: issue.path.filter((p): p is string | number => typeof p === "string" || typeof p === "number"),
    message: issue.message,
  }));
}

/**
 * 500 Internal Server Error for internal data validation failures.
 * This indicates a mismatch between database schema and application types.
 */
export class InternalDataValidationError extends BaseApiError {
  public readonly statusCode = 500;
  public readonly details: ValidationErrorDetail[];

  constructor(message: string, validationError: ZodError) {
    super(message);
    // Process the error immediately and store the simple details array.
    this.details = formatZodError(validationError);
  }
}

/**
 * Logs an error with an appropriate level based on its type.
 * @param error The error to log.
 * @param context Additional context for logging.
 */
export function logError(error: Error, context?: Record<string, unknown>) {
  const logData = {
    error: error.name,
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
  };

  // Log predictable, client-caused errors as info.
  if (error instanceof BusinessRuleError || error instanceof NotFoundError || error instanceof UnauthorizedError) {
    console.info("API Info:", JSON.stringify(logData, null, 2));
  } else if (error instanceof DatabaseError) {
    // Log unexpected, server-side errors as critical.
    console.error("Database Error:", JSON.stringify({ ...logData, originalError: error.originalError }, null, 2));
  } else if (error instanceof InternalDataValidationError) {
    console.error(
      "Internal Validation Error:",
      JSON.stringify({ ...logData, validationDetails: error.details }, null, 2)
    );
  } else {
    // Log all other errors as critical.
    console.error("Unexpected Error:", JSON.stringify(logData, null, 2));
  }
}

/**
 * Creates a standardized error response object.
 * @param error The name of the error class.
 * @param message A user-friendly error message.
 * @param status The HTTP status code.
 * @returns A formatted error response object.
 */
export function createErrorResponse(error: string, message: string, status: number): ErrorResponse {
  return {
    error,
    message,
    status,
  };
}

/**
 * Creates a validation error response object.
 * @param message A user-friendly summary message.
 * @param validationError The original Zod error.
 * @returns A formatted validation error response object.
 */
export function createValidationErrorResponse(message: string, validationError: ZodError): ValidationErrorResponse {
  return {
    error: "Unprocessable Entity",
    message,
    status: 422,
    errors: formatZodError(validationError),
  };
}
