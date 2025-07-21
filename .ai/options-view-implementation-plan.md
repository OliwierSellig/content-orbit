# Plan implementacji widoku Opcje

## 1. Przegląd

Widok "Opcje" (`/options`) jest centralnym miejscem w aplikacji, które pozwala użytkownikom na zarządzanie globalnymi ustawieniami. Umożliwia personalizację działania aplikacji poprzez konfigurację parametrów generowania AI, definiowanie własnych preferencji stylu AI oraz tworzenie niestandardowych audytów do analizy treści. Implementacja tego widoku jest kluczowa dla realizacji historyjki użytkownika US-018.

## 2. Routing widoku

Widok będzie dostępny pod następującą ścieżką:

- **Ścieżka**: `/options`
- **Plik**: `src/pages/options.astro`
- **Layout**: `src/layouts/DashboardLayout.astro` (Należy go utworzyć jako podstawowy layout. Pełna implementacja, w tym nagłówek z nawigacją, zostanie dodana w osobnym kroku).

## 3. Struktura komponentów

Hierarchia komponentów dla widoku "Opcje" będzie następująca. Komponenty interaktywne będą implementowane w React i ładowane jako wyspy Astro (`client:load`).

```
src/pages/options.astro
└── components/views/OptionsView.tsx (Główny komponent widoku, zarządza stanem)
    └── components/options/OptionsGrid.tsx (Układ siatki dla kart)
        ├── components/options/SettingsCard.tsx (Ustawienia generowania)
        │   └── components/options/GenerationSettingsForm.tsx (Formularz)
        ├── components/options/SettingsCard.tsx (Preferencje AI)
        │   └── components/shared/CrudList.tsx (Lista z CRUD)
        │       └── components/shared/CrudListItem.tsx (Element listy)
        └── components/options/SettingsCard.tsx (Niestandardowe audyty)
            └── components/shared/CrudList.tsx (Lista z CRUD)
                └── components/shared/CrudListItem.tsx (Element listy)

// Komponent modalny, renderowany warunkowo na poziomie OptionsView.tsx
└── components/shared/CrudFormModal.tsx (Modal do tworzenia/edycji)
```

## 4. Szczegóły komponentów

### `OptionsView.tsx`

- **Opis komponentu**: Główny kontener React dla widoku. Odpowiedzialny za pobieranie wszystkich niezbędnych danych (profil, preferencje, audyty), zarządzanie stanem ładowania i błędów oraz obsługę logiki dla modala CRUD.
- **Główne elementy**: Wyświetla wskaźnik ładowania, komunikat o błędzie lub komponent `OptionsGrid` po pomyślnym załadowaniu danych. Renderuje warunkowo `CrudFormModal`.
- **Obsługiwane interakcje**: Zarządzanie otwieraniem/zamykaniem modala, przekazywanie danych i funkcji do komponentów podrzędnych.
- **Obsługiwana walidacja**: Brak.
- **Typy**: `ProfileDto`, `AiPreferenceDto`, `CustomAuditDto`.
- **Propsy**: Brak.

### `GenerationSettingsForm.tsx`

- **Opis komponentu**: Formularz do edycji domyślnych wartości `default_topics_count` i `default_subtopics_count`, wykorzystujący `input` typu `number`.
- **Główne elementy**: Zbudowany przy użyciu komponentów `Form`, `FormField`, `Input` (type="number") i `Button` z biblioteki Shadcn/ui oraz `react-hook-form`.
- **Obsługiwane interakcje**: Wprowadzanie wartości, walidacja na żywo, zapisywanie zmian.
- **Obsługiwana walidacja**: Walidacja po stronie klienta musi być spójna ze schematem `UpdateProfileRequestSchema` używanym przez backend w `profile.ts`.
  - `default_topics_count`: wymagane, liczba całkowita, dodatnia.
  - `default_subtopics_count`: wymagane, liczba całkowita, dodatnia.
