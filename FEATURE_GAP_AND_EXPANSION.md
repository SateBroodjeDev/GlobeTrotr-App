# GlobeTrotr — functie-gapanalyse en uitbreidingskansen

**Stand: 23 september 2026**

Dit document beantwoordt twee vragen:

1. welke onderdelen uit de huidige roadmap vragen nog nieuwe code;
2. welke nuttige functies bieden andere reisproducten die GlobeTrotr nog niet heeft.

Uitrolstappen staan in [IMPLEMENTATION_PENDING.md](IMPLEMENTATION_PENDING.md). Vrijgavecontroles staan in [PRE_RELEASE.md](PRE_RELEASE.md). De gekozen uitvoervolgorde staat in [BUILD_PLAN.md](BUILD_PLAN.md). Dit document gaat uitsluitend over productfunctionaliteit.

## Conclusie

De kern voor de huidige productie-beta is gebouwd: accounts, reizen, route, planning, boekingen, uitgaven, verrekening, taken, documenten, Vandaag, statistieken, exports, live agenda, openbare reizen, Agency Admin, klantportaal, Corporate Admin, privacyverzoeken, Paddle en bedrijfsmail. De bestaande productie-mail loopt nog via ZXCS; de eigen Stalwart-server en boekingsmailconcepten zijn lokaal gebouwd en wachten op gecontroleerde uitrol.

Daarmee is GlobeTrotr functioneel publiceerbaar zodra de open productieacceptatie slaagt. **Niet alles op de roadmap is gebouwd.** De roadmap bevat bewust uitbreidingen voor na de eerste brede publicatie.

## Status van de roadmap

| Onderdeel | Status | Nog te bouwen |
| --- | --- | --- |
| Navigatie tussen website en portal | Gebouwd, uitrol open | Migratie/test 1480 en Node-01-uitrol. |
| Mobiele bediening en pagina-opfrissing | Gebouwd, acceptatie open | Echte apparaten en lange productiegegevens testen. |
| Auth, Paddle, live agenda, mail en Agency-domeinen | Gebouwd, acceptatie open | Met echte accounts, betalingen, mailboxen en domeinen bevestigen. |
| Agency-klantportaal en huisstijl | Gedeeltelijk | Meer klantacties, volledige huisstijlcontrole en eventueel een volledig dashboard op de Agency-host. |
| Boekingsmail naar reisconcept | Gebouwd, uitrol open | Migratie/test 1580, Stalwart/IMAP-uitrol en echte bevestigingen accepteren. |
| Veilige klantformulieren | Gebouwd, uitrol open | Migratie/test 1550, web/worker-uitrol en echte NL/EN-klantstromen accepteren. |
| Herbruikbare Agency-content | Gebouwd, uitrol open | SQL is uitgevoerd; rollen, versies, bron/licentie, preview, gerichte toepassing en tenantisolatie praktisch accepteren. |
| Groepsuitnodigingen en rollen | Basis gebouwd | Bulkuitnodigingen, bulkwijzigingen en impactpreview. |
| Bedrijfsmail | Gebouwd, verfijning open | Interne notities, toewijzen, antwoordstatus en boekingsverwerking. |
| Vertaalconcepten | Gebouwd, verfijning open | Terminologielijst, wijzigingsvergelijking en bulkcontrole. |
| Meldingen | Gebouwd, uitrol open | Webpush per apparaat en bezorging zijn gebouwd; VAPID en productieacceptatie staan open. |
| Volwaardige offline modus | Veilige leesbasis gebouwd | Expliciete route-, planning- en boekingssamenvatting per reis is lokaal gebouwd. Offline uitgaven, documenten, synchronisatie en conflictafhandeling ontbreken nog. |
| Automatische routeoptimalisatie | Niet gebouwd | Reistijdmatrix, voorkeuren, provider, kostenlimiet en bevestigingspreview. Route omkeren bestaat al. |
| Plaatsaanbevelingen en openingstijden | Niet gebouwd | Provider, filters, openingstijden, bronvermelding, quota en privacykeuze. |
| Periodieke vluchtcontrole | Gebouwd, uitrol open | Begrensde Pro/Agency-worker, wijzigingsdetectie, cooldown en webpush zijn gebouwd; provider- en productieproef staan open. |
| GPX-import | Niet gebouwd | Validatie, limieten, preview, dubbele punten en omzetting naar stops. GPX-export bestaat al. |
| Reisdagboek | Niet gebouwd | Foto’s en verhalen per dag/stop, zichtbaarheid, moderatie en export. |
| AI-reisplanning | Niet gebouwd | Provider, bronnen, kostenlimieten, privacygrenzen en verplichte menselijke controle. |

