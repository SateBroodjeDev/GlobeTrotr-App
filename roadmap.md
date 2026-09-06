# GlobeTrotr roadmap

GlobeTrotr is in de eerste plaats een reisplanner voor vriendengroepen, koppels en families. Agency-functionaliteit blijft als premium optie beschikbaar voor reisorganisaties.

> **Legenda:** `[x]` is gebouwd en beschikbaar. `[ ]` is gepland. Nieuwe werkzaamheden staan vanaf “Gepland” op prioriteit: **P0** eerst, daarna **P1** en **P2**.

# ✅ Al gebouwd

## Fase 1 — Accounts, privacy & dataopslag (klaar)

- [x] E-mailregistratie, inloggen en uitloggen via Supabase Auth
- [x] Privé workspace per account met Row Level Security
- [x] Eén workspace-document per account; reizen, leden, instellingen en abonnement staan samen in `data`
- [x] Cloud-sync van reizen en instellingen, met lokale cache per account
- [x] Publieke homepage voor bezoekers zonder account

## Fase 2 — Reizen plannen (klaar)

- [x] Reizen aanmaken, archiveren en heractiveren
- [x] Start- en einddatum van een reis wijzigen, met validatie van de datums
- [x] Bestemmingen zoeken en toevoegen op de Leaflet-routekaart
- [x] Dagplanning, afteller, paklijsten en reisstatus
- [x] Weerinformatie per bestemming
- [x] Reisonderdelen toevoegen: vlucht, overnachting, vervoer/reis en activiteit
- [x] Aanbieder, boekingsnummer, datum(s), notities, kosten en valuta opslaan per reisonderdeel
- [x] Geselecteerde vertrek-, aankomst- en verblijflocaties automatisch met de kaart synchroniseren

## Fase 3 — Vluchten (deels klaar)

- [x] Vluchtnummer en vluchtstatus bewaren bij een vlucht
- [x] Server-side koppeling met Aviationstack voor actuele vluchtinformatie
- [x] API-sleutel blijft buiten de browser via `AVIATIONSTACK_API_KEY`
- [ ] `AVIATIONSTACK_API_KEY` als server-secret instellen in de productieomgeving
- [ ] Live vertrek-/aankomsttijden en eventuele gate/terminal uitgebreider tonen
- [ ] Automatisch periodiek verversen van vluchtstatus voor reizen die binnenkort vertrekken

## Fase 4 — Groepen & geld (klaar)

- [x] Reizigers beheren en kosten eerlijk verdelen met zo min mogelijk terugbetalingen
- [x] Multi-valuta, live koersomrekening en valutaconversie
- [x] Brandstof- en autokostencalculator
- [x] Kosten bij een reisonderdeel direct ook als gekoppelde uitgave opslaan
- [x] Gekoppelde kosten automatisch opruimen wanneer het reisonderdeel wordt verwijderd

## Fase 5 — Delen (klaar)

- [x] Een individuele reis openbaar maken of weer privé zetten
- [x] Publieke reispagina via een niet-voorspelbare token-URL
- [x] Openbare reizen tonen op de homepage
- [x] PIN-beveiliging per gedeelde reis
- [x] Budget per openbare reis wel of niet delen

## Fase 6 — Documenten & export (deels klaar)

- [x] CSV- en JSON-back-up/export
- [x] Printklare reisgids met Google Maps-navigatie per stop
- [x] PDF-reisoverzicht
- [ ] Bonnetjes uploaden en koppelen aan een uitgave (de beveiligde opslagregels bestaan al)
- [ ] Boekingsbevestigingen als document koppelen aan een reisonderdeel

## Fase 7 — Abonnementen & Agency (deels klaar)

