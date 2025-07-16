# API Endpoint Implementation Plan: Get Topic Cluster by ID

## 1. Przegląd punktu końcowego

Ten punkt końcowy pobiera pojedynczy klaster tematyczny na podstawie jego unikalnego identyfikatora (ID). Dostęp jest ograniczony do właściciela zasobu.

## 2. Szczegóły żądania

- **Metoda HTTP**: `GET`
- **Struktura URL**: `/api/topic-clusters/{id}`
- **Parametry URL**:
  - **Wymagane**: `id` (UUID) - identyfikator klastra tematycznego.
- **Request Body**: Brak.

## 3. Wykorzystywane typy

- `TopicClusterDto` z `src/types.ts`: Do modelowania danych w odpowiedzi.

## 4. Szczegóły odpowiedzi

- **200 OK**: Pomyślne pobranie danych klastra. Odpowiedź zawiera pełny obiekt `TopicClusterDto` (zgodnie z `src/types.ts`), włączając w to pole `name`.
  ```json
  {
    "id": "uuid-goes-here",
    "created_at": "2023-10-27T10:00:00Z",
    "updated_at": "2023-10-27T10:00:00Z",
    "name": "Topic Cluster Example"
  }
  ```

## 5. Przepływ danych

1. Żądanie `GET` trafia do dynamicznego endpointu `src/pages/api/topic-clusters/[id].ts`.
2. Middleware Astro weryfikuje sesję użytkownika.
3. Handler `GET` pobiera `id` z `Astro.params` i waliduje je jako UUID przy użyciu Zod.
4. Handler wywołuje funkcję serwisową, np. `getTopicClusterById(userId, clusterId)`, w `src/lib/services/topic-cluster.service.ts`.
5. Funkcja serwisowa wykonuje zapytanie `SELECT` do tabeli `topic_clusters`, filtrując jednocześnie po `id` klastra oraz `user_id` uwierzytelnionego użytkownika.
6. Jeśli zasób zostanie znaleziony, serwis zwraca jego dane. W przeciwnym razie zwraca `null`.
7. Handler sprawdza wynik z serwisu. Jeśli jest `null`, zwraca błąd `404 Not Found`. W przeciwnym razie wysyła odpowiedź `200 OK` z danymi klastra.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Wymagane.
- **Autoryzacja / IDOR**: To kluczowy aspekt tego endpointu. Zapytanie do bazy danych musi bezwzględnie zawierać warunek `WHERE user_id = :authenticated_user_id` oprócz `WHERE id = :cluster_id`. Zapobiega to atakom typu Insecure Direct Object Reference (IDOR), gdzie uwierzytelniony użytkownik mógłby odgadnąć ID zasobu innego użytkownika i uzyskać do niego dostęp.

## 7. Obsługa błędów

- **400 Bad Request**: Zwracany, jeśli `id` w URL nie jest w formacie UUID.
- **401 Unauthorized**: Użytkownik nie jest uwierzytelniony.
- **404 Not Found**: Zwracany, jeśli klaster o podanym `id` nie istnieje lub nie należy do uwierzytelnionego użytkownika.
- **500 Internal Server Error**: Zwracany w przypadku nieoczekiwanego błędu bazy danych.

## 8. Rozważania dotyczące wydajności

- **Indeksowanie**: Główny klucz `id` jest domyślnie zindeksowany. Wydajność zapytania będzie bardzo wysoka.

## 9. Etapy wdrożenia

1. **Schemat walidacji**: W `src/lib/schemas/topic-cluster.schemas.ts` utwórz schemat Zod do walidacji parametru `id` jako UUID.
2. **Usługa**: W `src/lib/services/topic-cluster.service.ts` zaimplementuj funkcję `getTopicClusterById`, która przyjmuje `userId` i `clusterId`, a następnie wykonuje bezpieczne zapytanie do bazy danych.
3. **Endpoint API**: Utwórz nowy plik `src/pages/api/topic-clusters/[id].ts` i dodaj do niego handler `GET`.
4. **Logika handlera**: W handlerze `GET`:
   - Pobierz ID użytkownika z `context.locals`.
   - Pobierz `id` klastra z `Astro.params` i zwaliduj je.
   - Wywołaj usługę `getTopicClusterById`.
   - Zwróć `200 OK` z danymi lub `404 Not Found`, jeśli zasób nie istnieje.
5. **Testowanie**: Dodaj testy jednostkowe dla usługi (scenariusz pomyślny i not found). Dodaj testy integracyjne dla punktu końcowego, w tym test sprawdzający ochronę przed IDOR.
