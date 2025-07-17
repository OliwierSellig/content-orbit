# API Endpoint Implementation Plan: GET /api/topic-clusters/subtopic-suggestions

## 1. Przegląd punktu końcowego

Ten punkt końcowy jest kluczowym elementem przepływu tworzenia treści. Jego zadaniem jest wygenerowanie listy propozycji podtematów na podstawie nazwy tematu nadrzędnego, dostarczonej przez użytkownika. Wykorzystuje do tego usługę AI, która bierze pod uwagę kontekst dostarczony przez bazę wiedzy użytkownika, aby sugestie były jak najbardziej trafne. Endpoint ten jest wywoływany, zanim klaster tematyczny zostanie formalnie zapisany w bazie danych.

## 2. Szczegóły żądania

- **Metoda HTTP**: `GET`
- **Struktura URL**: `/api/topic-clusters/subtopic-suggestions`
- **Parametry Zapytania (Query Parameters)**:
  - `topic_name` (string, **wymagane**): Nazwa tematu, dla którego generowane są podtematy.
- **Request Body**: Brak.

## 3. Wykorzystywane typy

- **DTO (wyjście)**: `TopicClusterSuggestionsDto` (`src/types.ts`) - ten sam typ, co dla sugestii tematów, zawiera pole `suggestions: string[]`.

## 4. Szczegóły odpowiedzi

- **Sukces**:
  - **Kod**: `200 OK`
  - **Content**: Obiekt zawierający listę wygenerowanych propozycji podtematów.
  ```json
  {
    "suggestions": ["AI-Generated Subtopic 1 for given topic", "AI-Generated Subtopic 2 for given topic"]
  }
  ```
- **Błąd**: Zobacz sekcję "Obsługa błędów".

## 5. Przepływ danych

> **WAŻNA UWAGA DOTYCZĄCA MOCKOWANIA AI:** W bieżącej fazie implementacji, wywołanie do usługi AI musi być zamockowane. Funkcja mockująca powinna przyjmować nazwę tematu i zwracać predefiniowaną, statyczną listę stringów, które symulują propozycje podtematów.

1.  Żądanie `GET` trafia do `/api/topic-clusters/subtopic-suggestions`.
2.  Middleware Astro weryfikuje token JWT i umieszcza dane użytkownika w `context.locals`.
3.  Handler endpointu w nowym pliku `src/pages/api/topic-clusters/suggestions.ts` (lub zmodyfikowanym istniejącym) przejmuje żądanie.
4.  Parametr `topic_name` z URL jest odczytywany i walidowany przy użyciu `zod`. `topic_name` jest wymagany.
5.  Wywoływana jest nowa metoda w serwisie, np. `topicClusterService.getSubtopicSuggestions(topicName, user.id)`.
6.  **Wewnątrz serwisu `topic-cluster.service.ts`**:
    a. Serwis pobiera profil użytkownika (`userId`), aby uzyskać wartość `default_subtopics_count`. Jeśli profil lub wartość nie istnieje, zwraca błąd.
    b. **(MOCK)** Wywoływana jest zamockowana funkcja AI. Przekazywana jest jej nazwa tematu (`topicName`), oczekiwana liczba sugestii (`default_subtopics_count`) oraz potencjalnie dane z bazy wiedzy użytkownika (w przyszłości).
    c. Mock AI zwraca tablicę stringów z propozycjami podtematów.
    d. Zwracany jest obiekt `TopicClusterSuggestionsDto` zawierający otrzymane sugestie.
7.  Handler endpointu zwraca odpowiedź `200 OK` z `TopicClusterSuggestionsDto`.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Egzekwowane przez middleware.
- **Walidacja danych wejściowych**: Użycie `zod` do walidacji parametrów zapytania chroni przed nieprawidłowymi danymi. Należy upewnić się, że `topic_name` nie jest pusty.

## 7. Obsługa błędów

- **`400 Bad Request`**: Zwracany, gdy walidacja `zod` parametrów zapytania nie powiedzie się (np. brak wymaganego `topic_name`). Może być również zwrócony, jeśli w profilu użytkownika brakuje ustawienia `default_subtopics_count`.
- **`401 Unauthorized`**: Zwracany przez middleware, gdy token JWT jest nieprawidłowy lub go brakuje.
- **`500 Internal Server Error`**: Zwracany w przypadku nieoczekiwanych błędów serwera, np. problem z pobraniem profilu użytkownika z bazy danych.

## 8. Rozważania dotyczące wydajności

- Operacja jest synchroniczna i jej wydajność zależy od czasu odpowiedzi AI. Jest to akcja inicjowana przez użytkownika, więc pewne opóźnienie jest akceptowalne, pod warunkiem odpowiedniego feedbacku w UI (wskaźnik ładowania).

## 9. Etapy wdrożenia

1.  **Struktura Plików**: Zmodyfikuj istniejący plik `src/pages/api/topic-clusters/suggestions.ts`, aby mógł obsługiwać dwa różne przypadki (sugestie tematów i sugestie podtematów) lub rozważ utworzenie dedykowanego pliku `subtopic-suggestions.ts`. Lepszym podejściem będzie modyfikacja istniejącego, aby rozróżniał akcje na podstawie obecności parametru `topic_name`.
2.  **Schema Walidacji**: W `src/lib/schemas/topic-cluster.schemas.ts`, utwórz lub zaktualizuj schemę `zod` do walidacji parametru `topic_name`.
3.  **Serwis Klastrów Tematycznych (`topic-cluster.service.ts`)**:
    a. Utwórz nową, asynchroniczną metodę `getSubtopicSuggestions(topicName: string, userId: string): Promise<TopicClusterSuggestionsDto>`.
    b. Zaimplementuj logikę pobierania `default_subtopics_count` z profilu użytkownika. Obsłuż przypadek, gdy ustawienie nie istnieje.
    c. Stwórz zamockowaną funkcję AI, która przyjmuje `topicName` i `count`, a następnie zwraca listę stringów.
    d. Wywołaj mock i zwróć wynik opakowany w `TopicClusterSuggestionsDto`.
4.  **Endpoint API (`suggestions.ts`)**:
    a. Zmodyfikuj handler `GET`, aby sprawdzał obecność parametru `topic_name`.
    b. Jeśli `topic_name` jest obecny, przeprowadź walidację i wywołaj `topicClusterService.getSubtopicSuggestions`.
    c. Jeśli `topic_name` jest nieobecny, wykonaj logikę dla generowania sugestii tematów głównych (istniejąca funkcjonalność).
    d. Zwróć odpowiedź `200 OK` z odpowiednimi danymi.
    e. Zaimplementuj obsługę błędów w bloku `try...catch`.
