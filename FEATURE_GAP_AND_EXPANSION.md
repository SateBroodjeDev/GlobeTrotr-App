# GlobeTrotr functie-gapanalyse

**Gecontroleerd: 25 september 2026**

Dit document vergelijkt GlobeTrotr met bestaande reisproducten en bevat mogelijke uitbreidingen. Het is geen toezegging of uitrolhandleiding. Gekozen werk gaat naar `roadmap.md` en daarna naar `BUILD_PLAN.md`.

## Huidige positie

GlobeTrotr combineert route, dagplanning, boekingen, uitgaven, verrekening, taken, documenten, delen, live agenda, offline dagoverzicht, Agency-beheer, klantportaal, Paddle en governance. De huidige onderscheidende combinatie is groepsbesluitvorming, financiële samenwerking en Agency-functionaliteit binnen één Europese accountomgeving.

Een mogelijke latere productlijn is **Self-Hosted Agency**: een officieel gelicentieerde GlobeTrotr-installatie op infrastructuur van een reisorganisatie, met centrale licentie- en updatecontrole maar zonder centrale verwerking van reisinhoud. Het uitgewerkte licentie-, API-, branding-, distributie- en supportmodel staat in [`SELF_HOSTED_AGENCY.md`](SELF_HOSTED_AGENCY.md). Dit is een traject na release 1.0 en nog geen toegezegde publieke functie.

De belangrijkste open productiepunten zijn praktijktests voor de Reisvergelijker, live agenda, offline gebruik, Agency-domeinen, eigen Agency-SMTP en webpush. White-label portal- en e-mailbranding zijn gebouwd. De eigen centrale mailserver is technisch voorbereid maar blijft buiten productie; ZXCS blijft actief als centrale route en terugval.

## Status productuitbreidingen op 25 september 2026

| Onderdeel | Status | Volgende concrete stap |
| --- | --- | --- |
| GPX-import | Gebouwd voor Beta 0.9.1 | Routepreview, validatie, dubbelen, selectie en omzetting praktisch testen |
| Offline gebruik | Basis en uitgavenbeheer gebouwd | Geselecteerde documenten pas na ontwerp voor encryptie, intrekken en opslaglimieten |
| Groepsbeheer | Bulkuitnodiging, bulkrollen en toegangsvoorbeeld gebouwd | Praktisch testen met Free, Pro en verschillende rollen |
| Reisdagboek | Tijdlijn, galerij, kaart, fotobeheer, offline herinneringen en gekozen foto's, synchronisatiewachtrij, bewuste samenvatting, publieke terugblik, eigen PDF en opslaginzicht gebouwd | Migratie 1820 uitvoeren en offline gedrag, zichtbaarheid, samenvatting, PDF en openbare weergaven praktisch testen |
| Plaatsen rond de route | OpenStreetMap-zoekfunctie gebouwd | Resultaten, openingstijden, bronlinks en toevoegen aan planning praktisch testen |
| Accommodaties vergelijken | Volledige provider-onafhankelijke zoekvraag en vergelijking gebouwd | Live prijzen en beschikbaarheid pas na providergoedkeuring koppelen |
| Schaalbare bestandsopslag | Supabase Storage blijft veilig actief voor 1.0 | Private Hetzner S3 eerst voor herstelkopieën; daarna een servergateway en nieuwe dagboekfoto's volgens `STORAGE_ARCHITECTURE.md` |

## Concurrentievergelijking

