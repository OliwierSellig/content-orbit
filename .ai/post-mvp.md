# Post-MVP Enhancements

This document outlines potential features and technical improvements to be considered after the successful launch of the Minimum Viable Product (MVP).

## Knowledge Base and AI Context

### Implementation of `pgvector` for Semantic Search

**Proposal:** Investigate and implement the `pgvector` PostgreSQL extension.

**Description:**
Currently, the `knowledge_bases` table stores company information as plain `TEXT`. After the MVP, we should enhance this by generating vector embeddings for each section (`about_us`, `team`, `offer`, etc.) and storing them in the database using `pgvector`.

**Benefits:**

- **Semantic Search:** This will enable powerful semantic search capabilities instead of simple keyword matching. When generating content, the AI could perform a similarity search to find the most contextually relevant parts of the knowledge base.
- **Improved AI Relevance:** By providing more accurate and relevant context, the AI will be able to generate higher-quality, more consistent, and factually accurate content that is better aligned with the company's profile and voice.
- **Scalability:** It provides a scalable solution for managing and searching a growing knowledge base as more documents and information are added over time.
