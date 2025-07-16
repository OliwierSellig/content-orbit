# API Endpoint Implementation Plan: List Topic Clusters

## 1. Przegląd punktu końcowego

Ten punkt końcowy pobiera posortowaną i podzieloną na strony listę klastrów tematycznych należących do uwierzytelnionego użytkownika. Umożliwia elastyczne przeglądanie danych z wykorzystaniem parametrów zapytania.

## 2. Szczegóły żądania

- **Metoda HTTP**: `GET`
- **Struktura URL**: `/api/topic-clusters`
- **Parametry zapytania**:
  - **Opcjonalne**:
    - `sort_by` (string): Pole do sortowania. Dozwolone wartości: `name`, `created_at`. Domyślnie: `created_at`.
    - `order` (string): Kierunek sortowania. Dozwolone wartości: `asc`, `desc`. Domyślnie: `desc`.
    - `page` (number): Numer strony do pobrania. Domyślnie: `1`.
    - `limit` (number): Liczba elementów na stronie. Domyślnie: `10`.
- **Request Body**: Brak.

## 3. Wykorzystywane typy

- `TopicClusterDto` z `src/types.ts`: Do reprezentowania każdego klastra tematycznego na liście.
- Odpowiedź będzie miała strukturę paginacji, np.: `{ "data": TopicClusterDto[], "total": number, "page": number, "limit": number }`.

## 4. Szczegóły odpowiedzi

- **200 OK**: Pomyślne pobranie danych. Odpowiedź zawiera listę obiektów `TopicClusterDto`, gdzie każdy obiekt zawiera pole `name`.
  ```json
  {
    "data": [
      {
        "id": "uuid-goes-here",
        "created_at": "2023-10-27T10:00:00Z",
        "updated_at": "2023-10-27T10:00:00Z",
        "name": "Topic Cluster Example"
      }
    ],
    "pagination": {
      "total_items": 1,
      "total_pages": 1,
      "current_page": 1,
      "page_size": 10
    }
  }
  ```

## 5. Przepływ danych

1. Żądanie `GET` trafia do handlera w `src/pages/api/topic-clusters/index.ts`.
2. Middleware Astro (`src/middleware/index.ts`) weryfikuje sesję użytkownika i dołącza jego dane do `context.locals`.
3. Handler `GET` waliduje parametry zapytania (`sort_by`, `order`, `page`, `limit`) przy użyciu schematu Zod.
4. Handler wywołuje funkcję serwisową, np. `getTopicClusters(userId, options)`, z nowej usługi `src/lib/services/topic-cluster.service.ts`.
5. Serwis konstruuje i wykonuje zapytanie do bazy danych Supabase, aby pobrać klastry tematyczne należące do `userId`.
6. Zapytanie SQL uwzględnia sortowanie i paginację.
7. Serwis zwraca listę klastrów i dane paginacji do handlera.
8. Handler formatuje odpowiedź i wysyła ją do klienta ze statusem `200 OK`.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Dostęp do punktu końcowego musi być ograniczony do uwierzytelnionych użytkowników. Middleware musi odrzucić żądania bez ważnej sesji.
- **Autoryzacja**: Zapytanie do bazy danych musi bezwzględnie zawierać klauzulę `WHERE user_id = :authenticated_user_id`, aby zapobiec wyciekowi danych między użytkownikami (IDOR).

## 7. Obsługa błędów

- **400 Bad Request**: Zwracany, gdy parametry zapytania są nieprawidłowe (np. `sort_by` to nieobsługiwane pole, `order` jest inne niż `asc`/`desc`, `page` nie jest liczbą). Odpowiedź powinna zawierać szczegóły błędu walidacji.
- **401 Unauthorized**: Zwracany przez middleware, jeśli użytkownik nie jest uwierzytelniony.
- **500 Internal Server Error**: Zwracany w przypadku nieoczekiwanego błędu bazy danych. Szczegóły błędu powinny być logowane na serwerze, a klient powinien otrzymać ogólną wiadomość.

## 8. Rozważania dotyczące wydajności

- **Indeksowanie**: Należy upewnić się, że kolumna `user_id` w tabeli `topic_clusters` jest zindeksowana, aby przyspieszyć filtrowanie.
- **Paginacja**: Stosowanie paginacji jest kluczowe, aby unikać przesyłania dużych ilości danych i przeciążania bazy danych oraz klienta.

## 9. Etapy wdrożenia

1. **Schemat walidacji**: W nowym pliku `src/lib/schemas/topic-cluster.schemas.ts` utwórz schemat Zod do walidacji parametrów zapytania (`listTopicClustersSchema`).
2. **Usługa**: W nowym pliku `src/lib/services/topic-cluster.service.ts` zaimplementuj funkcję `getTopicClusters`, która przyjmuje ID użytkownika i opcje paginacji/sortowania, a następnie wykonuje zapytanie do Supabase.
3. **Endpoint API**: W `src/pages/api/topic-clusters/index.ts` stwórz handler `GET`.
4. **Logika handlera**: W handlerze `GET`:
   - Pobierz ID użytkownika z `context.locals`.
   - Zwaliduj parametry zapytania przy użyciu stworzonego schematu Zod.
   - Wywołaj funkcję `getTopicClusters` z usługi.
   - Sformatuj i zwróć odpowiedź `200 OK` lub odpowiedni błąd.
5. **Testowanie**: Dodaj testy jednostkowe dla usługi i testy integracyjne dla punktu końcowego.
