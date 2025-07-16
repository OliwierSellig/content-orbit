# API Endpoint Implementation Plan: Get Knowledge Base

## 1. Przegląd punktu końcowego

Ten punkt końcowy interfejsu API umożliwia uwierzytelnionym użytkownikom pobranie ich osobistej bazy wiedzy. Baza wiedzy zawiera informacje o firmie użytkownika, zespole i ofercie, które są wykorzystywane przez AI do generowania treści. Jeśli baza wiedzy nie istnieje dla danego użytkownika, punkt końcowy zwróci błąd `404 Not Found`.

## 2. Szczegóły żądania

- **Metoda HTTP**: `GET`
- **Struktura URL**: `/api/knowledge-base`
- **Parametry**:
  - **Wymagane**: Brak.
  - **Opcjonalne**: Brak.
- **Request Body**: Brak. Identyfikacja użytkownika odbywa się na podstawie sesji zweryfikowanej przez middleware.

## 3. Wykorzystywane typy

- **DTO**: `KnowledgeBaseDto` z `src/types.ts`. Reprezentuje dane bazy wiedzy wysyłane do klienta.
  ```typescript
  export type KnowledgeBaseDto = Tables<"knowledge_bases">;
  ```

## 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu (`200 OK`)**: Zwraca obiekt `KnowledgeBaseDto` z danymi bazy wiedzy.
  ```json
  {
    "id": "uuid",
    "user_id": "uuid",
    "created_at": "timestampz",
    "updated_at": "timestampz",
    "about_us": "Text about the company...",
    "team": "Text about the team...",
    "offer": "Text about the offer..."
  }
  ```
- **Odpowiedzi błędów**:
  - `401 Unauthorized`: Gdy użytkownik nie jest uwierzytelniony.
  - `404 Not Found`: Gdy uwierzytelniony użytkownik nie ma jeszcze utworzonej bazy wiedzy.
  - `500 Internal Server Error`: W przypadku nieoczekiwanych błędów serwera.

## 5. Przepływ danych

1.  Klient wysyła żądanie `GET` na adres `/api/knowledge-base`.
2.  Middleware Astro (`src/middleware/index.ts`) przechwytuje żądanie i weryfikuje sesję użytkownika za pomocą Supabase.
3.  Jeśli sesja jest ważna, dane użytkownika i instancja klienta Supabase są dołączane do `context.locals`. W przeciwnym razie middleware zwraca `401`.
4.  Handler `GET` w `src/pages/api/knowledge-base.ts` jest wywoływany.
5.  Handler pobiera `user.id` z `context.locals.session`.
6.  Handler wywołuje funkcję `getKnowledgeBase(supabase, userId)` z nowo utworzonego serwisu `KnowledgeBaseService`.
7.  `KnowledgeBaseService` wykonuje zapytanie `SELECT` do tabeli `knowledge_bases` w bazie danych Supabase, filtrując po `user_id`.
8.  Serwis zwraca znaleziony wiersz (jako `KnowledgeBaseDto`) lub `null`, jeśli nic nie znaleziono.
9.  Handler API sprawdza wynik z serwisu:
    - Jeśli zwrócono dane, serializuje je do formatu JSON i odsyła z kodem `200 OK`.
    - Jeśli zwrócono `null`, odsyła odpowiedź z kodem `404 Not Found`.
10. Cała operacja w handlerze jest opakowana w blok `try...catch` do obsługi nieoczekiwanych błędów i zwracania `500 Internal Server Error`.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Dostęp do punktu końcowego jest ograniczony wyłącznie do uwierzytelnionych użytkowników. Jest to zapewnione przez globalny middleware Astro, który weryfikuje token sesji (JWT) przy każdym żądaniu do API.
- **Autoryzacja**: Logika biznesowa w serwisie musi gwarantować, że zapytanie do bazy danych pobiera dane tylko dla `user_id` powiązanego z sesją (`context.locals.session.user.id`). Zapobiega to możliwości odpytania o dane innego użytkownika.
- **Ochrona przed SQL Injection**: Użycie klienta Supabase (który pod spodem korzysta z `node-postgres`) z parametryzowanymi zapytaniami zapewnia ochronę przed atakami typu SQL Injection.

## 7. Rozważania dotyczące wydajności

- Zapytanie `SELECT` do tabeli `knowledge_bases` używa klucza `user_id`, który ma unikalny indeks (`knowledge_bases_user_id_key`). Zapewnia to bardzo wysoką wydajność odczytu, nawet przy dużej liczbie rekordów w tabeli.
- Wielkość odpowiedzi jest niewielka (kilka pól tekstowych), więc nie przewiduje się problemów z przepustowością sieci.

## 8. Etapy wdrożenia

1.  **Utworzenie pliku serwisu**:
    - Stwórz nowy plik: `src/lib/services/knowledge-base.service.ts`.
2.  **Implementacja logiki serwisu**:
    - W pliku `knowledge-base.service.ts` dodaj funkcję `getKnowledgeBase`.
    - Funkcja powinna przyjmować instancję klienta Supabase i `userId` jako argumenty.
    - Wewnątrz funkcji wykonaj zapytanie `select().eq('user_id', userId).single()` do tabeli `knowledge_bases`.
    - Obsłuż potencjalny błąd zapytania i zwróć `data` lub `null`.
3.  **Utworzenie pliku API endpointa**:
    - Stwórz nowy plik: `src/pages/api/knowledge-base.ts`.
4.  **Implementacja handlera GET**:
    - W pliku `knowledge-base.ts` wyeksportuj `const prerender = false;`.
    - Zaimplementuj funkcję `GET({ locals, request }: APIContext)`.
    - Pobierz sesję i klienta supabase z `locals`.
    - Sprawdź, czy sesja istnieje. Jeśli nie, zwróć `401`.
    - Wywołaj serwis `getKnowledgeBase` z `id` użytkownika z sesji.
    - Na podstawie wyniku z serwisu, zwróć odpowiedź `200 OK` z danymi lub `404 Not Found`.
    - Dodaj obsługę błędów `try...catch` i zwracaj `500 Internal Server Error` w razie potrzeby.
5.  **Dodanie testów (opcjonalnie, ale zalecane)**:
    - Stwórz plik testowy `tests/api/knowledge-base.spec.ts`.
    - Napisz testy weryfikujące:
      - Poprawne pobieranie danych dla uwierzytelnionego użytkownika.
      - Zwracanie `401` dla niezalogowanego użytkownika.
      - Zwracanie `404`, gdy baza wiedzy nie istnieje.
