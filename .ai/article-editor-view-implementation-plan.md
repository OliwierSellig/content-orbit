# Plan implementacji widoku: Edytor Artykułu

## 1. Przegląd

Widok Edytora Artykułu jest centralnym miejscem pracy nad pojedynczą treścią. Umożliwia użytkownikowi edycję wszystkich pól artykułu (treść, metadane), a także interakcję z asystentem AI poprzez **dedykowany panel czatu**. W panelu akcji pozostaje przycisk do szybkiego generowania całej treści artykułu. W panelu metadanych znajduje się przycisk przenoszący artykuł do Sanity CMS. Widok zaprojektowano w układzie trzypanelowym z responsywnym widokiem zakładek na urządzeniach mobilnych. Kluczową funkcjonalnością jest podwójny mechanizm auto-zapisu, zapewniający, że żadne zmiany nie zostaną utracone.

> **WAŻNA UWAGA DOTYCZĄCA MOCKOWANIA:** Na obecnym etapie rozwoju, wszystkie interakcje z AI, w tym czat i generowanie treści, są **zamockowane**. Oznacza to, że API będzie zwracać statyczne, predefiniowane odpowiedzi, aby umożliwić budowę interfejsu bez zależności od gotowego backendu AI.

## 2. Routing widoku

- **Ścieżka**: `/articles/[id]`
- **Układ nadrzędny**: `src/layouts/DashboardLayout.astro`

## 3. Struktura komponentów

Hierarchia komponentów została zaprojektowana w celu maksymalizacji reużywalności i separacji logiki.

```
- src/pages/articles/[id].astro         # Renderuje kliencki komponent, przekazując ID
  - ArticleEditorView.tsx               # Główny komponent kliencki, zarządza stanem
    - useArticleEditor(initialData)     # Niestandardowy hook do zarządzania logiką
    - AutosaveIndicator.tsx
    - ThreePanelLayout.tsx (Desktop)
      - LeftPanel.tsx                   # Lewy panel
        - ActionPanel.tsx               # Szybkie akcje (Generuj treść)
        - ChatPanel.tsx                 # Komponent czatu z AI
          - ChatHistory.tsx             # Wyświetla historię wiadomości
          - ChatInput.tsx               # Pole do wprowadzania wiadomości z obsługą "/"
            - SlashCommandMenu.tsx      # Pop-up z listą audytów jako komend
      - MarkdownEditor.tsx
      - MetadataForm.tsx
    - MobileEditorTabs.tsx (Mobile)
      - Tab("Akcje") -> LeftPanel.tsx
      - Tab("Edytor") -> MarkdownEditor.tsx
      - Tab("Metadane") -> MetadataForm.tsx
```

## 4. Szczegóły komponentów

### `ArticleEditorView.tsx`

- **Opis**: Główny kontener, który pobiera dane artykułu, inicjalizuje hook `useArticleEditor` i przekazuje stan oraz callbacki do komponentów podrzędnych. Zarządza stanem ładowania, wyświetlając szkieletowy widok.
- **Propsy**: `articleId: string`.

### `LeftPanel.tsx`

- **Opis**: Komponent grupujący lewy panel. Zawiera `ActionPanel` i `ChatPanel`.
- **Propsy**: `article`, `onGenerateBody`, `chatHistory`, `onSendMessage`, `isLoading`.

### `ActionPanel.tsx`

- **Opis**: Panel zawierający przycisk "Generuj treść".
- **Obsługiwane interakcje**: Kliknięcie "Generuj treść".
- **Propsy**: `onGenerateBody: () => void`, `isLoading: boolean`.

### `ChatPanel.tsx`

- **Opis**: Główny komponent interfejsu czatu. Orkiestruje wyświetlanie historii i obsługę wprowadzania danych.
- **Główne elementy**: `ChatHistory`, `ChatInput`.
- **Propsy**: `history: ChatMessage[]`, `onSendMessage: (message: string) => void`, `customAudits: CustomAuditDto[]`.

### `ChatHistory.tsx`

- **Opis**: Wyświetla listę wiadomości od użytkownika i asystenta.
- **Propsy**: `history: ChatMessage[]`.

### `ChatInput.tsx`

- **Opis**: Pole tekstowe do wprowadzania wiadomości. Wykrywa wpisanie znaku `/` i wyświetla `SlashCommandMenu`.
- **Obsługiwane interakcje**: Wpisanie wiadomości, wysłanie formularza, wybranie komendy z menu.
- **Propsy**: `onSendMessage: (message: string) => void`, `customAudits: CustomAuditDto[]`.

### `MarkdownEditor.tsx`

- **Opis**: Edytor treści Markdown.
- **Propsy**: `content`, `onChange`, `disabled`, `isLoading`.

### `MetadataForm.tsx`

- **Opis**: Formularz metadanych z przyciskiem do przenoszenia artykułu do Sanity.
- **Propsy**: `article`, `onFieldChange`, `disabled`, `isLoading`, `onMoveToSanity`.

## 5. Typy

Wprowadzono typy do obsługi czatu.

- **`ChatMessage`**: Reprezentuje pojedynczą wiadomość w czacie.
  ```typescript
  export interface ChatMessage {
    id: string; // unikalne ID wiadomości
    role: "user" | "assistant";
    content: string;
  }
  ```
- **`ArticleChatCommand`**: Ciało żądania do endpointu czatu.
  ```typescript
  export interface ArticleChatCommand {
    message: string;
    history: Omit<ChatMessage, "id">[];
  }
  ```
