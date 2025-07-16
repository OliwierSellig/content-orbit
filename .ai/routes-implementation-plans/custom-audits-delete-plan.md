# API Endpoint Implementation Plan: Delete Custom Audit

## 1. Przegląd punktu końcowego

Ten punkt końcowy umożliwia uwierzytelnionemu użytkownikowi trwałe usunięcie niestandardowego audytu na podstawie jego ID.

## 2. Szczegóły żądania

- **Metoda HTTP**: `DELETE`
- **Struktura URL**: `/api/custom-audits/{id}`
- **Parametry**:
  - **Wymagane**: `id` (UUID) - identyfikator audytu w ścieżce URL.
- **Request Body**: Brak

## 3. Wykorzystywane typy

- Brak (operacja nie wykorzystuje DTO ani Command Models)

## 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu**:
  - **Kod**: `204 No Content`
  - **Treść**: Brak
- **Odpowiedzi błędów**:
  - `400 Bad Request`
  - `401 Unauthorized`
  - `404 Not Found`
  - `500 Internal Server Error`

## 5. Przepływ danych

1.  Żądanie `DELETE` trafia do `src/pages/api/custom-audits/[id].ts`.
2.  Middleware Astro weryfikuje token i dołącza dane użytkownika do `context.locals`.
3.  Handler API sprawdza uwierzytelnienie.
4.  Handler waliduje parametr `id` ze ścieżki (musi być poprawnym UUID).
5.  Handler wywołuje `customAuditService.deleteCustomAudit(supabase, user.id, id)`.
6.  Serwis wykonuje operację `DELETE` na tabeli `custom_audits` z klauzulą `WHERE id = :auditId AND user_id = :userId`.
7.  Serwis sprawdza liczbę usuniętych wierszy. Jeśli `rowCount` wynosi 0, oznacza to, że audyt o podanym ID nie istnieje lub nie należy do danego użytkownika. W takim przypadku serwis zwraca `false` (lub rzuca błąd `NotFoundError`).
8.  Jeśli `rowCount` wynosi 1, serwis zwraca `true`.
9.  Handler API, jeśli otrzyma `false` z serwisu, zwraca `404 Not Found`. W przeciwnym razie zwraca `204 No Content`.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Obowiązkowe.
- **Autoryzacja / IDOR**: Podobnie jak w przypadku `PATCH`, operacja `DELETE` musi bezwzględnie weryfikować `user_id` w klauzuli `WHERE`, aby uniemożliwić użytkownikom usuwanie zasobów, które do nich nie należą.
- **Walidacja danych wejściowych**: Parametr `id` musi być poprawnym UUID, aby uniknąć błędów zapytań do bazy danych.

## 7. Rozważania dotyczące wydajności

- Operacja `DELETE` na zindeksowanych kolumnach jest bardzo wydajna. Nie przewiduje się problemów z wydajnością.

## 8. Etapy wdrożenia

1.  **Schematy walidacji**: Upewnij się, że w `src/lib/schemas/custom-audit.schemas.ts` istnieje schemat do walidacji `id` jako UUID.
2.  **Serwis**: W `src/lib/services/custom-audit.service.ts` dodaj funkcję `deleteCustomAudit(supabase: SupabaseClient, userId: string, auditId: string): Promise<boolean>`.
3.  **Implementacja serwisu**: Funkcja powinna wykonać operację `DELETE` z warunkiem `WHERE` na `id` i `userId`, a następnie zwrócić `true` w przypadku powodzenia lub `false`, jeśli żaden wiersz nie został usunięty.
4.  **Endpoint API**: W `src/pages/api/custom-audits/[id].ts` dodaj handler dla metody `DELETE`.
5.  **Implementacja endpointu**: Handler `DELETE` powinien:
    - Zweryfikować uwierzytelnienie.
    - Zwalidować parametr `id`.
    - Wywołać `customAuditService.deleteCustomAudit`.
    - Zwrócić `204 No Content` w przypadku sukcesu lub `404 Not Found` w przypadku porażki.
6.  **Testowanie**: Dodaj testy jednostkowe dla logiki serwisu oraz testy integracyjne dla endpointu `DELETE`, w tym scenariusze udanego usunięcia, próby usunięcia nieistniejącego zasobu oraz próby usunięcia zasobu innego użytkownika (oczekiwany wynik 404).
