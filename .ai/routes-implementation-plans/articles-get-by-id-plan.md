# API Endpoint Implementation Plan: GET /api/articles/{id}

## 1. Przegląd punktu końcowego

Ten punkt końcowy służy do pobierania szczegółowych informacji o pojedynczym artykule na podstawie jego unikalnego identyfikatora (ID). Odpowiedź zawiera wszystkie pola obiektu artykułu, w tym jego pełną treść (`content`).

## 2. Szczegóły żądania

- **Metoda HTTP**: `GET`
- **Struktura URL**: `/api/articles/{id}`
- **Parametry URL (Path Parameters)**:
  - **Wymagane**:
    - `id` (string, uuid): Unikalny identyfikator artykułu do pobrania.

## 3. Wykorzystywane typy

- **DTO (Data Transfer Object)**:
  - `GetArticleParams`: Obiekt reprezentujący sparsowane i zwalidowane parametry ścieżki (ID).
- **Modele**:
  - `Article` (z `src/types.ts`): Pełna reprezentacja artykułu.

## 4. Szczegóły odpowiedzi

- **Pomyślna odpowiedź (Success)**:
  - **Kod**: `200 OK`
  - **Treść**: Pełny obiekt artykułu.
    ```json
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
      "content": "## Nagłówek\n\nPełna treść artykułu w formacie markdown...",
      "seo_title": "SEO Title",
      "seo_description": "SEO Description",
      "sanity_id": "text",
      "moved_to_sanity_at": "timestampz"
    }
    ```
- **Odpowiedź błędu (Error)**:
  - **Kod**: `400 Bad Request` - Błąd walidacji ID (np. nie jest to poprawny UUID).
  - **Kod**: `401 Unauthorized` - Brak lub nieprawidłowy token JWT.
  - **Kod**: `404 Not Found` - Artykuł o podanym ID nie istnieje lub użytkownik nie ma do niego dostępu.
  - **Kod**: `500 Internal Server Error` - Błąd po stronie serwera.

## 5. Przepływ danych

1.  Żądanie `GET` trafia do dynamicznego endpointu Astro `/api/articles/[id].ts`.
2.  Middleware Astro weryfikuje token JWT i udostępnia klienta Supabase w `context.locals.supabase`.
3.  Endpoint pobiera parametr `id` z `context.params`.
4.  ID jest walidowane przy użyciu schemy `getArticleParamsSchema` z `zod`.
5.  W przypadku błędu walidacji, zwracany jest błąd `400`.
6.  Endpoint wywołuje funkcję `getArticleById(supabase, id)` z serwisu `article.service.ts`.
7.  Serwis `getArticleById` wykonuje zapytanie do Supabase: `supabase.from('articles').select('*').eq('id', id).single()`. Metoda `.single()` jest kluczowa, ponieważ automatycznie zwróci błąd, jeśli nie zostanie znaleziony dokładnie jeden rekord.
8.  Jeśli Supabase zwróci błąd `PGRST116` (Not Found), serwis przechwytuje go i rzuca własny, bardziej specyficzny błąd (np. `ArticleNotFoundError`).
9.  Endpoint w bloku `catch` mapuje błąd `ArticleNotFoundError` na odpowiedź `404 Not Found`.
10. Jeśli artykuł zostanie znaleziony, serwis go zwraca, a endpoint formatuje odpowiedź JSON i odsyła z kodem `200 OK`.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Wymagany jest prawidłowy token JWT, weryfikowany przez middleware.
- **Autoryzacja**: Polityki RLS w Supabase zapewniają, że użytkownik może pobrać tylko artykuł, który do niego należy. Próba dostępu do cudzego artykułu zakończy się błędem "Not Found" (tak samo jak w przypadku nieistniejącego artykułu), co zapobiega wyciekowi informacji o istnieniu zasobów.
- **Walidacja ID**: Walidacja formatu UUID dla `id` w parametrze ścieżki zapobiega niepotrzebnym i potencjalnie błędnym zapytaniom do bazy danych.

## 7. Obsługa błędów

- **Błąd walidacji (400)**: Zwracany, gdy `id` nie jest prawidłowym UUID.
- **Nie znaleziono (404)**: Zwracany, gdy zapytanie `.single()` w Supabase nie znajdzie żadnego rekordu. Jest to celowe zachowanie, aby ukryć przed potencjalnym atakującym, czy zasób o danym ID w ogóle istnieje.
- **Błędy Supabase (500)**: Inne błędy z Supabase API (np. problemy z połączeniem) będą logowane i zwracane jako ogólny błąd `500`.

## 8. Rozważania dotyczące wydajności

- Zapytanie o pojedynczy rekord po kluczu głównym (`id`) jest wysoce zoptymalizowane w PostgreSQL i powinno być bardzo szybkie.
- Nie ma tu potrzeby dodatkowych optymalizacji, poza zapewnieniem, że kolumna `id` ma indeks klucza głównego (co jest domyślne).

## 9. Etapy wdrożenia

1.  **Schematy**: W pliku `src/lib/schemas/article.schemas.ts` dodaj schemę `zod` o nazwie `getArticleParamsSchema` do walidacji parametru `id`.
2.  **Serwis**: W pliku `src/lib/services/article.service.ts` zaimplementuj funkcję `async function getArticleById(supabase: SupabaseClient, id: string)`.
    - Funkcja powinna wykonać zapytanie `select...eq...single`.
    - Powinna zawierać obsługę błędu "Not Found" z Supabase i rzucać customowy błąd.
3.  **Endpoint**: W pliku `src/pages/api/articles/[id].ts` utwórz handler dla metody `GET`.
    - Pobierz klienta Supabase i `id` z `context`.
    - Zwaliduj `id`.
    - Wywołaj serwis `getArticleById` w bloku `try...catch`.
    - W bloku `catch` sprawdzaj typ błędu i zwracaj `404` dla `ArticleNotFoundError` lub `500` dla innych błędów.
    - W bloku `try` zwróć pomyślną odpowiedź `200 OK`.
4.  **Typy błędów**: W `src/lib/errors.ts` zdefiniuj customowy błąd, np. `class ArticleNotFoundError extends Error {}`.
5.  **Testowanie**: Dodaj testy jednostkowe dla serwisu (scenariusze sukcesu i "not found") oraz testy integracyjne dla endpointu (sukces, nieprawidłowe ID, nieznalezione ID).
