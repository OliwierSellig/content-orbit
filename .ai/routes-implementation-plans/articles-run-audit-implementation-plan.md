# API Endpoint Implementation Plan: POST /api/articles/{id}/run-audit

## 1. Przegląd punktu końcowego

Ten punkt końcowy umożliwia przeprowadzenie niestandardowego audytu na treści istniejącego artykułu. Na podstawie przekazanego identyfikatora audytu (`audit_id`), system pobiera odpowiedni prompt, wysyła go wraz z treścią artykułu do usługi AI, a następnie zwraca listę spostrzeżeń (`findings`). Jest to operacja tylko do odczytu - nie modyfikuje ona stanu artykułu w bazie danych.

## 2. Szczegóły żądania

- **Metoda HTTP**: `POST`
- **Struktura URL**: `/api/articles/{id}/run-audit`
- **Parametry URL**:
  - `id` (string, uuid): Identyfikator artykułu do audytu.
- **Request Body**: Ciało żądania musi zawierać obiekt JSON:
  ```json
  {
    "audit_id": "string (uuid)"
  }
  ```

## 3. Wykorzystywane typy

- **Command Model (wejście)**: `RunAuditCommand` (`src/types.ts`) - do walidacji `audit_id`.
- **DTO (wyjście)**: `RunAuditResponseDto` (`src/types.ts`) - zawiera listę `AuditFindingDto`.

## 4. Szczegóły odpowiedzi

- **Sukces**:
  - **Kod**: `200 OK`
  - **Content**: Obiekt zawierający listę znalezionych spostrzeżeń.
  ```json
  {
    "findings": [
      {
        "type": "warning",
        "message": "This sentence uses passive voice...",
        "offending_text": "The change was implemented..."
      }
    ]
  }
  ```
- **Błąd**: Zobacz sekcję "Obsługa błędów".

## 5. Przepływ danych

> **WAŻNA UWAGA DOTYCZĄCA MOCKOWANIA AI:** Wywołanie do usługi AI musi być zamockowane. Funkcja mockująca powinna przyjmować treść artykułu i prompt, a następnie zwracać predefiniowaną, statyczną listę obiektów `AuditFindingDto`.

1.  Żądanie `POST` trafia do `/api/articles/{id}/run-audit`.
2.  Middleware Astro weryfikuje token JWT.
3.  Handler endpointu w `src/pages/api/articles/[id]/run-audit.ts` przejmuje żądanie.
4.  Parametr `id` z URL oraz `audit_id` z ciała żądania są walidowane (`zod`).
5.  Wywoływana jest metoda `articleService.runCustomAudit(articleId, auditId, user.id)`.
6.  **Wewnątrz serwisu `article.service.ts`**:
    a. Pobierany jest artykuł o zadanym `articleId` oraz niestandardowy audyt o zadanym `auditId`. Logika musi upewnić się, że oba zasoby należą do zalogowanego użytkownika (`userId`).
    b. **(MOCK)** Wywoływana jest zamockowana funkcja AI. Przekazywana jest jej treść artykułu (`article.content`) oraz prompt z audytu (`customAudit.prompt`).
    c. Mock AI zwraca tablicę obiektów `AuditFindingDto`.
    d. Zwracany jest obiekt `RunAuditResponseDto` zawierający otrzymane `findings`.
7.  Handler endpointu zwraca odpowiedź `200 OK` z `RunAuditResponseDto`.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Egzekwowane przez middleware.
- **Autoryzacja / IDOR**: Kluczowa jest podwójna weryfikacja w serwisie:
  1.  Czy artykuł (`articleId`) należy do `userId`.
  2.  Czy niestandardowy audyt (`auditId`) należy do `userId`.

## 7. Obsługa błędów

- **`400 Bad Request`**: Zwracany, gdy walidacja `zod` dla `id` z URL lub `audit_id` z ciała żądania nie powiedzie się.
- **`401 Unauthorized`**: Zwracany przez middleware.
- **`404 Not Found`**: Zwracany, gdy artykuł lub niestandardowy audyt o podanych identyfikatorach nie istnieje lub nie należy do zalogowanego użytkownika.
- **`500 Internal Server Error`**: Zwracany w przypadku nieoczekiwanych błędów serwera.

## 8. Rozważania dotyczące wydajności

- Operacja jest synchroniczna i jej wydajność zależy od czasu odpowiedzi AI. Ponieważ jest to akcja na żądanie użytkownika (np. kliknięcie przycisku), dłuższy czas oczekiwania może być akceptowalny, o ile interfejs użytkownika odpowiednio go sygnalizuje.

## 9. Etapy wdrożenia

1.  **Struktura Plików**: Utwórz plik `src/pages/api/articles/[id]/run-audit.ts`.
2.  **Schema Walidacji**: W `src/lib/schemas/article.schemas.ts`, utwórz schemę `zod` dla `RunAuditCommand`.
3.  **Serwis Artykułów (`article.service.ts`)**:
    a. Utwórz nową, asynchroniczną metodę `runCustomAudit(articleId: string, auditId: string, userId: string): Promise<RunAuditResponseDto>`.
    b. Zaimplementuj logikę pobierania artykułu i audytu, weryfikując ich przynależność do `userId`.
    c. Stwórz zamockowaną funkcję AI, która zwraca przykładową listę `AuditFindingDto`.
    d. Wywołaj mock i zwróć wynik opakowany w `RunAuditResponseDto`.
4.  **Endpoint API (`run-audit.ts`)**:
    a. Dodaj `export const prerender = false;`.
    b. Zaimplementuj handler `POST`.
    c. Przeprowadź walidację `Astro.params.id` oraz `request.body`.
    d. W bloku `try...catch`, wywołaj `articleService.runCustomAudit` i zwróć odpowiedź `200 OK`.
    e. W bloku `catch`, obsłuż błędy i zwróć odpowiednie kody statusu.
