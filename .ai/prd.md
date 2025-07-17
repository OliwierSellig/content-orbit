# Dokument wymagań produktu (PRD) - Content Orbit

## 1. Przegląd produktu

Content Orbit to wewnętrzna aplikacja webowa dla firmy Kryptonum, zaprojektowana w celu optymalizacji i skalowania procesu tworzenia treści SEO. Aplikacja ma na celu rozwiązanie problemu potrzeby szybkiego generowania dużej liczby (do 100 tygodniowo) wysokiej jakości, zoptymalizowanych pod SEO artykułów, aby znacząco poprawić pozycjonowanie strony internetowej firmy w wyszukiwarkach.

Główny przepływ pracy w aplikacji opiera się na trzyetapowym procesie:

1.  Temat: Użytkownik wybiera istniejący temat, wpisuje go ręcznie lub wybiera z listy propozycji wygenerowanych przez AI.
2.  Podtematy: Na podstawie wybranego tematu, AI masowo generuje propozycje podtematów, uwzględniając bazę wiedzy firmy i preferencje użytkownika.
3.  Koncepty: Dla zaakceptowanych podtematów, system automatycznie generuje kompletne koncepty (tytuł, opis, struktura nagłówków, meta dane SEO), które stają się szkieletem dla finalnych artykułów.

Gotowe artykuły mogą być następnie edytowane w zaawansowanym edytorze i jednym kliknięciem przenoszone do systemu Sanity CMS.

## 2. Problem użytkownika

Głównym problemem, który rozwiązuje Content Orbit, jest niska efektywność i skalowalność obecnego procesu tworzenia treści. Aby osiągnąć cele biznesowe związane z pozycjonowaniem w wyszukiwarkach, firma Kryptonum potrzebuje publikować około 100 artykułów tygodniowo. Manualne tworzenie tak dużej ilości treści na wysokim poziomie merytorycznym i SEO jest czasochłonne, kosztowne i trudne do utrzymania w długim terminie. Copywriterzy potrzebują narzędzia, które zautomatyzuje i przyspieszy fazę planowania i tworzenia szkiców, pozwalając im skupić się na finalnym dopracowaniu treści i utrzymaniu jej jakości.

## 3. Wymagania funkcjonalne

### 3.1. System Kont Użytkowników i Uwierzytelnianie

- Aplikacja będzie oparta na indywidualnych kontach użytkowników, zarządzanych przez Supabase Auth.
- W ramach MVP, konta użytkowników będą tworzone manualnie przez administratora bezpośrednio w panelu Supabase. Funkcja samodzielnej rejestracji przez użytkowników nie będzie dostępna.
- Każde konto użytkownika będzie posiadało własny, odseparowany zbiór danych: klastrów tematycznych, artykułów, preferencji AI, niestandardowych audytów i opcji.
- System będzie chronił wszystkie podstrony aplikacji. Użytkownik, który nie jest zalogowany, przy próbie wejścia na dowolny adres URL (inny niż strona logowania), zostanie automatycznie przekierowany na stronę logowania.
- Dane nie będą współdzielone pomiędzy różnymi kontami użytkowników.

### 3.2. Baza Danych i Źródła Danych

- System będzie korzystał z bazy danych Supabase do przechowywania wszystkich danych aplikacji (klastry, artykuły, ustawienia etc.).
- W ramach uruchomienia MVP, istniejące artykuły ze strony kryptonum.eu zostaną zaimportowane bezpośrednio do tabel `klastry` i `artykuły` w bazie danych, aby stanowiły początkowy kontekst dla AI.

### 3.3. Rdzeń Aplikacji - Przepływ Tworzenia Treści

