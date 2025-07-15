# Schemat Bazy Danych PostgreSQL dla Content Orbit

## 1. Definicje Tabel i Typów

### Typy niestandardowe

```sql
-- Definicja typu ENUM dla statusu artykułu
CREATE TYPE public.article_status AS ENUM ('concept', 'in_progress', 'moved');
```

### Tabele

#### `profiles`

Przechowuje publiczne profile użytkowników i globalne ustawienia aplikacji. Relacja 1-do-1 z `auth.users`.

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  default_topics_count INTEGER NOT NULL DEFAULT 5,
  default_subtopics_count INTEGER NOT NULL DEFAULT 10
);
COMMENT ON TABLE public.profiles IS 'Stores user profiles and application-specific settings.';
```

#### `knowledge_bases`

Przechowuje specyficzną dla użytkownika bazę wiedzy o firmie.

```sql
CREATE TABLE public.knowledge_bases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  about_us TEXT,
  team TEXT,
  offer TEXT,
  CONSTRAINT knowledge_bases_user_id_key UNIQUE (user_id)
);
COMMENT ON TABLE public.knowledge_bases IS 'Stores user-specific knowledge base content about their company.';
```

#### `ai_preferences`

Przechowuje globalne preferencje AI zdefiniowane przez użytkownika.

```sql
CREATE TABLE public.ai_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  title TEXT NOT NULL,
  prompt TEXT NOT NULL
);
COMMENT ON TABLE public.ai_preferences IS 'Stores user-defined global AI preferences/prompts.';
```

#### `custom_audits`

Przechowuje niestandardowe audyty (zapisane prompty) zdefiniowane przez użytkownika.

```sql
CREATE TABLE public.custom_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  title TEXT NOT NULL,
  prompt TEXT NOT NULL
);
COMMENT ON TABLE public.custom_audits IS 'Stores user-defined custom audits (saved prompts for content analysis).';
```

#### `topic_clusters`

Przechowuje główne tematy klastrów kontentowych.

```sql
CREATE TABLE public.topic_clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  name TEXT NOT NULL
);
COMMENT ON TABLE public.topic_clusters IS 'Represents a content cluster, grouping multiple articles under one main topic.';
```

#### `articles`

Główna tabela przechowująca podtematy, koncepty i artykuły.

```sql
CREATE TABLE public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_cluster_id UUID NOT NULL REFERENCES public.topic_clusters(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status public.article_status NOT NULL DEFAULT 'concept'::public.article_status,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT NOT NULL,
  content TEXT,
  seo_title TEXT NOT NULL,
  seo_description TEXT NOT NULL,
  sanity_id TEXT,
  moved_to_sanity_at TIMESTAMPTZ
);
COMMENT ON TABLE public.articles IS 'Stores articles, from concept to the final version, including all metadata.';
```

---

## 2. Relacje między Tabelami

- **`auth.users` (1) --- (1) `profiles`**: Każdy użytkownik w `auth.users` ma dokładnie jeden profil w `profiles`. Klucz główny `profiles.id` jest jednocześnie kluczem obcym do `auth.users.id`.
- **`profiles` (1) --- (1) `knowledge_bases`**: Każdy profil ma dokładnie jedną bazę wiedzy. Wymuszone przez unikalny klucz obcy `knowledge_bases.user_id`.
- **`profiles` (1) --- (N) `ai_preferences`**: Każdy profil może mieć wiele preferencji AI.
- **`profiles` (1) --- (N) `custom_audits`**: Każdy profil może mieć wiele niestandardowych audytów.
- **`profiles` (1) --- (N) `topic_clusters`**: Każdy profil może mieć wiele klastrów tematycznych.
- **`topic_clusters` (1) --- (N) `articles`**: Każdy klaster może zawierać wiele artykułów. Usunięcie klastra powoduje kaskadowe usunięcie wszystkich powiązanych z nim artykułów (`ON DELETE CASCADE`).

---

## 3. Indeksy

Indeksy na kluczach głównych są tworzone automatycznie. Poniższe indeksy należy utworzyć w celu optymalizacji zapytań.

```sql
-- Indeksy na kluczach obcych dla szybszych złączeń
CREATE INDEX ON public.knowledge_bases (user_id);
CREATE INDEX ON public.ai_preferences (user_id);
CREATE INDEX ON public.custom_audits (user_id);
CREATE INDEX ON public.topic_clusters (user_id);
CREATE INDEX ON public.articles (topic_cluster_id);