- **Typy**: `ProfileDto`, `UpdateProfileCommand`.
- **Propsy**: `initialData: ProfileDto`, `onSave: (data: UpdateProfileCommand) => Promise<void>`.

### `CrudList.tsx` (Reużywalny)

- **Opis komponentu**: Generyczny komponent do wyświetlania listy elementów (preferencji AI lub audytów). Składa się z przycisku "Dodaj nowy" oraz listy komponentów `CrudListItem`.
- **Główne elementy**: Przycisk "Dodaj nowy", iteracja po `items` i renderowanie `CrudListItem` dla każdego z nich.
- **Obsługiwane interakcje**: Przekazuje zdarzenia `onCreate`, `onEdit`, `onDelete` do komponentu nadrzędnego.
- **Obsługiwana walidacja**: Brak.
- **Typy**: `TItem extends { id: string; title: string; prompt: string; }`.
- **Propsy**: `items: TItem[]`, `onCreate: () => void`, `onEdit: (item: TItem) => void`, `onDelete: (id: string) => void`.

### `CrudListItem.tsx` (Reużywalny)

- **Opis komponentu**: Wyświetla pojedynczy element na liście (`CrudList`). Po lewej stronie pokazuje tytuł, a po prawej skrócony opis (`prompt`) z możliwością rozwinięcia. Udostępnia ikony do edycji i usuwania.
- **Główne elementy**: Element `div` lub `Card`. Po lewej `h4` na tytuł. Po prawej `p` na opis, przyciski ikonowe `Pencil` i `Trash` (z biblioteki ikon). Przycisk "Pokaż więcej" / "Pokaż mniej".
- **Obsługiwane interakcje**:
  - Kliknięcie ikony edycji (wywołuje `onEdit`).
  - Kliknięcie ikony usunięcia (wywołuje `onDelete`, powinno być poprzedzone modalem potwierdzającym).
  - Rozwijanie i zwijanie opisu (zarządzane stanem lokalnym).
- **Obsługiwana walidacja**: Brak.
- **Typy**: `TItem extends { id: string; title: string; prompt: string; }`.
- **Propsy**: `item: TItem`, `onEdit: (item: TItem) => void`, `onDelete: (id: string) => void`.

### `CrudFormModal.tsx` (Reużywalny)

- **Opis komponentu**: Generyczny modal z formularzem do tworzenia lub edycji elementu (preferencji AI lub audytu).
- **Główne elementy**: Komponent `Dialog` z Shadcn/ui. Formularz z polami `Input` dla `title` i `Textarea` dla `prompt`.
- **Obsługiwane interakcje**: Wprowadzanie danych, walidacja, zapis lub anulowanie.
- **Obsługiwana walidacja**:
  - `title`: wymagany, string, minimalna długość 3 znaki. Musi być unikalny (wymaga obsługi błędu walidacji z API).
  - `prompt`: wymagany, string, minimalna długość 10 znaków.
- **Typy**: `TItem`, `TCreateCommand`, `TUpdateCommand`.
- **Propsy**: `isOpen: boolean`, `mode: 'create' | 'edit'`, `item: TItem | null`, `onClose: () => void`, `onSave: (data: TCreateCommand | TUpdateCommand) => Promise<void>`, `validationSchema: Zod.Schema`.

## 5. Typy

Większość typów DTO (`ProfileDto`, `AiPreferenceDto`, `CustomAuditDto`) i Command (`UpdateProfileCommand`, etc.) jest już zdefiniowana w `src/types.ts`. Należy zdefiniować dodatkowe typy dla zarządzania stanem widoku.

- **`OptionsViewState`**: Obiekt stanu dla całego widoku.

  ```typescript
  interface OptionsViewState {
    profile: ProfileDto | null;
    aiPreferences: AiPreferenceDto[];
    customAudits: CustomAuditDto[];
    isLoading: boolean;
    error: Error | null;
  }
  ```

- **`ModalState`**: Typ do zarządzania stanem `CrudFormModal`.
  ```typescript
  type ModalState<T> = {
    isOpen: boolean;
    mode: "create" | "edit";
    type: "aiPreference" | "customAudit" | null;
    data: T | null; // Dane edytowanego elementu
  };
  ```

