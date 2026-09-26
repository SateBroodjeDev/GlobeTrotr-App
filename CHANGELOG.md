# GlobeTrotr technisch changelog

Publieke releases lopen van beta 0.1 tot en met 0.9.1. Release 1.0 is gepland voor 1 oktober 2026 en wordt pas gepubliceerd na een geslaagde productieacceptatie. Detailwijzigingen blijven in Git beschikbaar.

## Beta 0.9.1 — 25 september 2026, 17:10 CEST

- Persoonlijke favoriete plaatsen kunnen tussen reizen worden hergebruikt.
- Reistaken ondersteunen een vertrekcheck, boodschappenlijst en eigen gedeelde lijsten.
- Opeenvolgende ontbrekende hotelnachten op dezelfde plaats verschijnen als één volledige verblijfsperiode.
- GPX-import toont vóór het toevoegen een lokale routepreview met routevolgorde, selectie en herkenbare bestaande punten.
- Offline uitgaven zijn afzonderlijk selecteerbaar en verwijderbaar; conflicterende regels worden niet stil overschreven.
- Meerdere reizigers kunnen in één gecontroleerde invoer worden uitgenodigd; GlobeTrotr toont vooraf hun rol en toegang en kan bestaande rollen in bulk wijzigen.
- Een reisvariant toont vooraf wat wordt gekopieerd en laat reisgenoten, documenten, uitgaven, betalingen, deelinstellingen en reserveringscodes veilig achter.
- Vanuit een routeplaats kunnen reizigers restaurants, bezienswaardigheden, activiteiten en praktische voorzieningen binnen 5 km zoeken, de bron controleren en een resultaat na bevestiging aan de dagplanning toevoegen.
- Verblijfskandidaten gebruiken nu één vergelijkbare zoekvraag met bestemming, datums, gasten, kamers, volledige prijs, belastingen en voorwaarden.
- Het reisdagboek heeft een eigen tabblad met visuele tijdlijn, fotogalerij en routekaart. Iedere herinnering ondersteunt een bestemming, waardering, uitgebreid verhaal en maximaal acht afgeschermde foto's met een schermvullende fotoviewer. Per herinnering bepaal je of alleen jij, reisgenoten of de gedeelde reisgids deze mag zien.
- Volledige herinneringen en bewust gekozen foto's kunnen offline worden bewaard. Offline toevoegingen, wijzigingen en verwijderingen blijven in een zichtbare wachtrij tot synchronisatie.
- Een terugblik kan handmatig of als controleerbaar concept uit gekozen herinneringen worden gemaakt. Opslaan en openbaar delen vereisen altijd bevestiging; de eigen PDF bevat verhalen, foto's en bijschriften.
- Opslaggebruik is zichtbaar per reis, account en offline apparaat.
- Het reisdagboek heeft een eigen portaalpagina en hoofdnavigatie-item. Vanuit een reis opent de Dagboek-knop direct de juiste reis.
- De controle op ontbrekende hotelnachten staat direct op de reispagina. Plaatsen rond de route heeft een eigen tab **Ontdekken** en zit niet meer verstopt onder dagplanning bewerken.

## Release 1.0 — in voorbereiding, 25 september 2026

