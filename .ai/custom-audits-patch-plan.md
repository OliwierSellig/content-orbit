# API Endpoint Implementation Plan: Update Custom Audit

## 1. Przegląd punktu końcowego

Ten punkt końcowy pozwala uwierzytelnionemu użytkownikowi zaktualizować istniejący niestandardowy audyt, identyfikowany przez jego ID. Umożliwia częściową aktualizację (`PATCH`) jednego lub obu pól: `title` i `prompt`.

## 2. Szczegóły żądania

- **Metoda HTTP**: `PATCH`
- **Struktura URL**: `/api/custom-audits/{id}`
- **Parametry**:
  - **Wymagane**: `id` (UUID) - identyfikator audytu w ścieżce URL.
- **Request Body**:
  ```json
  {
    "title": "Updated Title",
    "prompt": "Updated audit prompt..."
  }
  ```
  _Uwaga: Ciało żądania może zawierać `title`, `prompt` lub oba te pola._

## 3. Wykorzystywane typy

- **Command Model**: `UpdateCustomAuditCommand`
  ```typescript
  // src/types.ts
  export type UpdateCustomAuditCommand = Pick<TablesUpdate<"custom_audits">, "title" | "prompt">;
  ```
- **DTO**: `CustomAuditDto`
  ```typescript
  // src/types.ts
  export type CustomAuditDto = Omit<Tables<"custom_audits">, "user_id" | "created_at" | "updated_at">;
  ```

## 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu**:
  - **Kod**: `200 OK`
  - **Treść**: `CustomAuditDto` (zaktualizowany obiekt)
- **Odpowiedzi błędów**:
  - `400 Bad Request`
  - `401 Unauthorized`
  - `404 Not Found`
  - `500 Internal Server Error`

## 5. Przepływ danych

1.  Żądanie `PATCH` trafia do `src/pages/api/custom-audits/[id].ts`.
2.  Middleware Astro weryfikuje token i dołącza dane użytkownika do `context.locals`.
3.  Handler API sprawdza uwierzytelnienie.
4.  Handler waliduje parametr `id` ze ścieżki (musi być poprawnym UUID) oraz ciało żądania przy użyciu schematu Zod `updateCustomAuditSchema`.
5.  Handler wywołuje `customAuditService.updateCustomAudit(supabase, user.id, id, validatedData)`.
6.  Serwis wykonuje operację `UPDATE` na tabeli `custom_audits`. Zapytanie musi zawierać klauzulę `WHERE id = :auditId AND user_id = :userId`, aby zapewnić, że użytkownik modyfikuje tylko własne zasoby.
7.  Jeśli zapytanie nie zaktualizuje żadnego wiersza (ponieważ audyt o danym `id` nie istnieje lub nie należy do użytkownika), serwis powinien zwrócić `null` lub rzucić błąd `NotFoundError`.
8.  W przypadku sukcesu, serwis pobiera zaktualizowany obiekt i mapuje go na `CustomAuditDto`.
9.  Handler API, jeśli otrzyma `null` z serwisu, zwraca `404 Not Found`. W przeciwnym razie zwraca zaktualizowane `CustomAuditDto` z kodem `200 OK`.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Obowiązkowe.
- **Autoryzacja / IDOR**: Kluczowe jest, aby operacja `UPDATE` weryfikowała zarówno `id` audytu, jak i `user_id` pochodzący z sesji. Zapobiega to atakom Insecure Direct Object Reference (IDOR), gdzie użytkownik A mógłby próbować zmodyfikować zasób użytkownika B.
- **Walidacja danych wejściowych**: Zarówno parametr `id`, jak i ciało żądania muszą być walidowane, aby chronić przed błędnymi danymi i potencjalnymi atakami.

## 7. Rozważania dotyczące wydajności

- Zapytanie `UPDATE` jest wydajne, jeśli kolumny `id` i `user_id` są zindeksowane. `id` jest kluczem głównym, więc jest domyślnie zindeksowane. Należy upewnić się, że `user_id` również ma indeks.

## 8. Etapy wdrożenia

1.  **Typy**: Upewnij się, że typy `UpdateCustomAuditCommand` i `CustomAuditDto` są zdefiniowane w `src/types.ts`.
2.  **Schematy walidacji**: W `src/lib/schemas/custom-audit.schemas.ts` dodaj `updateCustomAuditSchema`. Pola `title` i `prompt` powinny być opcjonalne, ale przynajmniej jedno z nich musi być obecne. Dodaj również schemat dla walidacji `id` jako UUID.
3.  **Serwis**: W `src/lib/services/custom-audit.service.ts` dodaj funkcję `updateCustomAudit(supabase: SupabaseClient, userId: string, auditId: string, data: UpdateCustomAuditCommand): Promise<CustomAuditDto | null>`.
4.  **Implementacja serwisu**: Funkcja powinna wykonać operację `UPDATE` z warunkiem `WHERE` na `id` i `userId`. Jeśli aktualizacja się powiedzie, powinna zwrócić zaktualizowany obiekt. W przeciwnym razie `null`.
5.  **Endpoint API**: Utwórz plik `src/pages/api/custom-audits/[id].ts`.
6.  **Implementacja endpointu**: W `[id].ts` dodaj handler dla metody `PATCH`, który:
    - Weryfikuje uwierzytelnienie.
    - Waliduje `id` i ciało żądania.
    - Wywołuje `customAuditService.updateCustomAudit`.
    - Zwraca `200 OK` z obiektem lub `404 Not Found`.
7.  **Testowanie**: Dodaj testy dla logiki serwisu, schematów walidacji oraz testy integracyjne dla endpointu `PATCH`, obejmujące przypadki sukcesu i błędu (np. próba aktualizacji nieistniejącego zasobu).
