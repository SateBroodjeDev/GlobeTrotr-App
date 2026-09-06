# GlobeTrotr roadmap

GlobeTrotr is in de eerste plaats een reisplanner voor vriendengroepen, koppels en families. Agency-functionaliteit blijft als premium optie beschikbaar voor reisorganisaties.

> **Legenda:** `[x]` is gebouwd en beschikbaar. `[ ]` is gepland. Nieuwe werkzaamheden staan vanaf “Gepland” op prioriteit: **P0** eerst, daarna **P1** en **P2**.

# ✅ Al gebouwd

## Fase 1 — Accounts, privacy & dataopslag (klaar)

- [x] E-mailregistratie, inloggen en uitloggen via Supabase Auth
- [x] Privé workspace per account met Row Level Security
- [x] Workspace-instellingen blijven tijdelijk in `data`; reizen en reisgegevens laden en schrijven relationeel via SQL, met JSON als compatibiliteitskopie
- [x] Cloud-sync van reizen en instellingen, met lokale cache per account
- [x] Debounced opslag hersteld: opeenvolgende wijzigingen blijven niet op “Opslaan…” hangen
- [x] Publieke homepage voor bezoekers zonder account
- [x] Openbare reizen tonen de profielnaam van de eigenaar in plaats van de GlobeTrotr/white-label-merknaam

## Fase 2 — Reizen plannen (klaar)

- [x] Reizen aanmaken, archiveren en heractiveren
- [x] Nieuwe reizen krijgen direct een globale UUID en een relationele `trips`-rij
- [x] Start- en einddatum van een reis wijzigen, met validatie van de datums
- [x] Reisinstellingen pas opslaan na expliciete actie en serverbevestiging; naam, datums en budget kunnen niet leeg of ongeldig worden opgeslagen
- [x] Belangrijke reiswijzigingen pas als geslaagd melden na serverbevestiging: boekingen, uitgaven, bestemmingen, eigen programma-items en archiveren herstellen bij een serverfout de vorige staat
- [x] Bestemmingen zoeken en toevoegen op de Leaflet-routekaart
- [x] Dagplanning als chronologische timeline, met hele-reis- en per-dagweergave, afteller, paklijsten en reisstatus
- [x] Weerinformatie per bestemming
- [x] Reisonderdelen toevoegen en wijzigen: vlucht, overnachting, vervoer/reis, huurauto en activiteit
- [x] Aanbieder, boekingsnummer, datum(s), notities, kosten en valuta opslaan per reisonderdeel
- [x] Geselecteerde vertrek-, aankomst- en verblijflocaties automatisch met de kaart synchroniseren
- [x] Ruimere routekaart: grotere kaartkolom op desktop en 500–560 px kaarthoogte voor beter overzicht

## Fase 3 — Vluchten (deels klaar)

- [x] Vluchtnummer en vluchtstatus bewaren bij een vlucht
- [x] Eerste server-side koppeling met Aviationstack gebouwd als technische basis
- [x] Duidelijke melding bij een ontbrekende API-functie in het voormalige Aviationstack-plan of bij een bereikt quotum
- [x] Aviationstack in de app vervangen door SkyLinkAPI v3.1; de directe SkyLinkAPI-route is bevestigd
- [ ] `SKYLINK_API_KEY` als server-secret instellen in Lovable Cloud; de sleutel komt nooit in browsercode, Git of `workspaces.data`
- [x] SkyLinkAPI Flight Status server-side koppelen aan een vluchtnummer en de respons veilig omzetten naar GlobeTrotr-velden
- [ ] Live vertrek-/aankomsttijden en eventuele gate/terminal uitgebreider tonen
- [ ] Een Schedule-lookup alleen als nabije fallback toevoegen wanneer vertrek-IATA bekend is; SkyLink ondersteunt hiervoor slechts vijf dagen terug tot één dag vooruit en dus geen verre toekomstige reizen
- [ ] Duidelijke Nederlandse foutstatussen voor ongeldige vluchtnummers, geen resultaat, limiet bereikt en tijdelijke providerfout
- [ ] Automatisch periodiek verversen van vluchtstatus voor reizen die binnenkort vertrekken

## Fase 4 — Groepen & geld (klaar)

- [x] Reizigers beheren en kosten eerlijk verdelen met zo min mogelijk terugbetalingen
- [x] Multi-valuta, live koersomrekening en valutaconversie
- [x] Brandstof- en autokostencalculator
- [x] Kosten bij een reisonderdeel direct ook als gekoppelde uitgave opslaan
- [x] Gekoppelde kosten automatisch opruimen wanneer het reisonderdeel wordt verwijderd
- [x] Uitgaven wijzigen, inclusief verdeling, betaler, valuta en notitie; verrekening berekent direct opnieuw
- [x] Brandstofprognose per autorit, zichtbaar los van werkelijke uitgaven om dubbeltelling te voorkomen

## Fase 5 — Delen (klaar)

- [x] Een individuele reis openbaar maken of weer privé zetten
- [x] Publieke reispagina via een niet-voorspelbare token-URL
- [x] Openbare reizen tonen op de homepage
- [x] PIN-beveiliging per gedeelde reis
- [x] Budget per openbare reis wel of niet delen
- [x] Serverbevestiging en fout-herstel bij openbaar/privÃ© maken, budget delen en PIN-wijzigingen

## Fase 6 — Documenten & export (deels klaar)

- [x] CSV- en JSON-back-up/export
- [x] Printklare reisgids met Google Maps-navigatie per stop
- [x] PDF-reisoverzicht
- [x] Bonnetjes uploaden en koppelen aan een uitgave voor het Agency-plan: private `receipts`-opslag per account, PDF/JPG/PNG/WebP tot 10 MB, signed viewing-link en opruimen wanneer de databasekoppeling mislukt
- [ ] Boekingsbevestigingen als document koppelen aan een reisonderdeel
- [ ] De public view pagina mooi en overzichtelijker maken met bijvoorbeeld weer en een kaart

