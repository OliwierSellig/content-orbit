# Faza 1: Personalizacja Projektu i Konfiguracja Środowisk - Plan Szczegółowy

## 1. Cel Fazy

Głównym celem tej fazy jest przekształcenie istniejącego repozytorium startowego Astro w solidny fundament dla projektu "Content Orbit". Po zakończeniu tej fazy będziemy mieli w pełni skonfigurowane, czyste środowisko deweloperskie, odizolowane środowisko testowe oraz podstawową automatyzację CI/CD, co pozwoli nam na płynne i bezpieczne rozpoczęcie prac nad logiką aplikacji.

---

## 2. Kroki do Wykonania

### Krok 1: Personalizacja Repozytorium

**Cel:** Usunięcie zbędnego kodu startowego i dostosowanie projektu do naszych potrzeb.

- **Zadanie 1.1: Oczyszczenie Komponentów i Stron**

  - **Akcja:** Usuń plik `src/components/Welcome.astro`.
  - **Akcja:** Wyczyść zawartość pliku `src/pages/index.astro`, pozostawiając jedynie podstawową strukturę z głównym layoutem. Chcemy mieć czystą stronę główną, gotową na przyszłe komponenty.
  - **Akcja:** Przejrzyj `package.json` i usuń ewentualne zależności, które nie są częścią naszego docelowego stacku technologicznego (Astro, React, Tailwind, Supabase, etc.).

- **Zadanie 1.2: Aktualizacja Dokumentacji `README.md`**
  - **Cel:** Zapewnienie, że `README.md` jest naszą "wizytówką" i zawiera kluczowe informacje dla każdego, kto dołączy do projektu.
  - **Akcja:** Zaktualizuj plik `README.md`, dodając:
    - Krótki opis projektu "Content Orbit".
    - Listę kluczowych technologii (z `tech-stack.md`).
    - Podstawowe instrukcje dotyczące instalacji zależności (`npm install`) i uruchomienia projektu lokalnie (`npm run dev`).

---

### Krok 2: Konfiguracja Środowisk i Dostępu do Danych

**Cel:** Stworzenie odizolowanych środowisk dla dewelopmentu i testów oraz bezpieczne zarządzanie kluczami API, w ramach darmowego planu Supabase.

- **Zadanie 2.1: Utworzenie Projektów w Chmurze Supabase**

  - **Cel:** Przygotowanie dedykowanych baz danych dla różnych etapów pracy.
  - **Akcja (ja, AI):** Utworzę dwa nowe, oddzielne projekty w panelu Supabase:
    - `content-orbit-dev` (dla codziennej pracy deweloperskiej).
    - `content-orbit-staging` (dla testów automatycznych E2E oraz UAT).
  - **Wynik:** Otrzymasz ode mnie zestawy kluczy API (`SUPABASE_URL` i `SUPABASE_ANON_KEY`) dla obu projektów.

- **Zadanie 2.2: Konfiguracja Zmiennych Środowiskowych Lokalnie**

  - **Cel:** Umożliwienie Twojemu lokalnemu środowisku deweloperskiemu komunikacji z bazą `content-orbit-dev`.
  - **Akcja (Ty, Użytkownik):** Utwórz plik `.env` w głównym katalogu projektu.
  - **Akcja (Ty, Użytkownik):** Wklej do niego klucze otrzymane ode mnie dla bazy `content-orbit-dev`:
    ```env
    PUBLIC_SUPABASE_URL="TWOJ_URL_DO_BAZY_DEV"
    PUBLIC_SUPABASE_ANON_KEY="TWOJ_KLUCZ_ANON_DO_BAZY_DEV"
    ```
    _Przedrostek `PUBLIC_` jest wymagany przez Astro, aby zmienne były dostępne po stronie klienta.\_

- **Zadanie 2.3: Przygotowanie Pliku na Typy Bazy Danych**
  - **Cel:** Stworzenie miejsca na definicje typów, które później automatycznie wygenerujemy ze schematu naszej bazy danych.
  - **Akcja:** Utwórz plik `src/db/types.ts` i pozostaw go na razie pustym.

---

### Krok 3: Konfiguracja CI/CD i Testów Automatycznych

**Cel:** Wdrożenie podstawowej automatyzacji, która będzie pilnować jakości naszego kodu i przygotuje nas do pisania testów.

- **Zadanie 3.1: Stworzenie Podstawowego Pipeline'u CI/CD w GitHub Actions**

  - **Cel:** Automatyczne uruchamianie weryfikacji kodu przy każdej zmianie.
  - **Akcja:** Stwórz plik `.github/workflows/ci.yml`.
  - **Akcja:** W pliku `ci.yml` zdefiniuj przepływ pracy, który na zdarzenia `push` i `pull_request` uruchomi następujące zadania:
    1.  Checkout kodu.
    2.  Instalacja zależności (`npm install`).
    3.  Uruchomienie lintera (`npm run lint`).

- **Zadanie 3.2: Konfiguracja Sekretów w Repozytorium GitHub**

  - **Cel:** Bezpieczne przekazanie kluczy do testowej bazy danych do naszego pipeline'u CI/CD.
  - **Akcja (Ty, Użytkownik):** W ustawieniach repozytorium na GitHub (`Settings > Secrets and variables > Actions`) dodaj następujące sekrety, używając kluczy z projektu `content-orbit-staging`:
    - `PUBLIC_SUPABASE_URL_STAGING`: z kluczem URL dla bazy `content-orbit-staging`.
    - `PUBLIC_SUPABASE_ANON_KEY_STAGING`: z kluczem anon dla bazy `content-orbit-staging`.
      _Uwaga: Mimo że używamy kluczy produkcyjnych, testy będą działać na odizolowanym branchu `staging`, co jest bezpieczne._

- **Zadanie 3.3: Wstępna Konfiguracja Playwright**
  - **Cel:** Zainicjowanie frameworka do testów E2E, aby był gotowy do użycia w późniejszych fazach.
  - **Akcja:** Uruchom w terminalu komendę `npm init playwright@latest`.
  - **Akcja:** W `package.json` dodaj skrypt `"test:e2e": "playwright test"`.
  - **Akcja:** W pliku `playwright.config.ts`, w sekcji `webServer`, skonfiguruj komendę `command: 'npm run dev'` oraz `url: 'http://localhost:4321'`. To sprawi, że Playwright automatycznie uruchomi serwer deweloperski przed rozpoczęciem testów.
