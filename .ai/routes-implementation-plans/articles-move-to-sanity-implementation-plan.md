# API Endpoint Implementation Plan: POST /api/articles/{id}/move-to-sanity

## 1. Przegląd punktu końcowego

Ten punkt końcowy jest odpowiedzialny za finalny etap cyklu życia artykułu w aplikacji – przeniesienie go do zewnętrznego systemu CMS (Sanity). Operacja ta zmienia status artykułu na `moved`, zapisuje identyfikator zwrócony przez Sanity (`sanity_id`) oraz znacznik czasu operacji. Jest to akcja nieodwracalna w ramach standardowego przepływu.

## 2. Szczegóły żądania

- **Metoda HTTP**: `POST`
- **Struktura URL**: `/api/articles/{id}/move-to-sanity`
- **Parametry URL**:
  - `id` (string, uuid): Identyfikator artykułu do przeniesienia.
- **Request Body**: Brak.

## 3. Wykorzystywane typy

- **DTO (wyjście)**: `ArticleDto` (`src/types.ts`) - zaktualizowane dane artykułu.

## 4. Szczegóły odpowiedzi

- **Sukces**:
  - **Kod**: `200 OK`
  - **Content**: Zaktualizowany obiekt `ArticleDto` ze zmienionym statusem i nowym `sanity_id`.
- **Błąd**: Zobacz sekcję "Obsługa błędów".

## 5. Przepływ danych

> **WAŻNA UWAGA DOTYCZĄCA MOCKOWANIA SANITY:** W bieżącej fazie implementacji, wszystkie wywołania do API Sanity muszą być zamockowane. Logika serwisu powinna symulować pomyślne przesłanie danych i zwracać predefiniowany, statyczny `sanity_id` (np. `mock-sanity-id-123`).

1.  Żądanie `POST` trafia do `/api/articles/{id}/move-to-sanity`.
2.  Middleware Astro weryfikuje token JWT.
3.  Handler endpointu w `src/pages/api/articles/[id]/move-to-sanity.ts` przejmuje żądanie.
4.  Parametr `id` z URL jest walidowany.
5.  Wywoływana jest metoda `articleService.moveArticleToSanity(id, user.id)`.
6.  **Wewnątrz serwisu `article.service.ts`**:
    a. Pobierany jest artykuł o zadanym `id` i weryfikowana jest jego przynależność do `userId`.
    b. Sprawdzany jest status artykułu. Jeśli jest już `moved`, zwracany jest błąd (przełoży się na `409 Conflict`).
    c. **(MOCK)** Wywoływana jest zamockowana funkcja serwisu Sanity, której przekazywane są dane artykułu.
    d. Mock Sanity API zwraca fałszywy `sanity_id`.
    e. Artykuł w bazie danych jest aktualizowany: - `status` -> `'moved'` - `sanity_id` -> (wartość z mocka) - `moved_to_sanity_at` -> `NOW()`
    f. Zwracany jest pełny, zaktualizowany obiekt `ArticleDto`.
7.  Handler endpointu zwraca odpowiedź `200 OK` z `ArticleDto`.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Egzekwowane przez middleware.
- **Autoryzacja / IDOR**: Kluczowe jest sprawdzenie w serwisie, czy artykuł, który ma być przeniesiony, należy do zalogowanego użytkownika.

## 7. Obsługa błędów

- **`400 Bad Request`**: Zwracany, gdy `id` w URL nie jest prawidłowym formatem UUID.
- **`401 Unauthorized`**: Zwracany przez middleware.
- **`404 Not Found`**: Zwracany, gdy artykuł o podanym `id` nie istnieje lub nie należy do zalogowanego użytkownika.
- **`409 Conflict`**: Zwracany, gdy artykuł ma już status `moved`.
- **`500 Internal Server Error`**: Zwracany w przypadku błędów bazy danych.
- **`502 Bad Gateway`**: Zarezerwowany na przyszłość, gdy prawdziwe API Sanity będzie niedostępne lub zwróci błąd. Mock nie powinien symulować tego przypadku, chyba że w ramach dedykowanych testów.

## 8. Rozważania dotyczące wydajności

- Wydajność zależy od czasu odpowiedzi API Sanity. W fazie mockowania operacja będzie natychmiastowa.

## 9. Etapy wdrożenia

1.  **Struktura Plików**: Utwórz plik `src/pages/api/articles/[id]/move-to-sanity.ts`.
2.  **Serwis Artykułów (`article.service.ts`)**:
    a. Utwórz nową, asynchroniczną metodę `moveArticleToSanity(articleId: string, userId: string): Promise<ArticleDto>`.
    b. Zaimplementuj logikę pobierania artykułu i weryfikacji jego przynależności oraz statusu.
    c. **Stwórz zamockowaną funkcję serwisu Sanity**, która zwraca fałszywy `sanity_id`.
    d. Zaimplementuj logikę aktualizacji rekordu artykułu (status, sanity_id, moved_to_sanity_at).
    e. Zwróć zaktualizowany obiekt `ArticleDto`.
3.  **Endpoint API (`move-to-sanity.ts`)**:
    a. Dodaj `export const prerender = false;`.
    b. Zaimplementuj handler `POST`.
    c. Dodaj walidację `Astro.params.id`.
    d. W bloku `try...catch`, wywołaj `articleService.moveArticleToSanity` i zwróć odpowiedź `200 OK`.
    e. W bloku `catch`, obsłuż błędy (`404`, `409`, `500`) i zwróć odpowiednie kody statusu.
