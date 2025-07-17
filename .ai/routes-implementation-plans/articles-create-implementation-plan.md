# API Endpoint Implementation Plan: POST /api/articles

## 1. Przegląd punktu końcowego

Ten punkt końcowy jest odpowiedzialny za tworzenie nowego artykułu w systemie. Proces rozpoczyna się od przyjęcia nazwy podtematu (`name`) oraz identyfikatora klastra tematycznego (`topic_cluster_id`). Po wstępnej walidacji i utworzeniu rekordu w bazie danych, endpoint synchronicznie uruchamia usługę AI w celu wygenerowania kluczowych pól artykułu, takich jak `title`, `slug`, `description` oraz `seo_title` i `seo_description`. Po pomyślnym zakończeniu operacji, zwracany jest pełny obiekt nowo utworzonego artykułu.

## 2. Szczegóły żądania

- **Metoda HTTP**: `POST`
- **Struktura URL**: `/api/articles`
- **Request Body**: Ciało żądania musi zawierać obiekt JSON o następującej strukturze:
  ```json
  {
    "topic_cluster_id": "string (uuid)",
    "name": "string"
  }
  ```
- **Parametry**:
  - **Wymagane**: `topic_cluster_id`, `name`.
  - **Opcjonalne**: Brak.

## 3. Wykorzystywane typy

- **Command Model (wejście)**: `CreateArticleCommand` (`src/types.ts`) - do walidacji i przekazywania danych wejściowych.
- **DTO (wyjście)**: `ArticleDto` (`src/types.ts`) - do zwracania pełnych danych o utworzonym artykule.

## 4. Szczegóły odpowiedzi

- **Sukces**:
  - **Kod**: `201 Created`
  - **Content**: Pełny obiekt `ArticleDto` nowo utworzonego artykułu.
  ```json
  {
    "id": "uuid",
    "topic_cluster_id": "uuid",
    "created_at": "timestampz",
    "updated_at": "timestampz",
    "status": "concept",
    "name": "The Name of the New Subtopic",
    "title": "AI-Generated Title",
    "slug": "ai-generated-title",
    "description": "AI-generated description for the article.",
    "content": null,
    "seo_title": "AI-Generated SEO Title",
    "seo_description": "AI-generated SEO description.",
    "sanity_id": null,
    "moved_to_sanity_at": null
  }
  ```
- **Błąd**: Zobacz sekcję "Obsługa błędów".

## 5. Przepływ danych

> **WAŻNA UWAGA DOTYCZĄCA MOCKOWANIA AI:** W bieżącej fazie implementacji, wszystkie wywołania do zewnętrznych usług AI (np. OpenRouter) muszą być zamockowane. Logika serwisu powinna zwracać predefiniowane, statyczne dane, które symulują odpowiedź AI. Prawdziwa integracja zostanie zaimplementowana w późniejszej fazie.

1.  Żądanie `POST` trafia do `/api/articles`.
2.  Middleware Astro (`src/middleware/index.ts`) weryfikuje token JWT Supabase i umieszcza dane użytkownika w `context.locals`.
3.  Handler endpointu w `src/pages/api/articles/index.ts` przejmuje żądanie.
4.  Dane z `request.body` są walidowane przy użyciu schemy `zod` dla `CreateArticleCommand`. W przypadku błędu zwracany jest status `400`.
5.  Wywoływana jest metoda `articleService.createArticleConcept(command, user.id)`.
6.  **Wewnątrz serwisu `article.service.ts`**:
    a. Sprawdzane jest, czy `topic_cluster_id` istnieje i należy do zalogowanego użytkownika. Jeśli nie, zwracany jest błąd (co przełoży się na status `404`).
    b. Tworzony jest wstępny rekord w tabeli `articles` ze statusem `concept` i podstawowymi danymi.
    c. **(MOCK)** Wywoływana jest zamockowana funkcja AI, która na podstawie `name` zwraca obiekt z polami: `title`, `slug`, `description`, `seo_title`, `seo_description`.
    d. Rekord artykułu w bazie danych jest aktualizowany o dane zwrócone przez mock AI.
    e. Zwracany jest pełny, zaktualizowany obiekt `ArticleDto`.
