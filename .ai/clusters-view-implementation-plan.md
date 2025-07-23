# Plan implementacji widoku: Zarządzanie Klastrami

## 1. Przegląd

Widok "Zarządzanie Klastrami" jest centralnym miejscem do przeglądania i zarządzania klastrami tematycznymi oraz przypisanymi do nich artykułami. Umożliwia użytkownikowi wgląd w strukturę treści, szybki dostęp do edycji poszczególnych artykułów oraz zarządzanie cyklem życia klastrów i pojedynczych artykułów, w tym ich usuwanie. Implementacja musi być zgodna z historyjkami użytkownika US-016 i US-017, kładąc szczególny nacisk na bezpieczeństwo operacji usuwania danych.

## 2. Routing widoku

- **Plik strony**: `src/pages/clusters.astro`
- **Ścieżka URL**: `/clusters`
- **Layout nadrzędny**: `src/layouts/DashboardLayout.astro`

Strona będzie renderować komponent React `ClustersView.tsx`, który będzie stanowił główny punkt wejścia dla całej logiki widoku.

## 3. Struktura komponentów

Komponenty zostaną zbudowane w oparciu o bibliotekę Shadcn/ui oraz stylistykę spójną z istniejącymi widokami, takimi jak `OptionsView` i `DashboardView`.

```
- ClustersView.tsx (komponent-kontener widoku)
  - h1 ("Zarządzanie Klastrami")
  - SearchInput.tsx (pole wyszukiwania)
  - (Stan ładowania / błędu / braku wyników dla listy klastrów)
  - ClustersGrid.tsx
    - ClusterCard.tsx (mapowany z listy klastrów)
      - CardHeader (nazwa klastra, DeleteClusterButton)
      - CardContent
        - ArticlesList.tsx
          - ArticleListItem.tsx (mapowany z listy artykułów)
            - Link do artykułu
            - DeleteArticleButton.tsx
  - Pagination.tsx (komponent paginacji)
  - DeleteClusterModal.tsx (renderowany warunkowo)
    - Dialog (Shadcn)
      - ... (elementy nagłówka i opisu modalu)
      - Input (pole do wpisania nazwy klastra)
      - ... (elementy stopki z przyciskami Anuluj i Usuń)
  - DeleteArticleModal.tsx (renderowany warunkowo)
    - Dialog (Shadcn)
      - ... (elementy nagłówka i opisu modalu "Czy na pewno chcesz usunąć ten artykuł?")
      - ... (elementy stopki z przyciskami Anuluj i Usuń)
```

## 4. Szczegóły komponentów

### `ClustersView.tsx`

- **Opis**: Główny komponent widoku. Wykorzystuje hook `useClusters` do pobrania danych oraz funkcji obsługi, a następnie przekazuje je do odpowiednich komponentów podrzędnych (`ClustersGrid`, `SearchInput`, `Pagination`, modale).
- **Główne elementy**: Nagłówek `h1`, `SearchInput`, `ClustersGrid`, `Pagination`, `DeleteClusterModal` i `DeleteArticleModal`.
- **Obsługiwane interakcje**: Komponent deleguje obsługę interakcji do funkcji i komponentów potomnych.
- **Typy**: Brak (logika typów przeniesiona do hooka).
- **Propsy**: Brak.

### `SearchInput.tsx` (Nowy lub generyczny komponent)

- **Opis**: Komponent pola tekstowego do filtrowania listy klastrów.
- **Propsy**: `value: string`, `onChange: (newValue: string) => void`, `placeholder?: string`.

### `ClustersGrid.tsx`

- **Opis**: Renderuje siatkę klastrów (np. w 2 lub 3 kolumnach). Otrzymuje odfiltrowaną i spaginowaną listę klastrów i mapuje ją do komponentów `ClusterCard`.
- **Główne elementy**: Kontener CSS Grid.
- **Propsy**:
  - `clusters: TopicClusterWithArticlesDto[]`
  - `onDeleteClusterRequest: (cluster: TopicClusterDto) => void`
  - `onDeleteArticleRequest: (article: ArticleListItemDto, clusterId: string) => void`

