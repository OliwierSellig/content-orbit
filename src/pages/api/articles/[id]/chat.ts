import type { APIRoute } from "astro";
import { getArticleById } from "../../../../lib/services/article.service";
import { ArticleChatRequestSchema, ArticleIdSchema } from "../../../../lib/schemas/article.schemas";
import { createErrorResponse, createValidationErrorResponse, logError } from "../../../../lib/errors";
import { ZodError } from "zod";
import { validateAuth } from "../../../../lib/utils";

export const prerender = false;

// Helper to create a delay
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Handles POST requests to the article chat endpoint.
 * This endpoint is responsible for streaming AI responses for a given article.
 *
 * NOTE: The AI functionality is currently MOCKED.
 */
export const POST: APIRoute = async ({ params, request, locals }) => {
  try {
    // 1. Authentication & Authorization
    const { supabase } = validateAuth(locals, "POST /api/articles/{id}/chat");

    // 2. Validate Path
    const { id: articleId } = ArticleIdSchema.parse({ id: params.id });

    // 3. Robustly handle and validate Body
    const requestText = await request.text();
    if (!requestText) {
      return new Response(
        JSON.stringify(createErrorResponse("BadRequest", "Request body is required and cannot be empty.", 400)),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    const body = JSON.parse(requestText);
    ArticleChatRequestSchema.parse(body);

    // 4. Authorization: Check if the user has access to the article
    await getArticleById(supabase, articleId);

    // 5. (MOCK) Stream the response
    const mockResponse =
      "This is a mocked response from the AI assistant. The real implementation is coming soon!".split(" ");

    const stream = new ReadableStream({
      async start(controller) {
        for (const chunk of mockResponse) {
          const encoded = new TextEncoder().encode(`data: ${JSON.stringify({ text: chunk })}\n\n`);
          controller.enqueue(encoded);
          await sleep(80); // Simulate typing delay
        }
        const done = new TextEncoder().encode("data: [DONE]");
        controller.enqueue(done);
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    logError(error as Error);

    if (error instanceof SyntaxError) {
      return new Response(
        JSON.stringify(createErrorResponse("BadRequest", "Invalid JSON format in request body.", 400)),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (error instanceof ZodError) {
      return new Response(JSON.stringify(createValidationErrorResponse("Invalid request data", error)), {
        status: 422,
        headers: { "Content-Type": "application/json" },
      });
    }

    // This will catch ArticleNotFoundError and UnauthorizedError
    if (error instanceof Error && "statusCode" in error) {
      const statusCode = (error as any).statusCode;
      return new Response(JSON.stringify(createErrorResponse(error.name, error.message, statusCode)), {
        status: statusCode,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify(createErrorResponse("InternalServerError", "An unexpected error occurred.", 500)),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
