# Architektura UI dla Content Orbit

## 1. Przegląd struktury UI

Architektura interfejsu użytkownika (UI) dla aplikacji Content Orbit została zaprojektowana w oparciu o zasady prostoty, wydajności i skalowalności, z myślą o realizacji celów MVP. Wykorzystując stack technologiczny oparty na Astro, React i TailwindCSS z biblioteką komponentów shadcn/ui, UI skupia się na prowadzeniu użytkownika przez kluczowy, trzyetapowy proces tworzenia treści.

Kluczowe założenia architektoniczne:

- **Struktura oparta na komponentach**: Interfejs jest budowany z reużywalnych komponentów React, co zapewnia spójność i ułatwia rozwój. Komponenty są logicznie zorganizowane według widoków oraz na te współdzielone (np. formularze, modale).
- **Zarządzanie stanem**: Stan globalny (sesja użytkownika) jest zarządzany przez `React.useContext`, co eliminuje potrzebę stosowania zewnętrznych bibliotek dla MVP. Kluczowy proces generowania tematu i podtematów jest zarządzany w stanie po stronie klienta za pomocą dedykowanego `TopicGenerationContext`, a dane są utrwalane w bazie dopiero po wygenerowaniu pierwszego konceptu. Stan lokalny jest obsługiwany przez hooki `useState` i `useReducer`, a formularze przez `react-hook-form` z walidacją `zod`.
- **Integracja z API**: Stworzona zostanie warstwa kliencka API w postaci customowych hooków (np. `useArticles`, `useSseStream`), które enkapsulują logikę zapytań `fetch`, obsługę stanu ładowania i błędów, upraszczając logikę w komponentach.
- **Doświadczenie użytkownika (UX)**: Priorytetem jest płynność pracy. Długotrwałe operacje AI posiadają wyraźne wskaźniki postępu. Zastosowano mechanizmy takie jak "Optimistic UI" przy operacjach na listach, auto-zapis w edytorze oraz toasty do komunikacji zwrotnej.
- **Responsywność**: Wszystkie widoki są w pełni responsywne. Zastosowano specyficzne rozwiązania dla urządzeń mobilnych, jak np. transformacja trzypanelowego edytora w widok z zakładkami.
- **Mockowanie autentykacji (MVP)**: Zgodnie ze strategią wdrożenia, w ramach MVP nie jest implementowany pełny system uwierzytelniania. Dostęp do aplikacji jest mockowany z użyciem testowego użytkownika, co oznacza, że wszystkie chronione widoki są domyślnie dostępne bez potrzeby logowania.

## 2. Lista widoków

### Widok: Logowanie (Mockowany)

- **Ścieżka**: `/login`
- **Układ nadrzędny**: `PublicLayout.astro`
- **Główny cel**: W ramach MVP ta strona nie będzie używana. Bezpośredni dostęp będzie prowadził do `/`. W przyszłości: uwierzytelnienie użytkownika (US-001).
- **Kluczowe komponenty**: `LoginForm`.
- **Względy**: Strona istnieje jako placeholder dla przyszłej implementacji autentykacji.

### Widok: Dashboard (Strona główna)

- **Ścieżka**: `/`
- **Układ nadrzędny**: `DashboardLayout.astro`
- **Główny cel**: Centralny punkt aplikacji i startowy dla całego przepływu tworzenia treści: od wyboru tematu i podtematów w oknie modalnym, po dynamiczne pojawienie się komponentu inicjującego generowanie konceptów bezpośrednio w tym widoku (US-004, US-005, US-006, US-007, US-009).
- **Kluczowe informacje**: Przyciski akcji: "Nowy temat", "Wybierz istniejący". Po zakończeniu pracy w kreatorze, dynamicznie pojawia się lista podtematów gotowych do generowania konceptów.
- **Kluczowe komponenty**:
  - `TopicCreationWizard`: Wieloetapowy komponent-modal, który prowadzi użytkownika przez wybór tematu i podtematów. Stan jest zarządzany wewnątrz `TopicGenerationContext`.
  - `AiSuggestionTiles`: Wyświetlane wewnątrz kreatora kafelki z propozycjami od AI.
  - `ExistingClusterList`: Przeszukiwalna lista istniejących klastrów wewnątrz kreatora.
  - `ConceptGenerationList`: Komponent dynamicznie renderowany na stronie `/` po zamknięciu kreatora. Wyświetla listę zaakceptowanych podtematów i indywidualnie dla każdego z nich zarządza procesem generowania konceptu (spinner, wynik, link do edytora).
