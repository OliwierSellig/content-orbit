# REST API Plan

This document outlines the REST API for the Content Orbit application, designed based on the project's database schema, product requirements, and technical stack.

## 1. Resources

The API is structured around the following core resources, which map directly to the database tables:

- **Profiles**: Represents user-specific settings and preferences.
  - Database Table: `public.profiles`
- **Knowledge Bases**: Stores user-specific company information for AI context.
  - Database Table: `public.knowledge_bases`
- **AI Preferences**: Manages user-defined global prompts for AI generation.
  - Database Table: `public.ai_preferences`
- **Custom Audits**: Manages user-defined, reusable prompts for article analysis.
  - Database Table: `public.custom_audits`
- **Topic Clusters**: Represents the main content topics that group articles.
  - Database Table: `public.topic_clusters`
- **Articles**: Represents the core content items, from concepts to final drafts.
  - Database Table: `public.articles`

## 2. Endpoints

All endpoints are protected and require authentication. User-specific data is automatically filtered by Row-Level Security (RLS) policies in the database.

### 2.1. Profiles

The user profile is managed via a single resource endpoint, as each user has exactly one profile.

#### Get user profile

- **Method**: `GET`
- **URL**: `/api/profile`
- **Description**: Retrieves the profile and settings for the authenticated user.
- **Request Body**: None
- **Success Response**:
  - **Code**: `200 OK`
  - **Content**:
    ```json
    {
      "id": "uuid",
      "created_at": "timestampz",
      "updated_at": "timestampz",
      "default_topics_count": 5,
      "default_subtopics_count": 10
    }
    ```
- **Error Response**:
  - **Code**: `401 Unauthorized`
  - **Code**: `404 Not Found`

#### Update user profile

- **Method**: `PATCH`
- **URL**: `/api/profile`
- **Description**: Updates the settings for the authenticated user.
- **Request Body**:
  ```json
  {
    "default_topics_count": 7,
    "default_subtopics_count": 12
  }
  ```
- **Success Response**:
  - **Code**: `200 OK`
  - **Content**: The updated profile object.
- **Error Response**:
  - **Code**: `400 Bad Request` (Validation error)
  - **Code**: `401 Unauthorized`

### 2.2. Knowledge Base

The knowledge base is managed via a single resource endpoint.

#### Get knowledge base

- **Method**: `GET`
- **URL**: `/api/knowledge-base`
- **Description**: Retrieves the knowledge base for the authenticated user.
- **Request Body**: None
- **Success Response**:
  - **Code**: `200 OK`
  - **Content**:
    ```json
    {
      "id": "uuid",
      "user_id": "uuid",
      "created_at": "timestampz",
      "updated_at": "timestampz",
      "about_us": "Text about the company...",
      "team": "Text about the team...",
      "offer": "Text about the offer..."
    }
    ```

### 2.3. AI Preferences

Standard CRUD endpoints for managing AI preferences.

#### List AI preferences

- **Method**: `GET`
- **URL**: `/api/ai-preferences`
- **Description**: Retrieves all AI preferences for the user.
- **Success Response**:
  - **Code**: `200 OK`
  - **Content**: `[{ "id": "uuid", "title": "Prompt 1", "prompt": "..." }]`

#### Create AI preference

- **Method**: `POST`
- **URL**: `/api/ai-preferences`
- **Description**: Creates a new AI preference.
- **Request Body**:
  ```json
  {
    "title": "New Prompt",
    "prompt": "Act as a helpful assistant."
  }
  ```
- **Success Response**: `201 Created` with the new object.

#### Update AI preference

- **Method**: `PATCH`
- **URL**: `/api/ai-preferences/{id}`
- **Description**: Updates an existing AI preference.
- **Request Body**: `{ "title": "Updated Title" }`
- **Success Response**: `200 OK` with the updated object.

#### Delete AI preference

- **Method**: `DELETE`
- **URL**: `/api/ai-preferences/{id}`
- **Description**: Deletes an AI preference.
- **Success Response**: `204 No Content`.

### 2.4. Custom Audits

Standard CRUD endpoints for managing custom audits.

#### List custom audits

- **Method**: `GET`
- **URL**: `/api/custom-audits`
- **Description**: Retrieves all custom audits for the user.
- **Success Response**:
  - **Code**: `200 OK`
  - **Content**: `[{ "id": "uuid", "title": "SEO Audit", "prompt": "..." }]`

#### Create custom audit

- **Method**: `POST`
- **URL**: `/api/custom-audits`
- **Description**: Creates a new custom audit.
- **Request Body**:
  ```json
  {
    "title": "Tone of Voice Audit",
    "prompt": "Analyze for consistent tone of voice."
  }
  ```
- **Success Response**: `201 Created` with the new object.

#### Update custom audit

- **Method**: `PATCH`
- **URL**: `/api/custom-audits/{id}`
- **Description**: Updates an existing custom audit.
- **Request Body**: `{ "prompt": "Updated audit prompt..." }`
- **Success Response**: `200 OK` with the updated object.

