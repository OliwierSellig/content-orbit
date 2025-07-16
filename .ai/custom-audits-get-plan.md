# API Endpoint Implementation Plan: List Custom Audits

## 1. Przegląd punktu końcowego

Ten punkt końcowy pobiera listę wszystkich niestandardowych audytów należących do uwierzytelnionego użytkownika. Zwraca tablicę obiektów audytów, z wyłączeniem danych wrażliwych lub niepotrzebnych po stronie klienta, takich jak `user_id`.

## 2. Szczegóły żądania

- **Metoda HTTP**: `GET`
- **Struktura URL**: `/api/custom-audits`
- **Parametry**: Brak
- **Request Body**: Brak

## 3. Wykorzystywane typy

- **DTO**: `CustomAuditDto`
  ```typescript
  // src/types.ts
  export type CustomAuditDto = Omit<Tables<"custom_audits">, "user_id" | "created_at" | "updated_at">;
  ```

## 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu**:
  - **Kod**: `200 OK`
  - **Treść**: `CustomAuditDto[]`
    ```json
    [
      { "id": "uuid", "title": "SEO Audit", "prompt": "..." },
      { "id": "uuid", "title": "Tone of Voice Audit", "prompt": "..." }
    ]
    ```
- **Odpowiedzi błędów**:
  - `401 Unauthorized`
  - `500 Internal Server Error`

## 5. Przepływ danych

1.  Żądanie `GET` trafia do `src/pages/api/custom-audits/index.ts`.
2.  Middleware Astro weryfikuje token JWT użytkownika i dołącza dane użytkownika do `context.locals`.
3.  Handler API sprawdza, czy `context.locals.user` istnieje. Jeśli nie, zwraca `401 Unauthorized`.
4.  Handler wywołuje funkcję `customAuditService.getCustomAudits(supabase, user.id)`.
5.  Serwis wykonuje zapytanie do bazy danych: `SELECT id, title, prompt FROM custom_audits WHERE user_id = :userId`.
6.  Serwis mapuje wyniki na tablicę `CustomAuditDto`.
7.  Handler API zwraca tablicę z kodem statusu `200 OK`.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Punkt końcowy musi być chroniony. Dostęp jest dozwolony tylko dla uwierzytelnionych użytkowników. Należy to zweryfikować za pomocą `context.locals.user`.
- **Autoryzacja**: Zapytanie do bazy danych musi być ściśle powiązane z `user_id` uwierzytelnionego użytkownika, aby zapobiec wyciekowi danych między użytkownikami.

## 7. Rozważania dotyczące wydajności

- **Paginacja**: Chociaż nie jest to wymagane w początkowej specyfikacji, jeśli lista audytów może stać się bardzo duża, należy rozważyć wdrożenie paginacji w przyszłości, aby uniknąć przesyłania dużych ilości danych.
- **Indeksowanie**: Kolumna `user_id` w tabeli `custom_audits` powinna być zindeksowana, aby zapewnić szybkie wyszukiwanie.

## 8. Etapy wdrożenia

1.  **Typy**: Upewnij się, że typ `CustomAuditDto` jest poprawnie zdefiniowany w `src/types.ts`.
2.  **Serwis**: Utwórz nowy plik `src/lib/services/custom-audit.service.ts`.
3.  **Implementacja serwisu**: W `custom-audit.service.ts` zaimplementuj funkcję `getCustomAudits(supabase: SupabaseClient, userId: string): Promise<CustomAuditDto[]>`, która pobiera dane z Supabase i filtruje je po `userId`.
4.  **Endpoint API**: Utwórz plik `src/pages/api/custom-audits/index.ts`.
5.  **Implementacja endpointu**: W `index.ts` zaimplementuj handler `GET`, który:
    - Sprawdza uwierzytelnienie użytkownika.
    - Wywołuje serwis `getCustomAudits`.
    - Obsługuje błędy i zwraca odpowiednie kody statusu.
    - Zwraca dane w formacie `CustomAuditDto[]`.
6.  **Testowanie**: Dodaj testy jednostkowe dla logiki serwisu i testy integracyjne dla punktu końcowego API.
