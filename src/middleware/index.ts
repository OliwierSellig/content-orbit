import { createServerClient, parseCookieHeader } from "@supabase/ssr";
import { defineMiddleware } from "astro:middleware";
import type { Database } from "../db/types";

export const onRequest = defineMiddleware(async (context, next) => {
  const supabase = createServerClient<Database>(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          const parsed = parseCookieHeader(context.request.headers.get("Cookie") ?? "");
          return parsed.filter((cookie): cookie is { name: string; value: string } => typeof cookie.value === "string");
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => context.cookies.set(name, value, options));
        },
      },
    }
  );

  context.locals.supabase = supabase;

  return next();
});
