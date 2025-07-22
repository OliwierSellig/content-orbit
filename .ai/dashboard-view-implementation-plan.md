# Plan implementacji widoku Dashboard

## 1. Przegląd

Widok Dashboard (`/`) jest centralnym punktem startowym aplikacji, inicjującym główny przepływ pracy związany z tworzeniem treści. Umożliwia użytkownikom wybór tematu (poprzez generowanie AI, ręczne wprowadzanie lub wybór z istniejącej listy), a następnie zarządzanie listą podtematów w ramach wieloetapowego kreatora w oknie modalnym. Po zatwierdzeniu podtematów, widok dynamicznie renderuje listę, na której każdy podtemat jest indywidualnie przetwarzany na gotowy koncept artykułu, z widocznym statusem generowania.

## 2. Routing widoku

- **Ścieżka**: `/`
- **Plik**: `src/pages/index.astro`
- **Layout nadrzędny**: `src/layouts/DashboardLayout.astro`

## 3. Struktura komponentów

Widok będzie składał się z komponentu-strony Astro, który zarządza stanem i renderuje komponenty React.

```
- index.astro (Strona główna)
  - Button ("Nowy temat")
  - Button ("Wybierz istniejący")
  - TopicCreationWizard (React, client:load)
    - TopicGenerationContext.Provider
      - Step1_TopicChoice
      - Step2_TopicSelection
        - AiSuggestionTiles
        - TopicManualForm
        - ExistingClusterList
      - Step3_SubtopicManagement
  - ConceptGenerationList (React, client:load)
    - ConceptGenerationListItem
    - ConceptGenerationListItem
    - ...
```

## 4. Szczegóły komponentów

### `TopicCreationWizard`

- **Opis komponentu**: Wieloetapowy modal (oparty na `Dialog` z `shadcn/ui`), który prowadzi użytkownika przez proces wyboru tematu i podtematów. Stan jest zarządzany globalnie dla całego kreatora za pomocą hooka `useTopicGeneration` i udostępniany przez React Context.
- **Główne elementy**: `Dialog`, `DialogContent`, `DialogHeader`, `DialogFooter`, `Button`, komponenty poszczególnych kroków.
- **Obsługiwane interakcje**:
  - Otwieranie/zamykanie modala.
  - Nawigacja pomiędzy krokami (`goToStep`).
  - Wybór opcji stworzenia tematu.
  - Zatwierdzenie finalnej listy podtematów i zamknięcie kreatora z przekazaniem danych.
- **Obsługiwana walidacja**: Logika walidacji jest delegowana do komponentów podrzędnych (`TopicManualForm`, `Step3_SubtopicManagement`).
- **Typy**: `TopicClusterDto`, `TopicClusterSuggestionsDto`.
- **Propsy**:
  ```typescript
  interface TopicCreationWizardProps {
    isOpen: boolean;
    initialMode: "new" | "existing";
    onOpenChange: (isOpen: boolean) => void;
    onComplete: (subtopics: string[], topicCluster: TopicClusterDto) => void;
  }
  ```

### `Step2_TopicSelection` (warianty)

- **Opis komponentu**: Kontener na jeden z trzech sposobów wyboru tematu.
  - **`AiSuggestionTiles`**: Wyświetla kafelki z sugestiami od AI.
    - **Propsy**: `suggestions: string[]`, `onSelect: (suggestion: string) => void`, `isLoading: boolean`.
  - **`TopicManualForm`**: Formularz do ręcznego wpisania tematu.
    - **Propsy**: `onSubmit: (topicName: string) => void`, `isLoading: boolean`.
    - **Walidacja**: Pole nie może być puste. Musi obsłużyć błąd `409 Conflict` (duplikat) z API.
  - **`ExistingClusterList`**: Przeszukiwalna lista istniejących klastrów.
    - **Propsy**: `onSelect: (cluster: TopicClusterDto) => void`.
- **Typy**: `TopicClusterDto`.

### `Step3_SubtopicManagement`

- **Opis komponentu**: Komponent do zarządzania listą podtematów. Użytkownik może dodawać, usuwać i zlecać dogenerowanie propozycji.
- **Główne elementy**: Lista podtematów, `Input` do dodawania nowego, `Button` "Usuń" przy każdym elemencie, `Button` "Uzupełnij do X", `Button` "Zatwierdź i generuj koncepty".
- **Obsługiwane interakcje**:
  - Dodawanie podtematu z inputa.
  - Usuwanie podtematu z listy.
  - Uruchomienie generowania dodatkowych podtematów.
  - Zatwierdzenie listy.
