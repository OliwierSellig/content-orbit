# Plan aktualizacji endpointu: GET /api/topic-clusters

## 1. Cel

Celem jest modyfikacja istniejącego endpointu `GET /api/topic-clusters` tak, aby opcjonalnie zwracał on dla każdego klastra zagnieżdżoną listę przypisanych do niego artykułów. Ta zmiana jest kluczowa dla optymalizacji widoku "Zarządzanie Klastrami" na frontendzie, ponieważ pozwoli na pobranie wszystkich potrzebnych danych w jednym zapytaniu i uniknięcie problemu N+1 zapytań.

## 2. Plik do modyfikacji

- **Lokalizacja**: `src/pages/api/topic-clusters/index.ts`

## 3. Szczegóły implementacji

### Parametry zapytania

Endpoint będzie obsługiwał następujące parametry zapytania (query parameters):

- **`includeArticles`**: `true` - włącza dołączanie artykułów do każdego klastra
- **`search`**: `string` - filtruje klastry po nazwie oraz po nazwach zawartych w nich artykułów
- **Przykład użycia**: `GET /api/topic-clusters?includeArticles=true&search=marketing`

#### Parametr `includeArticles`

Jeśli parametr `includeArticles` jest obecny i ma wartość `true`, endpoint powinien zwrócić dane w nowym, zagnieżdżonym formacie. W przeciwnym razie, powinien zachować swoje dotychczasowe działanie, aby nie naruszyć innych części aplikacji, które mogą z niego korzystać.

#### Parametr `search`

Jeśli parametr `search` jest obecny, endpoint powinien filtrować wyniki w następujący sposób:

- Wyszukiwanie w nazwach klastrów (case-insensitive, ILIKE)
- Jeśli `includeArticles=true`, również wyszukiwanie w nazwach artykułów przypisanych do klastrów
- Zwracane są tylko te klastry, które pasują do kryteriów wyszukiwania

### Modyfikacja zapytania do bazy danych

Należy zmodyfikować zapytanie do Supabase, aby pobierało powiązane dane z tabeli `articles` oraz obsługiwało filtrowanie. Supabase umożliwia to w bardzo elegancki sposób poprzez zagnieżdżone `select` i filtry.

**Zapytanie dotychczasowe (lub jego odpowiednik):**

```typescript
const { data, error } = await supabase.from("topic_clusters").select("*").eq("user_id", userId);
```

**Zapytanie docelowe (z dołączaniem artykułów i wyszukiwaniem):**

```typescript
let query = supabase
  .from("topic_clusters")
  .select(includeArticles ? "*, articles(*)" : "*")
  .eq("user_id", userId);

// Dodaj filtrowanie jeśli parametr search jest obecny
if (searchTerm) {
  if (includeArticles) {
    // Wyszukiwanie w klastrach OR w artykułach
    query = query.or(`name.ilike.%${searchTerm}%,articles.name.ilike.%${searchTerm}%`);
  } else {
    // Wyszukiwanie tylko w klastrach
    query = query.ilike("name", `%${searchTerm}%`);
  }
}

const { data, error } = await query.order("name");
```

**Ważne**: Powyższy zapis zadziała poprawnie tylko wtedy, gdy między tabelami `topic_clusters` a `articles` istnieje poprawnie zdefiniowana relacja (foreign key). Należy się upewnić, że `articles.topic_cluster_id` jest kluczem obcym wskazującym na `topic_clusters.id`.

### Struktura odpowiedzi

Gdy `includeArticles=true`, odpowiedź z API powinna być tablicą obiektów o strukturze zgodnej z typem `TopicClusterWithArticlesDto`.

```typescript
// Przykładowa odpowiedź JSON
[
  {
    id: "uuid-klastra-1",
    name: "Marketing w Social Media",
    created_at: "...",
    articles: [
      {
        id: "uuid-artykulu-1",
        name: "Jak tworzyć reklamy na Facebooku",
        slug: "jak-tworzyc-reklamy-na-facebooku",
        status: "koncept",
        topic_cluster_id: "uuid-klastra-1",
        created_at: "...",
        updated_at: "...",
      },
      // ... inne artykuły
    ],
  },
  // ... inne klastry
];
```

## 4. Kroki implementacji

1.  **Otwórz plik**: Przejdź do pliku `src/pages/api/topic-clusters/index.ts`.
2.  **Znajdź obsługę GET**: Zlokalizuj blok kodu obsługujący metodę `GET` w `Astro.request`.
3.  **Odczytaj parametry**: Pobierz wartości parametrów `includeArticles` i `search` z obiektu `Astro.url.searchParams`.
    ```typescript
    const url = new URL(Astro.request.url);
    const includeArticles = url.searchParams.get("includeArticles") === "true";
    const searchTerm = url.searchParams.get("search");
    ```
4.  **Zaimplementuj logikę warunkową**:
    - Przekaż oba parametry (`includeArticles` i `searchTerm`) do funkcji `getTopicClusters` w serwisie.
    - Zmodyfikuj funkcję `getTopicClusters` w `topic-cluster.service.ts`, aby przyjmowała te parametry i implementowała odpowiednie zapytanie do Supabase.
5.  **Walidacja i obsługa błędów**: Upewnij się, że obsługa błędów z Supabase (`error`) jest poprawnie zaimplementowana dla obu ścieżek logicznych.
6.  **Zwróć odpowiedź**: Zwróć dane (`data`) z odpowiednim statusem (200 OK) lub błąd (np. 500 Internal Server Error).

## 5. Testowanie

Po wprowadzeniu zmian, należy ręcznie przetestować endpoint, aby zweryfikować jego działanie:

1.  Wywołaj `GET /api/topic-clusters` bez parametrów i sprawdź, czy odpowiedź ma stary format.
2.  Wywołaj `GET /api/topic-clusters?includeArticles=true` i sprawdź, czy odpowiedź zawiera klastry z zagnieżdżonymi tablicami artykułów.
3.  Sprawdź, czy dla klastra, który nie ma żadnych artykułów, zwracana jest pusta tablica `articles: []`.
4.  Przetestuj filtrowanie: `GET /api/topic-clusters?search=marketing` - powinny zostać zwrócone tylko klastry z nazwami zawierającymi "marketing".
5.  Przetestuj kombinację: `GET /api/topic-clusters?includeArticles=true&search=marketing` - powinny zostać zwrócone klastry i artykuły pasujące do wyszukiwania.
