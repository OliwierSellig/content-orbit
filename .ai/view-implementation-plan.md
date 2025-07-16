# API Endpoint Implementation Plan: Get User Profile

## 1. Przegląd punktu końcowego

Celem tego punktu końcowego jest pobranie profilu i powiązanych z nim ustawień dla aktualnie uwierzytelnionego użytkownika. Endpoint ten jest kluczowy dla personalizacji interfejsu użytkownika i dostosowania działania aplikacji do preferencji użytkownika. Jest to operacja tylko do odczytu.

## 2. Szczegóły żądania

- **Metoda HTTP**: `GET`
- **Struktura URL**: `/api/profile`
- **Parametry**:
  - **Wymagane**: Brak. Identyfikator użytkownika jest pobierany z kontekstu sesji po stronie serwera.
  - **Opcjonalne**: Brak.
- **Request Body**: Brak.

## 3. Wykorzystywane typy

- `ProfileDto`: Ten typ DTO (Data Transfer Object) z `src/types.ts` będzie używany do strukturyzowania i typowania danych odpowiedzi.

```typescript
// src/types.ts
export type ProfileDto = Tables<"profiles">;
```

## 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu (`200 OK`)**: Zwraca obiekt JSON zawierający dane profilu użytkownika.
  ```json
  {
    "id": "uuid",
    "created_at": "timestampz",
    "updated_at": "timestampz",
    "default_topics_count": 5,
    "default_subtopics_count": 10
  }
  ```
- **Odpowiedzi błędu**:
  - `401 Unauthorized`: Gdy żądanie jest wykonywane przez nieuwierzytelnionego użytkownika.
  - `404 Not Found`: Gdy profil dla uwierzytelnionego użytkownika nie został znaleziony w bazie danych.
  - `500 Internal Server Error`: W przypadku nieoczekiwanego błędu po stronie serwera.

## 5. Przepływ danych

1.  Żądanie `GET` trafia do endpointu `/api/profile`.
2.  Middleware Astro (`src/middleware/index.ts`) przechwytuje żądanie, aby zweryfikować, czy użytkownik ma aktywną, prawidłową sesję. Jeśli nie, middleware odrzuca żądanie z kodem `401 Unauthorized`.
3.  Jeśli sesja jest prawidłowa, żądanie jest przekazywane do handlera w `src/pages/api/profile.ts`.
4.  Handler wywołuje metodę w `ProfileService`, przekazując klienta Supabase (`Astro.locals.supabase`) i ID użytkownika (`Astro.locals.user.id`).
5.  `ProfileService` wykonuje zapytanie `SELECT` do tabeli `public.profiles` w bazie danych Supabase, używając ID użytkownika.
6.  Polityka RLS (Row-Level Security) na tabeli `profiles` automatycznie filtruje wyniki, zapewniając, że zwrócony zostanie tylko profil należący do uwierzytelnionego użytkownika.
7.  Jeśli profil zostanie znaleziony, dane są zwracane do handlera, który odsyła je do klienta z kodem `200 OK`.
8.  Jeśli zapytanie nie zwróci żadnych wyników, serwis zwraca `null`, a handler odpowiada kodem `404 Not Found`.
9.  W przypadku błędu bazy danych, serwis zgłasza błąd, który jest przechwytywany przez handler i zwracany jako `500 Internal Server Error`.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Dostęp do tego punktu końcowego musi być bezwzględnie chroniony i dostępny tylko dla zalogowanych użytkowników. Zostanie to zapewnione przez middleware Astro, który będzie weryfikować token sesji.
- **Autoryzacja**: Użytkownik może pobrać tylko i wyłącznie swój własny profil. Jest to gwarantowane na poziomie bazy danych przez politykę RLS: `CREATE POLICY "Users can view their own profile." ON public.profiles FOR SELECT USING (auth.uid() = id);`. Eliminuje to ryzyko przypadkowego lub celowego wycieku danych innych użytkowników.
- **Walidacja danych**: Nie ma danych wejściowych od klienta, więc walidacja za pomocą Zod nie jest konieczna.

## 7. Rozważania dotyczące wydajności

- Zapytanie do bazy danych jest bardzo proste i operuje na kluczu głównym (`id`), który jest automatycznie indeksowany. Oczekuje się, że operacja będzie bardzo szybka i nie będzie stanowić wąskiego gardła wydajnościowego.
- Wielkość odpowiedzi jest mała, co minimalizuje opóźnienia sieciowe.

## 8. Etapy wdrożenia

1.  **Utworzenie pliku serwisu**: Stwórz nowy plik `src/lib/services/profile.service.ts`.
2.  **Implementacja logiki serwisu**: W `ProfileService` zaimplementuj metodę `getProfile(supabase: SupabaseClient, userId: string)`, która będzie zawierała logikę zapytania do tabeli `profiles`. Metoda powinna obsługiwać przypadki sukcesu, braku danych oraz błędów bazy danych.
3.  **Utworzenie pliku endpointu**: Stwórz nowy plik `src/pages/api/profile.ts`.
4.  **Ustawienie renderowania dynamicznego**: W pliku endpointu dodaj `export const prerender = false;`, aby zapewnić, że jest on renderowany dynamicznie po stronie serwera dla każdego żądania.
5.  **Implementacja handlera GET**: W pliku endpointu zdefiniuj handler `GET`, który:
    - Pobiera klienta Supabase i dane użytkownika z `Astro.locals`.
    - Sprawdza, czy użytkownik jest dostępny w kontekście. Jeśli nie, zwraca `401`.
    - Wywołuje metodę `getProfile` z serwisu.
    - Na podstawie wyniku z serwisu zwraca odpowiednią odpowiedź HTTP (`200`, `404` lub `500`).
6.  **Logowanie błędów**: W bloku `catch` handlera dodaj mechanizm logowania nieoczekiwanych błędów po stronie serwera (np. `console.error`).
7.  **Testy (opcjonalnie, zgodnie z fazą 3 strategii)**: Dodaj test integracyjny dla tego endpointu, który weryfikuje wszystkie ścieżki (sukces, 401, 404) przy użyciu testowej bazy danych.
