# API Endpoint Implementation Plan: Delete Topic Cluster

## 1. Przegląd punktu końcowego

Ten punkt końcowy trwale usuwa klaster tematyczny wraz ze wszystkimi powiązanymi z nim artykułami (operacja kaskadowa). Jest to akcja destrukcyjna i nieodwracalna.

## 2. Szczegóły żądania

- **Metoda HTTP**: `DELETE`
- **Struktura URL**: `/api/topic-clusters/{id}`
- **Parametry URL**:
  - **Wymagane**: `id` (UUID) - identyfikator klastra tematycznego do usunięcia.
- **Request Body**: Brak.

## 3. Wykorzystywane typy

- Brak (operacja nie zwraca ani nie przyjmuje złożonych typów danych).

## 4. Szczegóły odpowiedzi

- **204 No Content**: Pomyślne usunięcie zasobu. Odpowiedź nie zawiera ciała.

## 5. Przepływ danych

1. Żądanie `DELETE` trafia do `src/pages/api/topic-clusters/[id].ts`.
2. Middleware Astro weryfikuje sesję użytkownika.
3. Handler `DELETE` pobiera `id` z `Astro.params` i waliduje je jako UUID.
4. Handler wywołuje funkcję serwisową, np. `deleteTopicCluster(userId, clusterId)`, w `src/lib/services/topic-cluster.service.ts`.
5. Funkcja serwisowa wykonuje operację `DELETE` na tabeli `topic_clusters`, filtrując po `id` klastra oraz `user_id` uwierzytelnionego użytkownika.
6. Baza danych, dzięki ograniczeniu `ON DELETE CASCADE` na tabeli `articles`, automatycznie usunie wszystkie artykuły powiązane z usuwanym klastrem.
7. Serwis sprawdza liczbę usuniętych wierszy. Jeśli wynosi 0, oznacza to, że zasób nie istniał (lub nie należał do użytkownika), więc serwis zgłasza błąd "not found".
8. Jeśli usunięcie się powiodło, handler zwraca pustą odpowiedź ze statusem `204 No Content`.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Wymagane.
- **Autoryzacja / IDOR**: Podobnie jak przy pobieraniu i aktualizacji, operacja `DELETE` musi być ściśle powiązana z `user_id`, aby uniemożliwić jednemu użytkownikowi usunięcie danych innego użytkownika. Warunek `WHERE user_id = :authenticated_user_id` jest absolutnie krytyczny.
- **Potwierdzenie operacji**: Ze względu na destrukcyjny charakter tej operacji, interfejs użytkownika (UI) powinien wymagać od użytkownika dodatkowego potwierdzenia przed wysłaniem tego żądania.

## 7. Obsługa błędów

- **400 Bad Request**: Zwracany, jeśli `id` w URL nie jest w formacie UUID.
- **401 Unauthorized**: Użytkownik nie jest uwierzytelniony.
- **404 Not Found**: Zwracany, jeśli próbowano usunąć klaster, który nie istnieje lub nie należy do danego użytkownika.
- **500 Internal Server Error**: Zwracany w przypadku nieoczekiwanego błędu bazy danych podczas operacji usuwania.

## 8. Rozważania dotyczące wydajności

- Operacja `DELETE` na indeksowanym kluczu głównym jest bardzo wydajna. Potencjalnym wąskim gardłem może być kaskadowe usuwanie dużej liczby powiązanych artykułów, ale jest to operacja, która musi zostać wykonana.

## 9. Etapy wdrożenia

1. **Baza danych**: Upewnij się, że klucz obcy w tabeli `articles` wskazujący na `topic_clusters` ma zdefiniowaną regułę `ON DELETE CASCADE`.
2. **Schemat walidacji**: Wykorzystaj istniejący schemat Zod do walidacji parametru `id` jako UUID z poprzednich zadań.
3. **Usługa**: W `src/lib/services/topic-cluster.service.ts` zaimplementuj funkcję `deleteTopicCluster`, która przyjmuje `userId` i `clusterId`.
4. **Endpoint API**: W `src/pages/api/topic-clusters/[id].ts` dodaj handler `DELETE`.
5. **Logika handlera**: W handlerze `DELETE`:
   - Pobierz ID użytkownika i ID klastra.
   - Zwaliduj ID klastra.
   - Wywołaj usługę `deleteTopicCluster`.
   - Obsłuż błąd "not found".
   - Zwróć odpowiedź `204 No Content`.
6. **Testowanie**: Dodaj testy jednostkowe dla usługi (scenariusz pomyślny, not found). Dodaj testy integracyjne, weryfikując, czy zasób został usunięty i czy użytkownik nie może usunąć zasobu innego użytkownika.