#### Delete custom audit

- **Method**: `DELETE`
- **URL**: `/api/custom-audits/{id}`
- **Description**: Deletes a custom audit.
- **Success Response**: `204 No Content`.

### 2.5. Topic Clusters

Endpoints for managing topic clusters, including AI-driven actions.

#### List topic clusters

- **Method**: `GET`
- **URL**: `/api/topic-clusters`
- **Query Parameters**:
  - `sort_by` (e.g., `name`, `created_at`)
  - `order` (e.g., `asc`, `desc`)
  - `page`, `limit` for pagination
- **Description**: Retrieves a paginated list of the user's topic clusters.
- **Success Response**: `200 OK` with a paginated list.

#### Get topic cluster suggestions from AI

- **Method**: `GET`
- **URL**: `/api/topic-clusters/suggestions`
- **Query Parameters**:
  - `count` (optional, defaults to `default_topics_count` from profile)
- **Description**: Generates a list of new topic cluster suggestions using AI, based on the user's existing content and knowledge base.
- **Success Response**:
  - **Code**: `200 OK`
  - **Content**:
    ```json
    {
      "suggestions": ["AI-Generated Topic 1", "AI-Generated Topic 2"]
    }
    ```

#### Create topic cluster

- **Method**: `POST`
- **URL**: `/api/topic-clusters`
- **Description**: Creates a new topic cluster. The API will enforce a duplicate name check (case-insensitive).
- **Request Body**:
  ```json
  {
    "name": "New Unique Topic"
  }
  ```
- **Success Response**: `201 Created` with the new object.
- **Error Response**: `409 Conflict` (if name already exists).

#### Get topic cluster by ID

- **Method**: `GET`
- **URL**: `/api/topic-clusters/{id}`
- **Description**: Retrieves a single topic cluster.
- **Success Response**: `200 OK`.

#### Delete topic cluster

- **Method**: `DELETE`
- **URL**: `/api/topic-clusters/{id}`
- **Description**: Deletes a topic cluster and all of its associated articles (cascading delete). This is a destructive action.
- **Success Response**: `204 No Content`.

### 2.6. Articles

Endpoints for managing articles and the core content generation workflow.

#### List articles

- **Method**: `GET`
- **URL**: `/api/articles`
- **Query Parameters**:
  - `topic_cluster_id` (uuid, required to filter by cluster)
  - `status` (e.g., `concept`, `in_progress`, `moved`)
  - `sort_by`, `order`, `page`, `limit`
- **Description**: Retrieves a list of articles, typically filtered by a topic cluster. The `content` field is omitted for performance.
- **Success Response**: `200 OK` with a paginated list.
- **Response Content**:
  ```json
  [
    {
      "id": "uuid",
      "topic_cluster_id": "uuid",
      "created_at": "timestampz",
      "updated_at": "timestampz",
      "status": "concept",
      "name": "Article Name",
      "title": "Formatted Article Title",
      "slug": "formatted-article-title",
      "description": "Short article description.",
      "seo_title": "SEO Title",
      "seo_description": "SEO Description",
      "sanity_id": "text",
      "moved_to_sanity_at": "timestampz"
    }
  ]
  ```

#### Create article (and trigger concept generation)

- **Method**: `POST`
- **URL**: `/api/articles`
- **Description**: Creates a single new article stub from a subtopic name within a topic cluster. After creation, it immediately triggers a background job to generate the concept details (title, description, slug, SEO fields) using AI.
- **Request Body**:
  ```json
  {
    "topic_cluster_id": "uuid",
    "name": "The Name of the New Subtopic"
  }
  ```
- **Success Response**:
  - **Code**: `202 Accepted`
  - **Content**: The newly created (but not yet fully generated) article stub. The client should expect the AI-populated fields to be null initially.
    ```json
    {
      "id": "uuid",
      "topic_cluster_id": "uuid",
      "name": "The Name of the New Subtopic",
      "status": "concept",
      "title": null,
      "slug": null,
      "description": null,
      "content": null,
      "seo_title": null,
      "seo_description": null,
      ...
    }
    ```

#### Regenerate a single article concept

- **Method**: `POST`
- **URL**: `/api/articles/{id}/regenerate`
- **Description**: Triggers a background job to regenerate the AI-created fields for a single article (title, description, content structure, etc.).
- **Request Body**: None
- **Success Response**: `202 Accepted`.

#### Get article by ID

- **Method**: `GET`
- **URL**: `/api/articles/{id}`
- **Description**: Retrieves a single article.
- **Success Response**: `200 OK`.

#### Update article

- **Method**: `PATCH`
- **URL**: `/api/articles/{id}`
- **Description**: Updates the details of an article, such as its content or metadata. This is used by the editor.
- **Request Body**:
  ```json
  {
    "name": "Updated Name",
    "content": "## New Header\n\nUpdated content.",
    "status": "in_progress"
  }
  ```
- **Success Response**: `200 OK` with the updated article object.

#### Generate article body

