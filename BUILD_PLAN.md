# GlobeTrotr — bouwplan na de huidige release

**Stand: 22 september 2026**

Dit is het werkplan voor de volgende ontwikkelrondes. De actuele productie-uitrol blijft in [IMPLEMENTATION_PENDING.md](IMPLEMENTATION_PENDING.md). De onderbouwing en concurrentievergelijking staan in [FEATURE_GAP_AND_EXPANSION.md](FEATURE_GAP_AND_EXPANSION.md).

## Werkafspraken

Bij iedere afgeronde stap:

1. bestaande architectuur en rechten hergebruiken;
2. databasewijziging in één nieuwe chronologische migratie zetten, vanaf **1490**;
3. een gerichte SQL-acceptatietest en waar zinvol een code-unit-test toevoegen;
4. Corporate Admin-releasechecklist aanvullen;
5. interne roadmap, publieke roadmap, technische changelog en publieke changelog bijwerken;
6. privacy, voorwaarden en bewaartermijnen controleren als nieuwe persoonsgegevens of leveranciers worden gebruikt;
7. `npm run verify`, `git diff --check` en waar nodig een productiebuild uitvoeren;
8. pas “gebouwd” schrijven als code en tests slagen; pas “uitgerold” schrijven na de praktijktest.

## Eerst: huidige release afronden

- [ ] Migratie en test 1480 uitvoeren.
- [ ] Node-01 web en Caddy uitrollen.
- [ ] Website ↔ portal op mobiel en desktop controleren.
- [ ] De open productieacceptatie uit `PRE_RELEASE.md` uitvoeren.
- [ ] Huidige wijzigingenset committen voordat een nieuwe functierelease begint.

Hierna krijgt iedere functierelease een eigen migratienummer, test en duidelijke commit. Nieuwe functies worden niet aan de nog open portalrelease toegevoegd.

## Release 1 — reisopties vergelijken

**Doel:** handmatig meerdere verblijven, vluchten, treinritten, auto’s en activiteiten als kandidaat opslaan en eerlijk vergelijken, zonder externe provider.

### Bouwen

- [x] Tabellen voor reisopties, prijzen, voorwaarden, bron en controletijd (lokaal gebouwd; migratie 1490 nog uitrollen).
- [x] RLS voor eigenaar, planner, finance, viewer en Agency-rechten.
- [x] Optietypes: verblijf, vlucht, trein/bus, huurauto en activiteit.
- [x] Valuta, totaalprijs, belastingen/toeslagen, flexibiliteit en notities.
- [x] Vergelijkvenster met maximaal vier opties naast elkaar.
- [x] Filters en sortering op prijs, duur, afstand en annuleringsinformatie.
- [x] Gekozen optie na bevestiging omzetten naar een bestaande boeking.
- [x] Verworpen optie archiveren zonder historische beslissing te verliezen.
- [x] Mobiele kaartweergave in plaats van een te brede tabel.

### Klaar wanneer

- [ ] Twee reisleden zien alleen toegestane opties.
- [x] Een viewer kan niets wijzigen (RLS, serverrechten en alleen-lezen UI).
- [ ] Valuta en onbekende toeslagen worden niet misleidend vergeleken.
- [x] Omzetten maakt exact één boeking en blijft idempotent (unit-test geslaagd).
- [ ] Corporate Admin-check `trip.options-comparison` slaagt.

## Release 2 — groepsbesluiten

**Doel:** samen een hotel, activiteit of andere optie kiezen zonder losse chats.

### Bouwen

- [ ] Reacties bij een reisoptie.
- [ ] Peiling met meerdere keuzes en optionele deadline.
- [ ] Stem wijzigen of intrekken zolang de peiling open is.
- [ ] Alleen een bevoegde rol maakt een keuze definitief.
- [ ] Meldingen bij nieuwe peiling, deadline en definitieve keuze.
- [ ] Auditregels zonder gevoelige berichtinhoud te dupliceren.

### Klaar wanneer