## Fase 7 — Abonnementen & Agency (deels klaar)

- [x] Free-, Pro- en Agency-plannen met accountgebonden cloudopslag
- [x] Plan wijzigen met bevestigde opslag in Supabase; JSON- en relationele plangegevens blijven daarbij synchroon
- [x] Agency-only: white-label, rollen, analytics en declarabele klantuitgaven
- [x] Agency-overzicht en Team & reisrechten hersteld na het uitfaseren van de oude workspace-demoleden; beide gebruiken nu de relationeel geladen reizen en reisleden
- [x] Voorbeeld-MRR, opslagstatistieken en fictieve facturen verwijderd; Agency toont alleen gegevens die GlobeTrotr werkelijk heeft
- [ ] Betalingen, facturen en abonnementstatus koppelen aan een betaalprovider, bijvoorbeeld Stripe
- [ ] Server-side verificatie van de abonnementstatus via webhooks

# 🧭 Gepland, op prioriteit

## Productprincipes voor de volgende fases

- Groepsfunctionaliteit moet ook zonder Agency-plan volledig bruikbaar blijven.
- Geld tussen reizigers is iets anders dan een betaling aan een reisorganisatie; beide krijgen een eigen stroom en eigen rechten.
- Boekingsbevestigingen, paspoortgegevens en betaalgegevens zijn privacygevoelig. Sla nooit ruwe kaartgegevens op en beperk toegang per reis en lid.
- De huidige JSON-workspace blijft tijdens de overgang een veilige terugval. Nieuwe kerngegevens worden daarna relationeel opgeslagen, zodat rechten, samenwerking en rapportages betrouwbaar kunnen werken.
- Een reisnaam is alleen een weergavelabel en mag onbeperkt dubbel voorkomen. Routes, koppelingen, uitnodigingen, uitgaven en publieke links gebruiken altijd een onveranderlijke, database-gegenereerde reis-ID.

## Besloten technische keuzes

- Transactionele app-e-mails (uitnodigingen, herinneringen en referrals) lopen via **Lovable Cloud Emails**.
- Het verzenddomein wordt `globetrotr.nl`, met een afzender zoals `noreply@globetrotr.nl`.
- API-sleutels, SMTP-wachtwoorden en andere secrets komen nooit in browsercode of het workspace-`data`-document.
- SkyLinkAPI wordt de vluchtprovider. De key staat uitsluitend als `SKYLINK_API_KEY` in Lovable Cloud; de app praat alleen via een serverfunctie met SkyLink.
- Stripe is de beoogde betaalprovider voor GlobeTrotr-abonnementen en Agency-facturen; deze koppeling volgt pas nadat uitnodigingen en veilige reisrechten bestaan.
- Lovable/Supabase SQL is beschikbaar en wordt de bron van waarheid voor accounts, reizen, reisleden en financiële gegevens. JSON wordt gefaseerd uitgefaseerd, niet in één risicovolle stap verwijderd.
- De eerste relationele import is op 6 september 2026 uitgevoerd. Dit is een momentopname: tot de app op SQL leest en schrijft, blijft `workspaces.data` de feitelijke runtimebron.

## Definitieve uitvoeringsvolgorde

1. **SQL-validatie & unieke reis-ID**: afgerond; relationele reizen hebben een globale UUID en de controles zijn uitgevoerd.
2. **Relationele reisopslag**: afgerond en handmatig gevalideerd; laden en wijzigen van reizen en kindgegevens loopt via SQL, met JSON als tijdelijke compatibiliteitskopie.
3. **Interface & boekingsbasis**: gebouwd; voer de nieuwe SQL-migratie uit en controleer huurauto's, timeline, kosten en leden in productie.
4. **SkyLink live vluchtdata**: server-side key instellen, één handmatige lookup betrouwbaar maken en pas daarna uitgebreidere velden tonen.
5. **Agency-basis herstellen**: bonnetjes uitsluitend voor Agency afdwingen en Agency-schermen op relationele data baseren.
6. **OAuth & accountafwerking**: OAuth-flow met echte providers handmatig testen, e-mailbevestiging testen en alleen daarna eventuele UI-details aanpassen.
7. **Relationele hardening**: parent- en kindwijzigingen atomair maken en gelijktijdige wijzigingen beschermen vóór toegang voor meerdere accounts.
8. **Veilige samenwerking**: toegang, rollen en uitnodigingstokens per reis server-side afdwingen.
9. **Agency-administratie**: echte workspace-teamleden, rechten en operationele dashboards bovenop de per-reisrollen bouwen.
10. **Boekingen & documenten**: opslag, tickets en boekingsimport toevoegen.
11. **Geldstromen**: groeps-betaalverzoeken, daarna Stripe en Agency-facturen.
12. **Reis onderweg**: routeoptimalisatie, offline toegang en meldingen.
13. **Lovable-e-mail**: pas na activering en domeinverificatie templates maken en de echte uitnodigingsstroom activeren.
14. **Groei**: referrals, prijsvergelijking, AI en de uitgebreide Agency-operatie.

## Huidige technische stand â€” 6 september 2026

