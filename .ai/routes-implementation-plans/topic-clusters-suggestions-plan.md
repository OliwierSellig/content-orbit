# API Endpoint Implementation Plan: Get Topic Cluster Suggestions

## 1. Przegląd punktu końcowego

Ten punkt końcowy generuje listę sugestii nazw dla nowych klastrów tematycznych przy użyciu AI. Analizuje istniejącą bazę wiedzy użytkownika i jego aktualne klastry, aby zaproponować trafne i kontekstowe tematy.

## 2. Szczegóły żądania

- **Metoda HTTP**: `GET`
- **Struktura URL**: `/api/topic-clusters/suggestions`
- **Parametry zapytania**:
  - **Opcjonalne**:
    - `count` (number): Liczba sugestii do wygenerowania. Jeśli nie zostanie podana, zostanie użyta wartość `default_topics_count` z profilu użytkownika.
- **Request Body**: Brak.

## 3. Wykorzystywane typy

- `TopicClusterSuggestionsDto` z `src/types.ts`: Do strukturyzowania odpowiedzi zawierającej listę sugestii.
- `ProfileDto` z `src/types.ts`: Do pobrania domyślnej liczby sugestii, jeśli parametr `count` nie jest obecny.

## 4. Szczegóły odpowiedzi

- **200 OK**: Pomyślne wygenerowanie sugestii.
  ```json
  {
    "suggestions": ["AI-Generated Topic 1", "AI-Generated Topic 2", "AI-Generated Topic 3"]
  }
  ```

## 5. Przepływ danych

1. Żądanie `GET` trafia do `src/pages/api/topic-clusters/suggestions.ts`.
2. Middleware Astro weryfikuje sesję użytkownika.
3. Handler waliduje parametr `count` (jeśli istnieje) za pomocą Zod.
4. Handler wywołuje funkcję serwisową, np. `getTopicClusterSuggestions(userId, count)`, z `src/lib/services/topic-cluster.service.ts`.
5. Funkcja serwisowa:
   a. Jeśli `count` nie został podany, pobiera profil użytkownika (`profile.service.ts`), aby uzyskać `default_topics_count`.
   b. Pobiera bazę wiedzy użytkownika (`knowledge-base.service.ts`).
   c. Pobiera listę istniejących klastrów tematycznych (`topic-cluster.service.ts`).
   d. Konstruuje szczegółowy prompt dla modelu AI, zawierający zebrane informacje jako kontekst.
   e. Wywołuje zewnętrzną usługę AI (np. OpenRouter) z przygotowanym promptem.
   f. Przetwarza odpowiedź z AI, aby wyodrębnić listę sugestii.
6. Serwis zwraca listę sugestii do handlera.
7. Handler wysyła odpowiedź `200 OK` z listą sugestii w formacie `TopicClusterSuggestionsDto`.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Dostęp tylko dla uwierzytelnionych użytkowników.
- **Zarządzanie kosztami**: Połączenia z usługami AI są płatne. Należy wprowadzić limit na maksymalną wartość parametru `count`, aby zapobiec nadużyciom i niekontrolowanym kosztom.
- **Obsługa kluczy API**: Klucz API do usługi AI musi być bezpiecznie przechowywany jako zmienna środowiskowa i nigdy nie może być eksponowany po stronie klienta.

## 7. Obsługa błędów

- **400 Bad Request**: Zwracany, jeśli `count` jest nieprawidłową wartością (np. nie jest dodatnią liczbą całkowitą).
- **401 Unauthorized**: Użytkownik nie jest uwierzytelniony.
- **500 Internal Server Error**: Zwracany w przypadku:
  - Błędu podczas pobierania danych z bazy (profil, baza wiedzy).
  - Błędu komunikacji z usługą AI (np. błąd sieci, nieprawidłowy klucz API, błąd modelu). Błąd powinien być szczegółowo logowany na serwerze.

## 8. Rozważania dotyczące wydajności

- **Czas odpowiedzi AI**: Modele AI mogą mieć zmienny czas odpowiedzi. Należy rozważyć zaimplementowanie limitu czasu (timeout) na żądanie do AI, aby uniknąć zbyt długiego oczekiwania klienta.
- **Optymalizacja promptu**: Długość promptu wpływa na koszt i czas odpowiedzi. Należy zoptymalizować prompt, aby był jak najbardziej zwięzły, a jednocześnie dostarczał wystarczającego kontekstu.

## 9. Etapy wdrożenia

1. **Schemat walidacji**: W `src/lib/schemas/topic-cluster.schemas.ts` dodaj schemat Zod do walidacji parametru `count`.
2. **Usługa**: W `src/lib/services/topic-cluster.service.ts` zaimplementuj funkcję `getTopicClusterSuggestions`.
3. **Logika usługi**:
   - Zintegruj wywołania do istniejących usług (`profile`, `knowledge-base`).
   - Zaimplementuj logikę budowania promptu.
   - Dodaj helper lub nową usługę do komunikacji z API OpenRouter.
   - Zaimplementuj logikę przetwarzania odpowiedzi od AI.
4. **Endpoint API**: Utwórz nowy plik `src/pages/api/topic-clusters/suggestions.ts` z domyślnym eksportem `GET`.
5. **Logika handlera**: W handlerze `GET` zwaliduj dane wejściowe, wywołaj usługę i zwróć odpowiedź `200 OK` lub błąd.
6. **Zmienne środowiskowe**: Dodaj `OPENROUTER_API_KEY` do zmiennych środowiskowych.
7. **Testowanie**: Napisz testy jednostkowe dla logiki budowania promptu i przetwarzania odpowiedzi. Test integracyjny powinien mockować wywołanie API zewnętrznego.
