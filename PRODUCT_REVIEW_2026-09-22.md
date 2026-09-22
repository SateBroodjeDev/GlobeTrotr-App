# Product- en concurrentiecontrole — 22 september 2026

Deze controle vergelijkt de huidige GlobeTrotr-code met actuele officiële productinformatie. Het is een prioriteringsdocument, geen claim dat een concurrentiefunctie technisch of juridisch één op één kan worden overgenomen. De actuele uitrol blijft in `IMPLEMENTATION_PENDING.md`; de releasebeslissing staat in `PRE_RELEASE.md`.

De volledige status per roadmaponderdeel en de uitgebreidere lijst met zoek-, vergelijkings- en concurrentiekansen staan afzonderlijk in [FEATURE_GAP_AND_EXPANSION.md](FEATURE_GAP_AND_EXPANSION.md).

## Huidige positie

GlobeTrotr combineert drie gebieden die concurrenten meestal afzonderlijk aanbieden:

1. planning voor reizigers: route, dagplanning, boekingen, taken, documenten en delen;
2. groepsgeld: meerdere valuta, bonnetjes, budgettempo en verrekening;
3. reisorganisatiebeheer: klanten, offertes, rollen, branding, domeinen en bedrijfsmail.

De sterkste onderscheidende basis is de combinatie van samenwerking, kosten en Agency-beheer met primaire Supabase-opslag in Central EU (Frankfurt, `eu-central-1`) en zelf beheerde Duitse applicatieservers. De grootste productachterstand zit bij automatische invoer, echte offline beschikbaarheid, plaatsinformatie en visuele reisherinneringen.

## Vergelijking met officiële productpagina’s