- [x] De eerste twee SQL-migraties zijn uitgevoerd: relationele tabellen, globale `trip_uuid`, child foreign keys, owner-trigger, uitnodigingstabel en RLS-hulpfuncties bestaan in Lovable Cloud.
- [x] De UUID-controles zijn uitgevoerd zonder lege UUIDâ€™s, verweesde kindrijen of dubbele UUIDâ€™s.
- [x] Een herstelmigratie is beschikbaar voor reizen die tijdens de overgang alleen in `workspaces.data` waren beland: `20260906160000_repair_missing_trips_and_json_ids.sql`.
- [x] Nieuwe reizen worden op de server als UUID in `trips` aangemaakt; publicatie gebruikt dezelfde UUID en wordt direct relationeel bevestigd.
- [x] Reizen worden bij laden uit `trips` en alle relationele kindtabellen opgebouwd. Reismutaties schrijven rechtstreeks naar SQL en werken daarna de JSON-kopie bij.
- [x] Handmatige productiecontrole: relationeel laden en wijzigen werkt na het laden van de laatste Lovable-commit.
- [ ] `workspaces.data` blijft voorlopig de bron voor workspace-instellingen en als compatibiliteitskopie van reizen. Verwijder deze kopie pas na relationele transacties, collaboratieve RLS-tests en productiecontrole.
- [x] Profielvoorkeuren voor taal, tijdzone en dark mode zijn gebouwd; de tijdzone-migratie moet nog per omgeving worden uitgevoerd.
- [ ] Volgende data-mijlpaal daarna: relationele transacties/optimistic concurrency voor gelijktijdige wijzigingen, daarna toegang voor geaccepteerde reisleden met een eigen account.

## Huidige interface- en boekingsupdate — klaar na SQL-import

- [x] Light mode is omgezet naar neutraal wit/lichtgrijs met donker leesbare tekst, subtiele borders en accentkleur alleen voor kleine accenten.
- [x] Dark mode blijft beschikbaar en is neutraler gemaakt; de globale zon/maan-knop werkt ook voor bezoekers zonder account.
- [x] De header toont geen permanente eigenaar-/rolselector meer. Een ingelogde gebruiker krijgt een avatar met Account, Abonnement en Uitloggen; een bezoeker krijgt Inloggen en Registreren.
- [x] Profielfoto gebruikt een veilige signed URL met initialen als fallback.
- [x] Reisinstellingen, reisgenoten, kosten en verrekening gebruiken de profielnaam/eigenaar en echte `trip_members`, niet langer de oude workspace-demoleden.
- [x] Reisonderdelen kunnen worden toegevoegd én gewijzigd; gekoppelde kosten worden bij wijzigen direct bijgewerkt.
- [x] Uitgaven zijn bewerkbaar, inclusief datum, categorie, betaler, verdeling, valuta en notitie. Verwijderen maakt een gekoppeld boekingsbedrag los zodat geen verkeerde kosten blijven staan.
- [x] Reisschema is een chronologische timeline met totale reis- en dagweergave, datumkiezer en navigatie naar vorige/volgende dag.
- [x] Meerdaagse accommodaties en huurauto's krijgen inchecken/ophalen, doorlopende dagen en uitchecken/inleveren in de timeline.
- [x] Huurauto is als reisonderdeel toegevoegd, met verhuurder, auto/categorie, borg, verzekering, eigen risico, locaties, tijden, prijs en reserveringsnummer.
- [x] Autoritten kunnen afstand, verbruik en brandstofprijs bevatten; de brandstofprognose staat los van werkelijke uitgaven om dubbeltelling te voorkomen.
- [x] Toegevoegde boekingen maken geen los planningrecord meer. Verwijderen ruimt ook oudere automatisch gemaakte planningrecords op.
- [x] Voer eerst `supabase/migrations/20260906180000_booking_details_and_clean_members.sql` uit in Lovable Cloud / Supabase SQL Editor. Deze voegt boekingsdetails/notities toe, markeert oude planningkoppelingen en verwijdert de verouderde workspace-level demoleden.
- [ ] Na de SQL-import: Supabase TypeScript-types opnieuw genereren en een productiecontrole uitvoeren voor nieuwe huurauto, wijziging/verwijdering van een boeking, wijziging van een uitgave en een meerdaags hotel.

## P0 — SkyLinkAPI: live vluchtinformatie (volgende bouwstap)

SkyLinkAPI vervangt Aviationstack omdat de huidige Aviationstack-functie niet binnen het beschikbare abonnement valt. Versie één blijft bewust klein: de gebruiker voert een vluchtnummer in en vraagt zelf een actuele status op. Er is dus nog geen automatische polling, webhook of achtergrondtaak nodig.

- [x] Vastgesteld: de key komt rechtstreeks van SkyLinkAPI; gebruik `https://data.skylinkapi.com/v3.1` met de header `x-api-key`.
- [ ] In **Lovable Cloud → Secrets** `SKYLINK_API_KEY` toevoegen. Niet in `.env` committen, niet in de client en niet in een screenshot of workspace-JSON plakken.
- [x] `src/lib/flight.functions.ts` vervangen door een serverfunctie voor SkyLinkAPI v3.1 Flight Status; de browser roept uitsluitend deze eigen serverfunctie aan.
- [ ] Eén invoerformaat valideren: IATA-vluchtnummer zoals `KL1234` of ICAO zoals `KLM1234`, zonder de key of ruwe providerfout in de UI te tonen.
- [x] Maatschappij, vluchtstatus, vertrek- en aankomstluchthaven, geplande/verwachte/werkelijke tijden, terminal en gate opslaan en tonen wanneer SkyLink die levert.
- [ ] De bij de boeking gekozen vlucht-datum gebruiken voor weergave en alleen binnen SkyLink's beperkte datumvenster voor een Schedule-fallback; Flight Status zelf zoekt op vluchtnummer en heeft geen datumparameter.
- [x] Foutmeldingen mappen op een bruikbare actie: geen vlucht gevonden, ongeldige invoer, tijdelijk niet beschikbaar of maandlimiet bereikt.
- [ ] Testen met één toekomstige en één historische/actieve vlucht, met een ontbrekend vluchtnummer en zonder secret. Controleer dat geen secret in DevTools, logs of de database verschijnt.
- [ ] Daarna pas: cache met `last_checked_at`, beperkte handmatige refresh en polling alleen voor reizen die binnen korte tijd vertrekken.