- Proces rozpoczyna się na stronie głównej, gdzie użytkownik ma do wyboru dwie opcje: "Nowy temat" lub "Wybierz istniejący".
- Wybór tematu (ręczny, z listy wygenerowanej przez AI lub z bazy) przenosi użytkownika do widoku generowania podtematów.
- AI generuje listę propozycji podtematów na podstawie tematu, bazy wiedzy, istniejących artykułów i preferencji użytkownika. Użytkownik może akceptować, odrzucać lub dodawać własne propozycje.
- Po zatwierdzeniu podtematów, system rozpoczyna synchroniczne generowanie konceptów. Użytkownik widzi wskaźnik ładowania i po zakończeniu procesu otrzymuje listę w pełni wygenerowanych konceptów.
- Wygenerowany koncept zawiera: tytuł artykułu, krótki opis, listę nagłówków (jako tablica stringów), tytuł SEO, opis SEO oraz slug.
- Model Danych Artykułu: Podtemat i Artykuł to ta sama encja w bazie danych. Każdy artykuł posiada jeden z trzech statusów:
  - `koncept`: Początkowy stan po wygenerowaniu przez AI. Szkielet artykułu jest gotowy.
  - `w toku`: Użytkownik rozpoczął edycję artykułu.
  - `przeniesiony`: Artykuł został zsynchronizowany z Sanity CMS.

### 3.4. Edytor Artykułów

- Interfejs edytora będzie składał się z trzech paneli, zapewniając logiczny podział przestrzeni roboczej:
  - **Lewy panel (Panel Akcji)**: Zawiera wszystkie narzędzia i akcje, które można wykonać na artykule, takie jak przycisk "Generuj treść", lista niestandardowych audytów do uruchomienia oraz przycisk "Przenieś do Sanity".
  - **Środkowy panel (Edytor Treści)**: Centralny obszar przeznaczony do pisania i edytowania treści w formacie Markdown.
  - **Prawy panel (Panel Metadanych)**: Przeznaczony do zarządzania danymi opisującymi artykuł, w tym jego tytułem, slugiem, opisem oraz metadanymi SEO.
- Użytkownik będzie miał do dyspozycji dwie główne funkcje AI w edytorze:
  - **Generowanie treści**: Przycisk w lewym panelu, który zleca AI napisanie całej treści artykułu na podstawie jego konceptu (tytułu, opisu, struktury nagłówków). Wygenerowana treść zostanie wstawiona do edytora, gotowa do dalszej, ręcznej edycji.
  - **Uruchamianie audytu**: Użytkownik może wybrać jeden ze swoich niestandardowych audytów z listy w lewym panelu. AI przeanalizuje tekst i zwróci swoje uwagi w formie tekstowej, bez bezpośredniego modyfikowania treści.
- Użytkownik może w dowolnym momencie nadpisać globalne preferencje AI na poziomie edytowanego artykułu.

### 3.5. Personalizacja i Zarządzanie Ustawieniami

- Użytkownicy będą mieli dedykowaną podstronę "Opcje".
- Na tej stronie będą mogli zarządzać globalnymi preferencjami (np. "Pisz wesołym tonem"), które będą używane przez AI, a także konfigurować parametry liczbowe procesów generatywnych (np. liczbę generowanych tematów i podtematów).
- Użytkownicy mogą tworzyć, edytować i usuwać własne, niestandardowe "audyty", które są zapisanymi promptami AI do wielokrotnego użytku.

### 3.6. Integracja z Sanity CMS

- Gotowe artykuły mogą być jednym kliknięciem przeniesione do Sanity. Artykuł trafia tam jako "draft".
- ID artykułu z Sanity będzie przechowywane w lokalnej bazie danych aplikacji w celu umożliwienia przyszłych aktualizacji.
- Przy próbie nadpisania artykułu, który już istnieje w Sanity, system wyświetli modal z ostrzeżeniem i poprosi o dodatkowe potwierdzenie akcji.
- Po przeniesieniu artykułu do Sanity, jego status w aplikacji zmieni się na "przeniesiony", a edycja zostanie domyślnie zablokowana, aby zapewnić spójność danych.

### 3.7. Zarządzanie Danymi i Usuwanie

- Usunięcie klastra tematycznego spowoduje trwałe usunięcie wszystkich powiązanych z nim artykułów z bazy danych aplikacji.
- Proces usuwania klastra będzie zabezpieczony dodatkową weryfikacją, wymagającą od użytkownika wpisania nazwy klastra w celu potwierdzenia akcji.
- Usunięte dane nie będą usuwane z Sanity CMS.

### 3.8. Model AI i Budżet