- [x] Free-, Pro- en Agency-plannen met accountgebonden cloudopslag
- [x] Plan wijzigen met bevestigde opslag in Supabase
- [x] Agency-only: white-label, rollen, analytics en declarabele klantuitgaven
- [ ] Betalingen, facturen en abonnementstatus koppelen aan een betaalprovider, bijvoorbeeld Stripe
- [ ] Server-side verificatie van de abonnementstatus via webhooks

# 🧭 Gepland, op prioriteit

## Productprincipes voor de volgende fases

- Groepsfunctionaliteit moet ook zonder Agency-plan volledig bruikbaar blijven.
- Geld tussen reizigers is iets anders dan een betaling aan een reisorganisatie; beide krijgen een eigen stroom en eigen rechten.
- Boekingsbevestigingen, paspoortgegevens en betaalgegevens zijn privacygevoelig. Sla nooit ruwe kaartgegevens op en beperk toegang per reis en lid.
- Nieuwe data blijft onderdeel van het workspace-`data`-document, tenzij een functie aantoonbaar een aparte, beveiligde opslag of webhook-administratie nodig heeft.

## Besloten technische keuzes

- Transactionele app-e-mails (uitnodigingen, herinneringen en referrals) lopen via **Lovable Cloud Emails**.
- Het verzenddomein wordt `globetrotr.nl`, met een afzender zoals `noreply@globetrotr.nl`.
- API-sleutels, SMTP-wachtwoorden en andere secrets komen nooit in browsercode of het workspace-`data`-document.
- Stripe is de beoogde betaalprovider voor GlobeTrotr-abonnementen en Agency-facturen; deze koppeling volgt pas nadat uitnodigingen en veilige reisrechten bestaan.

## Definitieve uitvoeringsvolgorde

1. **Reisinstellingen**: de overzichtelijke Instellingen-tab afronden.
2. **Veilige samenwerking**: toegang, rollen en uitnodigingstokens per reis ontwerpen en server-side afdwingen.
3. **Lovable-e-mail**: domein verifiëren, templates maken en de echte uitnodigingsstroom activeren.
4. **Boekingen & documenten**: opslag, tickets en boekingsimport toevoegen.
5. **Geldstromen**: groeps-betaalverzoeken, daarna Stripe en Agency-facturen.
6. **Reis onderweg**: routeoptimalisatie, offline toegang, meldingen en taalkeuze.
7. **Groei**: referrals, prijsvergelijking, AI en de uitgebreide Agency-operatie.

## P0 — Reiservaring & instellingen (eerstvolgend)

- [ ] Nieuwe tab **Instellingen** binnen iedere reis, geen losse modal
- [ ] Verplaats reisnaam, start- en einddatum, budget en template naar deze tab
- [ ] Verplaats openbare/publicatie-instellingen, budget delen en PIN naar deze tab
- [ ] Plaats archiveren en verwijderen als afgeschermde acties onderaan de tab, met bevestiging
- [ ] Houd Reisschema uitsluitend gericht op dagplanning, boekingen en kosten

## P0 — Fundament voor samenwerking

