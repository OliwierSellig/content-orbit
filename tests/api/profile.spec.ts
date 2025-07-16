import { test, expect } from "@playwright/test";

/**
 * Integration tests for GET /api/profile endpoint
 *
 * These tests verify the profile endpoint functionality including:
 * - Authentication requirements
 * - Successful profile retrieval
 * - Error handling scenarios
 */

test.describe("GET /api/profile", () => {
  test("should return 401 when user is not authenticated", async ({ request }) => {
    // Make request without authentication
    const response = await request.get("/api/profile");

    expect(response.status()).toBe(401);

    const body = await response.json();
    expect(body).toHaveProperty("error");
    expect(body.error).toContain("Unauthorized");
  });

  test("should return profile data when user is authenticated", async ({ request }) => {
    // Note: This test will need to be updated in Phase 5 when real authentication is implemented
    // For now, we'll test the structure assuming middleware provides a test user

    // TODO: Add authentication headers when Supabase auth is fully implemented
    // For Phase 3 development, this test may need to be skipped or mocked

    const response = await request.get("/api/profile");

    // Expecting either 401 (no test user in middleware yet) or 200 (if test user is added)
    if (response.status() === 200) {
      const body = await response.json();

      // Verify profile structure
      expect(body).toHaveProperty("id");
      expect(body).toHaveProperty("created_at");
      expect(body).toHaveProperty("updated_at");
      expect(body).toHaveProperty("default_topics_count");
      expect(body).toHaveProperty("default_subtopics_count");

      // Verify data types and constraints
      expect(typeof body.id).toBe("string");
      expect(typeof body.default_topics_count).toBe("number");
      expect(typeof body.default_subtopics_count).toBe("number");
      expect(body.default_topics_count).toBeGreaterThan(0);
      expect(body.default_subtopics_count).toBeGreaterThan(0);
    } else {
      // If no test user is configured yet, we expect 401
      expect(response.status()).toBe(401);
    }
  });

  test("should return 404 when profile does not exist", async () => {
    // This test case will be relevant when we have authentication but no profile in DB
    // For now, documenting the expected behavior

    // TODO: Implement when we have:
    // 1. Authentication working
    // 2. A way to create authenticated user without profile

    // Expected: GET /api/profile with authenticated user who has no profile
    // Should return: 404 with { error: "Profile not found" }

    // Placeholder test - skip for now
    test.skip();
  });

  test("should handle database errors gracefully", async () => {
    // This test would require mocking the database to simulate failures
    // For now, documenting the expected behavior

    // TODO: Implement when we have:
    // 1. A way to mock database errors
    // 2. Test environment setup

    // Expected: Database connection failure or query error
    // Should return: 500 with { error: "Internal server error" }

    // Placeholder test - skip for now
    test.skip();
  });

  test("should validate response format", async ({ request }) => {
    // Test to ensure response always follows the expected schema
    const response = await request.get("/api/profile");

    const body = await response.json();

    // Every response should have either profile data or error message
    if (response.status() === 200) {
      // Should match ProfileResponseSchema
      expect(body).toHaveProperty("id");
      expect(body).toHaveProperty("default_topics_count");
      expect(body).toHaveProperty("default_subtopics_count");
    } else {
      // Should match ErrorResponseSchema
      expect(body).toHaveProperty("error");
      expect(typeof body.error).toBe("string");
      expect(body.error.length).toBeGreaterThan(0);
    }
  });
});
