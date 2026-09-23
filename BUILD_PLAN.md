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

- [x] Migratie en test 1480 uitgevoerd (volgens de laatste bevestiging van de eigenaar).
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
- [x] Reisvergelijker met relevante vragen per categorie: verblijf, vlucht, trein/bus, huurauto en activiteit (nieuwe details vereisen migratie 1500).
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
- [ ] Corporate Admin-check `trip.options-comparison` slaagt na migraties 1490/1500 en een praktijktest.

## Release 2 — groepsbesluiten

**Doel:** samen een hotel, activiteit of andere optie kiezen zonder losse chats.

### Bouwen

- [x] Reacties bij een reisvergelijkerkandidaat (SQL uitgevoerd; praktijktest nog open).
- [x] Peiling met twee tot vier keuzes en optionele deadline (SQL uitgevoerd; praktijktest open).
- [x] Stem wijzigen of intrekken zolang de peiling open is (lokaal gebouwd; praktijktest open).
- [x] Alleen een bevoegde planner maakt een keuze definitief (lokaal gebouwd; praktijktest open).
- [x] In-appmeldingen bij nieuwe peiling, deadline en definitieve keuze (SQL uitgevoerd; praktijktest open).
- [x] Auditregels voor starten, stemmen, wijzigen, intrekken en afsluiten zonder gevoelige berichtinhoud te dupliceren (lokaal gebouwd; praktijktest open).

### Klaar wanneer

- [ ] Dubbele stemmen technisch onmogelijk zijn.
- [ ] Verwijderde leden geen toegang houden.
- [ ] E-mail- en in-appmeldingen NL/EN in productie bevestigd zijn (lokaal gebouwd; praktijktest open).
- [ ] Corporate Admin-check `trip.option-decisions` slaagt.

## Release 3 — veilige Agency-klantformulieren

**Doel:** een Agency kan ontbrekende reisgegevens gestructureerd en veilig opvragen.

### Bouwen

- [x] Formuliersjablonen per Agency (SQL uitgevoerd; praktijktest open).
- [x] Veldtypen met vereist/optioneel, doel en bewaartermijn.
- [x] Beveiligde, intrekbare klantlink met vervaldatum.
- [x] Antwoorden als aparte conceptgegevens opslaan.
- [x] Bevoegde medewerker controleert en verwerkt antwoorden naar klantvoorkeuren.
- [x] Auditlog, JSON-export, archivering en automatische verwijdering aansluiten.
- [x] Betaalkaart-, wachtwoord- en authenticatiegeheimvelden blokkeren en publiek waarschuwen.

### Klaar wanneer

- [ ] Twee Agency’s elkaars formulieren en antwoorden niet kunnen lezen.
- [ ] Verlopen of ingetrokken links niets meer tonen.
- [ ] Publieke formulierpagina mobiel en met toetsenbord werkt.
- [ ] Privacyverklaring en bewaarbeheer zijn bijgewerkt.
- [ ] Corporate Admin-check `agency.client-forms` slaagt.

## Release 4 — rijke Agency-contentbibliotheek

**Doel:** bestaande eenvoudige sjablonen uitbreiden zonder dubbele invoer.

### Bouwen

- [x] Contenttypes: bestemming, accommodatie, activiteit, dagblok, tekst en media.
- [x] Organisatiebrede en persoonlijke conceptstatus.
- [x] Tags, taal, versie, eigenaar en laatst gecontroleerd.
- [x] Preview en selectief toevoegen aan offerte of reis; een vaste versie wordt eenmaal toegevoegd en bestaande inhoud blijft intact.
- [x] Bron- en licentievelden voor externe afbeeldingen en teksten.
- [x] Bestaande itinerary-, packing- en message-sjablonen behouden.

### Klaar wanneer

- [x] Oude sjablonen blijven naast de bibliotheek bestaan zonder conversie.
- [x] Alleen medewerkers met `trips_plan` publiceren, toepassen of archiveren; persoonlijke concepten blijven bij de eigenaar.
- [x] Een nieuwe versie verandert bestaande reizen niet stilzwijgend en kan per doel slechts eenmaal worden toegepast.
- [ ] Corporate Admin-checks `agency.content-library` en `agency.content-application` in productie uitvoeren.

## Release 5 — boekingsmail naar concept

**Doel:** doorgestuurde bevestigingen veilig verwerken zonder een volledige inbox te scannen.

**Tijdelijke productiestatus:** uitgeschakeld via `TRIP_BOOKING_MAIL_ENABLED=false` totdat Hetzner uitgaand TCP 25 heeft vrijgegeven en de Stalwart/MX-acceptatie is afgerond. De UI toont gedurende deze periode een duidelijke melding en de server blokkeert mutaties.

### Bouwen

