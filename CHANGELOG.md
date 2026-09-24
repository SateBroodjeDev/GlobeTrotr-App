# GlobeTrotr technisch changelog

Publieke releases lopen van beta 0.1 tot en met 0.9. Release 1.0 is gepland voor 1 oktober 2026 en wordt pas gepubliceerd na een geslaagde productieacceptatie. Detailwijzigingen blijven in Git beschikbaar.

## Release 1.0 — in voorbereiding, 24 september 2026

- Bedrijfsmail heeft een gepagineerd archief, een echt schermvullend leesvenster en definitief verwijderen voor beheerders na archivering.
- HTML-bedrijfsmail blijft als opgemaakte mail zichtbaar, ook wanneer een provider de HTML volledig gecodeerd aanlevert.
- NL/EN-vertaalconcepten verwerken ook langere berichten, detecteren de brontaal automatisch en tonen zichtbaar succes- of configuratiefouten.
- Reisdatums kunnen met een impactpreview gezamenlijk worden verschoven; historische uitgaven en controledata blijven staan.
- De privacyverklaring en browseropslaginventaris zijn bijgewerkt; bezoekers krijgen de vernieuwde privacykeuze opnieuw te zien en offline opslag en push blijven aparte, bewuste handelingen.

- Reisvergelijker-kandidaten worden duurzaam opgeslagen zodat reacties en peilingen naar echte records verwijzen; migratie/test 1660 staan klaar.
- Live agenda-abonnementen krijgen een wijzigingsdatum, ETag en verversingshint; verblijf en huurauto worden compacte hele-dagactiviteiten; migratie/test 1670 staan klaar.
- Vandaag toont een vertrekcheck voor route, dagplanning, overnachtingen en paklijst.
- De vertrekcheck telt route-, boekings- en dagplanningsdatums samen en gebruikt dezelfde definitie voor ingestelde overnachtingen als de hotelzoeker.
- De hotelcontrole heeft nu een zichtbaar stappenplan, directe invoer voor echte overnachtingsplaatsen en duidelijke dekking per nacht; luchthavens en tussenstops worden zonder extra invoer genegeerd en zoekresultaten worden bewust niet als aanbevelingen benoemd.
- Het offline pakket toont grootte, inhoud, verbinding, synchronisatiestatus en bescherming tegen browseropschoning.
- Reisacties zijn vereenvoudigd; lange boekingsteksten blijven leesbaar op mobiel.
- Vandaag toont vóór of na de reis geen willekeurige bestemming.
- Google- en Discord-status vernieuwen direct na ontkoppelen.
- JSON-export vat weggedrukte meldingen samen; Corporate en Agency Audit tonen actor, doel, context en reden.
- Hotelcontrole onderscheidt ontbrekende nachten van een reis zonder ingestelde nachten.
- Agency DNS-instructies openen in een dialoog en geverifieerde hosts behouden hun eigen domein.
- Webpush wacht nog op VAPID-configuratie en een echte bezorgproef.
- Stalwart en Agency-SMTP blijven buiten 1.0; ZXCS blijft actief totdat TCP 25 en alle mailproeven slagen.

## Beta 0.9 — 23 september 2026, 12:00 CEST

- Reisvergelijker, groepskeuzes, Agency-klantformulieren en herbruikbare Agency-content.
- Begrensd offline dagoverzicht met uitgavenwachtrij.
- Portal- en websiteverdeling, mobiele verfijning en accountbeveiliging.
- Webpush, vluchtcontrole en boekingsmail technisch voorbereid maar nog niet volledig vrijgegeven.

## Beta 0.8 — 21 september 2026, 20:30 CEST

- Veilige HTML-bedrijfsmail, vaste handtekeningen en gecontroleerd opnieuw bezorgen.
- Handmatig controleerbare NL/EN-vertaalconcepten.
- Herstel en diagnose voor betalingen en live agenda.

## Beta 0.7 — 21 september 2026, 12:00 CEST

- Leesbaardere publieke reispagina.
- Werkende GPX-download en eenmalige ICS-export.
- Correcte uitgavenknoppen en opslag van bedrijfsbeheerderaccounts.

## Beta 0.6 — 15 september 2026, 16:00 CEST

- Paddle voor doorlopende abonnementen en een losse vooruitbetaalde maand.
- Facturen en abonnementsbeheer via het Paddle-klantportaal.
- Eerste agenda-export en voorbereiding van live abonnementen.

## Beta 0.5 — 14 september 2026, 23:55 CEST

- Google, Discord, passkeys en TOTP naast e-mailauthenticatie.
- Communicatievoorkeuren en privacyverzoeken.
- Gedeelde en persoonlijke bedrijfspostvakken met handtekeningen.

## Beta 0.4 — 14 september 2026, 12:00 CEST

- Reisstatistieken, budgettempo, taken en Vandaag.
- Route omkeren, conceptkopieën en reisvergelijking.
- Rustigere bediening voor langere reizen.

## Beta 0.3 — 12 september 2026, 20:00 CEST

- Agency-klanten, offertes, teamrechten en audit.
- Organisatiebranding en gecontroleerde domeinkoppeling.
- Operationele Agency-werkruimte.

## Beta 0.2 — 10 september 2026, 18:00 CEST

- Publieke website, feedback, bekende problemen en Corporate Admin.
- Prijzen, contact, status, roadmap en juridische pagina’s.
- Uitleg over Europese infrastructuur en privacykeuzes.

## Beta 0.1 — 7 september 2026, 23:34 CEST

- Route, dagplanning, boekingen en kaart in één reis.
- Uitgaven in meerdere valuta en kostenverrekening.
- Samenwerking met reisrollen en gecontroleerd delen.

## Onderhoud

- Publiceer alleen functies die werkelijk zijn uitgerold en bevestigd.
- Zet gebouwd maar nog niet uitgerold werk onder de eerstvolgende release.
- Houd versies, datum en tijd gelijk aan `src/lib/public-changelog.ts`.
- Noem geen secrets, persoonsgegevens of interne testadressen.
