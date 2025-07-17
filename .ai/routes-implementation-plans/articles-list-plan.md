# API Endpoint Implementation Plan: GET /api/articles

## 1. Przegląd punktu końcowego

Ten punkt końcowy jest odpowiedzialny za pobieranie paginowanej i filtrowanej listy artykułów należących do zalogowanego użytkownika. Ze względów wydajnościowych, odpowiedź nie zawiera pełnej treści (`content`) każdego artykułu.

## 2. Szczegóły żądania

- **Metoda HTTP**: `GET`
- **Struktura URL**: `/api/articles`
- **Parametry zapytania (Query Parameters)**:
  - **Wymagane**:
    - `topic_cluster_id` (string, uuid): Filtruje artykuły należące do określonego klastra tematycznego.
  - **Opcjonalne**:
    - `status` (string, enum: `concept`, `in_progress`, `moved`): Filtruje artykuły po ich statusie.
    - `sort_by` (string, enum: `name`, `created_at`, `updated_at`, `status`): Pole, według którego sortowane są wyniki. Domyślnie `created_at`.
    - `order` (string, enum: `asc`, `desc`): Kierunek sortowania. Domyślnie `desc`.
    - `page` (number): Numer strony do pobrania. Domyślnie `1`.
    - `limit` (number): Liczba wyników na stronie. Domyślnie `10`.

## 3. Wykorzystywane typy

- **DTO (Data Transfer Object)**:
  - `ListArticlesQuery`: Obiekt reprezentujący sparsowane i zwalidowane parametry zapytania.
  - `ArticleListItemDto`: Obiekt reprezentujący pojedynczy artykuł na liście (tylko podstawowe informacje bez szczegółów SEO, treści, opisów).
- **Modele**:
  - `Article` (z `src/types.ts`): Pełna reprezentacja artykułu, używana wewnętrznie w logice serwisu.

## 4. Szczegóły odpowiedzi

- **Pomyślna odpowiedź (Success)**:
  - **Kod**: `200 OK`
  - **Treść**:
    ```json
    {
      "data": [
        {
          "id": "uuid",
          "topic_cluster_id": "uuid",
          "created_at": "timestampz",
          "updated_at": "timestampz",
          "status": "concept",
          "name": "Article Name",
          "slug": "formatted-article-title"
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 10,
        "total": 1,
        "totalPages": 1
      }
    }
    ```
- **Odpowiedź błędu (Error)**:
  - **Kod**: `400 Bad Request` - Błąd walidacji parametrów zapytania.
  - **Kod**: `401 Unauthorized` - Brak lub nieprawidłowy token JWT.
  - **Kod**: `500 Internal Server Error` - Błąd po stronie serwera.

## 5. Przepływ danych

1.  Żądanie `GET` trafia do endpointu `/api/articles` w Astro (`src/pages/api/articles/index.ts`).
2.  Middleware Astro weryfikuje token JWT i umieszcza klienta Supabase w `context.locals.supabase`.
3.  Endpoint parsuje parametry zapytania z `Astro.url.searchParams`.
4.  Dane wejściowe są walidowane przy użyciu schemy `listArticlesQuerySchema` z `zod`.
5.  Jeśli walidacja się nie powiedzie, zwracany jest błąd `400`.
6.  Endpoint wywołuje funkcję `listArticles(supabase, query)` z serwisu `article.service.ts`.
7.  Serwis `listArticles` buduje zapytanie do Supabase, używając `.select()` do wybrania tylko wymaganych pól (z pominięciem `content`), `.eq()` do filtrowania, `.order()` do sortowania i `.range()` do paginacji.
8.  Serwis wykonuje również drugie zapytanie z `count: 'exact'` aby uzyskać całkowitą liczbę pasujących rekordów dla metadanych paginacji.
9.  Serwis zwraca listę artykułów (`ArticleListItemDto[]`) oraz obiekt paginacji.
10. Endpoint odbiera dane, formatuje odpowiedź JSON i zwraca ją z kodem `200 OK`.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Każde żądanie musi zawierać prawidłowy token JWT w nagłówku `Authorization`. Jest to obsługiwane przez middleware Astro.
- **Autoryzacja**: Dostęp do danych jest ograniczony przez polityki Row-Level Security (RLS) w bazie danych Supabase. Zapytania wykonane za pomocą klienta Supabase z tokenem użytkownika automatycznie filtrują wyniki, zwracając tylko te należące do tego użytkownika.
- **Walidacja danych wejściowych**: Wszystkie parametry zapytania są rygorystycznie walidowane przy użyciu `zod`, aby zapobiec nieoczekiwanemu zachowaniu i potencjalnym atakom (np. SQL Injection, chociaż Supabase ORM temu zapobiega).

## 7. Obsługa błędów

- **Błędy walidacji (400)**: Jeśli parametry zapytania nie przejdą walidacji `zod` (np. `topic_cluster_id` nie jest UUID, `status` ma nieprawidłową wartość), endpoint zwróci błąd `400` z listą błędów.
- **Błędy Supabase (500)**: Wszelkie błędy zwrócone przez API Supabase podczas pobierania danych będą logowane po stronie serwera i zwracane jako ogólny błąd `500 Internal Server Error`, aby nie ujawniać szczegółów implementacji.

## 8. Rozważania dotyczące wydajności

- **Paginacja**: Zaimplementowana po stronie serwera, aby zapobiec przesyłaniu dużych ilości danych naraz.
- **Selektywne pobieranie pól**: Tylko podstawowe pola (`id`, `topic_cluster_id`, `created_at`, `updated_at`, `status`, `name`, `slug`) są pobierane w zapytaniu. Pomijane są duże pola jak `content` oraz szczegóły SEO, co znacznie zmniejsza rozmiar odpowiedzi i obciążenie bazy danych.
- **Indeksowanie**: Należy upewnić się, że kolumny używane do filtrowania i sortowania (`topic_cluster_id`, `status`, `created_at`, `updated_at`, `name`) są odpowiednio zindeksowane w bazie danych PostgreSQL, aby zapewnić szybkie wykonywanie zapytań.

## 9. Etapy wdrożenia

1.  **Typy**: W pliku `src/types.ts` zdefiniuj lub zaktualizuj typy `Article`, `ArticleListItemDto` oraz `Pagination`.
2.  **Schematy**: W nowym pliku `src/lib/schemas/article.schemas.ts` utwórz schemę `zod` o nazwie `listArticlesQuerySchema` do walidacji parametrów zapytania.
3.  **Serwis**: W nowym pliku `src/lib/services/article.service.ts` zaimplementuj funkcję `async function listArticles(supabase: SupabaseClient, query: ListArticlesQuery)`. Funkcja ta powinna konstruować i wykonywać zapytanie do Supabase, a następnie zwracać dane i metadane paginacji.
4.  **Endpoint**: W pliku `src/pages/api/articles/index.ts` utwórz handler `GET`.
    - Pobierz klienta Supabase z `context.locals.supabase`.
    - Użyj `Astro.url.searchParams` do pobrania parametrów zapytania.
    - Zwaliduj parametry za pomocą `listArticlesQuerySchema.safeParse()`.
    - Obsłuż błędy walidacji.
    - Wywołaj serwis `listArticles`.
    - Zwróć pomyślną odpowiedź lub błąd serwera w bloku `try...catch`.
5.  **Testowanie**: Dodaj testy jednostkowe dla logiki serwisu i testy integracyjne dla endpointu, aby zweryfikować poprawność filtrowania, sortowania, paginacji i obsługi błędów.
