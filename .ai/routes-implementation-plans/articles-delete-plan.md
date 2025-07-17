# API Endpoint Implementation Plan: DELETE /api/articles/{id}

## 1. Przegląd punktu końcowego

Ten punkt końcowy jest odpowiedzialny za trwałe usunięcie pojedynczego artykułu na podstawie jego unikalnego identyfikatora (ID). Jest to operacja nieodwracalna.

## 2. Szczegóły żądania

- **Metoda HTTP**: `DELETE`
- **Struktura URL**: `/api/articles/{id}`
- **Parametry URL (Path Parameters)**:
  - **Wymagane**:
    - `id` (string, uuid): Unikalny identyfikator artykułu do usunięcia.
- **Ciało żądania (Request Body)**: Brak.

## 3. Wykorzystywane typy

- **DTO (Data Transfer Object)**:
  - `DeleteArticleParams`: Obiekt reprezentujący sparsowane i zwalidowane ID z parametrów ścieżki.

## 4. Szczegóły odpowiedzi

- **Pomyślna odpowiedź (Success)**:
  - **Kod**: `204 No Content`
  - **Treść**: Brak.
- **Odpowiedź błędu (Error)**:
  - **Kod**: `400 Bad Request` - Błąd walidacji ID.
  - **Kod**: `401 Unauthorized` - Brak lub nieprawidłowy token JWT.
  - **Kod**: `404 Not Found` - Artykuł o podanym ID nie istnieje lub użytkownik nie ma uprawnień do jego usunięcia.
  - **Kod**: `500 Internal Server Error` - Błąd po stronie serwera.

## 5. Przepływ danych

1.  Żądanie `DELETE` trafia do endpointu `/api/articles/[id].ts`.
2.  Middleware Astro weryfikuje token JWT i umieszcza klienta Supabase w `context.locals.supabase`.
3.  Endpoint pobiera parametr `id` z `context.params`.
4.  Parametr `id` jest walidowany za pomocą schemy `deleteArticleParamsSchema` z `zod`.
5.  Jeśli walidacja się nie powiedzie, zwracany jest błąd `400`.
6.  Endpoint wywołuje funkcję `deleteArticle(supabase, id)` z serwisu `article.service.ts`.
7.  Serwis `deleteArticle` najpierw sprawdza, czy artykuł istnieje, aby móc poprawnie zwrócić błąd `404`.
8.  Następnie serwis wykonuje operację usunięcia w Supabase: `supabase.from('articles').delete().eq('id', id)`.
9.  Jeśli operacja usunięcia się powiedzie, serwis kończy działanie.
10. Endpoint, po pomyślnym wykonaniu serwisu, zwraca pustą odpowiedź z kodem `204 No Content`.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Wymagany prawidłowy token JWT.
- **Autoryzacja**: Polityki RLS w Supabase zapewniają, że użytkownik może usunąć tylko artykuł, który do niego należy. Próba usunięcia cudzego zasobu zakończy się niepowodzeniem (najprawdopodobniej jako `404 Not Found`), chroniąc dane innych użytkowników.
- **Walidacja ID**: Rygorystyczna walidacja formatu UUID dla `id` jest kluczowa, aby zapobiec próbom wykonania operacji na nieprawidłowych danych.

## 7. Obsługa błędów

- **Błąd walidacji (400)**: Zwracany, gdy `id` nie jest prawidłowym UUID.
- **Nie znaleziono (404)**: Zwracany, gdy artykuł o podanym `id` nie istnieje lub nie należy do użytkownika. Jest to istotne, aby operacja `delete` była idempotentna z perspektywy klienta - wielokrotne wywołanie `DELETE` na tym samym zasobie powinno dawać ten sam efekt (zasób nie istnieje).
- **Błędy Supabase (500)**: Inne błędy, np. związane z naruszeniem więzów integralności (chociaż `ON DELETE CASCADE` na `topic_cluster_id` nie powinno tu stanowić problemu), będą logowane i zwracane jako `500`.

## 8. Rozważania dotyczące wydajności

- Operacja `delete` na kluczu głównym jest zoptymalizowana i szybka.
- Podobnie jak przy `PATCH`, dodatkowe zapytanie w celu weryfikacji istnienia rekordu wprowadza narzut, ale jest to dobra praktyka dla zapewnienia poprawnej semantyki `404`.

## 9. Etapy wdrożenia

1.  **Schematy**: W `src/lib/schemas/article.schemas.ts` dodaj schemę `deleteArticleParamsSchema` do walidacji `id`.
2.  **Serwis**: W `src/lib/services/article.service.ts` zaimplementuj funkcję `async function deleteArticle(supabase: SupabaseClient, id: string)`.
    - Funkcja powinna najpierw zweryfikować istnienie artykułu, rzucając `ArticleNotFoundError`, jeśli go nie znajdzie.
    - Następnie powinna wykonać operację `delete`.
3.  **Endpoint**: W pliku `src/pages/api/articles/[id].ts` dodaj handler dla metody `DELETE`.
    - Pobierz `id` i klienta Supabase z `context`.
    - Zwaliduj `id`.
    - Wywołaj serwis `deleteArticle` w bloku `try...catch`.
    - Obsłuż błędy `ArticleNotFoundError` (zwracając `404`) i inne błędy serwera.
    - Jeśli operacja się powiedzie, zwróć odpowiedź z kodem `204 No Content`.
4.  **Testowanie**: Dodaj testy jednostkowe dla serwisu (scenariusze pomyślnego usunięcia i próby usunięcia nieistniejącego artykułu) oraz testy integracyjne dla endpointu (sukces, nieprawidłowe ID, nieistniejące ID).
