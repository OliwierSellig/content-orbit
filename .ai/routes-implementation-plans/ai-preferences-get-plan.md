# API Endpoint Implementation Plan: List AI Preferences

## 1. Przegląd punktu końcowego

Ten punkt końcowy pobiera listę wszystkich preferencji AI (`ai_preferences`) dla uwierzytelnionego użytkownika. Odpowiedź będzie zawierać tablicę obiektów, z których każdy reprezentuje pojedynczą preferencję AI.

## 2. Szczegóły żądania

- **Metoda HTTP**: `GET`
- **Struktura URL**: `/api/ai-preferences`
- **Parametry**:
  - **Wymagane**: Brak.
  - **Opcjonalne**: Brak.
- **Request Body**: Brak.

## 3. Wykorzystywane typy

- **DTO**: `AiPreferenceDto`
  ```typescript
  // src/types.ts
  export type AiPreferenceDto = Omit<Tables<"ai_preferences">, "user_id" | "created_at" | "updated_at">;
  ```

## 4. Szczegóły odpowiedzi

- **Success Response (200 OK)**:
  ```json
  [
    {
      "id": "uuid-string-1",
      "title": "Preferencja 1",
      "prompt": "Treść podpowiedzi 1"
    },
    {
      "id": "uuid-string-2",
      "title": "Preferencja 2",
      "prompt": "Treść podpowiedzi 2"
    }
  ]
  ```
- **Error Responses**:
  - `401 Unauthorized`: Gdy użytkownik nie jest uwierzytelniony.
  - `500 Internal Server Error`: W przypadku problemów z serwerem lub bazą danych.

## 5. Przepływ danych

1.  Żądanie `GET` dociera do `src/pages/api/ai-preferences.ts`.
2.  Middleware Astro (`src/middleware/index.ts`) weryfikuje sesję użytkownika Supabase. Jeśli sesja jest nieprawidłowa, zwraca `401 Unauthorized`.
3.  Handler `GET` w pliku endpointa wywołuje `context.locals.user` w celu pobrania ID użytkownika.
4.  Handler wywołuje metodę serwisową, np. `AiPreferenceService.getAiPreferences(userId)`.
5.  Metoda serwisowa wykonuje zapytanie do bazy danych Supabase: `SELECT id, title, prompt FROM ai_preferences WHERE user_id = :userId`.
6.  Serwis mapuje wyniki na tablicę `AiPreferenceDto[]`.
7.  Handler API zwraca zmapowane dane jako odpowiedź JSON z kodem statusu `200 OK`.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Endpoint musi być chroniony przez middleware, który sprawdza ważną sesję użytkownika Supabase. Dostęp bez uwierzytelnienia musi być blokowany.
- **Autoryzacja**: Zapytanie do bazy danych musi bezwzględnie zawierać klauzulę `WHERE user_id = :userId`, aby uniemożliwić jednemu użytkownikowi dostęp do preferencji innego. ID użytkownika musi pochodzić z zaufanego źródła (sesji serwerowej), a nie z danych wejściowych klienta.

## 7. Rozważania dotyczące wydajności

- **Paginacja**: Chociaż specyfikacja tego nie wymaga, w przyszłości, jeśli liczba preferencji na użytkownika może być duża, należy rozważyć implementację paginacji (np. za pomocą parametrów `limit` i `offset`).
- **Indeksowanie**: Należy upewnić się, że kolumna `user_id` w tabeli `ai_preferences` jest zindeksowana, aby przyspieszyć wyszukiwanie.

## 8. Etapy wdrożenia

1.  **Utworzenie pliku serwisu**: Stwórz plik `src/lib/services/ai-preference.service.ts`, jeśli jeszcze nie istnieje.
2.  **Implementacja logiki serwisu**: W `AiPreferenceService` zaimplementuj metodę `getAiPreferences(userId: string): Promise<AiPreferenceDto[]>`, która pobiera dane z Supabase i filtruje je po `userId`.
3.  **Utworzenie pliku endpointa**: Stwórz plik `src/pages/api/ai-preferences.ts`.
4.  **Implementacja handlera GET**: W pliku endpointa dodaj `export const GET: APIRoute = async ({ locals }) => { ... }`.
5.  **Integracja z serwisem**: W handlerze `GET` pobierz `userId` z `locals.user.id` i wywołaj metodę z serwisu.
6.  **Obsługa odpowiedzi**: Zwróć dane z serwisu jako odpowiedź JSON z kodem `200 OK`.
7.  **Obsługa błędów**: Zaimplementuj bloki `try...catch` do obsługi potencjalnych błędów z serwisu lub bazy danych, zwracając odpowiednie kody statusu HTTP.
8.  **Testowanie**: Utwórz testy (jednostkowe dla serwisu, integracyjne dla endpointa), aby zweryfikować poprawność działania, w tym ścieżkę sukcesu i przypadki błędów.