## Concurrenten: functies die GlobeTrotr nog niet biedt

| Product | Relevante functie | GlobeTrotr-gap | Advies |
| --- | --- | --- | --- |
| [KAYAK Trips](https://www.kayak.com/c/help/account-trips/) | Boekingsmails doorsturen, Gmail-sync, live vluchtalerts, prijsalerts, zoekresultaten bewaren, reizen samenvoegen en onderdelen verplaatsen | Boekingsmailconcept is lokaal gebouwd; prijsbewaking, trip-merge en item-verplaatsing ontbreken | Accepteer eerst de veilige boekingsmail. Gmail-sync alleen na aparte privacybeoordeling. |
| [Wanderlog](https://wanderlog.com/) | Offline toegang, routeoptimalisatie, e-mailimport, aanbevelingen en live vluchtinformatie | Offline, optimalisatie en aanbevelingen ontbreken | Offline reisoverzicht en gecontroleerde optimalisatie na de publicatieacceptatie. |
| [TripIt](https://www.tripit.com/web/free) | Automatisch reisschema uit doorgestuurde bevestigingen en proactieve reisinformatie | Automatische invoer en periodieke bewaking ontbreken | Gebruik een uniek doorstuuradres en reviewbare concepten. |
| [Lambus](https://www.lambus.com/) | Groepschat, pushmeldingen, foto’s, browserextensie en partneraanbod voor activiteiten/vervoer | Geen reis-chat, browserextensie of geïntegreerd aanbod | Eerst eenvoudige reisdiscussie en ‘opslaan in GlobeTrotr’; een browserextensie pas later. |
| [Travefy](https://travefy.com/) | CRM, formulieren, contentbibliotheek, automatisering en branded voorstellen | Klantformulieren en rijke contentbibliotheek ontbreken | Sterke eerstvolgende Agency-uitbreiding. |
| [TravelSpend](https://travel-spend.com/) | Offline uitgaven invoeren | Geen betrouwbare offline schrijfstroom | Neem uitgaven als eerste bewerkbare onderdeel van de offline modus. |
| [Polarsteps](https://www.polarsteps.com/) | Fotoverhaal, automatische tijdlijn en reisboek | Geen volwaardig reisdagboek | Optioneel dagboek met expliciete zichtbaarheid; geen stille locatietracking. |
| [Roadtrippers](https://roadtrippers.com/) | Routevoorkeuren, plaatsen langs de route, offline kaarten en voertuigspecifieke navigatie | Geen routegebonden ontdekking of offline kaarten | Plaatsen langs de route is passend; volledige navigatie blijft buiten de kern. |
| [Perk](https://www.perk.com/uk/) | Reisbeleid, goedkeuringen, kostenplaatsen, rapportage, duurzaamheid en factuurverwerking | Geen zakelijke reisregels, goedkeuringsstroom of CO₂-rapportage | Alleen toevoegen als GlobeTrotr actief op zakelijke reizen mikt. |
| [Tripadvisor](https://www.tripadvisor.com/) | Grote plaatsendatabase, beoordelingen, bewaren en ontdekken | Geen externe reviews of bestemmingsontdekking | Gebruik een gelicentieerde provider; bouw geen eigen reviewplatform zonder moderatiecapaciteit. |

## Nieuwe functies met de meeste productwaarde

### Prioriteit A — sluit direct aan op het bestaande product

1. **Reisopties vergelijken**
   - Bewaar meerdere hotel-, vlucht-, trein-, auto- of activiteitsopties.
   - Vergelijk totale prijs, voorwaarden, duur, locatie, bagage, flexibiliteit en toegankelijkheid.
   - Laat groepsleden reageren of stemmen.
   - Zet de gekozen optie pas na bevestiging om in een boeking.

2. **Hotels zoeken en vergelijken**
   - Vul bestemming, data en reizigers vanuit de reis in.
   - Toon totaalprijs inclusief bekende belastingen en toeslagen, score, afstand, voorzieningen, maaltijden en annulering.
   - Start met één officiële aanbieder en stuur voor boeken door.
   - Bewaar provider, prijscontroletijd en commerciële relatie zichtbaar bij iedere optie.

3. **Boekingsmail naar concept**
   - Uniek e-mailadres per reis.
   - Ondersteun hotel, vlucht, trein, autohuur en activiteit.
   - Toon gevonden velden en waarschuwingen vóór opslag.
   - Herken dubbele bevestigingen en wijzigingen op bestaande boekingen.

4. **Agency-klantintake**
   - Reiswensen, budget, deelnemers, toegankelijkheid, dieet, documenten en noodcontacten als configureerbare velden.
   - Per veld doel, noodzakelijkheid, zichtbaarheid en bewaartermijn.
   - Antwoorden omzetten naar klantprofiel of reisconcept na controle.

5. **Reisbesluiten voor groepen**
   - Discussie of opmerkingen bij een reisoptie.
   - Peiling met deadline en zichtbare uitkomst.
   - Definitieve keuze alleen door een bevoegde rol.

### Prioriteit B — waardevol voor onderweg

- Offline pakket met Vandaag, boekingen, documenten, adressen en uitgaven.
- Web-push voor vluchtwijzigingen, taken, uitnodigingen, betalingen en incidenten.
- Automatische check-inherinneringen en terminal-/gatewijzigingen.
- Plaatsen en activiteiten langs de route met openingstijden en reistijd.
- Reisdagboek met foto’s, notities en selectief openbaar delen.
- Noodkaart met verzekeraar, ambassade, lokale noodnummers en gedeelde noodcontacten.
- Document- en paspoortvervalherinneringen, strikt privé en versleuteld.
- Paklijstregels op basis van weer, duur en reissoort, altijd als bewerkbaar voorstel.

### Prioriteit C — zoeken, prijsbewaking en inspiratie

- Vluchten vergelijken op totaalprijs, bagage, overstappen, duur en aankomsttijd.
- Autohuur vergelijken op totaalprijs, borg, kilometerlimiet, brandstofbeleid en locatie.
- Activiteiten vergelijken op beschikbaarheid, duur, taal, annulering en prijs.
- Prijsalerts voor bewaarde opties; toon de bron en het tijdstip van de laatste controle.
- Bestemmingen ontdekken binnen budget, reisduur, seizoen en interesses.
- Flexibele datumvergelijking voor goedkopere vluchten en verblijven.
- Een route-alternatief voorstellen op basis van tijd en budget, nooit stilzwijgend toepassen.

### Alleen bij een duidelijke zakelijke doelgroep

- Reisaanvraag en goedkeuring vóór boeken.
- Reisbeleid per team, bestemming of kostensoort.
- Kostenplaatsen, projecten en budgeteigenaren.
- CO₂-schatting en vervoersalternatieven.
- Leveranciersafspraken, commissie en marge.
- Geconsolideerde factuur- en betaalreconciliatie.
- Duty-of-care-overzicht tijdens verstoringen, met zeer beperkte locatiegegevens.

## Technische en commerciële randvoorwaarden

### Accommodaties

[Booking.com Demand API](https://developers.booking.com/demand/docs/accommodations/about-accommodation) ondersteunt zoeken, beschikbaarheid, prijs, details en doorsturen. Rechtstreeks boeken vereist aanvullende goedkeuring en een passende partnerovereenkomst. [Expedia Rapid](https://developers.expediagroup.com/rapid/lodging/shopping/about-shopping-api) en [Amadeus Hotels](https://admin.developers.amadeus.com/self-service/apis-docs/guides/developer-guides/resources/hotels/) zijn alternatieven.

Begin met zoeken en doorsturen. Meerdere providers vergelijken vereist contracten per provider, consistente valuta, het normaliseren van kamer- en maaltijdtypes en een eerlijke vergelijking van belastingen, toeslagen en annulering. Gebruik geen scraping als productbasis.

### Vluchten en auto’s

[Skyscanner Travel APIs](https://developers.skyscanner.net/docs/intro) bieden partnerinterfaces voor live en indicatieve vlucht- en autohuurprijzen. [Booking.com Demand API](https://developers.booking.com/demand/docs/open-api/3.2/demand-api) bevat eveneens accommodaties, auto’s en vluchten. API-toegang, attributie, caching, commissies en prijsweergave moeten contractueel zijn geregeld.

### Plaatsen en activiteiten

[Google Places Text Search](https://developers.google.com/maps/documentation/places/web-service/reference/rest/v1/places/searchText) kan zoeken op tekst, type, locatie en prijsniveau. [Viator Partner API](https://docs.viator.com/partner-api/) biedt activiteiten, content, beschikbaarheid en prijzen; boekingsrechten hangen af van het partnerniveau. Foto’s, reviews en beschrijvingen moeten volgens de licentie- en attributieregels worden gebruikt.

### Privacy

- Roep externe zoekproviders via Node-02 aan zodat het IP-adres van de reiziger niet rechtstreeks wordt gedeeld, tenzij de functie dat zichtbaar vereist.
- Verstuur alleen bestemming, data, reizigersaantal en gekozen filters die voor de zoekactie nodig zijn.
- Sla zoekgeschiedenis of voorkeuren alleen op als de gebruiker dat verwacht en kan verwijderen.
- Benoem provider, commerciële relatie, internationale doorgifte, bewaartermijn en doel in de privacyverklaring vóór activering.
- Laat gevoelige intakevelden nooit onderdeel worden van publieke reizen, zoekopdrachten of AI-prompts.

## Aanbevolen bouwvolgorde

1. Rond productieacceptatie en migratie 1480 af.
2. Bouw een provider-onafhankelijk model voor reisopties, vergelijking en groepskeuze.
3. Voeg boekingsmailconcepten en veilige Agency-klantformulieren toe.
4. Koppel één accommodatieprovider met zoeken en doorsturen.
5. Bouw offline Vandaag plus offline uitgaven.
6. Voeg periodieke vluchtcontrole en web-push toe.
7. Meet gebruik voordat een tweede hotelprovider, vluchtprijzen, autohuur of activiteiten worden aangesloten.
8. Voeg zakelijke goedkeuringen, duurzaamheid of AI alleen toe wanneer de doelgroep en operationele verantwoordelijkheid duidelijk zijn.

## Niet als eerste bouwen

- rechtstreeks afrekenen van hotels, vluchten of activiteiten;
- een eigen openbaar reviewplatform;
- stille Gmail- of volledige mailboxscan;
- continue locatievolging;
- volledige turn-by-turn-navigatie;
- autonome AI die zonder bevestiging boekt of een reis wijzigt;
- prijsvergelijking door websites te scrapen.

Deze onderdelen brengen aanzienlijk meer support, aansprakelijkheid, gegevensverwerking, licentievoorwaarden en operationele kosten mee dan zoeken, vergelijken en gecontroleerd doorsturen.
