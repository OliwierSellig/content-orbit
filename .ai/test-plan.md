# Plan Testów dla Aplikacji "Content Orbit"

## 1. Wprowadzenie i Cele Testowania

### 1.1. Wprowadzenie

Niniejszy dokument przedstawia kompleksowy plan testów dla aplikacji webowej "Content Orbit" – wewnętrznego narzędzia firmy Kryptonum do optymalizacji procesu tworzenia treści SEO. Plan został opracowany na podstawie dokumentu wymagań produktu (PRD) oraz specyfikacji technologicznej projektu.

### 1.2. Cele Testowania

Głównym celem procesu testowania jest zapewnienie, że aplikacja "Content Orbit" spełnia wszystkie wymagania funkcjonalne i niefunkcjonalne, jest stabilna, bezpieczna i dostarcza wysokiej jakości doświadczenie użytkownika (UX).

Szczegółowe cele:

- **Weryfikacja funkcjonalności:** Potwierdzenie, że wszystkie funkcje opisane w PRD, w tym kluczowy przepływ tworzenia treści, działają zgodnie z założeniami.
- **Zapewnienie bezpieczeństwa:** Sprawdzenie krytycznego mechanizmu separacji danych pomiędzy kontami użytkowników (data tenancy).
- **Testowanie integracji:** Weryfikacja poprawnej komunikacji z usługami zewnętrznymi: Supabase, OpenRouter.ai oraz Sanity CMS.
- **Ocena niezawodności:** Sprawdzenie stabilności aplikacji, zwłaszcza podczas asynchronicznych operacji generowania treści w tle.
- **Walidacja użyteczności:** Upewnienie się, że interfejs jest intuicyjny, a przepływy pracy logiczne dla użytkownika końcowego.
- **Weryfikacja metryk sukcesu:** Sprawdzenie, czy jakość generowanych treści jest zgodna z założonymi wskaźnikami w PRD.

## 2. Zakres Testów

### 2.1. Funkcjonalności objęte testami

- **System Kont i Uwierzytelnianie:** Logowanie, wylogowywanie, ochrona podstron (route guarding).
- **Rdzeń Aplikacji - Przepływ Tworzenia Treści:** Generowanie tematów (AI, ręcznie), zarządzanie podtematami, generowanie konceptów w tle i zarządzanie nimi.
- **Edytor Artykułów:** Trójpanelowy interfejs, interaktywna edycja z AI, uruchamianie audytów.
- **Integracja z Sanity CMS:** Przenoszenie artykułów, obsługa nadpisywania istniejących treści.
- **Zarządzanie Danymi:** Przeglądanie i usuwanie klastrów (z mechanizmem "soft delete").
- **Personalizacja i Ustawienia:** Zarządzanie globalnymi preferencjami AI i niestandardowymi audytami.
- **Kontrola Budżetu AI:** Mechanizm blokowania funkcji AI po przekroczeniu limitu.

### 2.2. Funkcjonalności wyłączone z testów

- Testowanie samych usług zewnętrznych (Supabase, OpenRouter, Sanity). Testom podlega wyłącznie integracja z nimi.
- Funkcjonalności jawnie wykluczone z MVP w PRD (np. zaawansowany research konkurencji, dwukierunkowa synchronizacja z Sanity).

## 3. Typy Testów do Przeprowadzenia

- **Testy Jednostkowe (Unit Tests):** Skupione na pojedynczych funkcjach, komponentach React i logice biznesowej. Zależności zewnętrzne (API, baza danych) będą mockowane.
- **Testy Integracyjne (Integration Tests):** Weryfikacja współpracy pomiędzy modułami, np. interakcja komponentów frontendu z logiką backendową lub testowanie endpointów API i ich wpływu na stan bazy danych.
- **Testy End-to-End (E2E):** Symulacja pełnych scenariuszy użytkownika w przeglądarce, np. od zalogowania, przez wygenerowanie artykułu, aż po jego wysłanie do Sanity.
- **Testy Regresji Wizualnej (Visual Regression Testing):** Automatyczne porównywanie zrzutów ekranu interfejsu w celu wykrycia niezamierzonych zmian wizualnych.
- **Testy Wydajnościowe (Performance Testing):** Podstawowa analiza wydajności (np. z użyciem Lighthouse) oraz testy obciążeniowe dla funkcji masowego generowania treści.
- **Testy Bezpieczeństwa (Security Testing):** Skupione na weryfikacji reguł Row Level Security w Supabase i ochronie przed nieautoryzowanym dostępem do danych.

## 4. Scenariusze Testowe dla Kluczowych Funkcjonalności

Poniższe scenariusze bazują na historyjkach użytkownika (User Stories) z PRD.

#### 4.1. Uwierzytelnianie i Dostęp (US-001, US-002, US-003)

- Poprawne zalogowanie przy użyciu prawidłowych danych.
- Nieudana próba logowania z błędnymi danymi i wyświetlenie komunikatu.
- Poprawne wylogowanie i przekierowanie na stronę logowania.
- Próba dostępu do chronionej podstrony przez niezalogowanego użytkownika i weryfikacja przekierowania.

#### 4.2. Główny Przepływ Tworzenia Treści (US-004 - US-010)

- **Generowanie tematu:** Weryfikacja wszystkich trzech ścieżek (AI, ręcznie, z listy). Sprawdzenie mechanizmu wykrywania duplikatów (case-insensitive).
- **Zarządzanie podtematami:** Automatyczne generowanie listy, usuwanie pozycji, dodawanie własnych, weryfikacja duplikatów, użycie funkcji "Uzupełnij do X".
- **Generowanie konceptów w tle:** Uruchomienie generowania, nawigacja do innej podstrony, powrót i weryfikacja aktualizacji statusów. Sprawdzenie, czy przy próbie zamknięcia strony pojawia się systemowe ostrzeżenie.
- **Zarządzanie konceptami:** Ponowne generowanie i usuwanie pojedynczego konceptu z poziomu listy.

