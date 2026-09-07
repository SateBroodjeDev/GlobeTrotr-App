# GlobeTrotr changelog

Technisch wijzigingsoverzicht voor GitHub en beheerders. De publieke, gebruikersgerichte versie staat op `/changelog`.

Tijden gebruiken `Europe/Amsterdam` (CEST/CET). Nieuwe vermeldingen komen bovenaan. Noteer databasewijzigingen, benodigde migraties en uitgevoerde controles; zet geen secrets, persoonsgegevens of interne tokens in dit bestand.

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