- Usługi AI będą dostarczane przez API OpenRouter.
- W systemie zostanie zaimplementowany mechanizm kontroli budżetu. Po przekroczeniu ustalonego miesięcznego limitu, wszystkie funkcje generatywne AI zostaną zablokowane do czasu odnowienia limitu.

### 3.9. Walidacja i Integralność Danych

- Wszystkie dane wprowadzane przez użytkownika (formularze, API) będą walidowane pod kątem poprawności formatu i typu przy użyciu biblioteki `zod`, aby zapewnić wysoką integralność danych i bezpieczeństwo.

## 4. Granice produktu

Następujące funkcje i elementy nie wchodzą w zakres wersji MVP (Minimum Viable Product) tego projektu:

- Zaawansowany research konkurencji: Aplikacja nie będzie automatycznie analizować treści konkurencji, np. poprzez integrację z Ahrefs API. Użytkownik może manualnie dostarczać linki w czacie z AI.
- Niestandardowe komponenty w edytorze: Edytor będzie obsługiwał wyłącznie standardowy format Markdown. Obsługa niestandardowych, złożonych komponentów z Sanity (np. galerie zdjęć, bloki CTA) nie jest częścią MVP.
- Dwukierunkowa synchronizacja z Sanity: Synchronizacja jest jednokierunkowa (z aplikacji do Sanity). Zmiany wprowadzone w Sanity nie będą automatycznie odzwierciedlane w aplikacji Content Orbit.
- System wersjonowania artykułów: Wersja MVP nie będzie zawierać mechanizmu wersjonowania, który pozwalałby na przywracanie poprzednich wersji edytowanego artykułu.
- Interaktywny czat z AI w edytorze: Wersja MVP nie będzie zawierać interfejsu czatu do konwersacyjnego edytowania treści. Interakcje z AI w edytorze ograniczają się do jednorazowego generowania treści oraz uruchamiania audytów zwracających wyniki w formie tekstowej.
- Zaawansowana analiza SEO przez AI: Weryfikacja tematów przez AI w MVP nie będzie obejmować głębokiej analizy potencjału SEO. Ta funkcjonalność zostanie rozważona w przyszłych wersjach produktu.
- Weryfikacja tematów i podtematów przez AI: Wersja MVP nie będzie zawierać weryfikacji przez AI ręcznie wprowadzonych tematów pod kątem literówek czy merytorycznej zgodności. Weryfikacja ograniczy się do sprawdzania, czy identyczny wpis już istnieje w bazie danych.

## 5. Historyjki użytkowników

### 5.1. Uwierzytelnianie i Zarządzanie Kontem

### ID: US-001

- Tytuł: Logowanie do aplikacji
- Opis: Jako użytkownik z kontem stworzonym przez administratora, chcę móc zalogować się do aplikacji przy użyciu moich poświadczeń, aby uzyskać dostęp do mojego spersonalizowanego środowiska pracy.
- Kryteria akceptacji:
  - Użytkownik może zalogować się do systemu przy użyciu adresu e-mail i hasła.
  - Po zalogowaniu użytkownik ma dostęp do swojego pulpitu.
  - Próba logowania z nieprawidłowymi danymi skutkuje wyświetleniem komunikatu o błędzie.
  - Dane jednego użytkownika nie są widoczne dla innego.

### ID: US-002

- Tytuł: Wylogowywanie z aplikacji
- Opis: Jako zalogowany użytkownik, chcę mieć możliwość bezpiecznego wylogowania się z aplikacji, aby zakończyć swoją sesję.
- Kryteria akceptacji:
  - W interfejsie aplikacji znajduje się widoczny przycisk lub link "Wyloguj".
  - Po kliknięciu przycisku sesja użytkownika jest kończona, a on sam jest przekierowywany na stronę logowania.

### ID: US-003

- Tytuł: Ochrona dostępu do podstron aplikacji
- Opis: Jako niezalogowany użytkownik, przy próbie dostępu do dowolnej podstrony aplikacji, chcę zostać automatycznie przekierowany na stronę logowania, aby uniemożliwić nieautoryzowany dostęp.
- Kryteria akceptacji:
  - Próba wejścia na adres URL (np. `/dashboard`, `/klastry`) bez aktywnej sesji logowania skutkuje natychmiastowym przekierowaniem na `/login`.
  - Użytkownik nie widzi zawartości chronionej strony nawet na chwilę.