### `ClusterCard.tsx`

- **Opis**: Reprezentuje pojedynczy klaster w formie karty. Wyświetla jego nazwę oraz listę przypisanych artykułów.
- **Główne elementy**: Komponent `Card` z Shadcn/ui, zawierający `CardHeader`, `CardTitle`, `CardContent`.
- **Propsy**:
  - `cluster: TopicClusterWithArticlesDto`
  - `onDeleteClusterRequest: (cluster: TopicClusterDto) => void`
  - `onDeleteArticleRequest: (article: ArticleListItemDto, clusterId: string) => void`

### `ArticlesList.tsx`

- **Opis**: Wyświetla listę artykułów wewnątrz karty klastra.
- **Propsy**:
  - `articles: ArticleListItemDto[]`
  - `onDeleteRequest: (article: ArticleListItemDto) => void`

### `ArticleListItem.tsx`

- **Opis**: Reprezentuje pojedynczy artykuł na liście wewnątrz karty.
- **Propsy**:
  - `article: ArticleListItemDto`
  - `onDeleteRequest: (article: ArticleListItemDto) => void`

### `Pagination.tsx`

- **Opis**: Komponent do nawigacji między stronami listy klastrów.
- **Propsy**: `currentPage: number`, `totalPages: number`, `onPageChange: (page: number) => void`.

### `DeleteArticleButton.tsx`

- **Opis**: Prosty przycisk z ikoną kosza, który wywołuje funkcję zwrotną w celu zainicjowania procesu usuwania artykułu.
- **Główne elementy**: Komponent `Button` z `shadcn/ui` (wariant `ghost` lub `icon`).
- **Obsługiwane interakcje**: Wywołuje `onClick`.
- **Propsy**: `onClick: () => void`.

### `DeleteClusterButton.tsx`

- **Opis**: Prosty przycisk z ikoną kosza, który wywołuje funkcję zwrotną w celu zainicjowania procesu usuwania klastra.
- **Główne elementy**: Komponent `Button` z `shadcn/ui` (wariant `ghost` lub `icon`).
- **Obsługiwane interakcje**: Wywołuje `onClick`.
- **Propsy**: `onClick: () => void`.

### `DeleteClusterModal.tsx`

- **Opis**: Modal potwierdzający usunięcie klastra. Zawiera pole tekstowe, które musi być poprawnie wypełnione, aby odblokować przycisk potwierdzenia.
- **Główne elementy**: Komponent `Dialog` z `shadcn/ui`, `Input`, `Button`.
- **Obsługiwane interakcje**: Wpisywanie tekstu w polu `Input`. Kliknięcie przycisku "Usuń" lub "Anuluj".
- **Warunki walidacji**: Przycisk "Usuń" jest nieaktywny (`disabled`), dopóki tekst wprowadzony w polu `Input` nie jest identyczny z nazwą usuwanego klastra. Porównanie powinno być wrażliwe na wielkość liter.
- **Typy**: `TopicClusterDto`.
- **Propsy**:
  - `isOpen: boolean` - Kontroluje widoczność modalu.
  - `cluster: TopicClusterDto | null` - Dane klastra do usunięcia.
  - `onConfirm: () => void` - Funkcja zwrotna wywoływana po potwierdzeniu usunięcia.
  - `onCancel: () => void` - Funkcja zwrotna wywoływana po zamknięciu modalu.

### `DeleteArticleModal.tsx`

- **Opis**: Prosty modal potwierdzający usunięcie artykułu. Nie wymaga wpisywania nazwy.
- **Główne elementy**: Komponent `Dialog` z `shadcn/ui`, tekst z pytaniem o potwierdzenie, przyciski "Anuluj" i "Usuń".
- **Warunki walidacji**: Brak. Przycisk "Usuń" jest zawsze aktywny, gdy modal jest otwarty.
- **Typy**: `ArticleListItemDto`.
- **Propsy**:
  - `isOpen: boolean` - Kontroluje widoczność modalu.
  - `article: ArticleListItemDto | null` - Dane artykułu do usunięcia.
  - `onConfirm: () => void` - Funkcja zwrotna wywoływana po potwierdzeniu usunięcia.
  - `onCancel: () => void` - Funkcja zwrotna wywoływana po zamknięciu modalu.