- **Obsługiwana walidacja**:
  - Przycisk "Zatwierdź i generuj koncepty" jest nieaktywny, jeśli lista podtematów jest pusta.
  - Dodawany podtemat nie może być pustym ciągiem znaków.
- **Typy**: `string[]`.

### `ConceptGenerationList`

- **Opis komponentu**: Renderowany na stronie głównej po pomyślnym ukończeniu `TopicCreationWizard`. Wyświetla listę zaakceptowanych podtematów i zarządza procesem generowania dla każdego z nich.
- **Główne elementy**: Kontener `div`, mapowanie po liście podtematów i renderowanie `ConceptGenerationListItem`.
- **Typy**: `TopicClusterDto`.
- **Propsy**:
  ```typescript
  interface ConceptGenerationListProps {
    subtopics: string[];
    topicCluster: TopicClusterDto;
  }
  ```

### `ConceptGenerationListItem`

- **Opis komponentu**: Pojedynczy, autonomiczny element na liście do generowania konceptów. Odpowiada za wykonanie własnego zapytania do API i zarządzanie swoim stanem (ładowanie, sukces, błąd).
- **Główne elementy**: `div` z nazwą podtematu, `Spinner` (wskaźnik ładowania), ikona sukcesu lub błędu, link do edytora po pomyślnym wygenerowaniu.
- **Obsługiwane interakcje**: Kliknięcie przycisku "Spróbuj ponownie" w razie błędu.
- **Typy**: `ArticleDto`.
- **Propsy**:
  ```typescript
  interface ConceptGenerationListItemProps {
    subtopicName: string;
    topicClusterId: string;
  }
  ```

## 5. Typy

Oprócz istniejących typów DTO (`TopicClusterDto`, `ArticleDto`, etc.), zostaną wykorzystane następujące typy i modele widoku:

```typescript
// Typ dla stanu wewnętrznego kreatora
export type WizardStep =
  | "topic_choice"
  | "topic_selection_ai"
  | "topic_selection_manual"
  | "topic_selection_existing"
  | "subtopic_management";

// Stan zarządzany przez hook `useTopicGeneration`
export interface TopicGenerationState {
  step: WizardStep;
  selectedTopicName: string | null;
  selectedTopicCluster: TopicClusterDto | null;
  subtopics: string[];
  isLoading: boolean;
  error: string | null;
}

// Stan pojedynczego elementu na liście generowania konceptów
export type GenerationStatus = "pending" | "loading" | "success" | "error";
```

## 6. Zarządzanie stanem

- **`useTopicGeneration`**: Niestandardowy hook, który będzie sercem `TopicCreationWizard`.
  - **Cel**: Hermetyzacja całej logiki biznesowej i stanu kreatora, w tym aktualnego kroku, wybranego tematu, listy podtematów oraz obsługi zapytań API (pobieranie sugestii, tworzenie klastra).
  - **Użycie**: Hook będzie wywołany w komponencie `TopicCreationWizard`, a jego wartości (stan i funkcje) zostaną przekazane do komponentów podrzędnych za pomocą `TopicGenerationContext`.
- **Stan lokalny**: Komponent `ConceptGenerationListItem` będzie zarządzał swoim własnym, niezależnym stanem (`status`, `wynik`, `błąd`), aby odizolować proces generowania każdego konceptu.

## 7. Integracja API

Komponenty będą komunikować się z następującymi endpointami:

- **`GET /api/topic-clusters/suggestions`**: Wywoływane przez `useTopicGeneration` do pobrania propozycji tematów.
  - **Odpowiedź**: `TopicClusterSuggestionsDto`
- **`POST /api/topic-clusters`**: Wywoływane z `TopicManualForm` do stworzenia nowego klastra.
  - **Żądanie**: `CreateTopicClusterCommand`
  - **Odpowiedź**: `201 Created` z `TopicClusterDto` lub `409 Conflict`.
- **`GET /api/topic-clusters`**: Wywoływane przez `ExistingClusterList` do pobrania istniejących klastrów.
  - **Odpowiedź**: Lista `TopicClusterDto`.
- **`GET /api/topic-clusters/subtopic-suggestions`**: Wywoływane przez `useTopicGeneration` po wyborze tematu.
  - **Parametry**: `topic_name: string`.
  - **Odpowiedź**: `TopicClusterSuggestionsDto`.
