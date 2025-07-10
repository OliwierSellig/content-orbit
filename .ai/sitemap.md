graph TD
subgraph "Strefa Publiczna"
A["/login<br/>(Strona Logowania)"]
end

    subgraph "Strefa Chroniona (dla zalogowanych użytkowników)"
        B["/<br/>(Strona Główna / Dashboard)<br/>Pełny proces tworzenia:<br/>- Wybór tematu<br/>- Zarządzanie podtematami<br/>- Generowanie konceptów"]

        C["/article/:articleId/edit<br/>(Edytor Artykułu)"]

        subgraph "Zarządzanie"
            D["/clusters<br/>(Lista Klastrów i Artykułów)"]
            E["/options<br/>(Ustawienia Globalne i Audyty)"]
        end

        A -- Po zalogowaniu --> B
        B -- Po wygenerowaniu konceptu --> C
        C -- Po wyjściu z edytora --> B

        B -- z Nawigacji --> D
        B -- z Nawigacji --> E
        D -- Edycja artykułu --> C
    end

    style A fill:#ECECFF,stroke:#9494FF
    style B fill:#D5F5E3,stroke:#58D68D
    style C fill:#EBF5FB,stroke:#85C1E9
    style D fill:#FEF9E7,stroke:#F7DC6F
    style E fill:#FEF9E7,stroke:#F7DC6F
