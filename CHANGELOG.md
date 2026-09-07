# GlobeTrotr changelog

Technisch wijzigingsoverzicht voor GitHub en beheerders. De publieke, gebruikersgerichte versie staat op `/changelog`.

Tijden gebruiken `Europe/Amsterdam` (CEST/CET). Nieuwe vermeldingen komen bovenaan. Noteer databasewijzigingen, benodigde migraties en uitgevoerde controles; zet geen secrets, persoonsgegevens of interne tokens in dit bestand.

## 2026-09-07 19:30 CEST — Basis voor internationale beta

### Gebruikerservaring

- Een globale NL/EN-keuze volgt de browsertaal en wordt voor ingelogde gebruikers in het profiel opgeslagen.
- Homepage, e-mailauthenticatie, openbare reizen, hoofdnavigatie, footer, privacy en beta-voorwaarden zijn tweetalig gemaakt.
- Datums en bedragen op openbare reizen volgen de gekozen taal.
- Privacy-informatie en beta-voorwaarden zijn vanuit de footer bereikbaar.
- OAuth-knoppen zijn verborgen zolang OAuth bewust buiten deze beta valt.
- Opslaanknoppen voor het wachtwoord en de reisinstellingen hebben meer afstand tot de velden erboven.

### Controles

- Zeven geautomatiseerde tests geslaagd.
- Productiebuild voor client, SSR en Cloudflare geslaagd.
- De bestaande waarschuwingen over TanStack `inputValidator()` en de grote hoofdbundle blijven als technisch onderhoud openstaan.

## 2026-09-07 18:50 CEST — Rustigere publieke reisheader

### Gebruikerservaring

- Een reis kan vanuit Reisinstellingen een omschrijving van maximaal 500 tekens krijgen.
- De openbare reis toont deze omschrijving in de hero. Zonder omschrijving verschijnt een korte samenvatting van het aantal bestemmingen en landen.
- De lange bestemmingenketen is uit de hero verwijderd.
- De lijst naast de kaart toont eerst vier bestemmingen en heeft een knop om de volledige route te openen.

### Backend en database

- `20260907170000_trip_description.sql` voegt `trips.description` met een lengtelimiet toe en neemt het veld op in de versiegestuurde opslag.
- De publieke endpoint levert de omschrijving mee, maar blijft uitgaven, betalers, bonnetjes en boekingsdetails uitsluiten.

## 2026-09-07 18:45 CEST — Changelog gereedmaken voor testopening

### Releaseproces

- Publieke releases hebben nu een herkenbare bèta-versie.
- De changelogpagina toont de actuele testfase en vermeldt dat OAuth en automatische app-e-mails bewust buiten de eerste testopening vallen.
- Automatische tests controleren unieke release-ID's en versies, expliciete tijdzones, nieuwste-eerst-volgorde, volledige teksten en gevoelige termen.
- GitHub Actions voert bij iedere push en pull request de tests en productiebuild uit.
- Een pull-requesttemplate bewaakt handmatige controles, mobiele weergave en beide changeloglagen.

### Controles

- Zeven geautomatiseerde tests geslaagd.
- Productiebuild geslaagd.

## 2026-09-07 18:40 CEST — Publieke reisbeleving en changelog

### Gebruikerservaring

- De publieke reisweergave heeft een hero, interactieve routekaart, klikbare bestemmingen, dagkaarten, verzorgde statusweergaven en een duidelijkere call-to-action gekregen.
- Aankomstdata en verblijfsduur worden openbaar getoond wanneer de eigenaar deze bij een bestemming heeft ingevuld.
- De publieke endpoint blijft beperkt tot expliciet deelbare reisgegevens. Uitgaven, betalers, bonnetjes en boekingsdetails worden niet meegestuurd.
- Een publieke changelogpagina en footerlink zijn toegevoegd.

### Backend en database

- `20260907150000_fix_snapshot_column_ambiguity.sql` corrigeert ambigue kolomverwijzingen in `save_trip_snapshot`.
- `20260907160000_trip_snapshot_versions.sql` voegt versiecontrole toe voor reisopslag en verwijderen en trekt uitvoerrechten op de onbeschermde snapshotfunctie in.
- Reismutaties worden per reis op volgorde verstuurd. Na een conflict of onzekere netwerkfout worden verdere writes geblokkeerd totdat de pagina opnieuw is geladen.

### Controles

- Productiebuild geslaagd.
- Wachtrijtests voor opslagvolgorde, versieoverdracht, blokkeren na fouten en verwijderen geslaagd.
- Praktijktest met twee tabbladen geslaagd.

## 2026-09-07 17:30 CEST — Mobiele formulieren en uitgaven

### Opgelost

- Vertrek- en aankomsttijd blijven binnen de mobiele kolom van het vluchtformulier.
- Het uitgavenoverzicht kan op kleine schermen binnen de kaart horizontaal worden bekeken.
- De opslagfunctie voor het wijzigen van uitgaven is hersteld met expliciete databasekolommen.
- Ingelogde gebruikers zien op een openbare reis `Naar mijn reizen` in plaats van een registratieoproep.

## 2026-09-07 16:30 CEST — Accountoverzicht

### Toegevoegd

- Accountinstellingen tonen het huidige plan, de planlimiet, het totale aantal reizen en het aantal actieve reizen.
- De abonnementsknop past zich aan: Free toont upgrades en betaalde plannen tonen abonnementbeheer.

## Onderhoudsafspraken

- Publieke wijzigingen worden daarnaast toegevoegd aan `src/lib/public-changelog.ts`.
- Technische wijzigingen die geen zichtbaar gedrag veranderen blijven alleen in dit bestand.
- Een item krijgt pas een geslaagde controle wanneer die daadwerkelijk is uitgevoerd.
- Iedere publieke release heeft een unieke bèta-versie en een ISO-tijdstip met expliciete tijdzone.
- `npm test` controleert de publieke releasevolgorde, unieke IDs/versies, volledige teksten en veelvoorkomende gevoelige termen.
- GitHub Actions voert bij iedere push en pull request `npm test` en de productiebuild uit.
