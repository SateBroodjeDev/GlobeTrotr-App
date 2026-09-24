# GlobeTrotr technisch bouwplan

**Stand: 24 september 2026**

Dit document beschrijft alleen de technische bouwvolgorde. Productstatus staat in `roadmap.md`, ideeën en concurrentiegaps in `FEATURE_GAP_AND_EXPANSION.md`, en uitrol in `IMPLEMENTATION_PENDING.md`.

## Huidige wijzigingenset voor 1.0

### Gebouwd en lokaal gecontroleerd

- duurzame Reisvergelijker-kandidaten voor reacties en peilingen;
- rustige reisacties en mobiele tekstafbreking;
- correcte Vandaag-status vóór en na een reis;
- directe status na ontkoppelen van Google of Discord;
- compacte JSON-export en uitgebreidere auditdetails;
- Agency-hostbinding en DNS-instructies in een dialoog;
- offline pakketstatus en vertrekcheck;
- live agenda met wijzigingsvalidators en compacte hele-dagactiviteiten;
- bedrijfsmail met meer laden in het archief, schermvullend lezen, langere vertalingen en gecontroleerd definitief verwijderen.
- reisdatums in één gecontroleerde handeling verschuiven met impactpreview en behoud van historische administratie.
- privacyverklaring, cookie-/opslagkeuze en browseropslaginventaris afgestemd op de actuele offline-, push-, mail- en vertaalfuncties.

### Nog uitvoeren

1. migratie/test 1660;
2. migratie/test 1670;
3. migratie/test 1680;
4. migratie/test 1690;
5. Node-01 en Node-02 uitrollen;
6. praktijktests uit `IMPLEMENTATION_PENDING.md`;
7. bevindingen oplossen en `npm run verify`, `npm run build` en `git diff --check` herhalen;
8. alleen bij een geslaagde vrijgavecontrole versie 1.0 publiceren.

## Bouwvolgorde na 1.0

### 1. Kleine verbeteringen zonder externe provider

- veilige reisvariant maken;
- favoriete plaatsen;
- algemene checklijsten naast de paklijst;
- praktische plaatsen rond een stop via de bestaande OpenStreetMap-laag;
- check-in- en vertrekmeldingen via de bestaande meldingslaag.

### 2. Eén accommodatieprovider

Voorwaarden: partnergoedkeuring, API-sleutel, quota, attributie, commerciële uitleg en privacycontrole.

- provideradapter uitsluitend op Node-02;
- bestemming, data en reizigers vanuit de reis vooraf invullen;
- totaalprijs, bekende toeslagen, voorwaarden, afstand en controletijd tonen;
- resultaat provider-onafhankelijk in de Reisvergelijker opslaan;
- gecontroleerd naar de aanbieder doorsturen;
- caching, time-outs, retries en foutcategorieën begrenzen.

### 3. Uitbreidingen na gemeten gebruik

- prijsalerts en flexibele data;
- vluchten, autohuur en activiteiten;
- routeoptimalisatie met bevestigingspreview;
- geselecteerde documenten offline;
- privé reisdagboek;
- zakelijke goedkeuringen en CO₂-inzicht.

## Werkafspraken

Voor iedere wijziging:

1. bestaande architectuur en rechten hergebruiken;
2. databasewijzigingen chronologisch migreren en gericht testen;
3. tenantisolatie, RLS en gevoelige gegevens controleren;
4. NL/EN-tekst en mobiele weergave meenemen;
5. privacy en bewaartermijnen bij nieuwe gegevens of providers bijwerken;
6. `npm run verify`, `npm run build` en `git diff --check` uitvoeren;
7. roadmap, changelog en het actuele implementatiehandboek bijwerken.

## Niet zonder apart besluit bouwen

- scraping als basis voor prijsvergelijking;
- stil Gmail- of volledig mailboxscannen;
- continue locatievolging;
- autonome boekingen of reiswijzigingen;
- volledige navigatie of offline kaartendatabase;
- een openbaar reviewplatform zonder moderatiecapaciteit.