## P1 — Compacte kaart- en planningweergave

Een reis met veel bestemmingen of boekingen mag niet veranderen in één onhandelbare, eindeloos lange pagina. De kaart blijft het ruimtelijke overzicht; reisschema en bestemmingsoverzicht worden compacte, taakgerichte schermdelen.

- [x] Lange bestemmingenlijst onder de kaart vervangen door een compacte samenvatting met aantal stops en een knop **Alle bestemmingen**.
- [x] Volledige bestemmingenlijst in een inklapbaar paneel tonen, met een compacte rij per stop; zoeken volgt bij zeer grote lijsten.
- [x] Kaartfocus toevoegen: klik op een stop in de lijst of marker om de kaart daarop te centreren en markeer de actieve stop.
- [x] **Reisschema** standaard als dagkiezer/timeline openen; de volledige reis blijft als bewust gekozen overzicht beschikbaar.
- [x] **Reisschema** en **Reisschema aanpassen** als afzonderlijke tabs: de eerste is rustig en alleen-lezen, de tweede bevat boekingen en bewerkbare programma-items voor gebruikers met bewerkrechten.
- [ ] Maak daggroepen standaard inklapbaar en behoud alleen de geselecteerde dag/openstaande bewerking; geef altijd een teller zodat niets verborgen voelt.
- [ ] Voeg snelle filters toe voor vlucht, accommodatie, vervoer, huurauto, activiteit en handmatige planningitems.
- [ ] Houd directe acties zoals toevoegen, wijzigen en verwijderen bereikbaar op desktop én mobiel; test met minstens 15 stops en een reis van 14 dagen.

## P0 — Accountinstellingen

Een aparte pagina **Accountinstellingen** voor de persoon achter het account. Dit is nadrukkelijk iets anders dan Reisinstellingen en het Agency-abonnement.

### Profiel

- [x] Accountinstellingenpagina met profiel, inlogmethodes, abonnement-link, communicatie en privacy-overzicht
- [x] Weergave- en volledige naam wijzigen
- [x] Profielfoto uploaden en vervangen via private Storage onder de eigen gebruikersmap (na SQL-import)
- [x] Primair e-mailadres wijzigen via Supabase Auth, inclusief de bestaande bevestigingsstroom
- [x] Telefoonnummer opslaan voor contact en optionele notificaties; nooit publiek tonen
- [x] Taal-, tijdzone- en dark-modevoorkeur kunnen vanuit Accountinstellingen in `profiles` worden opgeslagen (niet meer in `workspaces.data`)
- [x] Tijdzone-migratie toegevoegd: `supabase/migrations/20260906170000_add_profile_timezone.sql`; veilige standaard is `Europe/Amsterdam`
- [ ] Voer `20260906170000_add_profile_timezone.sql` eenmalig uit in Lovable Cloud / Supabase SQL Editor
- [x] De gekozen weergavemodus wordt direct appbreed toegepast, inclusief systeemmodus via `prefers-color-scheme`; vertalingen volgen in een afzonderlijke stap
- [x] E-mailadres wijzigen via Supabase Auth met zichtbare bevestigingsuitleg; het oude adres blijft actief tot de bevestigingslink is gebruikt

### Beveiliging & inloggen

- [x] Wachtwoord wijzigen via Supabase Auth, met minimale lengte, herhaling, laadstatus en duidelijke foutmelding bij een verlopen sessie
- [x] Overzicht van gekoppelde inlogmethodes: e-mail/wachtwoord, Apple, Google en Microsoft
- [x] Inlog- en registratiepagina met Apple-, Google- en Microsoft-knoppen via Lovable/Supabase OAuth, naast e-mail en wachtwoord
- [x] Profielpagina met Apple-, Google- en Microsoft-identiteiten koppelen/ontkoppelen; de laatste bruikbare inlogmethode kan niet worden verwijderd
- [x] OAuth-knoppen gebruiken de Lovable/Supabase-providerroute en veilige redirect-URL; providersecrets staan niet in browsercode
- [ ] **Geblokkeerd in Lovable Cloud:** Google staat op **Managed by Lovable**, maar project `adlrxxyaubxzzjfzibjn` antwoordt op `/auth/v1/authorize?provider=google` met `400 validation_failed: Unsupported provider: missing OAuth secret`. Dit is backend-provisioning, geen browser- of SQL-fout.
- [ ] Google in Lovable Cloud opnieuw uit- en inschakelen, **Managed by Lovable** opnieuw opslaan en daarna in incognito testen. Blijft de fout bestaan, ticket bij Lovable Support met project-ID en exacte foutmelding.
- [ ] Apple en Microsoft alleen als beschikbaar tonen zodra hun Lovable/Supabase-provider daadwerkelijk een secret heeft; geen providersecret in Git, browsercode, SQL of `workspaces.data` zetten.
- [ ] Handmatige productiecontrole: eerste Apple-, Google- en Microsoft-login, een al bestaand e-mailaccount en koppelen/ontkoppelen testen zonder duplicaat-workspace
- [ ] Actieve sessies en uitloggen op andere apparaten, als de gekozen Auth-configuratie dit ondersteunt
- [ ] Account verwijderen met expliciete bevestiging, gegevens-export en duidelijke bewaartermijn

### Abonnement & meldingen

