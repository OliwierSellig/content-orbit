graph TD
subgraph "Uwierzytelnianie"
Auth_Start["Start"] --> Login["Logowanie użytkownika<br/>(US-001, US-002)"]
Login -- Nieudane --> Login
Login -- Zalogowany --> WyborTematu
end

    subgraph "Główny Przepływ Tworzenia Treści"
        subgraph "1. Wybór Tematu (US-004, US-005, US-006)"
            WyborTematu["Strona główna"]
            WyborTematu --> Opcja1["Nowy temat"]
            WyborTematu --> Opcja2["Wybierz istniejący"]

            Opcja1 --> GenAI["Generuj przez AI"]
            Opcja1 --> WpiszRecznie["Wpisz ręcznie"]
            note_duplikat[/"System sprawdza duplikaty<br/>(case-insensitive)"/]
            WpiszRecznie -.-> note_duplikat

            Opcja2 --> ListaKlastrow["Wybierz z listy istniejących klastrów"]

            GenAI --> ZatwierdzonyTemat
            WpiszRecznie -- Unikalny --> ZatwierdzonyTemat
            ListaKlastrow --> ZatwierdzonyTemat
        end

        subgraph "2. Zarządzanie Podtematami (US-007, US-008)"
            ZatwierdzonyTemat["Zatwierdzony Temat"] -- "Generowanie X propozycji podtematów" --> ListaPodtematow["Lista propozycji podtematów"]

            ListaPodtematow --> AkcjeNaPodtematach{"Modyfikacja listy"}
            AkcjeNaPodtematach -- "Usuń propozycję" --> ListaPodtematow
            AkcjeNaPodtematach -- "Dodaj własny podtemat<br/>(sprawdzanie duplikatów)" --> ListaPodtematow
            AkcjeNaPodtematach -- "Uzupełnij do X" --> ListaPodtematow

            ListaPodtematow -- "Brak podtematów" --> Anuluj["Zacznij od nowa"]
            Anuluj --> WyborTematu

            ListaPodtematow -- "Jest co najmniej 1 podtemat" --> ZatwierdzPodtematy["Zatwierdź i generuj koncepty"]
        end

        subgraph "3. Generowanie Konceptów (US-009, US-010)"
            ZatwierdzPodtematy --> GenerowanieKonceptow["Automatyczne generowanie konceptów w tle<br/>(w kolejkach po 3)"]
            note_koncepty1[/"Proces kontynuowany przy nawigacji,<br/>ostrzeżenie przy zamknięciu strony"/]
            GenerowanieKonceptow -.-> note_koncepty1

            GenerowanieKonceptow --> ListaKonceptow["Widok listy konceptów<br/>(statusy: W kolejce, Generowanie, Gotowy)"]
            ListaKonceptow --> AkcjeNaKonceptach{"Akcje na gotowym koncepcie"}
            AkcjeNaKonceptach -- "Generuj ponownie" --> GenerowanieKonceptow
            AkcjeNaKonceptach -- "Usuń" --> ListaKonceptow
        end

        subgraph "4. Edycja i Publikacja (US-011 - US-015)"
            ListaKonceptow -- "Wybierz koncept do edycji" --> Edytor
            Edytor["Trójpanelowy edytor artykułu<br/>Status zmienia się na 'w toku'"]
            note_editor[/"- Czat z AI (US-012)<br/>- Edytor Markdown<br/>- Audyty (US-013)"/]
            Edytor -.-> note_editor

            Edytor -- "Wyjdź z edytora" --> ModalWyjscia["Modal wyjścia z edytora"]
            ModalWyjscia -- "Zapisz i wyjdź" --> ListaKonceptow
            ModalWyjscia -- "Nie zapisuj i wyjdź" --> ListaKonceptow
            ModalWyjscia -- "Anuluj" --> Edytor

            Edytor -- "Zakończono edycję" --> PrzeniesDoSanity["Przenieś do Sanity"]

            PrzeniesDoSanity --> CzyIstnieje{Czy artykuł<br/>istnieje w Sanity?}

            CzyIstnieje -- "Tak" --> ModalOstrzezenie["Modal z ostrzeżeniem o nadpisaniu<br/>(US-015)"]
            ModalOstrzezenie -- "Potwierdź" --> NadpiszWSanity["Nadpisz istniejący artykuł w Sanity"]
            ModalOstrzezenie -- "Anuluj" --> Edytor

            CzyIstnieje -- "Nie" --> UtworzWSanity["Utwórz nowy artykuł w Sanity (jako draft)"]

            NadpiszWSanity --> KoniecSanity
            UtworzWSanity --> KoniecSanity
            KoniecSanity["Artykuł przeniesiony do Sanity<br/>Status 'przeniesiony', edycja zablokowana<br/>(US-014)"]
        end
    end

    subgraph "Zarządzanie (poza głównym flow)"
        Nawigacja[" "] -- " " --- ZarzadzanieKlastrami
        style Nawigacja fill:none,stroke:none
        ZarzadzanieKlastrami["Nawigacja: '/klastry'<br/>(US-016)"] --> ListaKlastrowWidok["Lista klastrów i artykułów"]

        ListaKlastrowWidok -- "Usuń cały klaster" --> PotwierdzenieUsunieciaKlastra["Modal potwierdzający<br/>(wpisz nazwę klastra)"]
        PotwierdzenieUsunieciaKlastra -- "Potwierdź" --> UsunietoKlaster["Klaster usunięty (soft delete)<br/>(US-017)"]

        ListaKlastrowWidok -- "Usuń pojedynczy artykuł" --> PotwierdzenieUsunieciaArtykulu["Modal potwierdzający<br/>usunięcie artykułu"]
        PotwierdzenieUsunieciaArtykulu -- "Potwierdź" --> ListaKlastrowWidok
        PotwierdzenieUsunieciaArtykulu -- "Anuluj" --> ListaKlastrowWidok

        ListaKlastrowWidok -- "Wybierz artykuł<br>do edycji" --> PrzejscieDoEdytora["Przejście do Głównego Flow"]

        ZarzadzanieOpcjami["Nawigacja: '/opcje'<br/>(US-018)"]
        note_opcje[/"- Zarządzanie globalnymi preferencjami AI<br/>- Zarządzanie niestandardowymi audytami"/]
        ZarzadzanieOpcjami -.-> note_opcje
    end

    subgraph "Zasady globalne"
        KontrolaBudzetu["Kontrola budżetu AI<br/>(Blokada funkcji AI po przekroczeniu limitu)"]
        SeparacjaDanych["Separacja danych (Data Tenancy)<br/>(Każdy użytkownik ma swoje dane)"]
    end

    style note_duplikat fill:#fefde2,stroke:#b4b496,stroke-width:1px
    style note_koncepty1 fill:#fefde2,stroke:#b4b496,stroke-width:1px
    style note_editor fill:#fefde2,stroke:#b4b496,stroke-width:1px
    style note_opcje fill:#fefde2,stroke:#b4b496,stroke-width:1px