-- Złożony indeks unikalny, aby zapewnić, że `slug` jest unikalny w obrębie danego klastra
CREATE UNIQUE INDEX articles_topic_cluster_id_slug_idx ON public.articles (topic_cluster_id, slug);
```

---

## 4. Zasady Bezpieczeństwa (Row-Level Security)

RLS zostanie włączone na wszystkich tabelach, aby zapewnić ścisłą izolację danych między użytkownikami.

```sql
-- Włączenie RLS dla wszystkich tabel
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_bases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- Polityki dla tabeli `profiles`
CREATE POLICY "Users can view their own profile." ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Polityki dla tabeli `knowledge_bases`
CREATE POLICY "Users can manage their own knowledge base." ON public.knowledge_bases FOR ALL USING (auth.uid() = user_id);

-- Polityki dla tabeli `ai_preferences`
CREATE POLICY "Users can manage their own AI preferences." ON public.ai_preferences FOR ALL USING (auth.uid() = user_id);

-- Polityki dla tabeli `custom_audits`
CREATE POLICY "Users can manage their own custom audits." ON public.custom_audits FOR ALL USING (auth.uid() = user_id);

-- Polityki dla tabeli `topic_clusters`
CREATE POLICY "Users can manage their own topic clusters." ON public.topic_clusters FOR ALL USING (auth.uid() = user_id);

-- Polityki dla tabeli `articles`
CREATE POLICY "Users can manage articles within their own clusters." ON public.articles FOR ALL
  USING (
    (
      auth.uid() = (
        SELECT user_id
        FROM public.topic_clusters
        WHERE id = articles.topic_cluster_id
      )
    )
  );
```

---

## 5. Automatyzacja (Funkcje i Triggery)

### Automatyczna aktualizacja znacznika `updated_at`

```sql
-- Funkcja do aktualizacji kolumny `updated_at`
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggery dla każdej tabeli
CREATE TRIGGER on_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER on_knowledge_bases_updated BEFORE UPDATE ON public.knowledge_bases FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER on_ai_preferences_updated BEFORE UPDATE ON public.ai_preferences FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER on_custom_audits_updated BEFORE UPDATE ON public.custom_audits FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER on_topic_clusters_updated BEFORE UPDATE ON public.topic_clusters FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER on_articles_updated BEFORE UPDATE ON public.articles FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
```

### Automatyczne tworzenie profilu i bazy wiedzy dla nowego użytkownika

```sql
-- Funkcja, która tworzy profil i bazę wiedzy dla nowego użytkownika
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  profile_id uuid;
BEGIN
  -- Wstawienie nowego profilu
  INSERT INTO public.profiles (id) VALUES (NEW.id) RETURNING id INTO profile_id;

  -- Wstawienie pustej bazy wiedzy dla nowego profilu
  INSERT INTO public.knowledge_bases (user_id) VALUES (profile_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger, który uruchamia funkcję po dodaniu nowego użytkownika
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

---

## 6. Dodatkowe uwagi

1.  **Status zaimportowanych artykułów**: W nawiązaniu do nierozstrzygniętej kwestii, zaimportowane artykuły, które już istnieją w docelowym CMS (Sanity), powinny otrzymać status `'moved'`. Jeśli są to nowe artykuły, które mają dopiero zostać przeniesione, powinny przejść przez standardowy cykl życia, zaczynając od statusu `'concept'` lub `'in_progress'`.
2.  **`articles.title`**: Dodano kolumnę `title` do przechowywania formatowanego tytułu artykułu (np. z Markdown). Kolumna `headers` została usunięta, ponieważ nagłówki będą częścią pola `content`. `name` pozostaje jako prosty, wewnętrzny identyfikator tekstowy.
3.  **Inicjalizacja danych**: Poza automatycznym tworzeniem profili, proces inicjalizacji danych dla istniejących użytkowników (np. jednorazowy import z bloga) będzie musiał zostać obsłużony przez osobny skrypt, który wypełni tabele `topic_clusters` i `articles`.
4.  **Klucze główne**: Wszystkie tabele używają `UUID` jako kluczy głównych, co jest dobrą praktyką w systemach rozproszonych i zapobiega wyciekowi informacji o liczbie rekordów.
