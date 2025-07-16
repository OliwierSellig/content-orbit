import { z } from "zod";

/**
 * Zod schema for validating the KnowledgeBaseDto.
 * Ensures that data fetched from the database matches the expected client-side shape.
 */
export const KnowledgeBaseDtoSchema = z.object({
  id: z.uuid(),
  user_id: z.uuid(),
  created_at: z.string(),
  updated_at: z.string(),
  about_us: z.string().nullable(),
  team: z.string().nullable(),
  offer: z.string().nullable(),
});
