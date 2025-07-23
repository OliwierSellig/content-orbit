# API Endpoint Implementation Plan: POST /api/articles/{id}/chat

## 1. Przegląd punktu końcowego

Ten punkt końcowy zastępuje funkcjonalność audytów, wprowadzając interaktywny czat z asystentem AI. Umożliwia on użytkownikowi prowadzenie konwersacji w kontekście edytowanego artykułu. Endpoint przyjmuje wiadomość od użytkownika (oraz opcjonalnie historię rozmowy) i strumieniuje z powrotem odpowiedź AI.

> **WAŻNA UWAGA DOTYCZĄCA MOCKOWANIA:** Na obecnym etapie rozwoju, cała logika AI jest **zamockowana**. Endpoint będzie ignorował treść wiadomości od użytkownika i zawsze zwracał tę samą, predefiniowaną odpowiedź w formie strumienia, aby symulować prawdziwą interakcję.

## 2. Szczegóły żądania

- **Metoda HTTP**: `POST`
- **Struktura URL**: `/api/articles/{id}/chat`
- **Parametry URL**:
  - `id` (string, uuid): Identyfikator artykułu, którego dotyczy czat.
- **Request Body**: Ciało żądania musi zawierać obiekt JSON:
  ```json
  {
    "message": "string",
    "history": [
      { "role": "user", "content": "Poprzednia wiadomość" },
      { "role": "assistant", "content": "Poprzednia odpowiedź AI" }
    ]
  }
  ```

## 3. Wykorzystywane typy

- **Command Model (wejście)**: `ArticleChatMessage` (`src/types.ts`) - do walidacji ciała żądania.
- **DTO (wyjście)**: Strumień `text/event-stream`, gdzie każda porcja danych (`data:`) to fragment odpowiedzi.

## 4. Szczegóły odpowiedzi

- **Sukces**:
  - **Kod**: `200 OK`
  - **Content-Type**: `text/event-stream; charset=utf-8`
  - **Treść**: Strumień Server-Sent Events (SSE). Każde zdarzenie wysyła fragment (np. jedno słowo) zamockowanej odpowiedzi.

  ```
  data: "To "

  data: "jest "

  data: "zamockowana "

  data: "odpowiedź "

  data: "AI."

  data: "[DONE]"
  ```

  Specjalna wiadomość `[DONE]` sygnalizuje frontendowi koniec strumienia.

- **Błąd**: Zobacz sekcję "Obsługa błędów".

## 5. Przepływ danych

1.  Żądanie `POST` trafia do `/api/articles/[id]/chat`.
2.  Middleware Astro weryfikuje token JWT.
3.  Handler endpointu w `src/pages/api/articles/[id]/chat.ts` przejmuje żądanie.
4.  Parametr `id` z URL oraz ciało żądania są walidowane (`zod`).
5.  Wywoływana jest metoda `articleService.getArticleById(articleId, user.id)` w celu weryfikacji, czy artykuł istnieje i należy do użytkownika. Sama treść artykułu nie jest na tym etapie potrzebna.
6.  **(MOCK)** Handler inicjuje odpowiedź strumieniową (`ReadableStream`).
    a. Definiowana jest statyczna, zamockowana odpowiedź (np. "To jest zamockowana odpowiedź AI, która pomoże Ci w pisaniu!").
    b. W pętli, z niewielkim opóźnieniem (`setTimeout`), kolejne fragmenty (słowa) tej odpowiedzi są wysyłane do klienta za pomocą `controller.enqueue()`.
    c. Po wysłaniu całej wiadomości, wysyłany jest sygnał `[DONE]` i strumień jest zamykany (`controller.close()`).
7.  Frontend odbiera kolejne fragmenty i na bieżąco aktualizuje interfejs czatu, tworząc efekt pisania na żywo.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Egzekwowane przez middleware.
- **Autoryzacja**: Serwis musi zweryfikować, czy artykuł o podanym `articleId` należy do zalogowanego użytkownika (`userId`), aby uniemożliwić interakcję w kontekście nie swoich danych.

## 7. Obsługa błędów

- **`400 Bad Request`**: Zwracany, gdy walidacja `zod` dla `id` z URL lub ciała żądania nie powiedzie się.
- **`401 Unauthorized`**: Zwracany przez middleware.
- **`404 Not Found`**: Zwracany, gdy artykuł o podanym `id` nie istnieje lub nie należy do zalogowanego użytkownika.
- **`500 Internal Server Error`**: Zwracany w przypadku nieoczekiwanych błędów serwera podczas inicjowania strumienia.

## 8. Rozważania dotyczące wydajności

- Operacja jest asynchroniczna i nie obciąża serwera. Strumieniowanie jest lekkie i wydajne.

## 9. Etapy wdrożenia

1.  **Struktura Plików**: Utwórz plik `src/pages/api/articles/[id]/chat.ts`.
2.  **Schema Walidacji**: W `src/lib/schemas/article.schemas.ts`, utwórz schemę `zod` dla ciała żądania czatu.
3.  **Typy**: W `src/types.ts`, zdefiniuj typ `ArticleChatMessage`.
4.  **Endpoint API (`chat.ts`)**:
    a. Dodaj `export const prerender = false;`.
    b. Zaimplementuj handler `POST`.
    c. Przeprowadź walidację `Astro.params.id` oraz `request.body`.
    d. W bloku `try...catch`, wywołaj `articleService.getArticleById` w celu autoryzacji.
    e. Zaimplementuj logikę `ReadableStream` do strumieniowania zamockowanej odpowiedzi słowo po słowie.
    f. Ustaw odpowiednie nagłówki odpowiedzi (`Content-Type: text/event-stream`).
    g. W bloku `catch`, obsłuż błędy i zwróć odpowiednie kody statusu.