- [ ] Huidig plan, limieten en upgrade-link tonen; de bestaande abonnementspagina blijft de plek om een plan te wijzigen
- [ ] Facturen en betaalgegevens alleen tonen zodra Stripe is gekoppeld
- [ ] Meldingsvoorkeuren voor productmails, reisuitnodigingen, betalingen en vluchtalerts

## P0 — SQL-fundament & JSON-migratie

De migratie gebeurt in afzonderlijke, omkeerbare stappen. Voor elke stap: backup/export maken, SQL uitvoeren, aantallen vergelijken en pas daarna de app op de nieuwe tabel laten lezen.

### SQL-migraties die nodig zijn

- [x] Importscript aangemaakt: `supabase/migrations/20260906140000_normalize_globetrotr_data.sql`
- [x] Importscript uitgevoerd in Lovable Cloud / Supabase SQL Editor (6 september 2026)
- [x] `profiles`: voeg `phone`, `avatar_path`, `locale`, `theme` en `notification_preferences` toe. `display_name` en `email` bestaan al.
- [x] `workspaces`: plan, basisvaluta en branding zijn als kolommen toegevoegd; `data` blijft tijdelijk als compatibiliteitskopie bestaan.
- [x] `trips`: relationele rijen voor naam, template, start/einddatum, budget, publicatie, PIN-hash en archiefstatus zijn aangemaakt en gevuld.
- [x] `trip_members`: tabel voor lid, e-mail, rol, uitnodigingsstatus en latere Auth-koppeling is aangemaakt.
- [x] `trip_stops`, `trip_itinerary_items`, `trip_expenses`, `trip_travel_items` en `trip_packing_items`: relationele tabellen zijn aangemaakt en gevuld.
- [x] `trip_documents`: metadata-tabel voor private tickets, bonnetjes en boekingsbevestigingen is aangemaakt; bestanden zelf blijven in Storage.
- [ ] Voer `20260906180000_booking_details_and_clean_members.sql` uit: `trip_travel_items.details`, `trip_expenses.notes`, huurauto-type, legacy-planningkoppelingen en opschoning van oude workspace-demoleden.
- [ ] Voer `20260906190000_restrict_receipts_to_agency.sql` uit: de bestaande JSON-planwaarde wordt eenmalig met `workspaces.plan` gesynchroniseerd; Storage-RLS voor de `receipts`-bucket staat daarna alleen lezen, uploaden, wijzigen en verwijderen toe wanneer `workspaces.plan = 'agency'`.
- [ ] Voer `20260906200000_atomic_trip_snapshots.sql` uit: één server-only RPC slaat de parent-reis, alle kindgegevens en de JSON-compatibiliteitskopie in één database-transactie op. Een fout laat dus geen half opgeslagen reis achter.
- [ ] Genereer na deze import de Supabase TypeScript-types opnieuw en werk de lokale type-definities bij.
- [ ] `referrals`, `subscription_events`, `invoices` en `payment_events` pas toevoegen wanneer referrals/Stripe daadwerkelijk worden gebouwd.

### Directe vervolgmigratie — globale, unieke reis-ID

De huidige sleutel is `(workspace_user_id, id)`: dubbele reisnamen zijn dus al toegestaan en de app gebruikt de naam niet als sleutel. De huidige `id` is echter een korte browser-ID (`uid()`), geen database-gegarandeerde globale UUID. Voor gedeelde reizen en meerdere accounts is één onveranderlijke UUID per reis nodig.

- [x] Uitvoerbare vervolgscript toegevoegd: `supabase/migrations/20260906150000_add_global_trip_uuid_and_collaboration_rls.sql`
- [x] Vervolgscript uitgevoerd in Lovable Cloud / Supabase SQL Editor; de controlequeries op lege, verweesde en dubbele UUID's gaven nul terug.
- [x] Iedere bestaande en nieuwe reis heeft een onveranderlijke globale `trip_uuid`; dezelfde reisnaam mag nog steeds onbeperkt voorkomen.
- [x] UUID staat naast de tijdelijke tekst-ID; kindtabellen zijn gebackfilld en hebben foreign keys op de UUID.
- [x] UUID is de primaire referentie voor nieuwe privé-routes, nieuwe publieke links en nieuwe reisaanmaken; oude tijdelijke IDs en URLs hebben alleen nog een tijdelijke fallback.
- [x] De database geeft de UUID bij het aanmaken van een reis terug; client-side `uid()` wordt niet meer gebruikt voor ingelogde reizen.
- [x] Indexen voor UUID, eigenaar/startdatum en openbare niet-gearchiveerde reizen zijn toegevoegd.
- [ ] Schrijf een rollback- en controlequery: geen lege UUID’s, geen verweesde kindrijen en exact evenveel unieke reizen vóór en na de omzetting.

### Verplichte omzetting in de hele applicatie

De UUID-migratie is pas klaar wanneer ieder pad dezelfde sleutel gebruikt. Tijdens deze stap mag geen route, query, opslagpad of permissie meer een reis op naam vinden.

