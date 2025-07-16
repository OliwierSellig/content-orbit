# API Endpoint Implementation Plan: Update AI Preference

## 1. Przegląd punktu końcowego

Ten punkt końcowy pozwala uwierzytelnionemu użytkownikowi na aktualizację istniejącej preferencji AI (`ai_preference`), identyfikowanej przez jej ID. Pozwala na częściową aktualizację (tylko `title`, tylko `prompt`, lub oba). Po pomyślnej aktualizacji zwraca zaktualizowany obiekt.

## 2. Szczegóły żądania

- **Metoda HTTP**: `PATCH`
- **Struktura URL**: `/api/ai-preferences/{id}`
- **Parametry**:
  - **Wymagane (URL)**: `id` (UUID) - identyfikator preferencji do aktualizacji.
- **Request Body**:
  ```json
  // Przykładowe ciało żądania - co najmniej jedno pole jest wymagane
  {
    "title": "Zaktualizowany tytuł",
    "prompt": "Zaktualizowana treść podpowiedzi."
  }
  ```

## 3. Wykorzystywane typy

- **Command Model**: `UpdateAiPreferenceCommand`
  ```typescript
  // src/types.ts
  export type UpdateAiPreferenceCommand = Pick<TablesUpdate<"ai_preferences">, "title" | "prompt">;
  ```
- **DTO**: `AiPreferenceDto`
- **Error Response**: `ValidationErrorResponse`

## 4. Szczegóły odpowiedzi

- **Success Response (200 OK)**:
  ```json
  {
    "id": "uuid-of-updated-preference",
    "title": "Zaktualizowany tytuł",
    "prompt": "Zaktualizowana treść podpowiedzi."
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Gdy parametr `id` w URL jest nieprawidłowym UUID, lub gdy ciało żądania jest puste lub zawiera nieprawidłowe dane.
  - `401 Unauthorized`: Gdy użytkownik nie jest uwierzytelniony.
  - `404 Not Found`: Gdy preferencja o podanym `id` nie istnieje lub nie należy do zalogowanego użytkownika.
  - `500 Internal Server Error`: W przypadku problemów z serwerem lub bazą danych.

## 5. Przepływ danych

1.  Żądanie `PATCH` dociera do `src/pages/api/ai-preferences/[id].ts`.
2.  Middleware Astro weryfikuje sesję użytkownika.
3.  Handler `PATCH` pobiera `id` z `context.params.id`. Waliduje `id` (np. za pomocą `z.string().uuid()`). W razie błędu zwraca `400 Bad Request`.
4.  Handler odczytuje ciało żądania i waliduje je przy użyciu schematu Zod `updateAiPreferenceSchema`. Schemat powinien sprawdzać, czy co najmniej jedno z pól (`title`, `prompt`) jest obecne i czy są one niepustymi stringami. W razie błędu zwraca `400 Bad Request`.
5.  Handler pobiera `userId` z `context.locals.user.id`.
6.  Handler wywołuje metodę serwisową `AiPreferenceService.updateAiPreference(userId, id, validatedData)`.
7.  Metoda serwisowa wykonuje zapytanie `UPDATE` do bazy danych Supabase, używając klauzuli `WHERE id = :id AND user_id = :userId`.
8.  Zapytanie `UPDATE` powinno zwracać zaktualizowany rekord. Jeśli nic nie zostało zaktualizowane (bo rekord nie istnieje lub nie należy do użytkownika), serwis powinien zwrócić `null`.
9.  Jeśli serwis zwróci `null`, handler API zwraca `404 Not Found`.
10. Jeśli serwis zwróci zaktualizowany obiekt, handler API mapuje go na `AiPreferenceDto` i zwraca jako odpowiedź JSON z kodem `200 OK`.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Dostęp chroniony przez middleware.
- **Autoryzacja**: Klauzula `WHERE` w zapytaniu `UPDATE` musi zawierać zarówno `id`, jak i `user_id`. Zapobiega to modyfikacji zasobów należących do innych użytkowników.
- **Walidacja danych**: Należy walidować zarówno `id` z URL (musi być to UUID), jak i dane w ciele żądania. To chroni przed błędami bazy danych i atakami.
- **Ochrona przed wyciekiem informacji**: Zwracanie `404 Not Found` (zamiast `403 Forbidden`) uniemożliwia atakującemu odgadnięcie, czy zasób o danym ID istnieje, ale należy do kogoś innego.

## 7. Rozważania dotyczące wydajności

- Operacja `UPDATE` na kluczu głównym z dodatkowym warunkiem na zindeksowanej kolumnie (`user_id`) jest wydajna.

## 8. Etapy wdrożenia

1.  **Utworzenie pliku endpointa**: Stwórz plik `src/pages/api/ai-preferences/[id].ts`.
2.  **Utworzenie schematów walidacji**: W `src/lib/schemas/ai-preference.schemas.ts` utwórz `updateAiPreferenceSchema` (używając `.partial().refine(...)`, aby wymagać co najmniej jednego pola) oraz schemat do walidacji UUID.
3.  **Implementacja logiki serwisu**: W `AiPreferenceService` zaimplementuj metodę `updateAiPreference(userId: string, id: string, data: UpdateAiPreferenceCommand): Promise<AiPreferenceDto | null>`.
4.  **Implementacja handlera PATCH**: W pliku `[id].ts` dodaj `export const PATCH: APIRoute = async (context) => { ... }`.
5.  **Walidacja danych**: W handlerze zwaliduj `id` z `context.params` i ciało żądania.
6.  **Integracja z serwisem**: Wywołaj metodę `updateAiPreference` z serwisu.
7.  **Obsługa odpowiedzi**: Na podstawie wyniku z serwisu (obiekt lub `null`), zwróć `200 OK` z obiektem lub `404 Not Found`.
8.  **Obsługa błędów**: Zaimplementuj pełną obsługę błędów walidacji (`400`), autoryzacji (`401`) i serwera (`500`).
9.  **Testowanie**: Utwórz testy weryfikujące:
    - Pomyślną aktualizację jednego i obu pól.
    - Odrzucenie żądania z nieprawidłowym `id`.
    - Odrzucenie żądania z pustym ciałem.
    - Odrzucenie żądania z nieprawidłowymi danymi w ciele.
    - Zwrócenie `404` dla nieistniejącego `id`.
    - Zwrócenie `404` przy próbie aktualizacji zasobu innego użytkownika.