## 6. Zarządzanie stanem

Zarządzanie stanem będzie scentralizowane w komponencie `OptionsView.tsx`. Zalecane jest stworzenie customowego hooka `useOptionsData`, który enkapsuluje całą logikę.

- **`useOptionsData()`**:
  - **Cel**: Pobieranie danych początkowych, obsługa stanu ładowania i błędów, a także dostarczanie funkcji do operacji CRUD. Hook ten zaimplementuje logikę "Optimistic UI".
  - **Zarządzany stan**: `OptionsViewState`.
  - **Zwracane funkcje**:
    - `updateProfile(data: UpdateProfileCommand)`
    - `createItem(type: 'aiPreference' | 'customAudit', data: CreateCommand)`
    - `updateItem(type: 'aiPreference' | 'customAudit', id: string, data: UpdateCommand)`
    - `deleteItem(type: 'aiPreference' | 'customAudit', id: string)`
  - **Logika Optimistic UI**: Dla operacji `create`, `update`, `delete`, stan lokalny jest natychmiast aktualizowany, a następnie wywoływane jest zapytanie API. W przypadku błędu API, stan jest przywracany do poprzedniej wartości i wyświetlany jest komunikat o błędzie.

## 7. Integracja API

Integracja z API będzie realizowana z poziomu hooka `useOptionsData`.

- **Pobieranie danych**:
  - `Promise.all` zostanie użyte do pobrania wszystkich danych przy ładowaniu komponentu:
    - `GET /api/profile`
    - `GET /api/ai-preferences`
    - `GET /api/custom-audits`
- **Aktualizacja profilu**:
  - `PATCH /api/profile`
  - **Żądanie**: `UpdateProfileCommand`
  - **Odpowiedź (sukces)**: `200 OK` z `ProfileDto`
- **Operacje CRUD na preferencjach AI**:
  - `POST /api/ai-preferences` (Request: `CreateAiPreferenceCommand`, Response: `AiPreferenceDto`)
  - `PATCH /api/ai-preferences/{id}` (Request: `UpdateAiPreferenceCommand`, Response: `AiPreferenceDto`)
  - `DELETE /api/ai-preferences/{id}` (Response: `204 No Content`)
- **Operacje CRUD na audytach**:
  - `POST /api/custom-audits` (Request: `CreateCustomAuditCommand`, Response: `CustomAuditDto`)
  - `PATCH /api/custom-audits/{id}` (Request: `UpdateCustomAuditCommand`, Response: `CustomAuditDto`)
  - `DELETE /api/custom-audits/{id}` (Response: `204 No Content`)

## 8. Interakcje użytkownika

- **Ładowanie widoku**: Użytkownik widzi stan ładowania, a następnie trzy karty z załadowanymi danymi.
- **Zmiana ustawień generowania**: Użytkownik modyfikuje liczby w formularzu i klika "Zapisz". Przycisk pokazuje stan ładowania, a po sukcesie wyświetlany jest toast z potwierdzeniem.
- **Dodawanie elementu (Preferencji/Audytu)**: Kliknięcie "Dodaj nowy" otwiera modal. Po zapisaniu, modal się zamyka, a nowy element natychmiast pojawia się na liście (Optimistic UI).
- **Edycja elementu**: Kliknięcie ikony ołówka otwiera modal z wypełnionymi danymi. Po zapisie, zmiany są natychmiast widoczne na liście (Optimistic UI).
- **Usuwanie elementu**: Kliknięcie ikony kosza wyświetla modal potwierdzający. Po potwierdzeniu, element natychmiast znika z listy (Optimistic UI).
- **Rozwijanie opisu**: Użytkownik może klikać przycisk "Pokaż więcej" / "Pokaż mniej" pod skróconym opisem, aby zobaczyć cały `prompt`.

## 9. Warunki i walidacja