### 5.2. Główny Przepływ Tworzenia Treści

### ID: US-004

- Tytuł: Masowe generowanie tematów przez AI
- Opis: Jako użytkownik, chcę mieć możliwość wygenerowania listy propozycji nowych tematów przez AI, która analizuje moje istniejące klastry i artykuły, aby zaproponować tematy uzupełniające moją strategię contentową.
- Kryteria akceptacji:
  - Na stronie głównej znajduje się przycisk "Nowy temat", który otwiera pop-up.
  - W pop-upie jest opcja "Generuj z AI".
  - Po kliknięciu AI generuje listę X tematów (ilość X jest zdefiniowana w opcjach globalnych) i ją wyświetla.
  - Użytkownik może wybrać jeden z wygenerowanych tematów, co rozpoczyna proces generowania podtematów.
  - Użytkownik może odrzucić wszystkie propozycje i wygenerować nową listę.

### ID: US-005

- Tytuł: Ręczne wprowadzanie tematu z weryfikacją duplikatów
- Opis: Jako użytkownik, chcę móc samodzielnie wpisać temat, a system sprawdzi, czy identyczny temat nie istnieje już w mojej bazie klastrów, aby unikać duplikatów.
- Kryteria akceptacji:
  - W pop-upie "Nowy temat" znajduje się pole do ręcznego wpisania tematu.
  - Po wpisaniu i zatwierdzeniu, system sprawdza, czy w bazie danych istnieje już klaster o identycznej nazwie (exact match, case-insensitive).
  - Jeśli duplikat zostanie znaleziony, system wyświetli komunikat błędu, a użytkownik musi zmienić temat, aby kontynuować.
  - Jeśli temat jest unikalny, zostaje zaakceptowany.

### ID: US-006

- Tytuł: Wybór istniejącego tematu z bazy klastrów
- Opis: Jako użytkownik, chcę móc szybko wybrać jeden z moich wcześniej zdefiniowanych tematów z listy istniejących klastrów, aby kontynuować pracę nad rozbudową danej kategorii.
- Kryteria akceptacji:
  - Na stronie głównej znajduje się przycisk "Wybierz istniejący".
  - Kliknięcie otwiera pop-up z listą wszystkich klastrów/tematów przypisanych do mojego konta.
  - Mogę przeszukiwać lub filtrować listę tematów.
  - Wybór tematu z listy zamyka pop-up i przenosi mnie do etapu generowania podtematów.

### ID: US-007

- Tytuł: Zarządzanie listą propozycji podtematów
- Opis: Jako użytkownik, po wybraniu tematu, chcę otrzymać listę propozycji podtematów wygenerowanych przez AI, którą mogę modyfikować, usuwając lub dodając własne pozycje, a także uzupełniać listę o nowe propozycje AI.
- Kryteria akceptacji:
  - Po zaakceptowaniu tematu, system automatycznie generuje X podtematów (ilość X jest zdefiniowana w opcjach globalnych). Wszystkie wygenerowane podtematy są domyślnie "zaakceptowane".
  - Mogę usunąć dowolną propozycję z listy (zarówno wygenerowaną przez AI, jak i dodaną ręcznie). Usunięcie jest jedynym sposobem "odrzucenia" propozycji.
  - Mogę dodać własne podtematy do listy. Nowo dodany podtemat jest sprawdzany pod kątem duplikatów w bazie danych (identycznie jak w US-005).
  - Na stronie znajduje się przycisk "Uzupełnij do X", który jest aktywny, gdy liczba podtematów na liście jest mniejsza niż X.
  - Kliknięcie przycisku "Uzupełnij do X" sprawia, że AI generuje brakującą liczbę podtematów, aby na liście ponownie było X pozycji.
  - System zapamiętuje usunięte podtematy w ramach sesji, aby nie proponować ich ponownie podczas uzupełniania listy.
  - Przycisk "Zatwierdź i generuj koncepty" jest aktywny, gdy na liście znajduje się co najmniej jeden podtemat.

### ID: US-008