- De publieke demo is een begeleide oefenreis geworden met acht interactieve opdrachten, zichtbare voortgang en aanpasbare voorbeelden voor route, boekingen, vergelijken, dagplanning, ontdekken, kosten, dagboek en offline gebruik.
- Het nieuwe reisdagboek staat als volwaardige 1.0-functie klaar in een eigen tabblad, met een visuele tijdlijn, fotogalerij, routekaart, groepsauteurschap, meerdere afgeschermde foto's, volgorde en omslagfoto, bijschriften, schermvullende viewer, waardering, selectieve zichtbaarheid en rijkere reisgids-export.
- Dagboekfoto's zijn nu ook versleepbaar, afzonderlijk vervangbaar en voorzien van een status per upload. Tekst wordt lokaal als offline concept bewaard met zichtbaar opslaggebruik.
- De openbare reisterugblik toont uitsluitend bewust openbare herinneringen met kort geldige fotolinks en behoudt de Agency-branding van de gedeelde reis.
- Routeoptimalisatie vergelijkt de bestaande volgorde met een korter voorstel, toont geschatte afstand en reistijd en past nooit iets toe zonder bevestiging.
- Reizigers kunnen persoonlijke favoriete plaatsen bewaren, later aan een andere reis toevoegen en weer verwijderen; deze gegevens zijn opgenomen in de accountexport en privacyverklaring.
- Reistaken zijn uitgebreid met gedeelde vertrek-, boodschappen- en zelf benoemde checklists, met dezelfde reisrechten, verantwoordelijke en deadline.
- Corporate Admin begint met een lege lijst actieve implementatiechecks; oude onafgeronde controles blijven als alleen-lezen historie beschikbaar onder Archief en Agency blijft apart voor later.
- Een Paddle-checkout die alleen is geopend maakt geen betaalbevestiging meer; de melding en transactionele mail volgen pas na het bevestigde `transaction.completed`-event.
- Webpush heeft een afzonderlijke configuratie-healthcheck voor Node-02, zodat ontbrekende VAPID-instellingen zichtbaar zijn zonder sleutels te tonen.
- Het meldingenpaneel toont de echte apparaatstatus en kan een volledige testpush klaarzetten; nieuwe privacyverzoeken en ingevulde Agency-klantformulieren waarschuwen de juiste beheerders.
- Accountinstellingen bieden aparte pushkeuzes voor uitnodigingen, reizen en Agency-werk, betalingen, vluchtwijzigingen en account- of serviceberichten; uitzetten annuleert ook nog niet verzonden pushes in die categorie.
- Geregistreerde `naam.globetrotr.nl`-Agencyportalen gebruiken direct de juiste tenant; eigen domeinen tonen naam, logo, kleur en tagline al voor het inloggen en bieden geen route terug naar de publieke GlobeTrotr-marketingpagina's. Alleen externe domeinen vereisen CNAME/TXT-verificatie.
- Externe Agency-domeinen tonen geen passkeyknoppen omdat de GlobeTrotr RP-ID daar technisch niet geldig is. Registreren via e-mail, Google of Discord vraagt eerst een merkgebonden bevestiging dat de Agency GlobeTrotr gebruikt en dat de voorwaarden en privacyverklaring van toepassing zijn.
- Agencies kunnen een eigen SMTP-account versleuteld opslaan en met een echte testmail controleren; geteste Agency-uitnodigingen gebruiken die server, terwijl niet-ingestelde Agencies op de centrale ZXCS-relay blijven. Uitnodigingen en klantformulieren gebruiken daarbij volledig de eigen naam, kleur, tagline, logo, contactadres en Agency-host zonder GlobeTrotr-verwijzingen.
- Vluchten, verblijven, vervoer en huurauto's kunnen maximaal één vertrek-, check-in- of ophaalherinnering krijgen in de laatste 24 uur; de bestaande boekingsvoorkeur en profieltaal worden gerespecteerd en webpush bevat geen boekingsdetails.
- Herkende boekingsmail maakt weer een geldige boekingsmelding aan en webpush gebruikt precies één profieltaal zonder gevoelige inhoud.
- Vertaalde HTML-mail blijft na vertalen een opgemaakte, afgeschermde e-mail in plaats van zichtbare HTML-code.
- De hotelcontrole gebruikt de routepositie als standaard slaapplaats, toont de lange keuzelijst alleen bij wijzigen en zoekt met een tweede providerfallback tot 15 km.
- Bij ontbrekende nachten gebruikt de hotelcontrole nu eerst de datumgebonden aankomst of activiteit uit vluchten, vervoer en andere boekingen; alleen zonder bruikbare locatie vraagt hij nog om een routeplaats.
- Opeenvolgende ontbrekende nachten met dezelfde voorgestelde slaapplaats worden als één periode gegroepeerd, ook als de onderbouwing onderweg wisselt van expliciete overnachting naar routepositie.
- De publieke website toont na een afgeschermde portalcontrole direct de juiste accountavatar; tokens blijven uitsluitend op het portaal.
- Een gesloten Paddle-overlay blijft niet meer op ‘checkout openen…’ staan en biedt een duidelijke terugweg naar Abonnement.

- Bedrijfsmail heeft een gepagineerd archief, een echt schermvullend leesvenster en definitief verwijderen voor beheerders na archivering.
- HTML-bedrijfsmail blijft als opgemaakte mail zichtbaar, ook wanneer een provider de HTML volledig gecodeerd aanlevert.
- NL/EN-vertaalconcepten verwerken ook langere berichten, detecteren de brontaal automatisch en tonen zichtbaar succes- of configuratiefouten.
- Reisdatums kunnen met een impactpreview gezamenlijk worden verschoven; historische uitgaven en controledata blijven staan.
- De privacyverklaring en browseropslaginventaris zijn bijgewerkt; bezoekers krijgen de vernieuwde privacykeuze opnieuw te zien en offline opslag en push blijven aparte, bewuste handelingen.

- Reisvergelijker-kandidaten worden duurzaam opgeslagen zodat reacties en peilingen naar echte records verwijzen; migratie/test 1660 staan klaar.
- Live agenda-abonnementen krijgen een wijzigingsdatum, ETag en verversingshint; verblijf en huurauto worden compacte hele-dagactiviteiten; migratie/test 1670 staan klaar.
- Vandaag toont een vertrekcheck voor route, dagplanning, overnachtingen en paklijst.
- De vertrekcheck telt route-, boekings- en dagplanningsdatums samen en gebruikt dezelfde definitie voor ingestelde overnachtingen als de hotelzoeker.
- Bij het toevoegen van een bestemming kies je direct tussen routepunt en overnachtingsplaats; de hotelcontrole heeft daarnaast directe invoer voor slaapplaatsen en duidelijke dekking per nacht, terwijl luchthavens en tussenstops zonder extra invoer worden genegeerd.
- Het offline pakket toont grootte, inhoud, verbinding, synchronisatiestatus en bescherming tegen browseropschoning.
- Reisacties zijn vereenvoudigd; lange boekingsteksten blijven leesbaar op mobiel.
- Vandaag toont vóór of na de reis geen willekeurige bestemming.
- Google- en Discord-status vernieuwen direct na ontkoppelen.
- JSON-export vat weggedrukte meldingen samen; Corporate en Agency Audit tonen actor, doel, context en reden.
- Hotelcontrole onderscheidt ontbrekende nachten van een reis zonder ingestelde nachten.
- Agency DNS-instructies openen in een dialoog en geverifieerde hosts behouden hun eigen domein.
- Webpush wacht nog op VAPID-configuratie en een echte bezorgproef.
- De eigen Stalwart-mailserver blijft buiten 1.0; ZXCS blijft de centrale terugval totdat TCP 25 en alle mailproeven slagen.

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
