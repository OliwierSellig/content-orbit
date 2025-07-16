# API Endpoint Implementation Plan: Create Topic Cluster

## 1. Przegląd punktu końcowego

Ten punkt końcowy umożliwia uwierzytelnionemu użytkownikowi utworzenie nowego klastra tematycznego. Zapewnia unikalność nazw klastrów (wielkość liter nie ma znaczenia) w obrębie konta jednego użytkownika.

## 2. Szczegóły żądania

- **Metoda HTTP**: `POST`
- **Struktura URL**: `/api/topic-clusters`
- **Parametry zapytania**: Brak.
- **Request Body**:
  ```json
  {
    "name": "Nowy unikalny temat"
  }
  ```

## 3. Wykorzystywane typy

- `CreateTopicClusterCommand` z `src/types.ts`: Do modelowania danych wejściowych z ciała żądania.
- `TopicClusterDto` z `src/types.ts`: Do modelowania danych w odpowiedzi po pomyślnym utworzeniu zasobu.

## 4. Szczegóły odpowiedzi

- **201 Created**: Pomyślne utworzenie klastra. Odpowiedź zawiera nowo utworzony obiekt `TopicClusterDto`, włączając w to jego `name`.
  ```json
  {
    "id": "uuid-of-new-cluster",
    "created_at": "2023-10-27T10:00:00Z",
    "updated_at": "2023-10-27T10:00:00Z",
    "name": "Nowy unikalny temat"
  }
  ```

## 5. Przepływ danych

1. Żądanie `POST` z ciałem zawierającym `name` trafia do handlera w `src/pages/api/topic-clusters/index.ts`.
2. Middleware Astro weryfikuje sesję użytkownika.
3. Handler `POST` waliduje ciało żądania przy użyciu schematu Zod, sprawdzając, czy `name` jest niepustym stringiem.
4. Handler wywołuje funkcję serwisową, np. `createTopicCluster(userId, command)`, w `src/lib/services/topic-cluster.service.ts`.
5. Funkcja serwisowa:
   a. Sprawdza, czy klaster o tej samej nazwie (ignorując wielkość liter) już istnieje dla danego `userId`. Wykonuje zapytanie `SELECT` z `ILIKE` lub porównaniem po konwersji na małe litery.
   b. Jeśli nazwa jest już zajęta, serwis zgłasza błąd konfliktu.
   c. Jeśli nazwa jest unikalna, wykonuje operację `INSERT` do tabeli `topic_clusters`.
6. Serwis zwraca dane nowo utworzonego klastra.
7. Handler formatuje odpowiedź i wysyła ją do klienta ze statusem `201 Created`.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Tylko uwierzytelnieni użytkownicy mogą tworzyć klastry.
- **Walidacja danych wejściowych**: Ciało żądania musi być ściśle walidowane, aby zapobiec błędom i atakom (np. XSS, chociaż w tym przypadku ryzyko jest niskie). Nazwa powinna być oczyszczona z nadmiarowych białych znaków.
- **Integralność danych**: Aby zapobiec race conditions, gdzie dwa żądania o tej samej nazwie są przetwarzane jednocześnie, należy dodać w bazie danych ograniczenie unikalności `UNIQUE` na parze `(user_id, lower(name))`.

## 7. Obsługa błędów

- **400 Bad Request**: Zwracany, jeśli ciało żądania jest nieprawidłowe (np. brak pola `name`, `name` nie jest stringiem lub jest pusty).
- **401 Unauthorized**: Użytkownik nie jest uwierzytelniony.
- **409 Conflict**: Zwracany, jeśli klaster tematyczny o podanej nazwie już istnieje dla tego użytkownika.
- **500 Internal Server Error**: Zwracany w przypadku nieoczekiwanego błędu podczas zapisu do bazy danych.

## 8. Rozważania dotyczące wydajności

- **Sprawdzanie unikalności**: Zapytanie sprawdzające unikalność nazwy powinno być wydajne. Indeks na `(user_id, lower(name))` znacznie przyspieszy tę operację.

## 9. Etapy wdrożenia

1. **Baza danych**: Dodaj ograniczenie `UNIQUE` na kolumnach `user_id` i `lower(name)` w tabeli `topic_clusters`.
2. **Schemat walidacji**: W `src/lib/schemas/topic-cluster.schemas.ts` utwórz schemat Zod (`createTopicClusterSchema`) do walidacji ciała żądania.
3. **Usługa**: W `src/lib/services/topic-cluster.service.ts` zaimplementuj funkcję `createTopicCluster`.
   - Dodaj logikę sprawdzania unikalności nazwy.
   - Dodaj logikę wstawiania nowego rekordu.
4. **Endpoint API**: W `src/pages/api/topic-clusters/index.ts` dodaj handler `POST`.
5. **Logika handlera**: W handlerze `POST`:
   - Pobierz ID użytkownika z `context.locals`.
   - Zwaliduj ciało żądania.
   - Wywołaj usługę `createTopicCluster`.
   - Obsłuż błąd konfliktu, zwracając `409 Conflict`.
   - Zwróć odpowiedź `201 Created` z nowym obiektem.
6. **Testowanie**: Dodaj testy jednostkowe dla logiki serwisowej (scenariusz pomyślny i błąd konfliktu). Dodaj testy integracyjne dla punktu końcowego.