- **Method**: `POST`
- **URL**: `/api/articles/{id}/generate-body`
- **Description**: Fills the article's `content` field by generating a full article body based on the article's concept (title, description, headers). This overwrites any existing content.
- **Request Body**: None
- **Success Response**:
  - **Code**: `200 OK`
  - **Content**: The updated article object with the newly generated `content`.

#### Run a custom audit on an article

- **Method**: `POST`
- **URL**: `/api/articles/{id}/run-audit`
- **Description**: Runs a specified custom audit (AI prompt) on the article's content and returns a list of findings. This action is read-only and does not modify the article.
- **Request Body**: `{ "audit_id": "uuid" }`
- **Success Response**:
  - **Code**: `200 OK`
  - **Content**:
    ```json
    {
      "findings": [
        {
          "type": "warning",
          "message": "This sentence uses passive voice, which can be weak. Consider rephrasing.",
          "offending_text": "The change was implemented by the team."
        },
        {
          "type": "suggestion",
          "message": "This paragraph could be made stronger with a concrete example or data point.",
          "offending_text": "Our solutions provide significant value to clients."
        }
      ]
    }
    ```

#### Move article to Sanity CMS

- **Method**: `POST`
- **URL**: `/api/articles/{id}/move-to-sanity`
- **Description**: Pushes the article to Sanity CMS, updates its status to `moved`, and stores the returned `sanity_id`.
- **Request Body**: None
- **Success Response**: `200 OK` with the updated article object.
- **Error Response**:
  - `409 Conflict`: If the article is already in `moved` status.
  - `502 Bad Gateway`: If the Sanity API is unavailable or returns an error.

#### Delete article

- **Method**: `DELETE`
- **URL**: `/api/articles/{id}`
- **Description**: Deletes a single article.
- **Success Response**: `204 No Content`.

## 3. Authentication and Authorization

- **Mechanism**: Authentication will be handled using JSON Web Tokens (JWT) provided by Supabase Auth.
- **Implementation**:
  1.  The client application will handle the user login flow via the Supabase client library, obtaining a JWT upon successful login.
  2.  For every request to the backend API, the client must include the JWT in the `Authorization` header: `Authorization: Bearer <SUPABASE_JWT>`.
  3.  Astro middleware (`src/middleware/index.ts`) will be implemented to run on all `/api/*` routes. This middleware will:
      - Extract the JWT from the header.
      - Use the Supabase Admin SDK to validate the token and retrieve the authenticated user.
      - If the token is invalid or missing, the request will be rejected with a `401 Unauthorized` error.
      - If the token is valid, the user's ID (`auth.uid()`) will be available on the server-side for the RLS policies to use. For `POST` requests, the backend logic will use this ID to set the `user_id` on new records.
- **Authorization**: Data access control is primarily enforced at the database level using Supabase's Row-Level Security (RLS). All tables have RLS policies enabled that ensure users can only access or modify data they own (i.e., where `user_id = auth.uid()`). The API layer relies on this database security and does not need to re-implement user ownership checks.
- **Development Note (User Mocking)**: As per the implementation strategy (Phase 3), initial development will proceed without a live login UI. A single test user will be created in the `content-orbit-dev` database, and its UUID will be temporarily hardcoded in the API logic to simulate an authenticated session. The JWT validation middleware will be bypassed during this phase.

## 4. Validation and Business Logic

- **Validation**: All incoming data from request bodies and query parameters will be validated using `zod`.
  - A `zod` schema will be defined for the request payload of each `POST` and `PATCH` endpoint.
  - Validation will be the first step in every API route handler.
  - If validation fails, the API will respond immediately with a `400 Bad Request` error, including a structured message detailing the validation issues.
  - Schemas will enforce data types, required fields, string lengths, and other constraints derived from the database schema (e.g., `NOT NULL` columns).
- **Business Logic**:
  - **Duplicate Checks**: Endpoints for creating resources with unique names (e.g., `POST /api/topic-clusters`) will perform a case-insensitive database query to prevent duplicates, returning a `409 Conflict` if a match is found.
  - **Asynchronous Operations**: Features like concept generation (`/api/articles/generate-concepts`) are designed to be asynchronous. The API initiates the task and returns a `202 Accepted` response, allowing the frontend to remain responsive. The client can then poll for status updates on the relevant resources.
  - **AI Integration**: Logic for interacting with the OpenRouter API will be encapsulated in dedicated service modules (`/src/lib/ai`). These services will be responsible for building prompts (including context from the knowledge base and semantic search results) and handling responses.
  - **State Management**: Endpoints that modify the state of a resource (e.g., `move-to-sanity`) will be responsible for updating the `status` field in the `articles` table according to the defined workflow (`concept` -> `in_progress` -> `moved`).
- **Development Note (AI Mocking)**: As per the implementation strategy (Phase 3), all calls to external AI services (OpenRouter) will be mocked during initial development. The API endpoints (e.g., `/api/topic-clusters/suggestions`, `/api/articles/generate-concepts`) will return static, pre-defined data that mimics the expected structure of a real AI response. True integration will occur in Phase 5.