## 5. Typy

Aby umożliwić efektywne wyszukiwanie po stronie klienta, konieczna jest zmiana strategii pobierania danych. Wprowadzamy nowy, zagnieżdżony typ DTO.

- **`TopicClusterWithArticlesDto`**: Reprezentuje klaster wraz z pełną listą jego artykułów.

  ```typescript
  // src/types.ts
  export type TopicClusterWithArticlesDto = TopicClusterDto & {
    articles: ArticleListItemDto[];
  };
  ```

- **`TopicClusterDto`**: Bez zmian.
- **`ArticleListItemDto`**: Bez zmian.

## 6. Zarządzanie stanem (Hook `useClusters`)

Logika stanu dla widoku zostanie wyekstrahowana do dedykowanego hooka `src/components/hooks/useClusters.ts`, analogicznie do istniejących hooków, takich jak `useOptionsData`. Takie podejście separuje logikę biznesową od warstwy prezentacji, co poprawia czytelność i utrzymanie kodu.

**Hook `useClusters` będzie odpowiedzialny za:**

- Pobieranie wszystkich klastrów z artykułami przy pierwszym renderowaniu.
- Przechowywanie kompletnej listy danych (`allData`) oraz stanów `isLoading` i `error`.
- Zarządzanie stanem wyszukiwania (`searchTerm`) i paginacji (`currentPage`).
- Filtrowanie i paginację danych, zwracając gotową do wyświetlenia listę (`displayClusters`).
- Zarządzanie stanami modali usuwania (`clusterToDelete`, `articleToDelete`, `isDeleteClusterModalOpen`, `isDeleteArticleModalOpen`).
- Udostępnianie funkcji obsługi:
  - `handleSearchChange(term: string)`
  - `handlePageChange(page: number)`
  - `requestClusterDelete(cluster: TopicClusterDto)`
  - `confirmClusterDelete()`
  - `requestArticleDelete(article: ArticleListItemDto, clusterId: string)`
  - `confirmArticleDelete()`
  - `cancelDelete()`

**Komponent `ClustersView.tsx`**: Będzie konsumował hook `useClusters` i przekazywał zwrócone wartości i funkcje jako propsy do komponentów UI, pozostając "chudym" komponentem.

## 7. Integracja API

Strategia integracji z API ulega zmianie w celu optymalizacji pobierania danych. Cała komunikacja z API będzie hermetyzowana wewnątrz hooka `useClusters`.

- **Pobieranie danych (klastry z artykułami)**:
  - **Akcja**: Montowanie komponentu `ClustersView`.
  - **Endpoint**: `GET /api/topic-clusters?includeArticles=true` (propozycja modyfikacji API)
  - **Opis**: Endpoint powinien zwracać pełną listę klastrów tematycznych należących do użytkownika. Każdy obiekt klastra powinien zawierać zagnieżdżoną tablicę `articles` ze wszystkimi przypisanymi do niego artykułami. Pozwoli to uniknąć problemu N+1 zapytań na frontendzie.
  - **Typ odpowiedzi**: `TopicClusterWithArticlesDto[]`.

- **Usuwanie klastra**:
  - **Akcja**: Potwierdzenie usunięcia w `DeleteClusterModal`.
  - **Endpoint**: `DELETE /api/topic-clusters/{id}`
  - **Typ odpowiedzi**: `204 No Content`.

- **Usuwanie artykułu**:
  - **Akcja**: Potwierdzenie usunięcia w `DeleteArticleModal`.
  - **Endpoint**: `DELETE /api/articles/{id}`
  - **Typ odpowiedzi**: `204 No Content`.

## 8. Interakcje użytkownika

