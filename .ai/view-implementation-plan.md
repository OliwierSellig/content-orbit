# API Endpoint Implementation Plan: PATCH /api/profile

## 1. Przegląd punktu końcowego

Ten punkt końcowy umożliwia zalogowanemu użytkownikowi aktualizację jego ustawień profilu. Jest to operacja `PATCH`, co oznacza, że klient wysyła tylko te pola, które zamierza zmodyfikować. Endpoint odpowiada za walidację danych wejściowych, interakcję z bazą danych za pośrednictwem warstwy serwisowej oraz zwrócenie zaktualizowanego obiektu profilu lub odpowiedniego błędu.

## 2. Szczegóły żądania

- **Metoda HTTP**: `PATCH`
- **Struktura URL**: `/api/profile`
- **Nagłówki**:
  - `Content-Type`: `application/json`
  - `Authorization`: `Bearer <SUPABASE_JWT>`
- **Parametry**: Brak.
- **Treść żądania (Request Body)**: Obiekt JSON zawierający dowolną kombinację poniższych opcjonalnych pól.
  ```json
  {
    "default_topics_count": 5,
    "default_subtopics_count": 10
  }
  ```

## 3. Wykorzystywane typy

- **Command Model (wejście)**: `UpdateProfileCommand` (z `src/types.ts`)
- **DTO (wyjście)**: `ProfileDto` (z `src/types.ts`)
- **Schemat walidacji Zod (wejście)**: Nowy `UpdateProfileRequestSchema` (w `src/lib/schemas/profile.schemas.ts`)
- **Schemat walidacji Zod (wyjście)**: Istniejący `ProfileResponseSchema` (w `src/lib/schemas/profile.schemas.ts`)

## 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu (`200 OK`)**:
  - **Treść**: Obiekt `ProfileDto` reprezentujący zaktualizowany profil.
    ```json
    {
      "id": "uuid",
      "created_at": "timestampz",
      "updated_at": "timestampz",
      "default_topics_count": 5,
      "default_subtopics_count": 10
    }
    ```
- **Odpowiedzi błędów**:
  - **`400 Bad Request`**: Zwracany w przypadku nieudanej walidacji danych wejściowych. Treść odpowiedzi będzie obiektem typu `ValidationErrorResponse`.
  - **`401 Unauthorized`**: Zwracany, gdy użytkownik nie jest uwierzytelniony.
  - **`404 Not Found`**: Zwracany, gdy profil dla danego użytkownika nie istnieje w bazie danych.
  - **`500 Internal Server Error`**: Zwracany w przypadku błędów serwera (np. błąd bazy danych).

## 5. Przepływ danych

1. Żądanie `PATCH` trafia na endpoint `/api/profile`.
2. Middleware Astro weryfikuje token JWT i udostępnia `locals.user` oraz `locals.supabase`.
3. Handler API w `src/pages/api/profile.ts` sprawdza obecność `locals.user`. W przypadku braku, rzuca `UnauthorizedError`.
4. Handler odczytuje i parsuje ciało żądania JSON.
5. Ciało żądania jest walidowane przy użyciu schematu `UpdateProfileRequestSchema` z biblioteki Zod. W przypadku błędu, zwracana jest odpowiedź `400` ze szczegółami.
6. Handler wywołuje funkcję `updateProfile(supabase, user.id, validatedData)` z warstwy serwisowej (`src/lib/services/profile.service.ts`).
7. Funkcja `updateProfile` wykonuje operację `supabase.from("profiles").update(data).eq("id", userId).select().single()`.
8. Serwis obsługuje błędy z Supabase. Jeśli rekord nie został znaleziony, rzuca `ProfileNotFoundError`. W przypadku innych błędów bazy danych, rzuca `DatabaseError`.
9. Serwis waliduje dane zwrócone po aktualizacji przy użyciu `ProfileResponseSchema`. W przypadku niezgodności, rzuca `InternalDataValidationError`.
10. Serwis zwraca zwalidowany `ProfileDto` do handlera API.
11. Handler API zwraca odpowiedź `200 OK` z otrzymanym `ProfileDto`. W przypadku przechwycenia wyjątku z warstwy serwisowej, zwraca odpowiedni kod błędu HTTP.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Każde żądanie musi zawierać prawidłowy token JWT, który jest weryfikowany przez middleware Astro. Dostęp do endpointu bez tokenu jest niemożliwy.
- **Autoryzacja**: Identyfikator użytkownika (`userId`) jest pobierany z zaufanego źródła (`locals.user.id`), a nie z ciała żądania. Gwarantuje to, że użytkownicy mogą modyfikować tylko własne profile. Mechanizm Row-Level Security w bazie danych stanowi dodatkową warstwę ochrony.
- **Walidacja danych**: Użycie ścisłego schematu walidacji Zod (`.strict()`) chroni przed atakami typu "mass assignment" poprzez odrzucenie wszelkich nieoczekiwanych pól w żądaniu.