- [x] **Privéweergave**: `/trips/$tripId`, dashboardlinks, `updateTrip` en nieuwe reizen gebruiken de UUID. Reizen en kindgegevens worden relationeel geladen en gewijzigd.
- [x] **Publieke weergave (deels)**: `/reis/$token/$tripId`, `listPublicTrips` en `getPublicTrip` gebruiken relationele `trip_uuid`; tijdelijke fallback houdt oude URLs en JSON-data bruikbaar.
- [x] **Serverfuncties (basis)**: relationeel laden, aanmaken, wijzigen, publicatie en verwijderen gebruiken UUID-invoer. Elke reiswijziging werkt ook de JSON-compatibiliteitskopie bij.
- [x] **Serverfuncties (atomaire basis)**: `saveTrip` gebruikt na SQL-import `save_trip_snapshot`: parent, kindgegevens en JSON-kopie worden onder een parent-lock in één transactie opgeslagen. Vóór de import blijft alleen als compatibiliteit de oude route actief.
- [ ] **Serverfuncties (concurrency)**: voeg daarna `updated_at`/versiecontrole in de interface toe, zodat een tweede gelijktijdige wijziging een duidelijke conflictmelding krijgt in plaats van stil overschrijven.
- [x] **Kindgegevens (schema)**: stops, dagplanning, uitgaven, boekingen, paklijst, reisgenoten en documenten hebben een foreign key naar dezelfde reis-UUID.
- [x] **Kindgegevens (runtime)**: stops, planning, uitgaven, boekingen, paklijst en reisgenoten worden relationeel geladen en via de reisschrijfroute bijgewerkt.
- [ ] **Delen en bestanden**: maak publieke tokens en Storage-paden (`avatars` uitgezonderd) onafhankelijk van reisnaam; documenten krijgen een reis-UUID-pad en publieke data bevat alleen expliciet deelbare velden.
- [ ] **Uitnodigingen en rechten**: `trip_members`, `trip_invitations`, RLS-helpers en activiteitenlog gebruiken de reis-UUID als enige reisreferentie.
- [ ] **Compatibiliteit**: map bestaande JSON-`trip.id` éénmalig op de nieuwe UUID. Houd deze mapping alleen gedurende de overgang, toon hem niet aan gebruikers en verwijder hem pas na de SQL-omzetting.
- [ ] **Regressietest**: maak twee reizen met exact dezelfde naam, maak één privé en één openbaar, en controleer dat openen, wijzigen, delen, kosten, documenten en uitnodigingen steeds bij de juiste UUID blijven.

### SQL voor meerdere gebruikers en gedeelde reizen

De huidige RLS-regels geven uitsluitend de eigenaar (`workspace_user_id = auth.uid()`) toegang. Dat is correct voor privédata, maar nog niet voldoende voor een reisgenoot met een eigen account.

- [x] `trip_members` is als relationele toegangsbron aangemaakt: eigenaar wordt bij een nieuwe reis automatisch als actief lid toegevoegd.
- [x] Databaseconstraints/indexen voor één eigenaar per reis, één actief lid per reis + `user_id` en één open uitnodiging per e-mailadres zijn toegevoegd.
- [x] `trip_invitations` bestaat als aparte tabel met gehashte token, e-mail, rol, verloop- en statusvelden; tokens staan niet in `workspaces.data`.
- [x] Owner-only RLS is vervangen door rolgerichte policies en afgeschermde `private`-hulpfuncties voor reizen en kindtabellen.
- [ ] Sluit de app nu op deze relationele rechten aan: de huidige privé-interface leest nog de owner-workspace JSON en verleent nog geen toegang aan een geaccepteerd lid met een eigen account.
- [ ] Gebruik voor herbruikbare RLS-controles een niet-publiek `private` schema met zorgvuldig afgeschermde `SECURITY DEFINER`-functie, vaste `search_path` en rolchecks. Hiermee worden recursieve policies tussen reizen en leden voorkomen.
- [ ] Koppel een betaler en kostenverdeling uiteindelijk aan een reisgenoot-ID, niet aan alleen een weergavenaam. Dit voorkomt fouten bij twee personen met dezelfde naam of een naamswijziging.
- [ ] Maak `expense_shares` relationeel zodra gedeeltelijke kostenverdeling wordt opgeslagen; vervang het JSON-veld `split_with` pas na een gecontroleerde backfill.
- [ ] Verplaats documenten naar een pad met de globale reis-ID en maak Storage-RLS op reisrechten, zodat actieve leden alleen documenten van hun eigen reis kunnen zien.
- [ ] Voeg optimistic concurrency toe (versie of `updated_at`-controle) voor gelijktijdige wijzigingen, plus een activiteitenlog met actor-ID en tijdstip.
- [ ] Test RLS met minimaal eigenaar, actieve medereiziger, kijker, uitgenodigde gebruiker en niet-lid. Test ook dat een lid nooit een andere reis van dezelfde eigenaar kan lezen.
- [ ] Genereer na iedere schemawijziging de Supabase TypeScript-types opnieuw en vervang de handmatige types in `src/integrations/supabase/types.ts`.

### Migratie- en toepassingsplan