- **`POST /api/articles`**: Wywoływane przez każdy `ConceptGenerationListItem` do stworzenia artykułu i wygenerowania konceptu.
  - **Żądanie**: `CreateArticleCommand`
  - **Odpowiedź**: `201 Created` z `ArticleDto`.

## 8. Interakcje użytkownika

1.  Użytkownik klika "Nowy temat" na stronie głównej -> Otwiera się modal `TopicCreationWizard`.
2.  Użytkownik wybiera jedną z trzech opcji (AI, ręcznie, istniejący).
3.  Po wybraniu/stworzeniu tematu, kreator przechodzi do kroku zarządzania podtematami, które są wstępnie wypełnione przez AI.
4.  Użytkownik modyfikuje listę podtematów (dodaje/usuwa) i klika "Zatwierdź i generuj koncepty".
5.  Modal się zamyka. Na stronie głównej pojawia się komponent `ConceptGenerationList`.
6.  Każdy element na liście wyświetla indywidualny wskaźnik ładowania.
7.  Po zakończeniu generowania, wskaźnik ładowania zmienia się na status sukcesu (z linkiem do edytora) lub błędu (z opcją ponowienia).

## 9. Warunki i walidacja

- **Formularz ręcznego tematu**:
  - Pole nie może być puste (przycisk `submit` jest nieaktywny).
  - Musi być unikalne (komponent obsługuje błąd `409 Conflict` i wyświetla komunikat).
- **Lista podtematów**:
  - Przycisk "Zatwierdź i generuj koncepty" jest nieaktywny, jeśli `subtopics.length === 0`.
- **Przycisk "Uzupełnij do X"**:
  - Jest widoczny i aktywny tylko wtedy, gdy `subtopics.length < default_subtopics_count`.

## 10. Obsługa błędów

- **Błędy sieciowe/API**: Wszystkie zapytania API powinny być opakowane w bloki `try...catch`. Błędy powinny być komunikowane użytkownikowi za pomocą komponentu `Toast` (`sonner`).
- **Błąd pobierania danych (sugestie, klastry)**: Wewnątrz modala powinien pojawić się komunikat o błędzie z przyciskiem "Spróbuj ponownie".
- **Błąd generowania konceptu (`ConceptGenerationListItem`)**: Element listy powinien zmienić swój stan na `error`, wyświetlić komunikat "Nie udało się wygenerować konceptu" i przycisk "Spróbuj ponownie", który ponownie wywoła zapytanie `POST /api/articles` tylko dla tego elementu.

## 11. Kroki implementacji

1.  **Struktura plików**: Stwórz nowe pliki dla komponentów w `src/components/dashboard/`: `TopicCreationWizard.tsx`, `ConceptGenerationList.tsx`, `useTopicGeneration.tsx` etc.
2.  **Kontekst i Hook**: Zaimplementuj hook `useTopicGeneration` z całą logiką stanu (użyj `useState` i `useCallback`) oraz `TopicGenerationContext`.
3.  **Komponent `TopicCreationWizard`**: Zbuduj główny komponent modala, który korzysta z hooka i kontekstu do zarządzania krokami.
4.  **Komponenty kroków**: Zaimplementuj poszczególne komponenty podrzędne kreatora: `Step1_TopicChoice`, `AiSuggestionTiles`, `TopicManualForm`, `ExistingClusterList` i `Step3_SubtopicManagement`. Podłącz ich logikę do funkcji z hooka `useTopicGeneration`.
5.  **Integracja ze stroną Astro**: W `src/pages/index.astro`, dodaj logikę stanu do zarządzania otwarciem `TopicCreationWizard` i przekazywania `onComplete` callback.
6.  **Komponent `ConceptGenerationList`**: Stwórz komponent listy oraz autonomiczny komponent `ConceptGenerationListItem`, który będzie zarządzał swoim cyklem życia i zapytaniem API.
7.  **Finalizacja przepływu**: Upewnij się, że dane z `onComplete` poprawnie inicjują renderowanie `ConceptGenerationList` na stronie głównej.
8.  **Stylowanie i UX**: Dopracuj wygląd, animacje, stany ładowania i komunikaty o błędach, aby zapewnić płynne doświadczenie użytkownika.
9.  **Testowanie**: Przetestuj wszystkie ścieżki użytkownika, w tym przypadki brzegowe i obsługę błędów.
