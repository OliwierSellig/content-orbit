# API Endpoint Implementation Plan: Create AI Preference

## 1. Przegląd punktu końcowego

Ten punkt końcowy umożliwia uwierzytelnionemu użytkownikowi utworzenie nowej preferencji AI (`ai_preference`). Wymaga podania tytułu i treści podpowiedzi. Po pomyślnym utworzeniu zwraca nowo utworzony obiekt.

## 2. Szczegóły żądania

- **Metoda HTTP**: `POST`
- **Struktura URL**: `/api/ai-preferences`
- **Parametry**: Brak.
- **Request Body**:
  ```json
  {
    "title": "Nowa preferencja",
    "prompt": "Treść podpowiedzi."
  }
  ```

## 3. Wykorzystywane typy

- **Command Model**: `CreateAiPreferenceCommand`
  ```typescript
  // src/types.ts
  export type CreateAiPreferenceCommand = Pick<TablesInsert<"ai_preferences">, "title" | "prompt">;
  ```
- **DTO**: `AiPreferenceDto`
  ```typescript
  // src/types.ts
  export type AiPreferenceDto = Omit<Tables<"ai_preferences">, "user_id" | "created_at" | "updated_at">;
  ```
- **Error Response**: `ValidationErrorResponse`

## 4. Szczegóły odpowiedzi

- **Success Response (201 Created)**:
  ```json
  {
    "id": "new-uuid-string",
    "title": "Nowa preferencja",
    "prompt": "Treść podpowiedzi."
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Gdy dane wejściowe są nieprawidłowe (np. brakujące pola, nieprawidłowe typy).
  - `401 Unauthorized`: Gdy użytkownik nie jest uwierzytelniony.
  - `500 Internal Server Error`: W przypadku problemów z serwerem lub bazą danych.

## 5. Przepływ danych

1.  Żądanie `POST` z ciałem zawierającym `title` i `prompt` dociera do `src/pages/api/ai-preferences.ts`.
2.  Middleware Astro weryfikuje sesję użytkownika.
3.  Handler `POST` odczytuje ciało żądania (`await context.request.json()`).
4.  Dane wejściowe są walidowane przy użyciu schematu Zod `createAiPreferenceSchema`. W przypadku błędu walidacji zwracana jest odpowiedź `400 Bad Request` z `ValidationErrorResponse`.
5.  Handler pobiera `userId` z `context.locals.user.id`.
6.  Handler wywołuje metodę serwisową `AiPreferenceService.createAiPreference(userId, validatedData)`.
7.  Metoda serwisowa tworzy nowy rekord w tabeli `ai_preferences` w bazie danych Supabase, powiązując go z `userId`.
8.  Serwis zwraca nowo utworzony obiekt zmapowany na `AiPreferenceDto`.
9.  Handler API zwraca dane nowego obiektu jako odpowiedź JSON z kodem statusu `201 Created`.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Endpoint musi być chroniony przez middleware.
- **Autoryzacja**: Każda nowa preferencja musi być powiązana z `userId` z sesji, aby zapobiec tworzeniu zasobów w imieniu innych użytkowników.
- **Walidacja danych wejściowych**: Ciało żądania musi być rygorystycznie walidowane za pomocą Zod, aby upewnić się, że `title` i `prompt` są stringami i nie są puste. Zapobiega to błędom `NOT NULL constraint` w bazie danych i potencjalnym atakom.

## 7. Rozważania dotyczące wydajności

- Operacja `INSERT` jest zazwyczaj szybka. Wydajność nie powinna stanowić problemu przy typowym obciążeniu.
- Czas odpowiedzi zależy głównie od czasu odpowiedzi bazy danych Supabase.

## 8. Etapy wdrożenia

1.  **Utworzenie schematów walidacji**: W pliku `src/lib/schemas/ai-preference.schemas.ts` utwórz `createAiPreferenceSchema` używając Zod.
2.  **Implementacja logiki serwisu**: W `AiPreferenceService` zaimplementuj metodę `createAiPreference(userId: string, data: CreateAiPreferenceCommand): Promise<AiPreferenceDto>`.
3.  **Implementacja handlera POST**: W pliku `src/pages/api/ai-preferences.ts` dodaj `export const POST: APIRoute = async (context) => { ... }`.
4.  **Walidacja danych**: W handlerze `POST` zaimplementuj walidację przychodzących danych za pomocą stworzonego schematu Zod.
5.  **Integracja z serwisem**: Po pomyślnej walidacji, wywołaj metodę `createAiPreference` z serwisu.
6.  **Obsługa odpowiedzi**: Zwróć nowo utworzony obiekt z kodem `201 Created`.
7.  **Obsługa błędów**: Obsłuż błędy walidacji, zwracając `400 Bad Request`, oraz błędy serwera, zwracając `500 Internal Server Error`.
8.  **Testowanie**: Utwórz testy jednostkowe i integracyjne weryfikujące:
    - Pomyślne tworzenie zasobu.
    - Odrzucenie żądania z nieprawidłowymi danymi (`title` lub `prompt` brakujące/puste).
    - Odrzucenie żądania bez uwierzytelnienia.