- [x] Een eerste migratie maakte tabellen, indexen, foreign keys, `updated_at`-triggers en owner-only Row Level Security-regels.
- [x] Een tweede migratie voegde `trip_uuid`, UUID-foreign keys, automatische owner-leden, uitnodigingen en rolgerichte RLS toe.
- [x] Een herstelmigratie voor ontbrekende JSON-reizen is toegevoegd en na de SQL-overgang gebruikt: `20260906160000_repair_missing_trips_and_json_ids.sql`.
- [x] Nieuwe reizen en publicatie schrijven direct via beveiligde serverfuncties naar `trips`; relationele sync kan de JSON-opslag niet langer eindeloos blokkeren.
- [x] Een éénmalige backfill kopieerde bestaande `workspaces.data.trips[]` naar de nieuwe tabellen, zonder JSON te verwijderen.
- [ ] Voer nu controlequery’s uit en leg de uitkomsten vast: aantal workspaces, reizen, stops, uitgaven, boekingen, paklijstitems en reisgenoten vóór/na import.
- [ ] Maak vóór elke volgende wijziging een export/back-up. De eerste import is geen doorlopende synchronisatie: kindtabellen gebruiken `ON CONFLICT DO NOTHING` en worden niet automatisch bijgewerkt bij latere JSON-wijzigingen.
- [x] Overgangslaag toegevoegd: na de UUID-migratie schrijft een bestaande JSON-save ook de relationele reis en kindgegevens bij; vóór die migratie blijft JSON zonder foutmelding werken.
- [x] Publieke serverweergave leest relationele reizen via `trip_uuid`, met tijdelijke fallback voor bestaande JSON-data en oude deel-URLs.
- [x] Een atomaire serverwrite is voorbereid in `20260906200000_atomic_trip_snapshots.sql`; na uitvoering worden relationele data en JSON-kopie samen bevestigd of samen teruggedraaid.
- [ ] Test na die SQL-import één reis met stops, planning, boeking, uitgave, paklijst en reisgenoot. Forceer daarna bewust een ongeldige kindrij en controleer dat de vorige volledige reis intact blijft.
- [ ] Start die omzetting met één eigenaar en één privéreis als eerste testpad; migreer daarna stops, planning, uitgaven, boekingen, paklijst en leden afzonderlijk.
- [ ] Zet per onderdeel een featureflag om nadat lees-, schrijf- en RLS-tests slagen; begin met privé-reizen van de eigenaar, daarna leden, kosten en documenten.
- [ ] Na productiecontrole wordt SQL de bron van waarheid; daarna wordt de JSON-compatibiliteitskopie in een aparte, goedgekeurde migratie verwijderd.
- [ ] Per-reis toegang wordt via RLS op `trips` en `trip_members` afgedwongen; rollen in de browser zijn nooit de beveiliging.

## P0 — Reiservaring & instellingen (klaar)

- [x] Nieuwe tab **Instellingen** binnen iedere reis, geen losse modal
- [x] Reisnaam, start- en einddatum, budget en template staan in deze tab
- [x] Openbare/publicatie-instellingen, budget delen en PIN staan in deze tab
- [x] Archiveren en verwijderen staan als afgeschermde acties onderaan de tab, met bevestiging
- [x] Reisschema is gericht op dagplanning, boekingen en kosten
- [x] Toon na serverbevestiging een succesmelding bij openbaar/privé maken, budget delen en PIN-wijzigingen; herstel de vorige status bij een fout.
- [x] Reisnaam, datums, budget en template gebruiken een gevalideerde, expliciete opslagactie met serverbevestiging en fout-herstel.
- [ ] Breid deze bevestigingen uit naar leden, archiveren/verwijderen, reisonderdelen, uitgaven, stops en dagplanning zodra deze ieder een eigen relationele schrijfroute hebben.

## P0 — Planning, boekingen & kosten

- [x] Timeline met overzicht van de hele reis én een specifieke dag, inclusief datumkiezer en vorige/volgende-dagnavigatie.
- [x] Vlucht-, hotel-, activiteit-, vervoer- en huurauto-iconen en relevante status, locatie, tijd, boekingsnummer en prijs.
- [x] Type-specifieke, responsieve formuliergrids: vlucht, hotel, activiteit, vervoer en huurauto tonen alleen relevante velden.
- [x] Vlucht heeft één datum; vluchtnummer en live-opvraagknop staan op dezelfde desktoprij.
- [x] Activiteiten, boekingen en uitgaven zijn bewerkbaar; gekoppelde kosten synchroniseren direct met budget en verrekening.
- [x] Huurauto's en doorlopende accommodaties worden slim, zonder dubbele volledige boekingen, per dag weergegeven.
- [x] Brandstofprognose per autorit, met liters en kosten op basis van afstand, verbruik en brandstofprijs.
- [ ] Voeg serverbevestiging + herstel van de vorige staat toe aan snelle wijzigingen van boekingen, uitgaven, stops, leden en planning (nu nog debounced/optimistisch).
- [ ] Koppel kostenverdeling aan `trip_member`-IDs in plaats van namen voordat actieve leden met gelijke namen of naamswijzigingen kunnen samenwerken.
- [ ] Voeg werkelijke tankbonnen toe en laat een gebruiker expliciet kiezen of een brandstofprognose wordt vervangen, zodat prognose en realisatie nooit dubbel meetellen.

## P0 — Fundament voor samenwerking