- [ ] Dubbele stemmen technisch onmogelijk zijn.
- [ ] Verwijderde leden geen toegang houden.
- [ ] E-mail- en in-appmeldingen NL/EN volgen.
- [ ] Corporate Admin-check `trip.option-decisions` slaagt.

## Release 3 — veilige Agency-klantformulieren

**Doel:** een Agency kan ontbrekende reisgegevens gestructureerd en veilig opvragen.

### Bouwen

- [ ] Formuliersjablonen per Agency.
- [ ] Veldtypen met vereist/optioneel, doel, zichtbaarheid en bewaartermijn.
- [ ] Beveiligde, intrekbare klantlink met vervaldatum.
- [ ] Antwoorden als aparte conceptgegevens opslaan.
- [ ] Bevoegde medewerker controleert en verwerkt velden naar klant of reis.
- [ ] Auditlog, export, verwijdering en privacyarchief aansluiten.
- [ ] Verbieden van betaalkaart- en authenticatiegeheimen in formulieren.

### Klaar wanneer

- [ ] Twee Agency’s elkaars formulieren en antwoorden niet kunnen lezen.
- [ ] Verlopen of ingetrokken links niets meer tonen.
- [ ] Publieke formulierpagina mobiel en met toetsenbord werkt.
- [ ] Privacyverklaring en bewaarbeheer zijn bijgewerkt.
- [ ] Corporate Admin-check `agency.client-forms` slaagt.

## Release 4 — rijke Agency-contentbibliotheek

**Doel:** bestaande eenvoudige sjablonen uitbreiden zonder dubbele invoer.

### Bouwen

- [ ] Contenttypes: bestemming, accommodatie, activiteit, dagblok, tekst en media.
- [ ] Organisatiebrede en persoonlijke conceptstatus.
- [ ] Tags, taal, versie, eigenaar en laatst gecontroleerd.
- [ ] Preview en selectief toevoegen aan offerte of reis.
- [ ] Bron- en licentievelden voor externe afbeeldingen en teksten.
- [ ] Bestaande itinerary-, packing- en message-sjablonen behouden.

### Klaar wanneer

- [ ] Oude sjablonen zonder conversieverlies blijven werken.
- [ ] Alleen bevoegde medewerkers publiceren of archiveren.
- [ ] Een update verandert niet stilzwijgend bestaande reizen.
- [ ] Corporate Admin-check `agency.content-library` slaagt.

## Release 5 — boekingsmail naar concept

**Doel:** doorgestuurde bevestigingen veilig verwerken zonder een volledige inbox te scannen.

### Bouwen

- [ ] Uniek, intrekbaar ontvangstadres per reis.
- [ ] Alleen doorgestuurde berichten van toegestane afzenders accepteren.
- [ ] HTML, tekst en ondersteunde bijlagen via bestaande mail- en malwarescan verwerken.
- [ ] Hotel, vlucht, trein, auto en activiteit herkennen.
- [ ] Herkende velden, onzekerheden en bron tonen in een reviewvenster.
- [ ] Dubbele bevestiging, wijziging en annulering herkennen.
- [ ] Nooit automatisch opslaan zonder bevestiging.
- [ ] Brontekst en bijlagen volgens een expliciete bewaartermijn opruimen.

### Klaar wanneer

- [ ] Een onbekende of dubbel doorgestuurde mail geen dubbele boeking maakt.
- [ ] Parserfouten geen inhoud in logs lekken.
- [ ] Gebruiker ieder veld kan corrigeren of negeren.
- [ ] Privacyverklaring, mailvoorwaarden en verwijdering zijn bijgewerkt.
- [ ] Corporate Admin-check `trip.booking-mail-drafts` slaagt.

## Release 6 — web-push en periodieke vluchtcontrole

**Doel:** belangrijke informatie tijdig leveren zonder de app open te houden.

### Bouwen

- [ ] Web Push-abonnement per apparaat met intrekken en verval.
- [ ] Voorkeur per gebeurtenistype en per reis.
- [ ] Workerjob voor toekomstige vluchten binnen een begrensd venster.
- [ ] Wijzigingsdetectie voor status, tijd, gate, terminal en annulering.
- [ ] Dedupe, cooldown en providerquotum.
- [ ] Bezorgstatus zonder gevoelige vluchtgegevens in pushpayload.