| Product                                                                                                                          | Sterke functies                                                                                             | Relevante GlobeTrotr-gap                                  |
| -------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| [Wanderlog](https://wanderlog.com/)                                                                                              | Routeoptimalisatie, live samenwerking, boekingsimport, plaatsdetails, offline toegang en Google Maps-export | Routeoptimalisatie, uitgebreid ontdekken en kaart-export  |
| [TripIt](https://www.tripit.com/en-uk/web/free)                                                                                  | Boekingsimport, agendasynchronisatie, documenten, luchthavenkaarten, nabij zoeken en reisstatistieken       | Luchthavenhulp, nabij zoeken en CO₂-inzicht               |
| [Roadtrippers](https://roadtrippers.com/about/features/)                                                                         | Plaatsen langs de route, omwegfilter, favorieten, routevarianten, offline kaarten en live verkeer           | Favorieten, routevarianten en routegebonden ontdekking    |
| [Polarsteps](https://www.polarsteps.com/news/polarsteps-launches-summer-2026-release-new-tools-for-planning-privacy-and-sharing) | Visuele tijdlijn, reisverhaal, ontdekking en reisboek                                                       | Automatische routetracking en een gedrukt reisboek blijven mogelijke latere uitbreidingen; tijdlijn, galerij, kaart en selectief delen zijn voor 1.0 gebouwd |
| [Travefy](https://travefy.com/)                                                                                                  | CRM, formulieren, branded voorstellen, content en automatisering                                            | Verdere verfijning van Agency-workflows                   |
| [TravelSpend](https://travel-spend.com/)                                                                                         | Eenvoudige offline uitgaven en budgetbewaking                                                               | Praktijkacceptatie en verdere offline conflictafhandeling |

## Beste kleine uitbreidingen

Deze functies hergebruiken bestaande gegevens en vragen geen grote providerintegratie:

1. **Reisvariant maken** zonder leden, toegang, codes, documenten of betalingen over te nemen is gebouwd, inclusief een impactvoorbeeld vóór bevestiging.
2. **Favoriete plaatsen** bewaren en later aan een reis toevoegen is gebouwd en wacht op productieacceptatie; een directe koppeling met de vergelijker blijft een mogelijke verfijning.
3. **Algemene checklijsten** voor vertrek, boodschappen en vrije taken zijn gebouwd en wachten op productieacceptatie.
4. **Nabij deze stop** voor horeca, praktische voorzieningen, activiteiten en bezienswaardigheden via OpenStreetMap is gebouwd en wacht op productieacceptatie.
5. **Check-inherinneringen** uit bestaande vlucht-, verblijf-, vervoer- en huurautogegevens zijn gebouwd als begrensde 24-uursmelding en wachten op productieacceptatie.

## Uitbreidingen met provider of extra beheer

### Hotels zoeken

Kies één officiële provider en begin met zoeken en doorsturen. Toon altijd totaalprijs, valuta, bekende toeslagen, voorwaarden, afstand, controletijd en commerciële relatie. Mogelijke bronnen zijn [Booking.com Demand API](https://developers.booking.com/demand/docs/accommodations/about-accommodation), [Expedia Rapid](https://developers.expediagroup.com/rapid/lodging/shopping/about-shopping-api) en [Amadeus Hotels](https://admin.developers.amadeus.com/self-service/apis-docs/guides/developer-guides/resources/hotels/).

### Vluchten, auto’s en activiteiten

[Skyscanner Travel APIs](https://developers.skyscanner.net/docs/intro), Booking.com Demand en [Viator Partner API](https://docs.viator.com/partner-api/) zijn mogelijke vervolgstappen. Toegang, prijsregels, caching, commissie, foto’s en attributie moeten vooraf contractueel duidelijk zijn.

### Route en onderweg

- routeoptimalisatie met verplichte preview;
- plaatsen langs de route met openingstijden en reistijd;
- geselecteerde documenten offline;
- automatische routetracking en een optioneel gedrukt reisboek na een afzonderlijke privacy- en leverancierskeuze;
- luchthaven- en verstoringshulp.

## Privacy- en productgrenzen

- Externe providers lopen via Node-02; verstuur alleen noodzakelijke zoekcriteria.
- Zoekgeschiedenis wordt alleen opgeslagen wanneer de gebruiker dat verwacht en kan verwijderen.
- Nieuwe providers worden vóór activering in privacy- en cookie-informatie opgenomen.
- Geen scraping, stille mailboxscan, continue locatievolging of autonome boekingen.
- Geen gevoelige intakegegevens in publieke reizen, zoekopdrachten of AI-prompts.
- Volledige navigatie, offline kaarten en een reviewplatform vragen een apart productbesluit.

## Beslisvolgorde

1. Release 1.0 accepteren.
2. Kleine uitbreidingen op werkelijk gebruik prioriteren.
3. Eén hotelprovider contractueel en technisch beoordelen.
4. Gebruik en supportlast meten.
5. Pas daarna een tweede provider, prijsalerts, andere zoekcategorieën of AI overwegen.
