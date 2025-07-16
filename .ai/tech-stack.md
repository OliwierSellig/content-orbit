Frontend - Astro z React dla komponentów interaktywnych:

- Astro 5 pozwala na tworzenie szybkich, wydajnych stron i aplikacji z minimalną ilością JavaScript
- React 19 zapewni interaktywność tam, gdzie jest potrzebna
- TypeScript 5 dla statycznego typowania kodu i lepszego wsparcia IDE
- Tailwind 4 pozwala na wygodne stylowanie aplikacji
- Shadcn/ui zapewnia bibliotekę dostępnych komponentów React, na których oprzemy UI
- Zod posłuży do walidacji schematów danych, zarówno w formularzach frontendowych, jak i na poziomie endpointów API.

Backend - Supabase jako kompleksowe rozwiązanie backendowe:

- Zapewnia bazę danych PostgreSQL
- Zapewnia SDK w wielu językach, które posłużą jako Backend-as-a-Service
- Jest rozwiązaniem open source, które można hostować lokalnie lub na własnym serwerze
- Posiada wbudowaną autentykację użytkowników

AI - Komunikacja z modelami przez usługę Openrouter.ai:

- Dostęp do szerokiej gamy modeli (OpenAI, Anthropic, Google i wiele innych), które pozwolą nam znaleźć rozwiązanie zapewniające wysoką efektywność i niskie koszta
- Pozwala na ustawianie limitów finansowych na klucze API

Integracje - Komunikacja z zewnętrznymi usługami:

- Sanity CMS: Docelowy system zarządzania treścią, do którego eksportowane będą artykuły. Integracja obejmie wysyłanie danych przez API oraz potencjalnie odbieranie informacji zwrotnych (np. o statusie publikacji lub aktualizacjach w bazie wiedzy) za pomocą webhooków.

CI/CD i Hosting:

- Github Actions do tworzenia pipeline’ów CI/CD
- Cloudflare Hosting dla hostowania aplikacji

Testowanie:

- Vitest: Framework do testów jednostkowych i integracyjnych
- React Testing Library: Biblioteka do testowania komponentów React
- Playwright: Framework do testów E2E i regresji wizualnej
