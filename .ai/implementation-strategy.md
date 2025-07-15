# Strategia Wdrożenia MVP - Content Orbit

## 1. Wprowadzenie

Niniejszy dokument przedstawia zrewidowaną, wysokopoziomową strategię wdrożenia MVP aplikacji "Content Orbit". Nowe podejście opiera się na metodyce **"backend-first"**, co oznacza, że priorytetem jest stworzenie solidnych fundamentów w postaci bazy danych i API, zanim rozpoczniemy prace nad interfejsem użytkownika. Plan dzieli proces na siedem głównych, sekwencyjnych faz.

---

## Faza 1: Personalizacja Projektu i Konfiguracja Środowisk [COMPLETED]

**Cel:** Dostosowanie istniejącego repozytorium startowego Astro i przygotowanie fundamentów pod dalszy rozwój, włączając w to dedykowane, odizolowane środowiska.

**Kroki:**

1.  **Personalizacja Repozytorium:**
    - Przegląd i dostosowanie istniejącej konfiguracji: `astro.config.mjs`, `package.json`.
    - Usunięcie zbędnych komponentów startowych (np. `Welcome.astro`).
    - Aktualizacja `README.md`.
2.  **Konfiguracja Środowisk i CI/CD:**
    - Utworzenie **dwóch oddzielnych projektów** w chmurze Supabase w ramach darmowego planu:
      - `content-orbit-dev` (do codziennej pracy deweloperskiej).
      - `content-orbit-staging` (do testów automatycznych E2E i UAT).
    - Konfiguracja podstawowego pipeline'u CI/CD w GitHub Actions (linting, testy).
    - Konfiguracja Playwright, aby testy E2E uruchamiały się na dedykowanej bazie `content-orbit-staging`.

---

## Faza 2: Architektura Danych [COMPLETED]

**Cel:** Zdefiniowanie kompletnego schematu bazy danych i wdrożenie mechanizmów bezpieczeństwa na poziomie danych.

**Kroki:**

1.  **Projektowanie Schematu Bazy Danych:**
    - Stworzenie wszystkich tabel w Supabase: `clusters`, `articles`, `settings` itd., wraz z relacjami.
    - Zdefiniowanie typów TypeScript (DTOs) dla wszystkich encji w `src/types.ts`.
2.  **Implementacja Separacji Danych (RLS):**
    - Wdrożenie reguł Row Level Security (RLS) w Supabase. Wymusi to na wszystkich przyszłych zapytaniach konieczność uwzględniania `user_id`, co jest kluczowe dla bezpieczeństwa i ułatwia dalszy rozwój.

---

## Faza 3: Implementacja API (Backend-first)

**Cel:** Stworzenie kompletnego zestawu endpointów API, które będą obsługiwać logikę biznesową, z użyciem mockowanych danych.

**Kroki:**

1.  **Mockowanie Użytkownika:**
    - Ręczne stworzenie jednego użytkownika-testera w Supabase.
    - Tymczasowe przypisanie ID tego użytkownika na sztywno w logice aplikacji.
2.  **Implementacja API Routes:**
    - Zdefiniowanie i stworzenie wszystkich potrzebnych API routes w `src/pages/api`.
    - Stworzenie logiki CRUD, wykorzystującej zamockowane ID użytkownika.
3.  **Mockowanie Odpowiedzi AI:**
    - Stworzenie funkcji-placeholderów, które będą zwracać statyczne, predefiniowane dane (np. listę tematów) w takim formacie, jakiego oczekujemy od OpenRouter. Prawdziwa integracja AI nastąpi w późniejszej fazie.
4.  **Testowanie Integracyjne (dla krytycznych ścieżek):**
    - Pisanie testów integracyjnych (Vitest) dla kluczowych i złożonych endpointów (np. `POST /api/articles/generate-concepts`), uruchamianych na bazie `content-orbit-staging`.

---

## Faza 4: Implementacja Interfejsu Użytkownika (Frontend)

**Cel:** Zbudowanie kompletnego interfejsu użytkownika na podstawie gotowego i przetestowanego API.

**Kroki:**

1.  **Krok 0: Wireframing i Podstawy Systemu Designu:**
    - Stworzenie prostych szkiców (wireframes) dla każdego kluczowego widoku aplikacji.
    - Zdefiniowanie podstawowej palety kolorów, typografii i reguł spójności wizualnej.
2.  **Setup Biblioteki Komponentów:**
    - Instalacja i konfiguracja `shadcn/ui`.
