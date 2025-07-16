# API Endpoint Implementation Plan: Create Custom Audit

## 1. Przegląd punktu końcowego

Ten punkt końcowy umożliwia uwierzytelnionemu użytkownikowi utworzenie nowego niestandardowego audytu. Wymaga podania tytułu i promptu, a w odpowiedzi zwraca nowo utworzony obiekt.

## 2. Szczegóły żądania

- **Metoda HTTP**: `POST`
- **Struktura URL**: `/api/custom-audits`
- **Parametry**: Brak
- **Request Body**:
  ```json
  {
    "title": "Tone of Voice Audit",
    "prompt": "Analyze for consistent tone of voice."
  }
  ```

## 3. Wykorzystywane typy

- **Command Model**: `CreateCustomAuditCommand`
  ```typescript
  // src/types.ts
  export type CreateCustomAuditCommand = Pick<TablesInsert<"custom_audits">, "title" | "prompt">;
  ```
- **DTO**: `CustomAuditDto`
  ```typescript
  // src/types.ts
  export type CustomAuditDto = Omit<Tables<"custom_audits">, "user_id" | "created_at" | "updated_at">;
  ```

## 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu**:
  - **Kod**: `201 Created`
  - **Treść**: `CustomAuditDto`
    ```json
    {
      "id": "new-uuid",
      "title": "Tone of Voice Audit",
      "prompt": "Analyze for consistent tone of voice."
    }
    ```
- **Odpowiedzi błędów**:
  - `400 Bad Request`
  - `401 Unauthorized`
  - `500 Internal Server Error`

## 5. Przepływ danych

1.  Żądanie `POST` trafia do `src/pages/api/custom-audits/index.ts`.
2.  Middleware Astro weryfikuje token JWT i dołącza dane użytkownika do `context.locals`.
3.  Handler API sprawdza, czy `context.locals.user` istnieje. Jeśli nie, zwraca `401 Unauthorized`.
4.  Handler API parsuje ciało żądania i waliduje je przy użyciu schematu Zod `createCustomAuditSchema`. W przypadku błędu walidacji zwraca `400 Bad Request` z listą błędów.
5.  Handler wywołuje funkcję `customAuditService.createCustomAudit(supabase, user.id, validatedData)`.
6.  Serwis wykonuje operację `INSERT` na tabeli `custom_audits`, wstawiając dane z `validatedData` oraz `user_id` zalogowanego użytkownika.
7.  Serwis zwraca nowo utworzony audyt, mapując go na `CustomAuditDto`.
8.  Handler API zwraca `CustomAuditDto` z kodem statusu `201 Created`.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Dostęp jest ograniczony do uwierzytelnionych użytkowników.
- **Autoryzacja**: Identyfikator `user_id` jest pobierany z sesji serwera (`context.locals.user.id`), a nie z danych wejściowych klienta, co zapobiega podszywaniu się.
- **Walidacja danych wejściowych**: Wszystkie dane wejściowe muszą być walidowane za pomocą Zod, aby zapobiec atakom typu Injection i zapewnić integralność danych. Pola `title` i `prompt` powinny być oczyszczone z potencjalnie złośliwego kodu (np. skryptów XSS), chociaż Supabase SDK domyślnie parametryzuje zapytania, co chroni przed SQL Injection.

## 7. Rozważania dotyczące wydajności

- Operacja `INSERT` jest zazwyczaj szybka. Wydajność nie powinna stanowić problemu przy rozsądnym obciążeniu.

## 8. Etapy wdrożenia

1.  **Typy**: Upewnij się, że typy `CreateCustomAuditCommand` i `CustomAuditDto` są poprawnie zdefiniowane w `src/types.ts`.
2.  **Schematy walidacji**: Utwórz nowy plik `src/lib/schemas/custom-audit.schemas.ts`. W nim zdefiniuj `createCustomAuditSchema` używając Zod, który będzie wymagał `title` i `prompt` jako niepuste stringi.
3.  **Serwis**: W `src/lib/services/custom-audit.service.ts` dodaj funkcję `createCustomAudit(supabase: SupabaseClient, userId: string, data: CreateCustomAuditCommand): Promise<CustomAuditDto>`.
4.  **Implementacja serwisu**: Funkcja powinna wstawiać nowy rekord do tabeli `custom_audits`, a następnie zwracać nowo utworzony obiekt zmapowany do `CustomAuditDto`.
5.  **Endpoint API**: W `src/pages/api/custom-audits/index.ts` dodaj handler dla metody `POST`.
6.  **Implementacja endpointu**: Handler `POST` powinien:
    - Sprawdzić uwierzytelnienie.
    - Zwalidować ciało żądania przy użyciu `createCustomAuditSchema`.
    - Wywołać `customAuditService.createCustomAudit`.
    - Zwrócić odpowiedź `201 Created` z nowym obiektem.
7.  **Testowanie**: Dodaj testy jednostkowe dla nowej logiki serwisu i schematu walidacji, a także testy integracyjne dla endpointu `POST`.