## 7. Obsługa błędów

Wszystkie błędy są przechwytywane w bloku `try...catch` w handlerze API i logowane za pomocą funkcji `logError`.

- `UnauthorizedError`: Złapany i zmapowany na odpowiedź `401`.
- `ZodError` (z walidacji wejściowej): Złapany, przekształcony w `ValidationErrorResponse` i zmapowany na odpowiedź `400`.
- `ProfileNotFoundError`: Złapany i zmapowany na odpowiedź `404`.
- `DatabaseError`: Złapany i zmapowany na odpowiedź `500`.
- `InternalDataValidationError`: Złapany i zmapowany na odpowiedź `500`.
- **Inne błędy**: Wszelkie nieoczekiwane wyjątki są łapane i mapowane na generyczną odpowiedź `500 Internal Server Error`.

## 8. Rozważania dotyczące wydajności

- Operacja `UPDATE` na tabeli `profiles` jest wykonywana na kluczu głównym (`id`), który jest indeksowany, co zapewnia wysoką wydajność.
- Użycie `.select().single()` w jednym zapytaniu z `update()` eliminuje potrzebę drugiego odpytania bazy danych w celu pobrania zaktualizowanych danych, co jest optymalne.
- Nie przewiduje się znaczących wąskich gardeł wydajnościowych dla tego endpointu.

## 9. Etapy wdrożenia

1.  **Utworzenie schematu walidacji**:

    - W pliku `src/lib/schemas/profile.schemas.ts` dodać i wyeksportować nowy schemat `UpdateProfileRequestSchema`.
    - Schemat powinien definiować `default_topics_count` i `default_subtopics_count` jako `z.number().int().positive().optional()`.
    - Użyć `.strict()`, aby zapobiec przesyłaniu nadmiarowych pól.

2.  **Rozszerzenie serwisu profilu**:

    - W pliku `src/lib/services/profile.service.ts` utworzyć i wyeksportować nową funkcję asynchroniczną `updateProfile`.
    - Funkcja powinna przyjmować `supabase: SupabaseClient`, `userId: string` oraz `data: UpdateProfileCommand`.
    - Wewnątrz funkcji, wykonać zapytanie: `supabase.from("profiles").update(data).eq("id", userId).select().single()`.
    - Dodać obsługę błędów: jeśli `error` istnieje, rzucić `ProfileNotFoundError` dla kodu `PGRST116` lub `DatabaseError` dla innych błędów. Jeśli `data` jest `null`, również rzucić `ProfileNotFoundError`.
    - Zwalidować zwrócone dane za pomocą `ProfileResponseSchema.safeParse()`. W przypadku błędu walidacji, rzucić `InternalDataValidationError`.
    - Zwrócić `validationResult.data`.

3.  **Implementacja handlera API**:
    - W pliku `src/pages/api/profile.ts` dodać `export const PATCH: APIRoute = async ({ locals, request }) => { ... }`.
    - Dodać główny blok `try...catch` do obsługi błędów.
    - Zaimplementować logikę sprawdzania `locals.user` i `locals.supabase`, analogicznie do handlera `GET`.
    - Odczytać ciało żądania za pomocą `await request.json()`, z osobnym `try...catch` na wypadek błędu parsowania JSON.
    - Zwalidować ciało żądania przy użyciu `UpdateProfileRequestSchema.safeParse()`. W przypadku błędu, skonstruować `ValidationErrorResponse` z kodem `400` i zwrócić ją.
    - Wywołać `await updateProfile(locals.supabase, locals.user.id, validatedData)`.
    - Po pomyślnym wykonaniu, zwrócić odpowiedź `200 OK` z danymi profilu.
    - W głównym bloku `catch`, obsłużyć specyficzne wyjątki (`UnauthorizedError`, `ProfileNotFoundError`, `DatabaseError` itd.) i zwrócić odpowiednie odpowiedzi HTTP, używając istniejących helperów `createErrorResponse` i `logError`.
