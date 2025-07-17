# API Endpoint Implementation Plan: POST /api/articles/{id}/generate-body

## 1. Przegląd punktu końcowego

Ten punkt końcowy służy do synchronicznego generowania treści (`content`) dla istniejącego artykułu. Na podstawie tytułu i opisu artykułu, usługa AI tworzy pełną treść w formacie Markdown. Każde wywołanie tego endpointu nadpisuje istniejącą zawartość pola `content`. Po pomyślnej operacji, zwracany jest zaktualizowany obiekt artykułu.

## 2. Szczegóły żądania

- **Metoda HTTP**: `POST`
- **Struktura URL**: `/api/articles/{id}/generate-body`
- **Parametry URL**:
  - `id` (string, uuid): Identyfikator artykułu, dla którego ma zostać wygenerowana treść.
- **Request Body**: Brak.

## 3. Wykorzystywane typy

- **DTO (wyjście)**: `ArticleDto` (`src/types.ts`) - pełne dane zaktualizowanego artykułu.

## 4. Szczegóły odpowiedzi

- **Sukces**:
  - **Kod**: `200 OK`
  - **Content**: Zaktualizowany obiekt `ArticleDto`, zawierający nowo wygenerowaną treść w polu `content`.
- **Błąd**: Zobacz sekcję "Obsługa błędów".

## 5. Przepływ danych

> **WAŻNA UWAGA DOTYCZĄCA MOCKOWANIA AI:** W bieżącej fazie implementacji, wszystkie wywołania do zewnętrznych usług AI (np. OpenRouter) muszą być zamockowane. Logika serwisu powinna zwracać predefiniowane, statyczne dane (np. długi tekst w formacie Markdown), które symulują odpowiedź AI.

1.  Żądanie `POST` trafia do `/api/articles/{id}/generate-body`.
2.  Middleware Astro weryfikuje token JWT.
3.  Handler endpointu w `src/pages/api/articles/[id]/generate-body.ts` przejmuje żądanie.
4.  Parametr `id` z URL jest walidowany (musi być poprawnym UUID).
5.  Wywoływana jest metoda `articleService.generateArticleBody(id, user.id)`.
6.  **Wewnątrz serwisu `article.service.ts`**:
    a. Pobierany jest artykuł o zadanym `id` z bazy danych. Logika musi upewnić się, że artykuł należy do zalogowanego użytkownika (`userId`).
    b. **(MOCK)** Wywoływana jest zamockowana funkcja AI, której przekazywany jest tytuł i opis artykułu (`article.title`, `article.description`).
    c. Mock AI zwraca wygenerowaną treść w formacie Markdown.
    d. Pole `content` w rekordzie artykułu jest aktualizowane o zwróconą treść.
    e. Zwracany jest pełny, zaktualizowany obiekt `ArticleDto`.
7.  Handler endpointu zwraca odpowiedź `200 OK` z `ArticleDto` w ciele odpowiedzi.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Egzekwowane przez middleware Astro.
- **Autoryzacja / IDOR**: Kluczowym elementem jest weryfikacja w warstwie serwisu, czy artykuł o podanym `id` należy do zalogowanego użytkownika. Zapytania do bazy muszą być filtrowane przez `user_id`.

## 7. Obsługa błędów

- **`400 Bad Request`**: Zwracany, gdy `id` w URL nie jest prawidłowym formatem UUID.
- **`401 Unauthorized`**: Zwracany przez middleware, gdy token JWT jest nieprawidłowy lub go brakuje.
- **`404 Not Found`**: Zwracany, gdy artykuł o podanym `id` nie istnieje lub nie należy do zalogowanego użytkownika.
- **`500 Internal Server Error`**: Zwracany w przypadku nieoczekiwanych błędów serwera (np. błąd aktualizacji w bazie danych).

## 8. Rozważania dotyczące wydajności

- Podobnie jak przy tworzeniu konceptu, synchroniczne generowanie treści jest potencjalnym wąskim gardłem. Czas odpowiedzi będzie zależał od złożoności przyszłej, prawdziwej implementacji AI. Na etapie mockowania nie ma to znaczenia.

## 9. Etapy wdrożenia

1.  **Struktura Plików**: Utwórz plik `src/pages/api/articles/[id]/generate-body.ts`.
2.  **Serwis Artykułów (`article.service.ts`)**:
    a. Utwórz nową, asynchroniczną metodę `generateArticleBody(articleId: string, userId: string): Promise<ArticleDto>`.
    b. Zaimplementuj pobieranie artykułu i weryfikację jego przynależności do `userId`.
    c. Stwórz zamockowaną funkcję (wewnątrz serwisu lub w osobnym module), która zwraca przykładową treść artykułu w Markdown.
    d. Zaimplementuj logikę aktualizacji pola `content` dla artykułu.
    e. Zwróć pełny, zaktualizowany obiekt artykułu.
3.  **Endpoint API (`generate-body.ts`)**:
    a. Dodaj `export const prerender = false;`.
    b. Zaimplementuj handler dla metody `POST`.
    c. Dodaj walidację parametru `id` z `Astro.params`.
    d. W bloku `try...catch`, wywołaj `articleService.generateArticleBody` i zwróć odpowiedź `200 OK`.
    e. W bloku `catch`, obsłuż błędy i zwróć odpowiednie kody statusu.
