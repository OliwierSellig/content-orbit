# API Endpoint Implementation Plan: PATCH /api/articles/{id}

## 1. Przegląd punktu końcowego

Ten punkt końcowy umożliwia częściową aktualizację istniejącego artykułu. Pozwala na modyfikację wybranych pól, takich jak `name`, `content` czy `status`, bez potrzeby przesyłania całego obiektu.

## 2. Szczegóły żądania

- **Metoda HTTP**: `PATCH`
- **Struktura URL**: `/api/articles/{id}`
- **Parametry URL (Path Parameters)**:
  - **Wymagane**:
    - `id` (string, uuid): Unikalny identyfikator artykułu do zaktualizowania.
- **Ciało żądania (Request Body)**:
  - **Struktura**: Obiekt JSON zawierający pola do zaktualizowania. Wszystkie pola są opcjonalne.
    ```json
    {
      "name": "Updated Name",
      "content": "## New Header\n\nUpdated content.",
      "status": "in_progress",
      "title": "Updated Formatted Article Title",
      "slug": "updated-formatted-article-title",
      "description": "Updated short article description.",
      "seo_title": "Updated SEO Title",
      "seo_description": "Updated SEO Description"
    }
    ```

## 3. Wykorzystywane typy

- **DTO (Data Transfer Object)**:
  - `UpdateArticleParams`: Obiekt reprezentujący sparsowane ID z parametrów ścieżki.
  - `UpdateArticleDto`: Obiekt reprezentujący zwalidowane, opcjonalne pola z ciała żądania.
- **Modele**:
  - `Article` (z `src/types.ts`): Pełna reprezentacja artykułu.

## 4. Szczegóły odpowiedzi

- **Pomyślna odpowiedź (Success)**:
  - **Kod**: `200 OK`
  - **Treść**: Zaktualizowany, pełny obiekt artykułu.
- **Odpowiedź błędu (Error)**:
  - **Kod**: `400 Bad Request` - Błąd walidacji ID lub ciała żądania.
  - **Kod**: `401 Unauthorized` - Brak lub nieprawidłowy token JWT.
  - **Kod**: `404 Not Found` - Artykuł o podanym ID nie istnieje.
  - **Kod**: `500 Internal Server Error` - Błąd po stronie serwera.

## 5. Przepływ danych

1.  Żądanie `PATCH` trafia do endpointu `/api/articles/[id].ts`.
2.  Middleware Astro weryfikuje token i umieszcza klienta Supabase w `context.locals.supabase`.
3.  Endpoint pobiera parametr `id` oraz ciało żądania (`await Astro.request.json()`).
4.  Parametr `id` i ciało żądania są walidowane przy użyciu odpowiednich schem `zod` (`updateArticleParamsSchema` i `updateArticleDtoSchema`).
5.  Jeśli walidacja się nie powiedzie, zwracany jest błąd `400`.
6.  Endpoint wywołuje funkcję `updateArticle(supabase, id, data)` z serwisu `article.service.ts`.
7.  Serwis `updateArticle` najpierw sprawdza, czy artykuł o danym `id` istnieje (aby móc zwrócić `404` zamiast generycznego błędu `update`), wywołując np. `getArticleById`.
8.  Następnie serwis konstruuje zapytanie `update` do Supabase, przekazując tylko zwalidowane pola z DTO. Automatycznie aktualizuje również pole `updated_at`.
9.  Zapytanie `update` jest wykonywane: `supabase.from('articles').update({ ...data, updated_at: new Date() }).eq('id', id).select().single()`.
10. Jeśli artykuł zostanie pomyślnie zaktualizowany, serwis zwraca zaktualizowany obiekt.
11. Endpoint odbiera zaktualizowany artykuł i zwraca go w odpowiedzi z kodem `200 OK`.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Wymagany jest prawidłowy token JWT.
- **Autoryzacja**: Polityki RLS w Supabase zapewniają, że użytkownik może modyfikować tylko własne artykuły. Próba aktualizacji cudzego artykułu zakończy się niepowodzeniem (prawdopodobnie jako `404 Not Found`, ponieważ wstępne sprawdzenie nie znajdzie zasobu).
- **Walidacja danych wejściowych**: Ciało żądania jest rygorystycznie walidowane, aby upewnić się, że typy danych są poprawne, a pola takie jak `status` mają wartości z dozwolonej listy (enum). Zapobiega to wprowadzeniu do bazy danych nieprawidłowych danych.

## 7. Obsługa błędów

- **Błąd walidacji (400)**: Zwracany, gdy `id` jest nieprawidłowe lub dane w ciele żądania nie pasują do schemy `zod`.
- **Nie znaleziono (404)**: Zwracany, gdy artykuł o podanym `id` nie istnieje lub nie należy do użytkownika.
- **Błędy Supabase (500)**: Inne błędy z API Supabase (np. naruszenie ograniczeń bazy danych) będą logowane i zwracane jako ogólny błąd `500`.

## 8. Rozważania dotyczące wydajności

- Operacja `update` na kluczu głównym jest wydajna.
- Dodatkowe zapytanie `select` w celu weryfikacji istnienia artykułu przed aktualizacją wprowadza niewielki narzut, ale jest kluczowe dla prawidłowej obsługi błędów (zwracanie `404`). Można to zoptymalizować, polegając tylko na odpowiedzi z `update().select().single()`, która również zwróci błąd, jeśli rekord nie zostanie znaleziony.

## 9. Etapy wdrożenia

1.  **Schematy**: W `src/lib/schemas/article.schemas.ts` dodaj `updateArticleParamsSchema` dla `id` i `updateArticleDtoSchema` dla ciała żądania. Użyj `.partial()`, aby wszystkie pola w DTO były opcjonalne.
2.  **Serwis**: W `src/lib/services/article.service.ts` zaimplementuj funkcję `async function updateArticle(supabase: SupabaseClient, id: string, data: UpdateArticleDto)`.
    - Funkcja powinna zawierać logikę aktualizacji rekordu w Supabase.
    - Powinna obsługiwać przypadki, gdy rekord nie istnieje, rzucając `ArticleNotFoundError`.
3.  **Endpoint**: W pliku `src/pages/api/articles/[id].ts` dodaj handler dla metody `PATCH`.
    - Pobierz `id`, ciało żądania i klienta Supabase z `context`.
    - Zwaliduj parametry i ciało żądania.
    - Wywołaj serwis `updateArticle` w bloku `try...catch`.
    - Obsłuż błędy `ArticleNotFoundError` (zwracając `404`) oraz inne błędy serwera.
    - Zwróć pomyślną odpowiedź `200 OK` z zaktualizowanymi danymi.
4.  **Testowanie**: Dodaj testy jednostkowe dla serwisu (scenariusze pomyślnej aktualizacji, próby aktualizacji nieistniejącego artykułu) i testy integracyjne dla endpointu (sukces, nieprawidłowe dane, nieistniejące ID).