#### 4.3. Edytor i Integracja z Sanity (US-011 - US-015)

- **Nawigacja i zmiana statusu:** Wejście do edytora z listy konceptów i weryfikacja, czy status artykułu zmienia się na "w toku".
- **Przenoszenie do Sanity:** Jedno-kliknięciowe przeniesienie artykułu i weryfikacja, czy został utworzony jako "draft" w testowym CMS. Sprawdzenie, czy status w aplikacji zmienił się na "przeniesiony", a edycja została zablokowana.
- **Nadpisywanie w Sanity:** Próba ponownego przeniesienia tego samego artykułu, weryfikacja pojawienia się modala z ostrzeżeniem, potwierdzenie i sprawdzenie, czy dane w CMS zostały zaktualizowane.

#### 4.4. Zarządzanie Klastrami i Ustawieniami (US-016 - US-018)

- **Usuwanie klastra:** Weryfikacja modala potwierdzającego z koniecznością wpisania nazwy. Sprawdzenie, czy klaster i powiązane z nim artykuły zostały oznaczone jako usunięte (soft delete).
- **Zarządzanie opcjami:** Tworzenie, edycja i usuwanie globalnych preferencji AI i audytów. Weryfikacja, czy zmiany są uwzględniane w procesie generowania treści.

#### 4.5. Testowanie Obszarów Krytycznego Ryzyka

- **Test separacji danych:**
  1. Zaloguj się jako `Użytkownik_A`.
  2. Stwórz klaster `Klaster_A` i artykuły.
  3. Wyloguj się.
  4. Zaloguj się jako `Użytkownik_B`.
  5. Zweryfikuj, że `Użytkownik_B` nie widzi `Klastra_A` ani jego zawartości. Spróbuj uzyskać dostęp przez bezpośredni URL.
- **Test kontroli budżetu AI:**
  1. Ustaw w systemie (lub w mocku) niski limit budżetu (np. 99% wykorzystania).
  2. Wykonaj akcję wymagającą AI (np. generuj podtematy) i zweryfikuj, że się powiodła.
  3. Zweryfikuj, że limit został przekroczony.
  4. Spróbuj wykonać kolejną akcję AI i zweryfikuj, że jest zablokowana, a użytkownik otrzymał stosowny komunikat.

## 5. Środowisko Testowe

- **Lokalne (Local):** Środowisko deweloperskie do uruchamiania testów jednostkowych i integracyjnych.
- **Deweloperskie (Development):** Współdzielone środowisko deweloperskie, na którym można manualnie weryfikować nowe funkcjonalności.
- **Staging:** W pełni odzwierciedla środowisko produkcyjne. Hostowane na Cloudflare, połączone z testowymi instancjami Supabase, Sanity i kluczami API OpenRouter. Na tym środowisku uruchamiane będą automatyczne testy E2E, regresji wizualnej oraz testy manualne.
- **Produkcyjne (Production):** Środowisko docelowe dla użytkowników końcowych.

## 6. Narzędzia do Testowania

- **Framework do testów jednostkowych/integracyjnych:** Vitest
- **Biblioteka do testowania komponentów:** React Testing Library
- **Framework do testów E2E i regresji wizualnej:** Playwright
- **System CI/CD:** GitHub Actions
- **System do śledzenia błędów:** GitHub Issues

## 7. Kryteria Akceptacji Testów

### 7.1. Kryteria Wejścia

- Kod został wdrożony na środowisku Staging.
- Środowisko testowe jest stabilne i w pełni skonfigurowane.
- Główne funkcjonalności są zaimplementowane i gotowe do testów.

### 7.2. Kryteria Wyjścia (dla wdrożenia na produkcję)

- **100%** testów jednostkowych i integracyjnych dla krytycznych ścieżek przechodzi pomyślnie.
- **95%** wszystkich zautomatyzowanych testów E2E przechodzi pomyślnie.
- Brak nierozwiązanych błędów o priorytecie **Krytycznym** lub **Wysokim**.
- Wszystkie zidentyfikowane błędy zostały zaraportowane, przeanalizowane i przypisane do odpowiednich wydań.
- Metryki sukcesu zdefiniowane w PRD zostały pozytywnie zweryfikowane podczas testów.

## 8. Procedury Raportowania Błędów

Wszystkie wykryte błędy będą zgłaszane jako "Issue" w repozytorium GitHub projektu.

Każde zgłoszenie musi zawierać:

- **Tytuł:** Zwięzły opis problemu.
- **Opis:**
  - **Kroki do reprodukcji:** Szczegółowa, ponumerowana lista kroków.
  - **Wynik aktualny:** Co się stało po wykonaniu kroków.
  - **Wynik oczekiwany:** Co powinno się stać.
- **Środowisko:** (np. Staging, Lokalnie, Produkcja).
- **Priorytet:**
  - **Krytyczny:** Błąd blokujący kluczowe funkcjonalności, uniemożliwiający dalsze testy.
  - **Wysoki:** Błąd poważnie zakłócający działanie ważnej funkcji, bez obejścia.
  - **Średni:** Błąd utrudniający korzystanie z funkcji, ale istnieje obejście.
  - **Niski:** Drobny błąd kosmetyczny lub problem o niskim wpływie na użytkownika.
- **Załączniki:** Zrzuty ekranu, nagrania wideo, logi z konsoli.
- **Etykiety:** (np. `bug`, `frontend`, `backend`, `security`, `ux`).