- Tytuł: Resetowanie procesu wyboru tematu
- Opis: Jako użytkownik, jeśli odrzucę wszystkie wygenerowane propozycje podtematów, chcę mieć możliwość zresetowania procesu i powrotu do ekranu głównego, aby wybrać lub stworzyć nowy temat.
- Kryteria akceptacji:
  - Gdy na liście propozycji podtematów nie ma żadnej zaznaczonej pozycji, pojawia się przycisk "Zacznij od nowa".
  - Kliknięcie tego przycisku przenosi użytkownika z powrotem do stanu początkowego (strona główna/modal wyboru tematu).
  - Bieżący temat jest odrzucany i nie jest zapisywany w sesji.

### ID: US-009

- Tytuł: Synchroniczne generowanie konceptów
- Opis: Jako użytkownik, po zatwierdzeniu listy podtematów, chcę, aby system od razu wygenerował dla nich kompletne koncepty, abym mógł niezwłocznie przystąpić do dalszej pracy.
- Kryteria akceptacji:
  - Po zatwierdzeniu podtematów, interfejs użytkownika pokazuje stan ładowania, informując o trwającym procesie.
  - Aplikacja wykonuje pojedyncze zapytanie do API i czeka na jego zakończenie.
  - Po pomyślnym zakończeniu operacji, użytkownik jest przenoszony do widoku z listą w pełni wygenerowanych, gotowych do użycia konceptów.

### 5.3. Edytor Artykułu i Integracja z Sanity

### ID: US-011

- Tytuł: Nawigacja do edytora artykułu
- Opis: Jako użytkownik, chcę móc przejść z listy konceptów do dedykowanego widoku edytora dla wybranego artykułu, aby rozpocząć pracę nad jego treścią.
- Kryteria akceptacji:
  - Na liście konceptów, każdy element jest klikalny.
  - Kliknięcie na dany element przenosi mnie do trzy-panelowego widoku edytora tego konkretnego artykułu.
  - Status artykułu automatycznie zmienia się na "W toku", jeśli był to "Koncept".

### ID: US-012

- Tytuł: Generowanie treści artykułu przez AI
- Opis: Jako użytkownik w edytorze artykułu, chcę mieć przycisk "Generuj treść", który zleci AI napisanie całego artykułu na podstawie jego tytułu i opisu, abym mógł skupić się na jego dalszej redakcji.
- Kryteria akceptacji:
  - W lewym panelu edytora dostępny jest przycisk "Generuj treść".
  - Po kliknięciu, AI generuje kompletny tekst artykułu i wstawia go do edytora.
  - Istniejąca treść w edytorze jest nadpisywana.
  - Otrzymuję powiadomienie o zakończeniu generowania.

### ID: US-013

- Tytuł: Uruchamianie niestandardowych audytów AI
- Opis: Jako użytkownik, chcę mieć możliwość uruchomienia jednym kliknięciem zapisanego wcześniej audytu (np. "Audyt SEO"), aby AI przeanalizowało cały artykuł pod określonym kątem i zwróciło mi swoje wnioski w formie tekstowej.
- Kryteria akceptacji:
  - W lewym panelu edytora znajduje się lista moich niestandardowych audytów.
  - Po kliknięciu na audyt, AI analizuje treść artykułu na podstawie zapisanego promptu.
  - Wynik audytu pojawia się w formie tekstowej w dedykowanym panelu lub modalu.
  - Wynik audytu nie modyfikuje automatycznie treści artykułu.

### ID: US-014

- Tytuł: Przenoszenie gotowego artykułu do Sanity CMS
- Opis: Jako użytkownik, po zakończeniu pracy nad artykułem, chcę jednym kliknięciem przenieść go do Sanity, aby mógł on zostać opublikowany na stronie.
- Kryteria akceptacji:
  - W lewym panelu edytora znajduje się przycisk "Przenieś do Sanity".
  - Po kliknięciu, aplikacja wysyła treść i metadane artykułu do Sanity API.
  - Artykuł jest tworzony w Sanity jako "draft".
  - Status artykułu w aplikacji zmienia się na "przeniesiony", a jego edycja jest blokowana.
  - Otrzymuję potwierdzenie, że operacja się powiodła.

### ID: US-015

