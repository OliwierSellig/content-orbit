# API Endpoint Implementation Plan: Delete AI Preference

## 1. Przegląd punktu końcowego

Ten punkt końcowy pozwala uwierzytelnionemu użytkownikowi na trwałe usunięcie istniejącej preferencji AI (`ai_preference`), identyfikowanej przez jej ID. Pomyślna operacja nie zwraca żadnej treści.

## 2. Szczegóły żądania

- **Metoda HTTP**: `DELETE`
- **Struktura URL**: `/api/ai-preferences/{id}`
- **Parametry**:
  - **Wymagane (URL)**: `id` (UUID) - identyfikator preferencji do usunięcia.
- **Request Body**: Brak.

## 3. Wykorzystywane typy

- **Error Response**: `ValidationErrorResponse`

## 4. Szczegóły odpowiedzi

- **Success Response (204 No Content)**: Brak ciała odpowiedzi.
- **Error Responses**:
  - `400 Bad Request`: Gdy parametr `id` w URL jest nieprawidłowym UUID.
  - `401 Unauthorized`: Gdy użytkownik nie jest uwierzytelniony.
  - `404 Not Found`: Gdy preferencja o podanym `id` nie istnieje lub nie należy do zalogowanego użytkownika.
  - `500 Internal Server Error`: W przypadku problemów z serwerem lub bazą danych.

## 5. Przepływ danych

1.  Żądanie `DELETE` dociera do `src/pages/api/ai-preferences/[id].ts`.
2.  Middleware Astro weryfikuje sesję użytkownika.
3.  Handler `DELETE` pobiera `id` z `context.params.id`. Waliduje `id` (np. za pomocą `z.string().uuid()`). W razie błędu zwraca `400 Bad Request`.
4.  Handler pobiera `userId` z `context.locals.user.id`.
5.  Handler wywołuje metodę serwisową `AiPreferenceService.deleteAiPreference(userId, id)`.
6.  Metoda serwisowa wykonuje zapytanie `DELETE` do bazy danych Supabase z klauzulą `WHERE id = :id AND user_id = :userId`.
7.  Zapytanie `DELETE` zwraca informację o liczbie usuniętych wierszy. Jeśli liczba ta wynosi 0, oznacza to, że rekord nie istniał lub nie należał do użytkownika.
8.  Jeśli metoda serwisowa zasygnalizuje, że nic nie usunięto (np. zwracając `false`), handler API zwraca `404 Not Found`.
9.  Jeśli metoda serwisowa zasygnalizuje sukces (np. zwracając `true`), handler API zwraca odpowiedź z kodem statusu `204 No Content`.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Dostęp chroniony przez middleware.
- **Autoryzacja**: Klauzula `WHERE` w zapytaniu `DELETE` musi zawierać zarówno `id`, jak i `user_id`, aby uniemożliwić usuwanie zasobów należących do innych użytkowników.
- **Walidacja ID**: Parametr `id` musi być walidowany jako UUID, aby zapobiec błędom i potencjalnym atakom.
- **Ochrona przed wyciekiem informacji**: Zwracanie `404 Not Found` jest kluczowe, aby uniemożliwić odgadnięcie istnienia zasobu, który należy do innego użytkownika.

## 7. Rozważania dotyczące wydajności

- Operacja `DELETE` na kluczu głównym jest bardzo wydajna.

## 8. Etapy wdrożenia

1.  **Implementacja logiki serwisu**: W `AiPreferenceService` zaimplementuj metodę `deleteAiPreference(userId: string, id: string): Promise<{ success: boolean }>`. Powinna zwracać `true`, jeśli rekord został usunięty, i `false` w przeciwnym wypadku.
2.  **Implementacja handlera DELETE**: W pliku `src/pages/api/ai-preferences/[id].ts` dodaj `export const DELETE: APIRoute = async (context) => { ... }`.
3.  **Walidacja danych**: W handlerze zwaliduj `id` z `context.params`.
4.  **Integracja z serwisem**: Wywołaj metodę `deleteAiPreference` z serwisu.
5.  **Obsługa odpowiedzi**: Na podstawie wyniku z serwisu (`true` lub `false`), zwróć `204 No Content` lub `404 Not Found`.
6.  **Obsługa błędów**: Zaimplementuj pełną obsługę błędów walidacji (`400`), autoryzacji (`401`) i serwera (`500`).
7.  **Testowanie**: Utwórz testy weryfikujące:
    - Pomyślne usunięcie zasobu.
    - Odrzucenie żądania z nieprawidłowym `id`.
    - Zwrócenie `404` dla nieistniejącego `id`.
    - Zwrócenie `404` przy próbie usunięcia zasobu innego użytkownika.
    - Sprawdzenie, czy żądanie bez uwierzytelnienia jest odrzucane.
