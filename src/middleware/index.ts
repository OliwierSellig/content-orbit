/// <reference types="astro/client" />
import { createServerClient, parseCookieHeader } from "@supabase/ssr";
import { defineMiddleware } from "astro:middleware";
import type { Database } from "../db/types";
import type { Session, User } from "@supabase/supabase-js";

// Prawdziwy user z bazy danych development dla Phase 3
const TEST_USER: User = {
  id: "a8735877-743a-44d3-aff7-0773c4367578",
  email: "oliwier@kryptonum.eu",
  aud: "authenticated",
  role: "authenticated",
  email_confirmed_at: "2025-07-15T07:39:55.481618Z",
  phone: "",
  confirmed_at: "2025-07-15T07:39:55.481618Z",
  last_sign_in_at: "2025-07-15T07:39:55.464832Z",
  app_metadata: {},
  user_metadata: {},
  identities: [],
  created_at: "2025-07-15T07:39:55.464832Z",
  updated_at: "2025-07-15T07:39:55.464832Z",
  is_anonymous: false,
};

const TEST_SESSION: Session = {
  access_token: "test-access-token-dev",
  refresh_token: "test-refresh-token-dev",
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: "bearer",
  user: TEST_USER,
};

export const onRequest = defineMiddleware(async (context, next) => {
  // Tworzenie klienta Supabase dla SSR
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

  // Ustawiamy klienta Supabase w locals
  context.locals.supabase = supabase;

  // Uruchamiamy autentykację dla KAŻDEGO zapytania
  try {
    // Bezpieczne pobieranie sesji i walidacja JWT
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      // Dodatkowa walidacja JWT poprzez getUser() - zgodnie z dokumentacją Supabase
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (!error && user) {
        // Ustawiamy uwierzytelnionego użytkownika w locals
        context.locals.user = user;
        context.locals.session = session;
      } else {
        console.error("JWT validation failed:", error);
        context.locals.user = null;
        context.locals.session = null;
      }
    } else {
      // FALLBACK dla Phase 3 development - prawdziwy user z dev database
      console.log("No session found, using real dev user for Phase 3 development");
      context.locals.user = TEST_USER;
      context.locals.session = TEST_SESSION;
    }
  } catch (error) {
    console.error("Authentication error in middleware:", error);
    // FALLBACK dla Phase 3 development - prawdziwy user z dev database
    console.log("Auth error, using real dev user for Phase 3 development");
    context.locals.user = TEST_USER;
    context.locals.session = TEST_SESSION;
  }

  return next();
});