- Tytuł: Bezpieczne nadpisywanie istniejącego artykułu w Sanity
- Opis: Jako użytkownik, jeśli próbuję przenieść artykuł, który już istnieje w Sanity (ma zapisane Sanity ID), chcę otrzymać wyraźne ostrzeżenie i możliwość świadomego potwierdzenia operacji nadpisania.
- Kryteria akceptacji:
  - Przed wysłaniem danych do Sanity, system sprawdza, czy artykuł ma już powiązane Sanity ID.
  - Jeśli tak, wyświetlany jest modal z ostrzeżeniem "Ten artykuł już istnieje w Sanity. Czy na pewno chcesz go nadpisać?".
  - Modal zawiera przyciski "Tak, nadpisz" oraz "Anuluj".
  - Operacja jest kontynuowana tylko po kliknięciu przycisku potwierdzającego.

### 5.4. Zarządzanie Klastrami i Ustawieniami

### ID: US-016

- Tytuł: Przeglądanie listy klastrów tematycznych
- Opis: Jako użytkownik, chcę mieć dedykowaną podstronę, na której mogę zobaczyć wszystkie moje klastry tematyczne i przypisane do nich artykuły, aby zarządzać swoją pracą.
- Kryteria akceptacji:
  - W nawigacji aplikacji jest link do podstrony "Klastry".
  - Na stronie widoczna jest lista wszystkich moich klastrów.
  - Mogę rozwinąć dany klaster, aby zobaczyć listę artykułów (podtematów) wewnątrz.
  - Z tego widoku mogę przejść do edycji konkretnego artykułu.

### ID: US-017

- Tytuł: Trwałe usuwanie klastra
- Opis: Jako użytkownik, chcę mieć możliwość trwałego usunięcia całego klastra tematycznego wraz ze wszystkimi przypisanymi do niego artykułami.
- Kryteria akceptacji:
  - Na liście klastrów przy każdym z nich jest opcja "Usuń".
  - Po kliknięciu "Usuń" otwiera się modal z prośbą o potwierdzenie.
  - W modalu znajduje się pole tekstowe, w które należy wpisać nazwę klastra, aby potwierdzić usunięcie.
  - Przycisk potwierdzający usunięcie jest nieaktywny, dopóki nazwa klastra nie zostanie poprawnie wpisana.
  - Po poprawnym wpisaniu nazwy i kliknięciu przycisku potwierdzającego, klaster i wszystkie powiązane z nim artykuły są trwale usuwane z bazy danych.
  - Operacja nie usuwa artykułów, które zostały już przeniesione do Sanity CMS.

### ID: US-018

- Tytuł: Zarządzanie globalnymi preferencjami i audytami
- Opis: Jako użytkownik, chcę mieć centralne miejsce (stronę "Opcje"), gdzie mogę definiować, edytować i usuwać moje globalne preferencje dotyczące stylu pisania AI, ustawiać parametry generowania (np. liczbę tematów i podtematów) oraz tworzyć własne, niestandardowe audyty.
- Kryteria akceptacji:
  - W nawigacji aplikacji znajduje się link do strony "Opcje".
  - Na stronie mogę zarządzać listą globalnych preferencji (dodawać, edytować, usuwać).
  - Na stronie mogę zdefiniować domyślną liczbę tematów i podtematów do wygenerowania przez AI.
  - Na stronie mogę zarządzać listą moich niestandardowych audytów (nazwa + prompt).
  - Zmiany zapisane w tym miejscu są automatycznie uwzględniane w procesach generowania AI.

## 6. Metryki sukcesu

Sukces wdrożenia wersji MVP produktu będzie mierzony na podstawie następujących kluczowych wskaźników, które odzwierciedlają jakość i trafność generowanych przez AI treści:

- Wskaźnik akceptacji tematów: Co najmniej 75% tematów generowanych przez AI jest akceptowanych przez użytkownika do dalszej pracy.
- Wskaźnik retencji podtematów: Mniej niż 10% podtematów generowanych przez AI jest manualnie usuwanych przez użytkownika na etapie selekcji.
- Wskaźnik jakości konceptów: Mniej niż 25% konceptów generowanych przez AI jest znacząco modyfikowanych lub w całości usuwanych przez użytkownika w fazie przeglądu konceptów.
