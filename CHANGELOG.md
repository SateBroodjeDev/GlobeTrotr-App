# GlobeTrotr changelog

Technisch wijzigingsoverzicht voor GitHub en beheerders. De publieke, gebruikersgerichte versie staat op `/changelog`.

Tijden gebruiken `Europe/Amsterdam` (CEST/CET). Nieuwe vermeldingen komen bovenaan. Noteer databasewijzigingen, benodigde migraties en uitgevoerde controles; zet geen secrets, persoonsgegevens of interne tokens in dit bestand.

## 2026-09-07 23:56 CEST — Compactere reisplanning

### Gebruikerservaring

- De volledige tijdlijn kan nu per dag worden ingeklapt en toont bij iedere dag hoeveel onderdelen erin staan.
- Snelle filters maken vluchten, verblijven, vervoer, huurauto's, activiteiten en eigen planning afzonderlijk zichtbaar.
- De filterbalk blijft op smalle schermen horizontaal bereikbaar en lege filterresultaten krijgen een duidelijke melding in het Nederlands en Engels.

### Controles

- Negen geautomatiseerde regressietests en de client-, SSR- en Cloudflare-productiebuild zijn geslaagd.

## 2026-09-07 23:51 CEST — Samenwerken per reis

### Gebruikerservaring

- Bestaande accounts krijgen na opnieuw inloggen toegang tot reizen waarvoor hun geverifieerde e-mailadres als reisgenoot is toegevoegd.
- Gedeelde reizen verschijnen herkenbaar in het dashboard en tellen niet mee voor de persoonlijke reislimiet.
- Traveler en advisor kunnen planning en uitgaven beheren, finance alleen uitgaven en viewer/client alleen de toegestane reisinhoud bekijken.

### Privacy en autorisatie

- Alleen de eigenaar kan reisleden, openbare toegang, archivering en verwijdering beheren.
- Viewer en client ontvangen geen financiële reisgegevens; niet-eigenaren ontvangen geen e-mailadressen van andere reisleden.
- De server bewaart beschermde velden uit de actuele databaseversie wanneer een planner of financieel lid een gemanipuleerde snapshot indient.

### Controles

- De praktijktest met een tweede bestaand account en alle vijf niet-eigenaarsrollen is geslaagd.
- Negen geautomatiseerde tests en de client-, SSR- en Cloudflare-productiebuild zijn geslaagd.

## 2026-09-07 23:34 CEST — Internationale testopening

### Vrijgegeven voor testers

- De Nederlandse en Engelse gebruikersstromen zijn gereed voor de internationale betatest.
- Registratie met e-mail, reisbeheer, bestemmingen, planning, boekingen, uitgaven, verdeling, paklijst en exports zijn in de praktijk gecontroleerd.
- Publiek delen is gecontroleerd met en zonder PIN, met financiële informatie aan en uit, met lege en uitgebreide reizen.
- Dashboard, formulieren, uitgaven, publieke reizen en changelog zijn op een echte telefoon gecontroleerd.
- Free-, Pro- en Agency-scenario's zijn doorlopen.

### Bekende beperkingen

- OAuth en automatische app-e-mails maken bewust nog geen deel uit van deze testopening.

### Controles

- De beheerder heeft op 7 september 2026 bevestigd dat de volledige rooktest is geslaagd.
- Zeven geautomatiseerde tests en de client-, SSR- en Cloudflare-productiebuild zijn geslaagd.

### Privacy-audit na vrijgave

- De openbare reisindex toont geen PIN-beveiligde reizen meer; deze blijven alleen via hun directe link en geldige PIN bereikbaar.
- Een ontbrekende profielnaam valt openbaar terug op een neutrale reizigersnaam en gebruikt geen deel van het e-mailadres.
- Gearchiveerde reizen zijn ook via bestaande openbare links niet meer opvraagbaar.
- `20260907234000_restrict_trip_financials.sql` beperkt relationele uitgaven tot owner, traveler, advisor en finance. De migratie en regressietest zijn op 7 september 2026 volledig en zonder foutmelding uitgevoerd.
- De SQL-regressietests voor versiegestuurde reisopslag en persistente meldingen zijn op 7 september 2026 volledig en zonder foutmelding uitgevoerd.