De huidige ledenlijst wordt een echte groepsreis: uitnodigen, rollen en gelijktijdig plannen. Grote planners zoals Wanderlog en Roadtrippers behandelen samenwerken als kernfunctionaliteit, niet als Agency-extra. [Wanderlog](https://wanderlog.com/travel-maps) [Roadtrippers](https://roadtrippers.com/about/features/)

- [ ] Reizigers per e-mail uitnodigen voor één specifieke reis, zonder toegang tot alle reizen van de eigenaar
- [ ] Rollen per reis: eigenaar, bewerker, deelnemer en alleen-lezen
- [ ] Uitnodiging accepteren/weigeren en lid weer verwijderen
- [ ] Gedeelde, live wijzigingen met conflictveilige opslag en zichtbare “laatst gewijzigd door”-informatie
- [ ] Activiteitenlog: wie wijzigde een stop, boeking, planning of uitgave?
- [ ] Reacties en @mentions bij een reisonderdeel of dag in de planning
- [ ] Meldingsvoorkeuren per reis: uitnodigingen, wijzigingen, betaalverzoeken en vluchtalerts

## P0 — E-mail, uitnodigingen & logische rollen

De huidige knop “Uitnodigen” registreert alleen een lid in de workspace; echte bezorging en toegang bestaan nog niet. Dit onderdeel maakt de volledige, veilige stroom af.

- [ ] Lovable Cloud Emails activeren voor het project
- [ ] `globetrotr.nl` verifiëren in **Lovable Cloud → Emails** met de vereiste SPF/DKIM-records
- [ ] Branded templates maken voor uitnodiging, herinnering, referral en betaalverzoek, met verplichte afmeldvoet waar nodig
- [ ] Lovable’s server-side e-mailfunctie gebruiken; geen externe SMTP- of e-mailprovider toevoegen
- [ ] Uitnodigingsmail met persoonlijke naam, reisnaam, afzender en verlopen/eenmalige acceptatielink
- [ ] Uitnodiging accepteren via bestaand account of registratie; pas daarna toegang verlenen
- [ ] Uitnodigingen intrekken, opnieuw verzenden en verlopen laten zijn
- [ ] Rate limiting en auditlog voor e-mailverzending; geen mailadres uitlekken in foutmeldingen
- [ ] De huidige één-workspace-per-account-opzet uitbreiden met veilige toegang per reis, zodat een genodigde niet alle reizen van de eigenaar ziet

### Rollen voor vriendengroepen — Free en Pro

- [ ] **Eigenaar**: beheert de reis, leden, publicatie en verwijdering
- [ ] **Medereiziger**: plant mee, voegt boekingen/uitgaven toe en kan kosten verdelen
- [ ] **Kijker**: ziet alleen het reisschema en de kaart; geen kosten tenzij de eigenaar die expliciet deelt
- [ ] Free: beperkte groepsuitnodigingen en basisrechten; Pro: onbeperkte groepsleden, gezamenlijke uitgaven en volledige samenwerking
- [ ] Geen accountant-, declaratie- of klantrollen in de vriendengroep-interface

### Rollen voor Agency

- [ ] **Workspace-eigenaar**: abonnement, branding, team en alle reizen
- [ ] **Reisadviseur**: maakt en beheert klantreizen, offertes en reisonderdelen
- [ ] **Financiën**: facturen, betalingen, creditnota’s en commissies; geen branding of abonnement
- [ ] **Klant/reiziger**: alleen eigen reis, documenten, facturen en betaalverzoeken
- [ ] Rechten daadwerkelijk op de server afdwingen; een rol in de browser of in JSON is niet voldoende

## P0 — Boekingen, documenten & reis-inbox

TripIt en Wanderlog verminderen handmatig invoerwerk door bevestigingsmails te importeren; TripIt ondersteunt bovendien documenten zoals QR-codes en pdf’s bij een reis. [TripIt](https://www.tripit.com/web/free) [Wanderlog](https://wanderlog.com/lp/mobileLandingPage)

- [ ] Beveiligde documentopslag per reis voor tickets, hotelvouchers, verzekeringen, paspoorten en visa
- [ ] Upload van PDF, foto en QR-code bij een reisonderdeel
- [ ] Mobiele weergave van ticket/QR-code en belangrijke nooddocumenten
- [ ] Eigen boekingsinbox, bijvoorbeeld `jouwreis@import.globetrotr.app`, voor doorgestuurde bevestigingen
- [ ] Parser die vlucht-, hotel-, trein- en autohuurbevestigingen omzet naar een concept-reisonderdeel
- [ ] Handmatige controle vóór geïmporteerde boekingen en kosten definitief worden opgeslagen
- [ ] Koppeling met Gmail/Outlook pas na een expliciete privacy-, beveiligings- en toestemmingsontwerpkeuze
- [ ] Versleutelde velden en beperkte zichtbaarheid voor gevoelige documenten; bewaartermijn en verwijderfunctie

## P0 — Betalen, facturen & financiële administratie (Agency)

Voor Agency is dit de belangrijkste commerciële uitbreiding. Moderne agency-platforms maken facturen vanuit reisonderdelen, werken met termijnen en tonen betaal- en commissiestatus in één overzicht. [Travefy](https://travefy.com/blog-post/travefy-launches-all-new-crm-suite) [Travefy Agency](https://avanti.travefy.com/solutions/agency)

### Groepsreizen — geen Agency-plan nodig

- [ ] Betaalverzoek per uitgave of saldo, met betaal-link of QR-code
- [ ] Status per verzoek: concept, verzonden, deels betaald, betaald, verlopen en geannuleerd
- [ ] Handmatig markeren als betaald voor contant/Tikkie/bankoverschrijving
- [ ] Herinneringen voor openstaande groepsschulden
- [ ] Exporteerbaar overzicht voor degene die de groepskas beheert

### Agency — alleen Agency-plan

- [ ] Klantprofiel met contactgegevens, reisvoorkeuren en reisgeschiedenis
- [ ] Branded factuur maken vanuit geselecteerde reisonderdelen en kosten
- [ ] Factuurnummering, concept/verzonden/betaald/vervallen-status en PDF-bijlage
- [ ] Betaaltermijnen, aanbetaling, restbetaling en automatische betaalherinneringen
- [ ] Stripe Checkout/Payment Links gebruiken; GlobeTrotr bewaart geen kaartnummers
- [ ] Webhooks verifiëren en betaling idempotent verwerken voordat een factuur als betaald geldt
- [ ] Creditnota, handmatige correctie en auditlog
- [ ] BTW-velden, bedrijfsgegevens en valuta per factuur; lokale fiscale regels pas na juridisch advies per land
- [ ] Commissies, verwachte marge, ontvangen commissie en uitbetaling per leverancier
- [ ] Agency-financieel dashboard: omzet, openstaand, vervallen, commissie en marge

## P1 — Slimmere route, kaart & dagplanning

Roadtrippers optimaliseert de volgorde van stops, toont reistijd/brandstof en laat routes naar navigatie exporteren. Wanderlog koppelt locaties automatisch aan de kaart. [Roadtrippers](https://roadtrippers.com/about/features/) [Wanderlog](https://wanderlog.com/travel-maps)

- [ ] Stops slepen om de routevolgorde en dagplanning te wijzigen
- [ ] Afstand, reistijd en geschatte vervoerskosten tussen opeenvolgende stops
- [ ] Routeoptimalisatie met een duidelijk voorstel dat de gebruiker kan accepteren of terugdraaien
- [ ] Keuze voor auto, lopen, fiets, openbaar vervoer of vlucht per traject
- [ ] Navigatie-exportroutes naar Google Maps, Apple Maps en Waze
- [ ] Filters op de kaart: accommodatie, vervoer, activiteit, favoriet en geboekte locatie
- [ ] Opgeslagen ideeën/favorieten los van de definitieve planning
- [ ] Deelbare dagkaart of routekaart voor deelnemers
- [ ] Live verkeersinformatie alleen als er een geschikte provider en transparante kostenbasis is

## P1 — Reizen onderweg

Grote planners bieden offline toegang, kalenderintegratie en proactieve vluchtmeldingen; dit is vooral tijdens de reis waardevol. [TripIt](https://help.tripit.com/en/support/solutions/articles/103000063396-tripit-or-tripit-pro-) [Wanderlog](https://wanderlog.com/travel-maps)

- [ ] PWA-installatie en offline cache voor het actieve reisschema, kaart en documenten
- [ ] Offline wijzigingen in wachtrij zetten en veilig synchroniseren zodra verbinding terug is
- [ ] iCalendar-export en tweewegssynchronisatie pas na een technische haalbaarheidscheck
- [ ] Herinneringen: inchecken, vertrek naar luchthaven, hotel-check-in en activiteit
- [ ] Vluchtalerts voor vertraging, annulering, gate, terminal en bagageband zodra de dataprovider dit ondersteunt
- [ ] Tijdzonebewuste planning en lokale tijden bij elke boeking
- [ ] Noodkaart met lokale alarmnummers, ambassade, verzekering en ICE-contacten
- [ ] Reisinformatie-checklist: paspoortgeldigheid, visum, vaccinaties en reisverzekering — met bron en datum, geen juridisch advies

## P1 — Nederlands & English

- [ ] Taalinfrastructuur met Nederlandse en Engelse vertaalbestanden; geen losse hardcoded Engelse labels
- [ ] Taalkeuze in accountinstellingen en bij eerste bezoek, standaard Nederlands
- [ ] Taalkeuze ook opslaan in het workspace-`data`-document en toepassen op e-mails, publieke reispagina’s en exports
- [ ] Datums, bedragen, valuta en tijdzones tonen volgens de gekozen locale
- [ ] Nieuwe teksten alleen via vertaalkeys toevoegen; controle op ontbrekende vertalingen in de build

## P1 — Referral- en kortingsprogramma

- [ ] Persoonlijke referralcode en deelbare referral-link per account
- [ ] Betrouwbare attributie: referral vastleggen bij registratie, met verlooptermijn en fraudebeperking
- [ ] Dashboard met klikken, registraties, gekwalificeerde referrals en verdiend tegoed
- [ ] Beloning pas activeren wanneer de aangebrachte gebruiker aan een vooraf bepaalde voorwaarde voldoet, bijvoorbeeld eerste betaalde Pro-maand
- [ ] Korting als GlobeTrotr-tegoed met begin-, verval- en gebruiksdatum; geen directe gelduitkering in versie één
- [ ] Voorwaardenpagina, misbruikmeldingen en handmatige correctie door beheerder
- [ ] Automatisch toepassen op Stripe-facturen pas bouwen nadat Stripe en webhookverificatie uit de betaalfase bestaan

## P2 — Betere boekings- en reiskeuzes

- [ ] Beschikbaarheid en prijsvergelijking voor accommodatie, vervoer en activiteiten via gelicentieerde partner-API’s
- [ ] Meerdere voorstellen per reisonderdeel vergelijken en één optie goedkeuren
- [ ] Annuleringsvoorwaarden, bagagevoorwaarden en incheckdeadline zichtbaar bij de boeking
- [ ] Duurzaamheidsindicatoren: geschatte CO₂ per vervoerstraject en alternatieven
- [ ] Toegankelijkheids- en voorkeurstags, zoals kinderwagen, rolstoel, huisdier of dieetwens
- [ ] Groepspoll voor bestemming, accommodatie, activiteit of vervoerskeuze
- [ ] AI-reisassistent voor een eerste concept, gaten in de planning en praktische suggesties; altijd controleerbaar en nooit automatisch boeken

## P2 — Agency-operatie & schaalbaarheid

- [ ] Herbruikbare itinerary-, factuur-, e-mail- en paklijsttemplates
- [ ] Offertes met meerdere varianten, klantgoedkeuring en conversie naar een reis
- [ ] Klantportaal met alleen de relevante reis, documenten, facturen en betaalstatus
- [ ] Taken, deadlines en automatiseringen voor het Agency-team
- [ ] Supplier-/leveranciersbibliotheek en contentbibliotheek voor veelgebruikte hotels en activiteiten
- [ ] Rapportages over conversie, omzet, marge, commissie en klanttevredenheid
- [ ] Webhook-/integratielaag voor boekhoudpakket, CRM en betaalprovider
- [ ] Rate limiting, auditlogs, back-ups, export/verwijderverzoeken en herstelproces voor productiegegevens