7.  Handler endpointu otrzymuje `ArticleDto` z serwisu.
8.  Zwracana jest odpowiedź `201 Created` z `ArticleDto` w ciele odpowiedzi.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Każde żądanie musi zawierać prawidłowy token JWT w nagłówku `Authorization`. Jest to egzekwowane przez middleware.
- **Autoryzacja**: Dostęp do danych jest kontrolowany przez polityki Row-Level Security (RLS) w Supabase. Logika serwisu musi poprawnie przekazywać `user_id` do zapytań, aby RLS mogły działać. Sprawdzenie przynależności `topic_cluster_id` do użytkownika jest kluczowym elementem autoryzacji.
- **Walidacja danych wejściowych**: Użycie `zod` do walidacji ciała żądania chroni przed nieprawidłowymi danymi i potencjalnymi atakami (np. Injection).

## 7. Obsługa błędów

- **`400 Bad Request`**: Zwracany, gdy walidacja `zod` ciała żądania nie powiedzie się. Odpowiedź powinna zawierać szczegóły błędów walidacji.
- **`401 Unauthorized`**: Zwracany przez middleware, gdy token JWT jest nieprawidłowy lub go brakuje.
- **`404 Not Found`**: Zwracany, gdy klaster tematyczny o podanym `topic_cluster_id` nie zostanie znaleziony w bazie danych dla danego użytkownika.
- **`500 Internal Server Error`**: Zwracany w przypadku nieoczekiwanych błędów po stronie serwera, takich jak błąd połączenia z bazą danych, niepowodzenie zapisu/aktualizacji rekordu lub błąd w logice serwisu.

## 8. Rozważania dotyczące wydajności

- Synchroniczne wywołanie AI jest potencjalnym wąskim gardłem. Chociaż na etapie mockowania nie stanowi to problemu, w przyszłości, przy integracji z prawdziwym modelem AI, czas odpowiedzi może się wydłużyć.
- **Strategia optymalizacji (na przyszłość)**: Jeśli operacja generowania konceptu okaże się zbyt długa, można rozważyć przejście na model asynchroniczny (np. z użyciem Supabase Edge Functions i Webhooks), gdzie klient po utworzeniu zalążka artykułu odpytuje o jego status.

## 9. Etapy wdrożenia

1.  **Schema Walidacji**: W pliku `src/lib/schemas/article.schemas.ts`, utwórz lub zaktualizuj schemę `zod` o nazwie `createArticleSchema`, która będzie walidować obiekt zgodny z `CreateArticleCommand`.
2.  **Serwis Artykułów (`article.service.ts`)**:
    a. Utwórz nową, asynchroniczną metodę `createArticleConcept(command: CreateArticleCommand, userId: string): Promise<ArticleDto>`.
    b. Zaimplementuj logikę sprawdzającą istnienie `topic_cluster_id` dla danego `userId`.
    c. Zaimplementuj logikę tworzenia początkowego rekordu w tabeli `articles`.
    d. **Stwórz zamockowaną funkcję AI** wewnątrz serwisu (lub w osobnym, mockowanym module), która przyjmuje `name` i zwraca obiekt z wygenerowanymi polami.
    e. Zaimplementuj logikę aktualizacji rekordu artykułu o dane z mocka AI.
    f. Zwróć finalny obiekt `ArticleDto`.
3.  **Endpoint API (`src/pages/api/articles/index.ts`)**:
    a. Upewnij się, że plik istnieje i ma ustawiony `export const prerender = false;`.
    b. Zaimplementuj handler dla metody `POST`.
    c. Dodaj blok `try...catch` do obsługi błędów.
    d. Wewnątrz bloku `try`, przeprowadź walidację `request.body` przy użyciu `createArticleSchema`.
    e. Wywołaj metodę `articleService.createArticleConcept` z danymi z żądania i `user.id` z `context.locals`.
    f. Zwróć odpowiedź `201 Created` z danymi otrzymanymi z serwisu.
4.  **Obsługa Błędów**: W bloku `catch` oraz w logice serwisu, obsłuż potencjalne błędy (np. `404`, `500`) i zwróć odpowiednie statusy oraz komunikaty błędów w formacie `ErrorResponse`.