- [x] Uniek, intrekbaar ontvangstadres per reis.
- [x] Alleen doorgestuurde berichten van toegestane afzenders accepteren.
- [x] HTML, tekst en ondersteunde bijlagen via bestaande mail- en malwarescan verwerken.
- [x] Hotel, vlucht, trein, auto en activiteit herkennen.
- [x] Herkende velden, onzekerheden en bron tonen in een reviewvenster.
- [x] Dubbele bevestiging, wijziging en annulering herkennen.
- [x] Nooit automatisch opslaan zonder bevestiging.
- [x] Brontekst en bijlagen volgens een expliciete bewaartermijn opruimen.

### Klaar wanneer

- [ ] Een onbekende of dubbel doorgestuurde mail geen dubbele boeking maakt.
- [ ] Parserfouten geen inhoud in logs lekken.
- [x] Gebruiker ieder herkend veld kan corrigeren of het concept negeren.
- [x] Privacyverklaring, mailstatus, bewaartermijn en verwijdering zijn bijgewerkt.
- [ ] Corporate Admin-check `trip.booking-mail` slaagt.

## Release 6 — web-push en periodieke vluchtcontrole

**Doel:** belangrijke informatie tijdig leveren zonder de app open te houden.

### Bouwen

- [x] Web Push-abonnement per apparaat met intrekken, beperkte retries, verlopen endpoints en privacyvriendelijke payload (SQL uitgevoerd; VAPID-productieproef open).
- [x] Bestaande vluchtvoorkeur per reis wordt vóór aanmaak van de melding afgedwongen.
- [x] Workerjob voor Pro/Agency-vluchten binnen zeven dagen, met maximaal twintig claims per cyclus.
- [x] Wijzigingsdetectie voor status, tijd, gate, terminal en annulering via providerstatus.
- [x] Dedupe, tien minuten cooldown, dynamisch controle-interval en exponentiële providerbackoff.
- [x] Bezorgstatus zonder gevoelige vluchtgegevens in pushpayload.

### Klaar wanneer

- [x] Geen melding bij een basislijn of onveranderde vluchtdata.
- [x] Verlopen abonnementen worden automatisch ingetrokken en later verwijderd.
- [x] Free wordt niet automatisch gecontroleerd; Pro/Agency en provideruitval zijn begrensd.
- [ ] Corporate Admin-checks `notifications.web-push` en `notifications.flight-monitoring` slagen na productieproef.

## Release 7 — offline Vandaag en uitgaven

**Doel:** de essentiële reisgegevens bewust downloaden voor gebruik zonder verbinding.

### Bouwen

- [x] Installeerbare PWA-basis en versieerbare serviceworker die alleen de publieke offline shell cachet (lokaal gebouwd; productieproef open).
- [x] Per reis expliciet offlinepakket downloaden, bijwerken en verwijderen (SQL uitgevoerd; productieproef open).
- [x] Route, planning en praktische boekingsinformatie voor iedere reisdag lezen; bedragen, boekingscodes en documenten zijn bewust uitgesloten.
- [x] Uitgaven offline toevoegen aan een begrensde lokale wachtrij en pas na een expliciete keuze synchroniseren.
- [ ] Synchronisatiestatus en opslaggebruik tonen; de laatste lokale update is al zichtbaar.
- [x] Conflicten nooit stilzwijgend overschrijven: alleen nieuwe UUID's worden samengevoegd en bij een mislukte serverwrite blijft de volledige wachtrij lokaal staan.
- [x] Lokale gevoelige gegevens minimaliseren; het pakket bevat geen bedragen, boekingscodes of documenten.

### Klaar wanneer

- [ ] Vliegtuigmodus op een echt Android- en iOS-apparaat is getest.
- [x] Uitloggen en accountverwijdering lokale pakketten wissen (codepad gebouwd; productieproef open).
- [x] Een conflict stopt synchronisatie met een begrijpelijke melding en behoudt de lokale invoer.
- [ ] Corporate Admin-check `trip.offline-today` slaagt.

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
- GPX-import is gebouwd; migratie en test 1640 zijn uitgevoerd. Webuitrol en productieacceptatie staan open.
- Reisdagboek.
- Routeoptimalisatie.
- Zakelijke reisaanvragen, beleid en goedkeuringen.
- CO₂-inzicht.
- AI-reisplanning.

Voor elk van deze onderwerpen wordt eerst gecontroleerd of echte gebruikers het nodig hebben, welke provider en overeenkomst nodig zijn, welke persoonsgegevens worden gedeeld en wat de operationele supportlast wordt.

## Eerstvolgende bouwactie

**Live hotels zoeken** is de volgende integratielijn na de GPX-uitrol. Eerst worden één officiële provider, partnervoorwaarden, quota, totaalprijsvelden, caching en privacygrenzen vastgelegd. Daarna volgt zoeken vanuit bestemming, data en reizigers, opslaan als provider-onafhankelijke vergelijkingsoptie en gecontroleerd doorsturen om bij de aanbieder te boeken. Rechtstreeks boeken en meerdere providers volgen pas na bewezen gebruik.