3.  **Budowa Komponentów i Widoków:**
    - Stworzenie wszystkich stron (`/dashboard`, `/klastry`, `/edytor`, `/opcje`).
    - Implementacja komponentów React i Astro, w tym z `shadcn/ui`.
    - Połączenie interfejsu z endpointami API stworzonymi w Fazie 3.
4.  **Testowanie E2E:**
    - Stopniowe tworzenie testów End-to-End (Playwright), które będą uruchamiane na środowisku `content-orbit-staging`.

---

## Faza 5: Integracja z Usługami AI i Wyszukiwaniem Semantycznym

**Cel:** Zastąpienie mockowanych odpowiedzi AI prawdziwą integracją z OpenRouter oraz wdrożenie wyszukiwania semantycznego za pomocą `pgvector` w celu dostarczania trafnego kontekstu.

**Kroki:**

1.  **Konfiguracja `pgvector`:**
    - Aktywacja rozszerzenia `pgvector` w bazach danych Supabase (`dev` i `staging`).
    - Modyfikacja odpowiednich tabel (np. `articles`) w celu dodania kolumny typu `vector`.
2.  **Implementacja Klienta OpenRouter:**
    - Stworzenie serwisu do komunikacji z API OpenRouter, który będzie obsługiwał zarówno generowanie treści, jak i tworzenie embeddingów (wektorów).
3.  **Skrypt do Generowania Embeddingów:**
    - Stworzenie jednorazowego skryptu, który pobierze wszystkie istniejące artykuły, wygeneruje dla nich embeddingi za pomocą OpenRouter, a następnie zapisze je w nowej kolumnie wektorowej.
4.  **Integracja Wyszukiwania Semantycznego z API:**
    - Zmodyfikowanie endpointów API (np. do generowania podtematów). Nowa logika powinna wyglądać następująco:
      a. Pobierz zapytanie użytkownika (np. główny temat).
      b. Wygeneruj embedding dla tego zapytania.
      c. Użyj `pgvector` do znalezienia w bazie `N` najbardziej podobnych semantycznie artykułów (kontekstu).
      d. Zbuduj prompt dla AI, który zawiera pierwotne zapytanie oraz znaleziony kontekst.
      e. Wyślij kompletny prompt do OpenRouter w celu wygenerowania odpowiedzi.
5.  **Testowanie i Walidacja:**
    - Ręczne przetestowanie całego przepływu w celu weryfikacji jakości i trafności odpowiedzi AI w oparciu o kontekst z `pgvector`.

---

## Faza 6: Implementacja Uwierzytelniania

**Cel:** Zastąpienie mockowanego użytkownika pełnym, bezpiecznym systemem logowania.

**Kroki:**

1.  **Stworzenie Widoku Logowania:**
    - Implementacja interfejsu strony `/login` (bez rejestracji).
    - Wykorzystanie biblioteki `react-hook-form` do zarządzania stanem formularza.
2.  **Implementacja Logiki Autentykacji:**
    - Podłączenie formularza logowania do Supabase Auth.
    - Stworzenie middleware w Astro (`src/middleware/index.ts`) do ochrony podstron.
    - Usunięcie mechanizmu mockowania ID użytkownika.
3.  **Testy E2E dla Autentykacji:**
    - Dodanie testów Playwright obejmujących proces logowania i wylogowywania.

---

## Faza 7: Finalizacja, Testy Końcowe i Wdrożenie

**Cel:** Zapewnienie najwyższej jakości i przygotowanie aplikacji do wdrożenia produkcyjnego.

**Kroki:**

1.  **Konfiguracja Środowiska Produkcyjnego:**
    - **Utworzenie nowego, trzeciego projektu w Supabase (`content-orbit-prod`) na planie płatnym.**
    - Przygotowanie środowiska na Cloudflare.
    - Bezpieczne zarządzanie zmiennymi środowiskowymi.
2.  **Pełna Regresja i Testy UAT:**
    - Uruchomienie pełnego zestawu testów na środowisku `content-orbit-staging`.
    - Przeprowadzenie User Acceptance Testing (UAT).
3.  **Wdrożenie na Produkcję:**
    - Po akceptacji, wdrożenie aplikacji na środowisko produkcyjne.
4.  **Zadania po Wdrożeniu:**
    - Uruchomienie skryptów inicjalizujących (np. jednorazowy import istniejących artykułów do tabel `clusters` i `articles`).
    - Monitoring i zbieranie feedbacku.