- **Przeglądanie**: Użytkownik widzi spaginowaną siatkę kart z klastrami. Wszystkie artykuły w ramach widocznych klastrów są od razu widoczne.
- **Wyszukiwanie**: Użytkownik wpisuje frazę w polu wyszukiwania. Lista klastrów na siatce jest dynamicznie filtrowana. Jeśli fraza pasuje do nazwy klastra lub nazwy któregokolwiek z jego artykułów, dany klaster jest wyświetlany.
- **Paginacja**: Użytkownik używa przycisków paginacji, aby przełączać się między stronami listy klastrów.
- **Inne interakcje** (nawigacja do edytora, inicjowanie i potwierdzanie usunięcia) pozostają takie same jak w pierwotnym planie.

## 9. Warunki i walidacja

- **Wyszukiwanie**: Logika filtrowania w `ClustersView.tsx` powinna być case-insensitive i sprawdzać `searchTerm` zarówno w `cluster.name`, jak i w `article.name` dla każdego artykułu w klastrze.
- **Usuwanie klastra**: Walidacja w `DeleteClusterModal` (wymóg wpisania nazwy) pozostaje bez zmian.

## 10. Obsługa błędów

- **Błąd pobierania danych**: Hook `useClusters` zwróci stan błędu, który `ClustersView` wykorzysta do wyświetlenia odpowiedniego komunikatu.
- **Błędy usuwania**: Obsługa pozostaje bez zmian (powiadomienia toast), a jej implementacja znajdzie się wewnątrz hooka `useClusters`.

## 11. Kroki implementacji

1.  **Backend**: Zmodyfikować endpoint `GET /api/topic-clusters`, aby opcjonalnie dołączał zagnieżdżoną listę artykułów (np. przez query param `?includeArticles=true`).
2.  Utworzyć plik `src/pages/clusters.astro` i osadzić w nim `DashboardLayout`.
3.  Stworzyć hook `src/components/hooks/useClusters.ts`, który będzie hermetyzował całą logikę zarządzania stanem: pobieranie danych, wyszukiwanie, paginację i obsługę usuwania.
4.  Stworzyć pusty komponent `src/components/views/ClustersView.tsx`, który będzie wykorzystywał hook `useClusters` i renderował podstawowy szkielet widoku. Umieścić go na stronie `clusters.astro`.
5.  Zintegrować `ClustersView.tsx` z komponentem `SearchInput`, podłączając go do stanu i funkcji z hooka `useClusters`.
6.  Stworzyć komponent `src/components/clusters/ClustersGrid.tsx`, który przyjmuje przefiltrowaną i spaginowaną listę klastrów i renderuje je w siatce.
7.  Stworzyć komponent `src/components/clusters/ClusterCard.tsx` jako zamiennik `ClusterListItem.tsx`, używając komponentu `Card` z Shadcn.
8.  Wewnątrz `ClusterCard.tsx` umieścić komponenty `ArticlesList.tsx` i `ArticleListItem.tsx` do wyświetlania listy artykułów.
9.  Stworzyć komponenty `DeleteArticleButton.tsx` oraz `DeleteClusterButton.tsx`.
10. Stworzyć komponent `DeleteArticleModal.tsx` (prosty) i `DeleteClusterModal.tsx` (z walidacją) i podłączyć ich stan (widoczność, dane) oraz akcje do hooka `useClusters`.
11. Stworzyć generyczny komponent `Pagination.tsx` i zintegrować go z `ClustersView.tsx`, podłączając do stanu i funkcji z hooka `useClusters`.
12. Zaimplementować w hooku `useClusters` logikę aktualizacji UI po usunięciu:
    - Po usunięciu klastra, odfiltrować go z głównego stanu `allData`.
    - Po usunięciu artykułu, zaktualizować obiekt klastra w stanie `allData`, usuwając z niego dany artykuł. Obie operacje powinny odbywać się bez przeładowania strony.
13. Dodać w hooku `useClusters` obsługę powiadomień toast dla operacji usuwania (sukces/błąd).
14. Dodać link do nowej podstrony w nawigacji (`src/components/layout/DesktopNav.tsx` i `MobileNav.tsx`).
15. Przeprowadzić testy manualne, weryfikując wyszukiwanie, paginację, usuwanie i obsługę błędów.