- **`ArticleEditorViewModel`**: Zostaje rozszerzony o stan czatu.
  ```typescript
  export interface ArticleEditorViewModel extends ArticleDto {
    // ... poprzednie pola
    chatHistory: ChatMessage[];
    isAiReplying: boolean;
  }
  ```

## 6. Zarządzanie stanem

Cała logika biznesowa i stan widoku będą zamknięte w jednym, dedykowanym custom hooku.

- **`useArticleEditor(articleId: string)`**:
  - **Cel**: Centralizacja stanu, logiki zapisu, interakcji z API, a także zarządzanie stanem konwersacji w czacie.
  - **Zarządzany stan**:
    - `useState<ArticleEditorViewModel>` - przechowuje stan artykułu, w tym `chatHistory`.
    - `useState<CustomAuditDto[]>` - przechowuje listę audytów dla komend `/`.
  - **Eksponowane wartości**:
    - `article: ArticleEditorViewModel`
    - `isLoading: boolean`
    - `sendMessage(message: string)`
    - i inne...
  - **Logika `sendMessage`**:
    1.  Dodaje wiadomość użytkownika do `chatHistory`.
    2.  Ustawia `isAiReplying` na `true`.
    3.  Wywołuje `fetch` do `/api/articles/{id}/chat`, przesyłając wiadomość i historię.
    4.  Przetwarza strumień SSE z odpowiedzią, na bieżąco aktualizując ostatnią wiadomość asystenta w `chatHistory`.
    5.  Po otrzymaniu sygnału `[DONE]`, ustawia `isAiReplying` na `false`.

## 7. Integracja API

Widok będzie komunikował się z kilkoma kluczowymi endpointami:

- **`POST /api/articles/{id}/chat`**:
  - **Cel**: Główny endpoint do interakcji z asystentem AI.
  - **Kiedy**: Wywoływany przez `sendMessage` w hooku `useArticleEditor`.
  - **Odpowiedź**: Strumień `text/event-stream` z odpowiedzią AI (zamockowaną).

- **`PATCH /api/articles/{id}`**:
  - **Cel**: Zapisywanie zmian w artykule.
  - **Kiedy**: Wywoływany przez mechanizm auto-zapisu (debounce/interval) w `useArticleEditor`.
  - **Odpowiedź**: Zaktualizowany obiekt `ArticleDto`.

- **`POST /api/articles/{id}/generate-body`**:
  - **Cel**: Wygenerowanie pełnej treści artykułu.
  - **Kiedy**: Po kliknięciu przycisku "Generuj treść" w `ActionPanel`.
  - **Odpowiedź**: Zaktualizowany `ArticleDto` z nową treścią (zamockowaną).

- **`POST /api/articles/{id}/move-to-sanity`**:
  - **Cel**: Przeniesienie artykułu do Sanity CMS.
  - **Kiedy**: Po kliknięciu przycisku w `MetadataForm`.
  - **Odpowiedź**: Zaktualizowany `ArticleDto` ze statusem `moved`.

- **`GET /api/custom-audits`**:
  - **Cel**: Pobranie listy audytów do użycia w komendach `/`.
  - **Kiedy**: Przy montowaniu komponentu `ChatPanel` lub `ChatInput`.
  - **Odpowiedź**: `CustomAuditDto[]`.

## 8. Interakcje użytkownika

- **Rozpoczęcie czatu**: Użytkownik wpisuje wiadomość w `ChatInput` i wysyła ją.
- **Użycie komendy "slash"**:
  1. Użytkownik wpisuje `/`.
  2. Pojawia się `SlashCommandMenu` z listą tytułów audytów.
  3. Użytkownik wybiera audyt z listy.
  4. Treść promptu z wybranego audytu jest wstawiana do `ChatInput`.
  5. Użytkownik wysyła wiadomość z promptem.

## 9. Warunki i walidacja

- Pole `ChatInput` jest nieaktywne (`disabled`), gdy `isAiReplying === true`.
- Przycisk "Generuj treść" jest nieaktywny, gdy AI generuje treść lub odpowiada w czacie.

## 10. Obsługa błędów

- Błąd wysłania wiadomości w czacie lub błąd strumienia SSE powinien być obsłużony w `useArticleEditor` i skutkować wyświetleniem komunikatu o błędzie w `ChatHistory`.

## 11. Kroki implementacji

1.  **Implementacja API**: Stworzyć endpoint `POST /api/articles/[id]/chat` zgodnie z planem, zwracający zamockowany strumień.
2.  **Aktualizacja typów**: Dodać typy `ChatMessage` i `ArticleChatCommand` do `src/types.ts`.
3.  **Implementacja `useArticleEditor`**:
    - Dodać logikę zarządzania `chatHistory` i stanem `isAiReplying`.
    - Zaimplementować funkcję `sendMessage` z obsługą strumienia SSE.
    - Dodać pobieranie niestandardowych audytów na potrzeby komend `/`.
4.  **Budowa komponentów czatu**:
    - Stworzyć komponenty `LeftPanel`, `ChatPanel`, `ChatHistory`, `ChatInput` i `SlashCommandMenu`.
    - `ChatInput` musi zawierać logikę do wykrywania `/` i wyświetlania menu.
5.  **Integracja w `ArticleEditorView`**: Złożyć widok, używając komponentu `LeftPanel` i przekazując do niego wszystkie potrzebne propsy (historię czatu, callbacki itp.).
6.  **Testowanie manualne**: Przetestować cały przepływ czatu, w tym wysyłanie wiadomości, otrzymywanie zamockowanej odpowiedzi strumieniowej oraz używanie komend "slash".