De huidige ledenlijst wordt een echte groepsreis: uitnodigen, rollen en gelijktijdig plannen. Grote planners zoals Wanderlog en Roadtrippers behandelen samenwerken als kernfunctionaliteit, niet als Agency-extra. [Wanderlog](https://wanderlog.com/travel-maps) [Roadtrippers](https://roadtrippers.com/about/features/)

- [ ] Reizigers per e-mail uitnodigen voor één specifieke reis, zonder toegang tot alle reizen van de eigenaar
- [ ] Rollen per reis: eigenaar, bewerker, deelnemer en alleen-lezen
- [ ] Uitnodiging accepteren/weigeren en lid weer verwijderen
- [ ] Gedeelde, live wijzigingen met conflictveilige opslag en zichtbare “laatst gewijzigd door”-informatie
- [ ] Activiteitenlog: wie wijzigde een stop, boeking, planning of uitgave?
- [ ] Reacties en @mentions bij een reisonderdeel of dag in de planning
- [ ] Meldingsvoorkeuren per reis: uitnodigingen, wijzigingen, betaalverzoeken en vluchtalerts

### JSON-basis (klaar)

- [x] Reisgenoten staan per reis in het bestaande workspace-`data`-document
- [x] Naam, e-mail, rol, uitnodigingsstatus en uitnodigingsdatum worden per reisgenoot bewaard
- [x] Reisgenoten beheren vanuit de Instellingen-tab van de betreffende reis
- [x] Rol en status handmatig beheren zolang automatische e-mailuitnodigingen nog niet beschikbaar zijn

## P0 — E-mail, uitnodigingen & logische rollen

De huidige knop “Uitnodigen” registreert alleen een lid in de workspace; echte bezorging en toegang bestaan nog niet. Dit onderdeel maakt de volledige, veilige stroom af.

> **Uitgesteld:** begin pas met de e-mailimplementatie nadat Lovable Cloud Emails is geactiveerd en `globetrotr.nl` in Lovable is geverifieerd. Tot die tijd blijven reisgenoten als JSON-status `Uitgenodigd` beheerd worden.

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

- [x] **Eigenaar**, **Medereiziger** en **Kijker** als JSON-rollen per reis
- [x] Free: maximaal twee reisgenoten; Pro: onbeperkt reisgenoten
- [ ] Rechten bij iedere serveractie afdwingen zodra toegangsverlening voor andere accounts is gebouwd
- [ ] Geen accountant-, declaratie- of klantrollen in de vriendengroep-interface

### Rollen voor Agency

- [x] **Reisadviseur**, **Financiën** en **Klant/reiziger** als JSON-rollen per reis
- [ ] Workspace-eigenaar: abonnement, branding, team en alle reizen
- [ ] Rechten voor adviseur, financiën en klant daadwerkelijk per actie afdwingen
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
- [ ] Taalkeuze uit `profiles.locale` toepassen op e-mails, publieke reispagina’s en exports
- [ ] Datums, bedragen, valuta en tijdzones tonen volgens de gekozen locale
- [ ] Nieuwe teksten alleen via vertaalkeys toevoegen; controle op ontbrekende vertalingen in de build

## P1 — Weergave & dark mode

- [x] Dark mode en light mode voor de app-shell en standaard UI-componenten via de bestaande kleurvariabelen
- [x] Keuze: systeeminstelling volgen, licht of donker; opgeslagen in `profiles.theme`
- [ ] Donkere kaarttegels voor Leaflet en een visuele controle van uitzonderlijke schermen en lege statussen
- [ ] Contrast, focusstatussen en foutmeldingen controleren op toegankelijkheid in beide modi
- [ ] PDF- en printweergave bewust licht houden voor leesbaarheid en papierverbruik

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

## P1 — Agency-administratie

Dit is het operationele dashboard voor een Agency-workspace. Het is nadrukkelijk iets anders dan per-reisrollen: het beheert het eigen team, klanten en werkvoorraad binnen één Agency-account.

- [ ] Alleen Agency-eigenaren krijgen toegang tot een **Agency Admin**-dashboard; geen route alleen op basis van een verborgen navigatieknop beveiligen
- [ ] Relationele `workspace_members`- en `workspace_invitations`-tabellen toevoegen, met UUID, status, verloopdatum en RLS per workspace
- [ ] Teamleden beheren met rollen: eigenaar, reisadviseur en financiën; klanten blijven uitsluitend per reis gekoppeld
- [ ] Eigen teamoverzicht met actieve leden, open uitnodigingen, limieten en laatst actieve wijzigingen
- [ ] Werkvoorraad: aankomende reizen, ontbrekende boekingsdetails, open kosten, onbetaalde facturen en verlopen uitnodigingen
- [ ] Agency-statistieken alleen uit echte data: actieve klantreizen, uitgaven, declarabel, omzet/openstaand zodra Stripe bestaat en documentgebruik zodra Storage-meting bestaat
- [ ] Auditlog voor team-, rol-, factuur- en klantwijzigingen met actor, tijdstip en context

## P2 — Platformbeheer (Domenic)

Een compacte app-side beheeromgeving als aanvulling op Lovable, uitsluitend voor de GlobeTrotr-platformbeheerder. Dit is geen kopie van Lovable en toont nooit secrets, wachtwoorden, OAuth-tokens of ruwe betaalkaartgegevens.

- [ ] Afzonderlijke `platform_admins`-tabel met een expliciete, server-side gecontroleerde gebruikers-UUID voor Domenic; geen toegang op basis van e-mail, plan of client-state
- [ ] Aparte serverfuncties en RLS voor een **Platformbeheer**-route; elke beheeractie krijgt auditlogging
- [ ] Overzicht: geregistreerde gebruikers, bevestigde accounts, planverdeling, actieve/openbare reizen, Storage-gebruik en fout-/activiteitscijfers uit echte aggregaties
- [ ] Gebruikersoverzicht met minimale noodzakelijke profielgegevens, zoek/filter, accountstatus en ondersteuningsnotities; gevoelige gegevens alleen na expliciete actie en met auditlog
- [ ] Moderatie voor openbare reizen: verbergen/herstellen met reden en auditlog, zonder privéreisdata te tonen
- [ ] Beheerbare productinstellingen zoals featureflags, onderhoudsmelding en handmatige plan-correctie; betaling blijft uitsluitend via Stripe-webhooks leidend
- [ ] Privacytools: export- en verwijderverzoeken volgen, bewaartermijnen en misbruikmeldingen behandelen

## P2 — Agency-automatisering & schaalbaarheid

- [ ] Herbruikbare itinerary-, factuur-, e-mail- en paklijsttemplates
- [ ] Offertes met meerdere varianten, klantgoedkeuring en conversie naar een reis
- [ ] Klantportaal met alleen de relevante reis, documenten, facturen en betaalstatus
- [ ] Taken, deadlines en automatiseringen voor het Agency-team
- [ ] Supplier-/leveranciersbibliotheek en contentbibliotheek voor veelgebruikte hotels en activiteiten
- [ ] Rapportages over conversie, omzet, marge, commissie en klanttevredenheid
- [ ] Webhook-/integratielaag voor boekhoudpakket, CRM en betaalprovider
- [ ] Rate limiting, auditlogs, back-ups, export/verwijderverzoeken en herstelproces voor productiegegevens