- **Względy**: Interfejs jest dynamiczny. Użytkownik nie opuszcza strony głównej, a kolejne etapy przepływu pracy pojawiają się w tym samym widoku, co upraszcza nawigację i utrzymuje kontekst.

### Widok: Edytor Artykułu

- **Ścieżka**: `/articles/[articleId]`
- **Układ nadrzędny**: `DashboardLayout.astro`
- **Główny cel**: Edycja treści i metadanych artykułu, interakcja z funkcjami AI (generowanie treści, audyty) oraz przeniesienie do Sanity (US-011, US-012, US-013, US-014, US-015).
- **Kluczowe informacje**: Trzy panele: Akcje (generowanie, audyty, publikacja), Edytor treści (Markdown), Metadane (formularz).
- **Kluczowe komponenty**: `ThreePanelLayout` (główny układ), `ActionPanel` (z `AuditList` i `AuditRunner` do obsługi audytów SSE), `MarkdownEditor`, `MetadataForm`, `AutosaveIndicator`, `MobileEditorTabs` (dla widoku mobilnego).
- **Względy**: Implementacja podwójnego mechanizmu auto-zapisu (debounce i interwał). Wyniki audytu są strumieniowane, dając wrażenie interaktywnej rozmowy. Na mobile panele stają się wysuwanymi od dołu zakładkami z wykorzystaniem `scroll-snap`.

### Widok: Zarządzanie Klastrami

- **Ścieżka**: `/clusters`
- **Układ nadrzędny**: `DashboardLayout.astro`
- **Główny cel**: Przeglądanie i zarządzanie wszystkimi klastrami tematycznymi i przypisanymi do nich artykułami (US-016, US-017).
- **Kluczowe informacje**: Lista klastrów z opcją rozwinięcia, aby zobaczyć listę artykułów.
- **Kluczowe komponenty**: `ClusterList`, `ClusterListItem` (komponent `Accordion` z opcją usunięcia), `ArticleList`, `DeleteClusterButton` (uruchamia modal z wymogiem wpisania nazwy klastra w celu potwierdzenia).
- **Względy**: Zabezpieczenie operacji usuwania klastra poprzez modal potwierdzający, co zapobiega przypadkowemu usunięciu dużej ilości danych.

### Widok: Opcje

- **Ścieżka**: `/options`
- **Układ nadrzędny**: `DashboardLayout.astro`
- **Główny cel**: Zarządzanie globalnymi ustawieniami aplikacji, preferencjami AI oraz niestandardowymi audytami (US-018).
- **Kluczowe informacje**: Ustawienia generowania, lista preferencji AI, lista niestandardowych audytów.
- **Kluczowe komponenty**: `OptionsGrid` (układ siatki), `SettingsCard` (karta dla każdej sekcji), `CrudList` (reużywalny komponent do wyświetlania, edycji i usuwania elementów), `CrudFormModal` (reużywalny modal do tworzenia/edycji preferencji i audytów).
- **Względy**: Wszystkie operacje CRUD odbywają się w modalu, co pozwala użytkownikowi pozostać w kontekście strony. Zastosowanie "Optimistic UI" dla płynniejszej interakcji.

## 3. Mapa podróży użytkownika

Główny przepływ pracy użytkownika ("happy path") jest następujący:

