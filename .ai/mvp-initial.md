### Główny problem

Nasza firma Kryptonum zajmuję się szeroko pojętym IT i Marketingiem. Chcemy jednak polepszyć pozycjonowanie naszej strony internetowej w wyszukiwarce. Obecnie na stronie, która jest swoją drogą świetna pod kątem technicznym, mamy podstrone bloga, na którym mamy kilka artykułów (42). Na potrzeby naszego SEO i pozycjonowania chcemy stworzyć narzędzie, które umoliwi naszemu copywriterowi tworzenie 100 artykułów na tydzień, taka była chwytliwa nazwa projektu. Artykuły będą prezentowały najwysze poziom pod względem copywritingu i SEO przez co nasza strona będzie liderem jeeli chodzi o pozycjonowanie software housów i agencji marketingowych w polsce.

### Słownik pojęć

- Temat - główny temat klastra kontentowego, np. Hostowanie Stron Internetowych
- Podtemat - podtemat przypisany do konkretnego tematu, np. "Gdzie najlepiej hostować strony bodowany na Astro.js w 2025"
- Klaster - zbiór podtematów z jednym głównym tematem kontentowym, klaster ma zawsze jeden temat i może mieć od 0 do nieskończonej ilości podtematów
- Koncept - koncept jest budowany z jednego podtematu, powiedzmy, że mamty podtemat "Gdzie najlepiej hostować strony bodowany na Astro.js w 2025", koncept jaki powstanie z tego podtematu będzie miał w sobie główny tytuł artykułu bazującego na tym podtemacie, do tego krótki opis artykułu, wszystkie nagłówki sekcji, oraz tytuł i opis SEO
- Artykuł - jeden artykuł jest tworzony dla jednego konceptu, co za tym idzie dla jednego podtematu

### Jak ma działać ta aplikacja (MVP)

#### Dane statyczne, baza danych

- Mamy zbiór danych o naszej firmie (Artykuły, Zespół, Case Studies etc), im więcej danych tym lepiej, wrzucamy to do jakiejś bazy danych (trzeba postanowić gdzie )
- Mamy również bazę dancyh preferencji, to powinno pojawiać się jako np. jako swoiste opcje gdzieś w panelu frontentdowym ale te preferencje powinny zapisywać się w backendzie, żeby później można było ich użyć np. do promptowania AI, przykładowa preferencja to: "Pisz w stylu wesołym, z chumorem". Każda preferencja to osobny string. Preferencje są globalne, więc będą używane w tworzenia tematów, podtematów, konceptów oraz przy pracy nad konkretnym artykułem.
- Dodatkowow z trzyamnych dancyh mamy też klastry kontentowe - jeden klaster to jeden temat główny, np. "Hostowanie stron internetowcyh", dla każdego klastra możemy mieć niezliczoną ilość podtematów, czuyli np. dla hostowania stron możemy mieć: "Gdzie najlepiej hostować stronę zbudowaną na Astro.js" - to może być podtemat, ponieważ jest konkretny i odnosi się do konkretnego problemu. Takie klastry powinny być przechowywane w bazie danych
- Ogólne opcje które są bazowe (czyli nie generowanie przez użytkonika) ale możemy je zmieniać:
  - Na pewno ilość generowanych podtematów do każdego tematu

#### Autentykacja

- Aplikacja będzie oparta na indywidualnych kontach użytkowników, zarządzanych przez Supabase Auth. Każde konto będzie posiadało własny, odseparowany zbiór klastrów, preferencji, audytów i opcji, aby zapewnić pełną personalizację i bezpieczeństwo danych.

#### Architektura aplikacji

- Strona dla bazy wiedzy Kryptonum (edycja, dodawania etc)
- Strona dla personalizacji
- Strona z widokiem wszystkich klastrów
- Strona główna (całe flow z geenrowaniem tematów i podtematów)
- Strona konkretnego podtematu / artykuło (edytor)

#### Flow aplikacji

- Wysokopoziomy flow aplikacji został opisany za pomocą diagramu Mermaid w /.ai/application-flow.md
- Zaczynając na głównej stronie mamy trzy możliwość wybrania tematu:
  - Możemy wygenerować temat z AI, wtedy AI patrzy na obecne tematy które mamy w klastrach i na podstawie tego generuje następny temat, który warto uwzględnić w bazie klastrów, temat to zwykły string. (Tutaj po wygenerowaniu tematu musimy go zatwierdzić ręcznie)
  - Możemy wpisać temat ręcznie (tutaj po wpisaniu tematu i zatwierdzeniu go, przechodzimy przez weryfikacje z AI, jeśli AI nie ma zastrzezen idziemy dalej, jeśli jednak ma jakieś zastrzeżenia, tzn, temat powtarza sie już w jednym z klastór, albo ma jakąś listerówkę, informujemy o tym użytkownika, ale nie blokujemy, tzn. dalejmy informacje i użytkownik ma dwa wyjścia, albo zminić temat ręcznie, albo przejść dalej)
  - Możemy też wybrać istniejący już temat z bazy klastrów