### Klaar wanneer

- [ ] Geen melding bij onveranderde vluchtdata wordt verstuurd.
- [ ] Verlopen abonnementen automatisch worden opgeruimd.
- [ ] Free/Pro-limieten en provideruitval duidelijk worden afgehandeld.
- [ ] Corporate Admin-check `notifications.web-push-flight` slaagt.

## Release 7 — offline Vandaag en uitgaven

**Doel:** de essentiële reisgegevens bewust downloaden voor gebruik zonder verbinding.

### Bouwen

- [ ] Installeerbare PWA en versieerbare service worker.
- [ ] Per reis expliciet offlinepakket downloaden en verwijderen.
- [ ] Vandaag, adressen, boekingen en geselecteerde documenten lezen.
- [ ] Uitgaven offline toevoegen aan een lokale wachtrij.
- [ ] Synchronisatiestatus, laatste update en opslaggebruik tonen.
- [ ] Conflicten nooit stilzwijgend overschrijven.
- [ ] Lokale gevoelige gegevens minimaliseren en waar haalbaar versleutelen.

### Klaar wanneer

- [ ] Vliegtuigmodus op een echt Android- en iOS-apparaat is getest.
- [ ] Uitloggen en accountverwijdering lokale pakketten wissen.
- [ ] Een conflict een begrijpelijke keuze toont.
- [ ] Corporate Admin-check `trip.offline-pack` slaagt.

## Release 8 — één accommodatieprovider

**Voorwaarde:** partnergoedkeuring, API-sleutel, commissieregels, attributie, privacycontrole en prijsweergaveregels zijn geregeld.

### Bouwen

- [ ] Provideradapter op Node-02; geen secrets of providercalls vanuit de browser.
- [ ] Zoekcriteria vanuit reisstop, data en reizigers vooraf invullen.
- [ ] Totaalprijs, bekende toeslagen, voorwaarden, afstand en controletijd tonen.
- [ ] Resultaat opslaan als provider-onafhankelijke reisoptie.
- [ ] Doorsturen naar provider met duidelijke commerciële melding.
- [ ] Cache, quota, time-outs, retries en meetbare foutcategorieën.
- [ ] Providergegevens verwijderen wanneer een optie wordt verwijderd.

### Klaar wanneer

- [ ] Geen prijs zonder valuta, controletijd en voorwaarden wordt getoond.
- [ ] De gebruiker ziet dat beschikbaarheid en prijs kunnen wijzigen.
- [ ] Provideruitval de bestaande reisplanner niet blokkeert.
- [ ] Privacy- en cookie-informatie vóór activering zijn bijgewerkt.
- [ ] Corporate Admin-check `search.accommodation-provider` slaagt.

## Daarna beoordelen, nog niet automatisch bouwen

- Tweede accommodatieprovider en echte metasearch.
- Vlucht- en autohuurprijzen.
- Activiteiten en beschikbaarheid.
- Prijsalerts en flexibele data.
- Plaatsen langs de route en openingstijden.
- GPX-import.
- Reisdagboek.
- Routeoptimalisatie.
- Zakelijke reisaanvragen, beleid en goedkeuringen.
- CO₂-inzicht.
- AI-reisplanning.

Voor elk van deze onderwerpen wordt eerst gecontroleerd of echte gebruikers het nodig hebben, welke provider en overeenkomst nodig zijn, welke persoonsgegevens worden gedeeld en wat de operationele supportlast wordt.

## Eerstvolgende bouwactie

**Release 1 — reisopties vergelijken** is lokaal gebouwd en automatisch gecontroleerd. Eerst volgen migratie 1490 en de productieacceptatie uit `IMPLEMENTATION_PENDING.md`. Daarna start **Release 2 — groepsbesluiten** op de opgeslagen reisopties; zo krijgt samenwerking één duidelijke volgende stap zonder de open uitrol te vergroten.