1.  **Start**: Użytkownik wchodzi na stronę główną (`/`). Dostęp jest przyznawany automatycznie (mockowana sesja).
2.  **Inicjacja w kreatorze**: Na pulpicie nawigacyjnym (`/`) użytkownik klika "Nowy temat", co otwiera wieloetapowy modal (`TopicCreationWizard`).
3.  **Wybór tematu i podtematów (w modalu)**: Użytkownik wybiera temat (ręcznie, z listy lub generuje AI), a następnie w kolejnym kroku definiuje listę podtematów. Wszystkie te dane są przechowywane tymczasowo w stanie po stronie klienta (`TopicGenerationContext`).
4.  **Zamknięcie kreatora i dynamiczna zmiana widoku**: Po zatwierdzeniu podtematów, modal zamyka się. Na stronie głównej (`/`) dynamicznie pojawia się komponent `ConceptGenerationList`, wyświetlający zaakceptowane podtematy.
5.  **Generowanie Konceptów**: Dla każdego podtematu na liście rozpoczyna się proces generowania konceptu (indywidualny spinner). Gdy pierwszy koncept (np. koncept X) zostanie pomyślnie wygenerowany przez AI, wykonywane są następujące akcje:
    - Jeśli klaster tematyczny jeszcze nie istnieje, wysyłane jest żądanie `POST` do API w celu jego utworzenia.
    - Następnie wysyłane jest żądanie `POST` do API w celu zapisania konceptu X w bazie danych jako nowy artykuł powiązany z klastrem.
6.  **Edycja Artykułu**: Użytkownik klika w wygenerowany koncept na liście, przechodząc do edytora (`/articles/[articleId]`).
7.  **Praca w Edytorze**:
    - Klika "Generuj treść", aby AI napisało cały artykuł.
    - Ręcznie edytuje tekst, a zmiany są automatycznie zapisywane.
    - Uruchamia audyt SEO. Wyniki pojawiają się w panelu po lewej stronie.
8.  **Publikacja**: Gdy artykuł jest gotowy, użytkownik klika "Przenieś do Sanity".
9.  **Zakończenie pracy**: Użytkownik może wrócić do pulpitu nawigacyjnego (`/`), przejść do listy klastrów (`/clusters`) lub wylogować się.

## 4. Układ i struktura nawigacji

- **Główny układ**: Aplikacja wykorzystuje dwa główne układy Astro:
  - `PublicLayout.astro`: Dla stron publicznych.
  - `DashboardLayout.astro`: Dla stron chronionych, który zawiera stały pasek nawigacyjny i logikę mockowania sesji użytkownika dla MVP.

## 5. Kluczowe komponenty

Poniżej znajduje się lista kluczowych, reużywalnych komponentów, które będą stanowić fundament interfejsu użytkownika:

- **`FormField`**: Komponent-wrapper integrujący komponenty `Input`, `Label`, `FormMessage` z `shadcn/ui` oraz logikę `react-hook-form`.
- **`Modal` i `useModal`**: Generyczny komponent modala (`Dialog` z `shadcn/ui`) oraz hook do zarządzania jego stanem.
- **`CrudList`**: Reużywalny komponent do wyświetlania listy elementów (np. audytów, preferencji AI) z wbudowanymi akcjami "Edytuj" i "Usuń".
- **`Toast`**: Komponent do wyświetlania krótkich powiadomień (sukces, błąd, informacja).
- **`Spinner` / `Skeleton`**: Komponenty do sygnalizacji stanu ładowania.
- **Custom Hooks API (`useProfile`, `useArticles`, etc.)**: Hooki stanowiące warstwę abstrakcji na `fetch`, zarządzające stanem `isLoading`, `error`, `data`.
- **`TopicGenerationContext`**: Kontekst Reacta dedykowany do zarządzania stanem wieloetapowego procesu tworzenia tematu i podtematów, przechowujący dane w kliencie przed ich utrwaleniem w bazie.