- Kiedy mamy już temat i go zaakceptujemy na podstawnie tego tematu AI generuje nam X (ilość wybieramy w opcjach) podtematów które pasują tematycznie do tego tematu oraz są zgodne z wartościamy firmy, tym jakie zasoby firma już publikuje oraz preferencjami użytkownka.
  - Propozycje podtematów możemy odrzucać, możemy też generować je ręcznie. Możemy również powtarzać całe generowanie za pomocą przycisku, jeżeli odrzucimy wszytkie propozycje, pojawia się opcja albo resetowania tematu, czyli przejścia do stanu bazowego sprzed wyboru tematu, albo ponownego generowania propozycji podteamtów, powwiniśmy gdzsieś w sesji trzymać informacje jakie propozycje odrzuciliśmy, tak, że by nie genrować ich ponownie.
  - Propozycje następnie możemy zatwierdzić przyciskiem, jeżeli mamy jakieś ręcznie dodane propozycje AI przejdzie przez nie i tak jak w flow tematu, sprawdźi czy nie mamy już podobnym poteamtów w klastrze oraz czy w porpozycji nie ma literówek
- Kiedy zatwierdziliśmy X propozycji, przechodzimy do następnego stanu, w którym do każdej propozycji w tym samym czasie generujemy kocenpt (opisany wyżej), wszytko dzieje sie w tym samym czasie, czyli np. mamy zakładkę z listą 8 propozcyji i możemy mieć wgląd w każdy kocenpt.
  - Kiedy koncept skończy generowanie, zostanie automatycznie dodany do klastra z obecnym tematem.
  - Możemy dany koncept usunąć, możemy ręcznie modyfikować wszysktie pola któr stworzyło AI (nagłówki, opis etc.), możemy również poprosić AI o ponowne generowania konceptu dla danego podteamtu, wtedy generuje wszytko jeszcze raz, wszyskie pola
  - Kiedy usuwany koncept, jest on odrazu usuwany też z bazy danych klastra
  - Koncepty generują się w tle, to znaczy, że mając klientową apke z Reactem i Astro, możemy przejść na inne podstrony, ale nie możemy zamykać aplikacji, najelpiej jakbyśmy w tym przypadku dosatli jakiś popup, czy na pewno chcemy zamknąć aplikacji i informacje ze nie wygenerowanie jeszcze kocenpty się nie zapiszą.
  - Kiedy wszystkie koncepty się już wygenerują nie dzieje się nic spektakularnego. Po porstu mamy możliwość resetowania workflow bez straty zadnego konceptu
  - Po wygenerowaniu jakiegokolwiek konceptu możemy przejść na strone konkretnego konceptu czyli np. /www.xyz.com/{nazwa klastra}/{slug podtematu} (dodatkowo każdy kocnept powinien mieć w sobie slug).

#### Strona konkretnego konceptu / artykułu

- Jeżeli konkretny podtemat / artykuł jest w jakimś klastrze to ma swoją podstronę. Możemy na taką postronę wejsć, tam będzie czekać na użytkownika edytor markdown tego artykułu, oraz mozliwość edytowania pozostałych pól nie związanych z samym tesktem artykułu, tzn. slug, tytuł, opis, tytuł SEO i opis SEO
- Mamy do dyspozycji edytor markdown do ręcznego edytowania artykułu oraz panel z czatem z AI, tak jak np. w przypadku Cursora dla programistów, możemy rozmawaić z AI, on tworzy zmiany w tekscie jakie chcemy, my widzimy zmiany (np. zielony backgropudn dla dodanych, czerwony dla usuniętych). Możemy je zaakceptować, odrzucić albo pisać dalej żeby je skorygować.
- Możemy tworzyć też gotowe audyty, tzn, możemy stworzyć np. "Audyt SEO" wpisujemy tam określony prompt, żeby przejrzał całą zawartość artykułu pod kontem X, on to robi a później daje nam feedback, w tym samym czasie proponuje zmiany i czeka na naszą odpowiedz lub akceptacje
- Każdy artykuł w klastrze ma swój stan, tzn, może to być koncept albo już artykuł który jest w stanie roboczym, czyli coś do nieog dodaliśmy, może być też już przerzucony do Sanity - o tym za chwilę, czyli 3 stany arrtykułu.

### Co NIE wchodzi w zakres MVP

- Research konkurencjji, możemy podwać linki do artykułów konkruencji manualnie w rozmowie z AI, ale głębszy research, np. Ahrefs API nie wchodzi w skład MVP
- Niestandardowe komponenty w edytorze konkretnego artykułu. W sanity oprócz zwykłego tesktu możemy mieć niestandardowe komponenty, np. zdjęcia, listy z ptaszkami etc. W przyszłości dodamy takie komponenty do tej aplikacji, jednak to nie będzie w MVP
- Autentykacja: na moment MVP aplikacja będzie działać tylko wewnętrznie w Kryptonum

### Kryteria sukcesu

- 75% tematów generowanych za pomocą AI jest akceptowana przez użytkownika
- Mniej niż 10% podtematów generowanych przez AI jest manualnie usuwana przez użytkownika.
- Mniej niż 25% konceptów generowanych przez AI jest zmieniana w fazie konceptów albo usuwana przez użytkownika