| Product | Publiek aangeboden zwaartepunten | GlobeTrotr nu | Betekenis voor de roadmap |
| --- | --- | --- | --- |
| [Wanderlog](https://wanderlog.com/) | Samen plannen, kaart en reisschema, reserveringen, kosten, paklijsten, offline toegang, e-mailimport, routeoptimalisatie, vluchtstatus, aanbevelingen en AI | Planning, samenwerking, kaart, boekingen, kosten, paklijst en exports bestaan | Boekingsmailconcepten hebben directe waarde. Offline, aanbevelingen en optimalisatie blijven grotere vervolgprojecten. |
| [TripIt](https://www.tripit.com/web/free) | Bevestigingsmails doorsturen, automatisch reisschema, documenten, agenda-sync, delen, vluchtmeldingen, luchthaveninformatie en reisstatistieken | Documenten, delen, statistieken, ICS-download en live feed bestaan | Een uniek doorstuuradres met controleerbaar concept is de belangrijkste ontbrekende tijdbespaarder. Vluchtbewaking volgt later. |
| [Travefy](https://travefy.com/) | Branded itineraries en voorstellen, CRM, formulieren, facturen, taken, automatisering, herbruikbare content, klantactiviteit en mobiele klantervaring | Agency-klanten, offertes, taken, rollen, branding, audit en klantportaal bestaan | Veilige klantformulieren en een herbruikbare content-/sjabloonbibliotheek zijn logische eerstvolgende Agency-functies. Facturatie en commissies vragen een apart financieel ontwerp. |
| [TravelSpend](https://travel-spend.com/) | Reisbudget, categorieën, valuta, groepsuitgaven, uitgaven op de kaart en offline invoer | Uitgaven, categorieën, valuta, budgettempo, statistieken, kaartlaag en verrekening bestaan | Offline invoer is het voornaamste gat; mobiel invoergemak en duidelijke budgetsignalen zijn belangrijker dan meer financiële schermen. |
| [Polarsteps](https://www.polarsteps.com/) | Reis plannen, route automatisch volgen, foto’s en verhalen, privacy per publiek, reisstatistieken, reels en fotoboeken | Openbare reizen, route, omslagfoto en statistieken bestaan | Een optioneel reisdagboek kan delen aantrekkelijker maken. Live locatie mag alleen met expliciete, fijnmazige privacykeuzes. |
| [Roadtrippers](https://roadtrippers.com/) | Lange routes, samenwerking, offline kaarten, verkeer, routevoorkeuren, plaatsendatabase, PDF en GPX | Samenwerking, routekaart, PDF en GPX bestaan | Offline kaarten, live verkeer en voertuigspecifieke navigatie zijn kostbare niches; niet vóór de kernacceptatie bouwen. |

## Geprioriteerde bouwkandidaten

### Eerstvolgend

1. **Boekingsmail naar concept.** Geef iedere reis een uniek doorstuuradres. Parse de bevestiging server-side en laat de gebruiker elk gevonden onderdeel controleren voordat het wordt opgeslagen. Scan geen volledige privé-inbox zonder een aparte opt-in.
2. **Agency-klantformulieren.** Laat een Agency alleen noodzakelijke klant- en reisgegevens opvragen, met bewaartermijn, doel, roltoegang en auditlog. Verzamel geen betaalkaartgegevens in GlobeTrotr.
3. **Herbruikbare Agency-content.** Maak goedgekeurde teksten, activiteiten, accommodaties en dagonderdelen herbruikbaar in offertes en reizen, met organisatie- en teamrechten.
4. **Mobiele kernstroom meten.** Test toevoegen, wijzigen, betalen en Vandaag op echte apparaten voordat nieuwe navigatieonderdelen worden toegevoegd.

## Uitgebreide gapanalyse

De afzonderlijke [functie-gapanalyse](FEATURE_GAP_AND_EXPANSION.md) bevat de actuele status van ieder roadmaponderdeel, extra concurrenten, zoek- en vergelijkingsfuncties, technische en commerciële randvoorwaarden en de aanbevolen bouwvolgorde. Daarmee blijft dit document een compacte productcontrole en ontstaat geen tweede afwijkende roadmap.

## Product- en inhoudscontrole

| Gebied | Huidige beoordeling | Open acceptatie |
| --- | --- | --- |
| Homepage | Heldere waardepropositie, interactieve demo, rollen, openbare reizen, privacy en concrete CTA’s | Test conversieroute, echte openbare voorbeelden en kleine schermen. |
| Portal | Website en private omgeving zijn gescheiden; terugnavigatie en mobiele header staan klaar | Migratie/test 1480 en Node-01-uitrol uitvoeren. |
| Reisplanner | Volledige kern met Vandaag, route, planning, boekingen, uitgaven, taken, documenten en exports | Praktijktest met lange echte reis, beperkte rol en telefoon. |
| Agency | Klanten, offertes, teamrechten, branding, domeinen en operationeel beheer | Tenantisolatie met twee Agency’s en echte domeinen bevestigen. |
| Communicatie | NL/EN-servicemail, HTML-bedrijfsmail, meldingen en vertaalconcepten | Taal, eenmalige bezorging, lange mail en bijlagen in productie controleren. |
| Privacy | Doelen, grondslagen, leveranciers, doorgiften, bewaartermijnen, rechten en browseropslag zijn NL/EN beschreven; Central EU (Frankfurt, `eu-central-1`) is bevestigd | Leveranciersovereenkomsten en feitelijke bewaartermijnen vóór brede publicatie controleren. |
| Prestaties | Routes zijn grotendeels gesplitst; enkele JavaScriptbundels blijven groot | Op een langzame telefoon meten en zware Agency-onderdelen verder splitsen op meetresultaat. |

## Bronnen en controledatum

Gecontroleerd op 22 september 2026 via de officiële pagina’s van [Wanderlog](https://wanderlog.com/), [TripIt](https://www.tripit.com/web/free), [Travefy](https://travefy.com/), [TravelSpend](https://travel-spend.com/), [Polarsteps](https://www.polarsteps.com/) en [Roadtrippers](https://roadtrippers.com/). De uitbreidingsanalyse gebruikt daarnaast de officiële documentatie van [Booking.com Demand API](https://developers.booking.com/demand/docs/accommodations/about-accommodation), [Expedia Rapid](https://developers.expediagroup.com/rapid/lodging/shopping/about-shopping-api), [Amadeus Hotels](https://admin.developers.amadeus.com/self-service/apis-docs/guides/developer-guides/resources/hotels/), [Skyscanner Travel APIs](https://developers.skyscanner.net/docs/intro), [Google Places](https://developers.google.com/maps/documentation/places/web-service/reference/rest/v1/places/searchText) en [Viator Partner API](https://docs.viator.com/partner-api/). Productaanbod, toegang en voorwaarden veranderen; controleer deze bronnen en sluit de benodigde partnerovereenkomst voordat een integratie wordt ontworpen.