Walidacja po stronie klienta będzie realizowana przy użyciu biblioteki `zod`, aby zapewnić spójność z backendem i poprawić UX.

- **`GenerationSettingsForm`**: Schemat `zod` sprawdzi, czy wartości są dodatnimi liczbami całkowitymi. Przycisk zapisu będzie nieaktywny, jeśli formularz jest niepoprawny.
- **`CrudFormModal`**: Schemat `zod` sprawdzi minimalną długość dla `title` i `prompt`. Przycisk zapisu będzie nieaktywny, jeśli formularz jest niepoprawny.

## 10. Obsługa błędów

- **Błąd pobierania danych**: `OptionsView` wyświetli ogólny komunikat o błędzie zamiast siatki z opcjami.
- **Błąd zapisu (CRUD)**: Dzięki "Optimistic UI", w przypadku błędu API, interfejs użytkownika zostanie przywrócony do stanu sprzed operacji. Dodatkowo, zostanie wyświetlony toast z informacją o błędzie (np. "Nie udało się usunąć preferencji. Spróbuj ponownie.").
- **Błąd walidacji z API (np. zduplikowany tytuł)**: Jeśli API zwróci błąd walidacji (np. status 409 Conflict lub 400 Bad Request), `CrudFormModal` powinien wyświetlić ten błąd pod odpowiednim polem formularza, informując użytkownika, że np. "Ta nazwa jest już zajęta".
- **Brak autoryzacji (401)**: Globalny mechanizm obsługi błędów w aplikacji powinien przechwycić ten status i przekierować użytkownika na stronę logowania.

## 11. Kroki implementacji

1.  **Struktura plików**: Utwórz plik `src/pages/options.astro` oraz foldery i puste pliki dla wszystkich zdefiniowanych komponentów React (`OptionsView`, `OptionsGrid`, `SettingsCard`, `GenerationSettingsForm`, `CrudList`, `CrudListItem`, `CrudFormModal`).
2.  **Layout**: Utwórz podstawowy plik `src/layouts/DashboardLayout.astro`. Na tym etapie plik będzie zawierał jedynie strukturę ramową bez nagłówka i nawigacji, które zostaną dodane w przyszłości.
3.  **Strona Astro**: Zaimplementuj `src/pages/options.astro`, importując i renderując `<OptionsView client:load />` wewnątrz layoutu.
4.  **Pobieranie danych i budowa komponentów**: Zaimplementuj hook `useOptionsData` do pobierania danych (`GET` requests) z API. Dzięki istnieniu mockowanej sesji użytkownika w middleware (`src/middleware/index.ts`), nie ma potrzeby mockowania wywołań API — należy od razu pracować na żywych danych. Równolegle buduj komponenty React (`OptionsView`, `OptionsGrid`, `SettingsCard` itd.), od razu podłączając je do stanu i danych zarządzanych przez hook.
5.  **Implementacja `GenerationSettingsForm`**: Zaimplementuj logikę formularza, walidację `zod` spójną z backendem i obsługę zapisu (`PATCH /api/profile`).
6.  **Implementacja CRUD**:
    - Zaimplementuj logikę `CrudList`, `CrudListItem` i `CrudFormModal`, czyniąc je w pełni funkcjonalnymi.
    - Rozszerz hook `useOptionsData` o funkcje do tworzenia, aktualizacji i usuwania elementów (preferencji i audytów).
7.  **Implementacja Optimistic UI**: Zaimplementuj logikę "Optimistic UI" wewnątrz hooka `useOptionsData` dla wszystkich operacji CRUD. Zapewnij mechanizm przywracania stanu w przypadku błędu API.
8.  **Obsługa błędów i UX**: Dopracuj obsługę błędów, dodaj toasty (powiadomienia) dla sukcesu i porażki operacji. Upewnij się, że stany ładowania są poprawnie wyświetlane.
9.  **Testowanie i Refaktoryzacja**: Przetestuj wszystkie ścieżki użytkownika, przypadki brzegowe i obsługę błędów. Zrefaktoryzuj kod w razie potrzeby.