### Samenwerking

- Actieve relationele reisleden krijgen gedeelde reizen in hun eigen dashboard, herkenbaar als gedeelde reis en zonder invloed op hun persoonlijke reislimiet.
- Een bestaande gebruiker kan een openstaande lidregel alleen claimen via het geverifieerde e-mailadres in het Supabase-token; uitnodigingsmail is hiervoor niet nodig.
- Reisrollen worden ook door de server begrensd. Finance kan alleen uitgaven indienen, planners kunnen geen leden, publicatie of archiefstatus wijzigen en viewer/client blijven alleen-lezen.
- Niet-eigenaren ontvangen geen e-mailadressen van andere reisleden. Viewer/client ontvangen ook geen financiële reisgegevens.
- Twee nieuwe autorisatietests brengen het geautomatiseerde totaal op negen. De productiebuild en praktijktest met een tweede account zijn geslaagd.

## 2026-09-07 19:30 CEST — Basis voor internationale beta

### Gebruikerservaring

- Een globale NL/EN-keuze volgt de browsertaal en wordt voor ingelogde gebruikers in het profiel opgeslagen.
- Homepage, e-mailauthenticatie, openbare reizen, hoofdnavigatie, footer, privacy en beta-voorwaarden zijn tweetalig gemaakt.
- Datums en bedragen op openbare reizen volgen de gekozen taal.
- Privacy-informatie en beta-voorwaarden zijn vanuit de footer bereikbaar.
- OAuth-knoppen zijn verborgen zolang OAuth bewust buiten deze beta valt.
- Opslaanknoppen voor het wachtwoord en de reisinstellingen hebben meer afstand tot de velden erboven.
- Alle publieke releasetitels, samenvattingen en wijzigingskaarten zijn in Nederlands en Engels beschikbaar.
- De taalactie toont bezoekers duidelijk `NL` of `EN`. Voor ingelogde gebruikers staat de taalkeuze alleen in Accountinstellingen en wordt deze na opslaan direct overal toegepast.
- Dashboard, abonnementsoverzicht en meldingen volgen nu ook de opgeslagen NL/EN-voorkeur, inclusief acties, statuslabels, lege staten, foutmeldingen en meldingsdatums.
- Het centrale reisbeheerscherm volgt NL/EN voor navigatie, reis- en deelinstellingen, routes, uitgaven, verrekening, paklijst en weerinformatie.
- Tijdlijn en reisgenoten zijn tweetalig gemaakt. De belangrijkste boekingsvelden en validatiemeldingen volgen eveneens de accounttaal; specialistische voertuig- en vluchtinformatie volgt in de resterende vertaalslag.
- Ook specialistische velden voor vluchtstatus, verblijf, huurauto, vervoer en brandstof zijn vertaald. Accountprofiel, wachtwoordbeheer, voorkeuren en planinformatie volgen nu dezelfde taalkeuze.
- Landnamen, weeromschrijvingen, aftel-eenheden en de standaardtagline worden nu ook in het Engels weergegeven wanneer Engels actief is.
- Bestemmingslijsten tonen ieder volgnummer één keer en de opslaanknop in het formulier voor reisonderdelen heeft meer ruimte tot het laatste veld.
- Agency-overzicht, team- en reisrechten en white-labelinstellingen volgen de opgeslagen NL/EN-voorkeur.
- CSV-uitgaven, declaratie-PDF's en reisgidsen gebruiken de gekozen accounttaal voor koppen, categorieën, landen en bestandsnamen.
- Bevestigingen, foutmeldingen, reisstatussen, uitgavencategorieën en bonacties in het reisbeheer zijn verder vertaald.

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
- Uitvoering van deze migratie is op 7 september 2026 door de beheerder bevestigd; de functionele productiecontrole staat nog open.
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
