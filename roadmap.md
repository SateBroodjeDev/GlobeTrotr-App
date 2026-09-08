# GlobeTrotr roadmap

GlobeTrotr is in de eerste plaats een reisplanner voor vriendengroepen, koppels en families. Agency-functionaliteit blijft als premium optie beschikbaar voor reisorganisaties.

> **Legenda:** `[x]` is gebouwd of expliciet als uitgevoerd bevestigd. `[ ]` is open: bouw, configuratie of controle. Gebouwd betekent niet automatisch in productie getest. Nieuwe werkzaamheden staan vanaf “Gepland” op prioriteit: **P0** eerst, daarna **P1** en **P2**.

## Actuele stand — 8 september 2026

- [x] Juridische contactgegevens gepubliceerd: GlobeTrotr, postadres (geen bezoekadres) Gedempte Oude Gracht 95, 2011 GT Haarlem en privacy@globetrotr.nl.
- [x] Privacykeuzes voor ingelogde gebruikers naar Accountinstellingen verplaatst; alleen gasten zien de keuze in de footer.
- [x] Oude AtlasLedger-cachenaam vervangen door `globetrotr.workspace.v1` met verliesvrije eenmalige migratie en opruiming.
- [x] Vaste feedbackknop voor ingelogde betatesters gebouwd met veilige invoerlimieten en waarschuwing voor gevoelige gegevens.
- [x] Corporate Admin-pagina en publieke pagina Bekende problemen gebouwd; NL/EN, status, ernst, zichtbaarheid en feedbackstatus zijn beheerbaar.
- [x] GitHub Issues-synchronisatie gebouwd voor nieuwe en gewijzigde bekende problemen.
- [x] Feedbackknop verkleind tot een toegankelijk icoon zonder overlopende tekst.
- [x] Feedback en bekende problemen kunnen worden gearchiveerd, hersteld en definitief verwijderd; statussen en ernst worden in NL/EN weergegeven.
- [ ] Veilige automatische vertaling van bekende problemen server-side toevoegen nadat een vertaalprovider, verwerkersafspraken, bewaarbeleid en secret zijn gekozen.
- [x] Migratie `20260908017000_archive_feedback_and_issues.sql` uitgevoerd.
- [x] Gedeelde categorieën voor feedback en bekende problemen gebouwd en vertaald weergegeven in beheer en op de openbare probleemlijst.
- [x] Migratie `20260908018000_feedback_issue_categories.sql` uitgevoerd.
- [x] Migratie `20260908016000_beta_feedback_and_known_issues.sql` en test `supabase/tests/beta_feedback_and_known_issues.sql` uitgevoerd.
- [x] Corporate Admin-claim `app_metadata.corporate_admin=true` uitsluitend aan het GlobeTrotr-beheerdersaccount toegekend en opnieuw ingelogd.
- [x] Server-secrets `GITHUB_ISSUES_TOKEN` en `GITHUB_ISSUES_REPOSITORY` ingesteld; aanmaken en wijzigen synchroniseren correct met GitHub Issues.
- [x] Corporate Admin kan de drie actuele beta-beperkingen eenmalig importeren en direct naar GitHub synchroniseren: automatische e-mails, OAuth-login en automatische feedbackvertaling.
- [x] Veilige publieke roadmap op `/roadmap` toegevoegd en vanuit de footer bereikbaar; interne techniek, secrets en beheerwerk blijven uitsluitend in dit bestand.

### Actuele bekende beta-beperkingen

- Automatische app-e-mails en reisuitnodigingen zijn nog niet actief.
- Inloggen met Apple, Google en Microsoft volgt na de beta-infrastructuur.
- Feedback en bekende problemen moeten nog handmatig naar NL/EN worden vertaald.

- [x] Privacy- en browseropslagverklaring uitgebreid met gegevensdoelen, AVG-grondslagen, ontvangers, doorgiften, bewaartermijnen, rechten, openbare gegevens en een concrete opslaginventaris.
- [x] Privacykeuze op iedere eerste sessie toegevoegd: optionele taalopslag staat standaard uit, weigeren en opslaan zijn gelijkwaardig en de keuze is later via footer en privacypagina aanpasbaar.
- [x] Externe Google Fonts- en unpkg-verzoeken bij iedere paginalaad verwijderd; Leaflet-CSS wordt lokaal gebundeld.
- [x] Beta-voorwaarden uitgebreid met deelname, toegestaan gebruik, gebruikersinhoud, beta- en reisrisico's, beëindiging, aansprakelijkheid, consumentenbescherming en toepasselijk recht in NL/EN.

- [x] Homepage vernieuwd met een visuele productdemo, mogelijkheden, stappenplan, openbare reisinspiratie en duidelijke beta-call-to-actions in NL/EN.
- [x] Blanco homepage door `Map`-naamconflict opgelost en een uitgebreide publieke pagina **Mogelijkheden** toegevoegd voor routes, planning, boekingen, kosten, samenwerking, delen, exports en Agency.
- [x] Migratie `20260908010000_public_trip_api.sql` en test `supabase/tests/public_trip_api.sql` volledig uitgevoerd; publieke RPC's geven alleen geselecteerde reisvelden vrij en valideren PIN-toegang.
- [x] Homepage en een openbare reis rechtstreeks via de productie-RPC gecontroleerd met alleen de publishable key: de openbare lijst laadt en de detailroute antwoordt met `ok`, zonder `SUPABASE_SERVICE_ROLE_KEY`.
- [x] Internationale beta-pagina uitgebreid tot praktische testgids met testgebieden, meldinstructies, veiligheidsadvies en bekende beperkingen.
- [x] Privacyverklaring uitgebreid met AVG-informatie over verwerkingsverantwoordelijkheid, gegevenscategorieën, doelen en grondslagen, ontvangers, doorgiften, bewaartermijnen, rechten en de klachtroute bij de Autoriteit Persoonsgegevens.
- [x] Accountgegevens kunnen vanuit Accountinstellingen als machineleesbare JSON worden geëxporteerd; accountverwijdering gebruikt een expliciete `DELETE`-bevestiging en ruimt eigen databasegegevens en uploads op.
- [x] Praktijktest bevestigd: zowel de volledige gegevens-export als accountverwijdering werken stabiel in de gekoppelde omgeving.
- [x] Negen regressietests en de client-, SSR- en Cloudflare-productiebuild zijn na de pagina- en accountwijzigingen geslaagd.
- [ ] Voor een volledig openbare productieopening de officiële juridische naam, vestigings-/postadres en een werkend privacycontactadres van de verwerkingsverantwoordelijke publiceren.
- [x] Reisinstellingen tonen bij de reisnaam een live tekenteller tot de limiet van 30, gelijk aan de teller bij de omschrijving.
- [x] Migratie `20260908002000_trip_text_limits.sql` en regressietest `supabase/tests/trip_text_limits.sql` uitgevoerd; reisnamen zijn maximaal 30 tekens en reisomschrijvingen maximaal 375 tekens.
- [x] Mobiele slimme verrekening hersteld: de vierkolomstabel is op telefoon vervangen door compacte kaarten en Saldo krijgt een eigen volledige rij binnen de kaart.
- [ ] Mobiele slimme verrekening in productie opnieuw controleren met korte en lange namen en een groot positief en negatief saldo.
- [x] Kostenverdeling gebruikt vaste eigenaar- en `trip_member`-sleutels; dubbele namen en hernoemde reisleden blijven afzonderlijk en correct gekoppeld. Oude naamwaarden worden compatibel omgezet.
- [ ] Praktijktest na publicatie: maak twee reisleden met dezelfde naam, boek voor ieder een uitgave en wijzig daarna één naam; controleer na herladen dat beide saldi bij de juiste persoon blijven.
- [x] Herstelmigratie `20260908000000_update_linked_member_roles.sql` en regressietest `supabase/tests/trip_member_role_updates.sql` uitgevoerd; een Agency-eigenaar kan de rol van een bestaand gekoppeld lid wijzigen met behoud van `user_id`, actieve status en acceptatietijd.
- [x] Werkelijke brandstofuitgaven kunnen expliciet aan een autorit worden gekoppeld; één of meer tankuitgaven vervangen de prognose van die rit en verwijderen of opnieuw koppelen herstelt de juiste berekening.
- [x] Bij vervoer kiest de gebruiker auto, motor, camper, OV, trein, bus, veerboot, taxi/deelrit, fiets, lopen of anders; alleen eigen brandstofvoertuigen tonen de literprognose.
- [x] Boekingen kunnen per onderdeel bewust openbaar worden gedeeld met alleen type, titel, datum, tijd en plaatsnamen; de publieke pagina toont deze als compacte kaarten.
- [x] Migratie `20260908013000_public_trip_bookings.sql` en SQL-test `supabase/tests/public_trip_bookings.sql` zonder fouten uitgevoerd.
- [ ] Eén gedeelde en één private boeking na publicatie via een incognitovenster controleren.
- [x] Publiek weer gebouwd voor Pro- en Agency-reizen; de gekozen bestemming bepaalt de verwachting en de vijfdaagse weergave past op smalle schermen.
- [x] Migratie `20260908014000_public_trip_weather.sql` en SQL-test `supabase/tests/public_trip_weather.sql` zonder fouten uitgevoerd.
- [x] CSV-export neutraliseert spreadsheetformules uit gebruikersinvoer en heeft regressietests voor formuleprefixen en aanhalingstekens.
- [x] Vluchtopvraging vereist een geverifieerde sessie en gebruikt een atomaire limiet van 20 controles per account per uur.
- [x] Directe databaselezers van `trip_members` krijgen alleen veilige samenwerkingsvelden; e-mailadressen blijven beschikbaar voor de eigenaar via de afgeschermde serverroute.
- [x] Onnodige uitvoerrechten op `SECURITY DEFINER`-triggerfuncties en publieke reis-RPC's ingetrokken; alleen de twee bewust anonieme, veldbeperkte publieke reisfuncties blijven voor bezoekers beschikbaar.
- [ ] Migratie `20260908015000_security_hardening.sql` en SQL-test `supabase/tests/security_hardening.sql` uitvoeren en daarna de Lovable-securityscan opnieuw draaien.

- [x] Technisch changelog in `CHANGELOG.md` toegevoegd voor GitHub, met datum, tijd, databasewijzigingen en controles.
- [x] Publieke pagina `/changelog` toegevoegd met gebruikersgerichte releases, categorie-iconen, datum en tijd; link staat in de footer.
- [x] Changelogvalidatie en GitHub Actions toegevoegd: unieke releases/versies, veilige teksten, datumvolgorde, tests en productiebuild worden bij pushes en pull requests gecontroleerd.

### Naar de testopening — OAuth en app-e-mail uitgezonderd

- [x] NL/EN-taalkeuze toegevoegd en opgeslagen per account; publieke homepage, authenticatie, gedeelde reis, hoofdnavigatie, footer, privacy en beta-voorwaarden zijn tweetalig
- [x] Publieke changeloginhoud volledig tweetalig gemaakt; bezoekers schakelen zichtbaar met `NL`/`EN`, ingelogde gebruikers beheren taal via Accountinstellingen
- [x] Privacy-informatie en internationale beta-voorwaarden gepubliceerd en vanuit de footer bereikbaar
- [x] OAuth-acties verborgen zolang de providers bewust niet tot de beta behoren
- [x] Extra witruimte toegevoegd boven de knoppen voor wachtwoord- en reisinstellingen
- [x] Dashboard, abonnementsoverzicht en meldingen volgen de gekozen NL/EN-taal, inclusief statussen, acties, foutmeldingen en datums
- [x] Hoofdnavigatie van reisbeheer, instellingen, openbaar delen, route, uitgaven, verrekening, paklijst en weer volgen de gekozen NL/EN-taal
- [x] Tijdlijn en reisgenoten volgen NL/EN, inclusief rollen, uitnodigingsstatussen, bewerken, lege staten en lokale datumlabels
- [x] Boekingsformulieren volledig gekoppeld aan NL/EN: vlucht, verblijf, huurauto, vervoer, activiteit, locaties, brandstofprognose, kosten en statussen
- [x] Dynamische reiswaarden volgen NL/EN: landen, weeromschrijving, aftel-eenheden en de standaardtagline; dubbele nummering in bestemmingslijsten is verwijderd en de opslaanknop van reisonderdelen heeft extra afstand
- [x] Accountprofiel, taal/weergave, beveiliging, planinformatie en beta-communicatie volgen NL/EN
- [x] Engelse vertaling afgerond voor Agency-overzicht, team/reisrechten, branding, CSV, declaratie-PDF en reisgids; hoofdschermmeldingen, statussen en uitgavencategorieën gecontroleerd
- [x] Kritieke rooktest geslaagd: registreren/inloggen met e-mail, reis aanmaken, wijzigen, herladen, archiveren en verwijderen
- [x] Reisinhoud getest: stops, planning, vlucht, verblijf, vervoer, huurauto, uitgave, verdeling, paklijst en export
- [x] Publiek delen getest: aan/uit, PIN, budget wel/niet delen, oude link, lege reis en reis met veel stops
- [x] Mobiele controle op een echte telefoon geslaagd: dashboard, formulieren, uitgaven, publieke reis en changelog
- [x] SQL-tests `trip_snapshot_versions.sql` en `persistent_notifications.sql` volledig en zonder foutmelding uitgevoerd
- [x] Productiemigraties voor tijdzone, Agency-bonrechten, meldingen en versieopslag zijn uitgevoerd; bijbehorende versie-, melding- en financiële regressietests zijn geslaagd
- [x] Privacy- en rechtencontrole afgerond voor publieke responses, PIN-links, gearchiveerde reizen, publieke auteursnaam, financiële RLS, private bonnetjesopslag, foutmeldingen, exports en accountgegevens
- [x] Publieke reiscode gecontroleerd en aangescherpt: geen e-mailadres als auteursnaam, geen PIN-beveiligde reis in de openbare index en geen gearchiveerde reis via een oude deellink
- [x] Migratie `20260907234000_restrict_trip_financials.sql` en `supabase/tests/trip_financial_privacy.sql` volledig uitgevoerd; viewer/client lezen geen uitgaven en financiële rollen behouden toegang
- [x] Free-, Pro- en Agency-scenario’s in de praktijktest doorlopen
- [x] Bekende beperkingen op de changelogpagina vermeld: OAuth en automatische app-e-mails zijn bewust nog niet actief
- [x] Gedateerde **Testopening**-release aangemaakt in het technische en publieke changelog
- [x] Herstelmigratie `20260907150000_fix_snapshot_column_ambiguity.sql` uitgevoerd, bevestigd door de gebruiker. De atomaire opslagfunctie gebruikt expliciete kolomverwijzingen voor `trip_uuid` en `updated_at`.
- [x] Omschrijvingsmigratie `20260907170000_trip_description.sql` uitgevoerd, bevestigd door de gebruiker.
- [x] Publieke reispagina toont ingelogde gebruikers **Naar mijn reizen** in plaats van **Gratis account maken**; tijdens het laden van de sessie verschijnt geen registratieknop.
- [x] Mobiele boekingsvelden begrensd en uitgavenoverzicht binnen de kaart horizontaal scrollbaar gemaakt.
- [x] Accountinstellingen tonen huidig plan, reisgebruik, actieve reizen en planlimiet, met een link naar upgrades/abonnementbeheer.
- [x] Productiecontrole geslaagd: gewijzigde uitgave bleef na herladen behouden; vluchtvelden en uitgavenoverzicht zijn op telefoon gecontroleerd.
- [x] Versiecontrole gebouwd voor reisopslag, publicatie en verwijderen; lokale opslagacties lopen per reis achter elkaar. Een conflict of onzekere opslag blokkeert verdere writes tot herladen.
- [x] `20260907160000_trip_snapshot_versions.sql` uitgevoerd, bevestigd door de gebruiker. De migratie trekt de oude onbeschermde RPC-rechten in; de bijbehorende appcode gebruikt de gecontroleerde opslagroute.
- [x] Laatste appversie in de praktijktest gecontroleerd.
- [x] Drie geautomatiseerde wachtrijtests geslaagd: volgorde/versiedoorgifte, blokkeren na fout en geen opslag na verwijderen. Gerichte TypeScript-controle van de wachtrij en tests, formatteringscontrole en productiebuild geslaagd; bestaande projectbrede TypeScript-fouten blijven open.
- [x] `supabase/tests/trip_snapshot_versions.sql` zonder foutmelding voltooid; de eerdere praktijktest met twee tabbladen is eveneens geslaagd.
- [x] Actieve reisleden worden relationeel geladen in hun eigen dashboard; een bestaand account claimt bij opnieuw inloggen alleen uitnodigingen voor het geverifieerde eigen e-mailadres.
- [x] Rolgrenzen ook server-side afgedwongen: owner beheert delen/leden/archief, traveler en advisor plannen en beheren kosten, finance beheert alleen kosten en viewer/client zijn alleen-lezen zonder financiële response.
- [x] Praktijktest samenwerking geslaagd met een bestaand tweede account: gedeelde reis zichtbaar en toegestane acties gecontroleerd voor traveler, advisor, finance, viewer en client.
- [x] Samenwerking opgenomen in publieke release **Beta 0.7**. E-mailbezorging blijft apart geblokkeerd op activering.

OAuth blijft gepauzeerd tot Lovable Pro; e-mailverzending wacht op activering en domeinverificatie. Alle aanwezige SQL-migraties en SQL-tests zijn op 7 september 2026 als uitgevoerd bevestigd. De SkyLink-secret is ingesteld; de live praktijktest blijft open.

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
- [x] `SKYLINK_API_KEY` als server-secret ingesteld in Lovable Cloud; de sleutel komt nooit in browsercode, Git of `workspaces.data`
- [x] SkyLinkAPI Flight Status server-side koppelen aan een vluchtnummer en de respons veilig omzetten naar GlobeTrotr-velden
- [x] Geleverde live vertrek-/aankomsttijden, gate en terminal opslaan en tonen
- [x] Datumgebonden Schedule-fallback toegevoegd wanneer Flight Status niets vindt en vertrek-IATA bekend is; de server roept deze alleen aan van vijf dagen terug tot één dag vooruit
- [x] Nederlandse foutstatussen voor ongeldige vluchtnummers, geen resultaat, limiet bereikt en tijdelijke providerfout
- [ ] Automatisch periodiek verversen van vluchtstatus voor reizen die binnenkort vertrekken

## Fase 4 — Groepen & geld (klaar)

- [x] Reizigers beheren en kosten eerlijk verdelen met zo min mogelijk terugbetalingen
- [x] Multi-valuta, live koersomrekening en valutaconversie
- [x] Brandstof- en autokostencalculator
- [x] Kosten bij een reisonderdeel direct ook als gekoppelde uitgave opslaan
- [x] Gekoppelde kosten automatisch opruimen wanneer het reisonderdeel wordt verwijderd
- [x] Uitgaven wijzigen, inclusief verdeling, betaler, valuta en notitie; verrekening berekent direct opnieuw
- [x] Vervoerssoort per rit en brandstofprognose alleen voor auto, motor en camper; gekoppelde werkelijke brandstofuitgaven vervangen de prognose zodat beide nooit dubbel meetellen

## Fase 5 — Delen (klaar)

- [x] Een individuele reis openbaar maken of weer privé zetten
- [x] Publieke reispagina via een niet-voorspelbare token-URL
- [x] Openbare reizen tonen op de homepage
- [x] PIN-beveiliging per gedeelde reis
- [x] Budget per openbare reis wel of niet delen
- [x] Serverbevestiging en fout-herstel bij openbaar/privé maken, budget delen en PIN-wijzigingen

## Fase 6 — Documenten & export (deels klaar)

- [x] CSV- en JSON-back-up/export
- [x] Printklare reisgids met Google Maps-navigatie per stop
- [x] PDF-reisoverzicht
- [x] Bonnetjes uploaden en koppelen aan een uitgave voor het Agency-plan: private `receipts`-opslag per account, PDF/JPG/PNG/WebP tot 10 MB, signed viewing-link en opruimen wanneer de databasekoppeling mislukt
- [ ] Boekingsbevestigingen als document koppelen aan een reisonderdeel

### Publieke viewingpage vernieuwen

De publieke viewingpage werkt technisch, maar is nu vooral een kale verzameling informatieblokken. Maak hiervan een aantrekkelijke, deelbare reisbeleving die ook op telefoon prettig leest.

- [x] Een visuele hero met reisnaam, periode, eigenaar, bestemmingen en een template-illustratie/fallback
- [x] Een interactieve routekaart met genummerde markers, routevolgorde en focus op een geselecteerde bestemming
- [x] Bestemmingen presenteren als compacte route met aankomstdatum en aantal nachten wanneer ingevuld
- [x] Handmatige dagplanning tonen als overzichtelijke dagkaarten en tijdlijn
- [x] Expliciet deelbare boekingsinformatie toegevoegd: alleen type, titel, datum, tijd en plaatsnamen; boekingsreferentie, prijs, betaler, notities, live vluchtvelden en coördinaten blijven buiten de publieke API
- [x] Weer per geselecteerde bestemming tonen voor openbare Pro- en Agency-reizen; de publieke API deelt alleen een beschikbaarheidsvlag en geen plannaam
- [x] Budget alleen tonen wanneer **Budget delen** aanstaat; de publieke serverroute stuurt geen uitgaven, betalers, bonnetjes of boekingsdetails mee
- [x] Een compacte GlobeTrotr-call-to-action tonen; ingelogde gebruikers gaan naar **Mijn reizen**, bezoekers kunnen een account maken
- [ ] Mobiele vormgeving in productie controleren op smalle schermen, lange reisnamen en veel stops
- [x] Verzorgde laad-, lege, PIN- en niet-beschikbaarstatussen in dezelfde visuele stijl
- [x] Korte reisomschrijving (maximaal 375 tekens) toegevoegd aan reisinstellingen en de publieke header; zonder omschrijving verschijnt een compacte route-samenvatting
- [x] Lange bestemmingenketen uit de header verwijderd en de lijst naast de kaart standaard beperkt tot vier stops met een uitklapactie
- [x] Migratie `20260907170000_trip_description.sql` uitgevoerd
- [ ] Reisomschrijving opslaan, publiek tonen en weer leegmaken in productie controleren

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
- De eerste relationele import is op 6 september 2026 uitgevoerd. Reizen worden inmiddels relationeel gelezen en geschreven; `workspaces.data` bewaart workspace-instellingen en een tijdelijke compatibiliteitskopie van reizen.

## Definitieve uitvoeringsvolgorde

1. **SQL-validatie & unieke reis-ID**: afgerond; relationele reizen hebben een globale UUID en de controles zijn uitgevoerd.
2. **Relationele reisopslag**: afgerond en handmatig gevalideerd; laden en wijzigen van reizen en kindgegevens loopt via SQL, met JSON als tijdelijke compatibiliteitskopie.
3. **Interface & boekingsbasis**: gebouwd en boekingsmigratie als uitgevoerd genoteerd; productiecontrole van huurauto's, timeline, kosten en leden blijft open.
4. **SkyLink live vluchtdata**: server-side key is ingesteld; één handmatige lookup betrouwbaar testen en pas daarna uitgebreidere velden tonen.
5. **Agency-basis herstellen**: gebouwd en de receipts-RLS-migratie is uitgevoerd; de productiecontrole blijft te bevestigen.
6. **Accountafwerking; OAuth gepauzeerd**: e-mailbevestiging en accountafwerking kunnen doorgaan. OAuth-werk voor Apple, Google en Microsoft overslaan totdat Lovable Pro is aangeschaft; daarna providerconfiguratie, foutoplossing en handmatige tests hervatten. De volgende bouwstappen hoeven hier niet op te wachten.
7. **Relationele hardening**: atomaire opslag, versiecontrole, versiemigratie, SQL-tests en tweebladentest zijn afgerond.
8. **Veilige samenwerking**: toegang, rollen en uitnodigingstokens per reis server-side afdwingen.
9. **Agency-administratie**: echte workspace-teamleden, rechten en operationele dashboards bovenop de per-reisrollen bouwen.
10. **Boekingen & documenten**: opslag, tickets en boekingsimport toevoegen.
11. **Geldstromen**: groeps-betaalverzoeken, daarna Stripe en Agency-facturen.
12. **Reis onderweg**: routeoptimalisatie, offline toegang en meldingen.
13. **Lovable-e-mail**: pas na activering en domeinverificatie templates maken en de echte uitnodigingsstroom activeren.
14. **Groei**: referrals, prijsvergelijking, AI en de uitgebreide Agency-operatie.

## Relationele basis — voortgang

- [x] De eerste twee SQL-migraties zijn uitgevoerd: relationele tabellen, globale `trip_uuid`, child foreign keys, owner-trigger, uitnodigingstabel en RLS-hulpfuncties bestaan in Lovable Cloud.
- [x] De UUID-controles zijn uitgevoerd zonder lege UUID’s, verweesde kindrijen of dubbele UUID’s.
- [x] Een herstelmigratie is beschikbaar voor reizen die tijdens de overgang alleen in `workspaces.data` waren beland: `20260906160000_repair_missing_trips_and_json_ids.sql`.
- [x] Nieuwe reizen worden op de server als UUID in `trips` aangemaakt; publicatie gebruikt dezelfde UUID en wordt direct relationeel bevestigd.
- [x] Reizen worden bij laden uit `trips` en alle relationele kindtabellen opgebouwd. Reismutaties schrijven rechtstreeks naar SQL en werken daarna de JSON-kopie bij.
- [x] Handmatige productiecontrole: relationeel laden en wijzigen werkt na het laden van de laatste Lovable-commit.
- [ ] `workspaces.data` blijft voorlopig de bron voor workspace-instellingen en als compatibiliteitskopie van reizen. Verwijder deze kopie pas na relationele transacties, collaboratieve RLS-tests en productiecontrole.
- [x] Profielvoorkeuren voor taal, tijdzone en dark mode zijn gebouwd; de tijdzone-migratie is uitgevoerd.
- [x] Versiemigratie en transactietests zijn uitgevoerd; geaccepteerde reisleden met een eigen account krijgen inmiddels toegang volgens hun reisrol.

## Interface- en boekingsbasis — gebouwd, productiecontrole open

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
- [x] In **Lovable Cloud → Secrets** `SKYLINK_API_KEY` toegevoegd. De sleutel staat niet in Git, clientcode of workspace-JSON.
- [x] `src/lib/flight.functions.ts` vervangen door een serverfunctie voor SkyLinkAPI v3.1 Flight Status; de browser roept uitsluitend deze eigen serverfunctie aan.
- [x] IATA-vluchtnummers zoals `KL1234` en ICAO-vluchtnummers zoals `KLM1234` worden server-side genormaliseerd en gevalideerd; de key en ruwe providerfouten komen niet in de UI.
- [x] Maatschappij, vluchtstatus, vertrek- en aankomstluchthaven, geplande/verwachte/werkelijke tijden, terminal en gate opslaan en tonen wanneer SkyLink die levert.
- [x] De gekozen vluchtdatum en optionele vertrek-IATA gebruiken voor een Schedule-fallback van vijf dagen terug tot één dag vooruit wanneer Flight Status `404` geeft; verre datums veroorzaken geen Schedule-call.
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
- [x] Daggroepen in het volledige reisoverzicht inklapbaar gemaakt, met per dag een teller; de standaard dagweergave behoudt alleen de geselecteerde dag.
- [x] Snelle filters toegevoegd voor vlucht, accommodatie, vervoer, huurauto, activiteit en handmatige planningitems.
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
- [x] `20260906170000_add_profile_timezone.sql` uitgevoerd in Lovable Cloud / Supabase SQL Editor
- [x] De gekozen weergavemodus wordt direct appbreed toegepast, inclusief systeemmodus via `prefers-color-scheme`; vertalingen volgen in een afzonderlijke stap

### Beveiliging & inloggen

> **OAuth tijdelijk gepauzeerd (7 september 2026):** op verzoek geen verdere configuratie, foutoplossing of tests voor Apple-, Google- en Microsoft-login totdat Lovable Pro is aangeschaft. De onderstaande open OAuth-punten blijven bewaard voor hervatting; bestaande implementatie en e-mail/wachtwoordfunctionaliteit blijven behouden. Dit blokkeert de overige roadmap niet.

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
- [x] Account verwijderen met expliciete bevestiging, machineleesbare gegevens-export en duidelijke bewaarinformatie

### Abonnement & meldingen

- [x] Huidig plan, reisgebruik, actieve reizen en planlimiet tonen met upgrade-/beheerlink; de bestaande abonnementspagina blijft de plek om een plan te wijzigen
- [ ] Facturen en betaalgegevens alleen tonen zodra Stripe is gekoppeld
- [ ] Meldingsvoorkeuren voor productmails, reisuitnodigingen, betalingen en vluchtalerts
- [x] Meldingenpaneel rechtsboven gebouwd met een teller voor openstaande meldingen, kleuren en emoji per soort: blauw/👤 voor accounts, amber/🧳 voor reiswijzigingen en paars/✉️ voor uitnodigingen. Openen of doorklikken verwijdert niets; meldingen blijven per account bewaard totdat de gebruiker ze expliciet met het kruisje wegklikt.
- [x] Persistente meldingen geactiveerd met `supabase/migrations/20260907120000_persistent_notifications.sql`: opslag, ontvangergebonden RLS en triggers zijn geïnstalleerd.
- [x] `supabase/tests/persistent_notifications.sql` volledig uitgevoerd voor RLS, bundeling per transactie en blijvend wegklikken; de aparte praktijktest van het paneel blijft onderdeel van de rooktest.
- [ ] Na aansluiting van samenwerking: reiswijzigingen met twee actieve accounts controleren en bij toekomstige service-role schrijfstromen de geverifieerde actor doorgeven. Uitnodigingen voor bestaande en nieuwe geverifieerde accounts controleren; accepteren/doorklikken vanuit een uitnodigingsmelding aansluiten zodra de uitnodigingsstroom bestaat.

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
- [x] `20260906180000_booking_details_and_clean_members.sql` uitgevoerd volgens de bestaande voortgangsregistratie: boekingsdetails/notities, huurauto-type, legacy-planningkoppelingen en opschoning van oude workspace-demoleden.
- [x] `20260906190000_restrict_receipts_to_agency.sql` uitgevoerd: de planwaarde is gesynchroniseerd en Storage-RLS voor de `receipts`-bucket beperkt toegang tot Agency-accounts.
- [x] Atomaire RPC `save_trip_snapshot` geïnstalleerd via de op 7 september bevestigde herstelmigratie `20260907150000_fix_snapshot_column_ambiguity.sql`; deze vervangt de functie uit `20260906200000_atomic_trip_snapshots.sql`. Oudere functie niet opnieuw over het herstel heen uitvoeren.
- [ ] Genereer na deze import de Supabase TypeScript-types opnieuw en werk de lokale type-definities bij.
- [ ] `referrals`, `subscription_events`, `invoices` en `payment_events` pas toevoegen wanneer referrals/Stripe daadwerkelijk worden gebouwd.

### Directe vervolgmigratie — globale, unieke reis-ID

De oorspronkelijke sleutel `(workspace_user_id, id)` blijft tijdelijk behouden voor compatibiliteit. De app gebruikt inmiddels de globale `trip_uuid`; dubbele reisnamen zijn toegestaan en namen worden niet als sleutel gebruikt.

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
- [x] **Serverfuncties (atomaire basis)**: `saveTrip` gebruikt `save_trip_snapshot_versioned` rond de bestaande atomaire opslag. Parent, kindgegevens en JSON-kopie worden onder een parent-lock opgeslagen. Geen onbeschermde fallback bij ontbrekende migratie.
- [x] **Serverfuncties (concurrency)**: databaseversie wordt geladen, gecontroleerd en na opslag bevestigd; verouderde wijzigingen en verwijderingen worden geweigerd. Publicatie gebruikt dezelfde snapshotroute.
- [x] **Kindgegevens (schema)**: stops, dagplanning, uitgaven, boekingen, paklijst, reisgenoten en documenten hebben een foreign key naar dezelfde reis-UUID.
- [x] **Kindgegevens (runtime)**: stops, planning, uitgaven, boekingen, paklijst en reisgenoten worden relationeel geladen en via de reisschrijfroute bijgewerkt.
- [ ] **Delen en bestanden**: maak publieke tokens en Storage-paden (`avatars` uitgezonderd) onafhankelijk van reisnaam; documenten krijgen een reis-UUID-pad en publieke data bevat alleen expliciet deelbare velden.
- [ ] **Uitnodigingen en rechten**: `trip_members`, `trip_invitations`, RLS-helpers en activiteitenlog gebruiken de reis-UUID als enige reisreferentie.
- [ ] **Compatibiliteit**: map bestaande JSON-`trip.id` éénmalig op de nieuwe UUID. Houd deze mapping alleen gedurende de overgang, toon hem niet aan gebruikers en verwijder hem pas na de SQL-omzetting.
- [ ] **Regressietest**: maak twee reizen met exact dezelfde naam, maak één privé en één openbaar, en controleer dat openen, wijzigen, delen, kosten, documenten en uitnodigingen steeds bij de juiste UUID blijven.

### SQL voor meerdere gebruikers en gedeelde reizen

Het databaseschema bevat rolgerichte RLS voor reisleden. De app leest en schrijft momenteel binnen de workspace van de eigenaar; toegang voor geaccepteerde reisgenoten met een eigen account moet nog worden aangesloten en getest.

- [x] `trip_members` is als relationele toegangsbron aangemaakt: eigenaar wordt bij een nieuwe reis automatisch als actief lid toegevoegd.
- [x] Databaseconstraints/indexen voor één eigenaar per reis, één actief lid per reis + `user_id` en één open uitnodiging per e-mailadres zijn toegevoegd.
- [x] `trip_invitations` bestaat als aparte tabel met gehashte token, e-mail, rol, verloop- en statusvelden; tokens staan niet in `workspaces.data`.
- [x] Owner-only RLS is vervangen door rolgerichte policies en afgeschermde `private`-hulpfuncties voor reizen en kindtabellen.
- [x] De privé-interface laadt relationele reizen voor eigenaar en actieve reisleden; rechten worden per reisrol toegepast.
- [x] Herbruikbare RLS-controles staan in het niet-publieke `private` schema, met afgeschermde `SECURITY DEFINER`-functies, vaste `search_path` en rolchecks.
- [x] Betalers en kostenverdeling gebruiken vaste eigenaar- en `trip_member`-sleutels; dubbele namen en naamswijzigingen zijn met regressietests afgedekt.
- [ ] Maak `expense_shares` relationeel zodra gedeeltelijke kostenverdeling wordt opgeslagen; vervang het JSON-veld `split_with` pas na een gecontroleerde backfill.
- [ ] Verplaats documenten naar een pad met de globale reis-ID en maak Storage-RLS op reisrechten, zodat actieve leden alleen documenten van hun eigen reis kunnen zien.
- [x] Optimistic concurrency met een oplopende databaseversie toegevoegd; activering en productiecontrole staan bovenaan.
- [ ] Activiteitenlog met actor-ID en tijdstip toevoegen.
- [x] Relationele toegang, rollen en financiële afscherming zijn met SQL-regressietests en een tweede bestaand account gecontroleerd; niet-financiële rollen ontvangen geen uitgaven.
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
- [x] Atomaire serverwrite is geïnstalleerd met de bevestigde herstelmigratie; relationele data en JSON-kopie worden samen bevestigd of samen teruggedraaid.
- [ ] Test na die SQL-import één reis met stops, planning, boeking, uitgave, paklijst en reisgenoot. Forceer daarna bewust een ongeldige kindrij en controleer dat de vorige volledige reis intact blijft.
- [x] Relationele omzetting voor de eigenaar omvat reizen, stops, planning, uitgaven, boekingen, paklijst en leden.
- [x] Toegang voor bestaande andere accounts is geactiveerd nadat lees-, schrijf-, rol- en financiële RLS-controles slaagden.
- [ ] Verwijder de JSON-compatibiliteitskopie in een aparte, goedgekeurde migratie na productiecontrole; SQL is al de runtimebron voor reizen.
- [x] Per-reis toegang wordt via RLS en aanvullende servercontroles op `trips` en `trip_members` afgedwongen; browserrollen zijn alleen voor de interface.

## P0 — Reiservaring & instellingen (klaar)

- [x] Nieuwe tab **Instellingen** binnen iedere reis, geen losse modal
- [x] Reisnaam, start- en einddatum, budget en template staan in deze tab
- [x] Openbare/publicatie-instellingen, budget delen en PIN staan in deze tab
- [x] Archiveren en verwijderen staan als afgeschermde acties onderaan de tab, met bevestiging
- [x] Reisschema is gericht op dagplanning, boekingen en kosten
- [x] Toon na serverbevestiging een succesmelding bij openbaar/privé maken, budget delen en PIN-wijzigingen; herstel de vorige status bij een fout.
- [x] Reisnaam, datums, budget en template gebruiken een gevalideerde, expliciete opslagactie met serverbevestiging en fout-herstel.
- [x] Serverbevestiging en fout-herstel uitgebreid naar archiveren, reisonderdelen, uitgaven, stops en eigen dagplanning.
- [x] Reisverwijdering wacht op serverbevestiging en controleert de versie; bij een fout blijft de reis zichtbaar en wordt niet genavigeerd.
- [x] Rolwijziging van een bestaand gekoppeld Agency-lid praktisch gecontroleerd; de wijziging blijft opgeslagen en de accountkoppeling blijft behouden.

## P0 — Planning, boekingen & kosten

- [x] Boekingen en eigen programma-items vanuit het reisschema wijzigen via een vooraf ingevulde popup met opslaan en annuleren; boekingen gebruiken hetzelfde formulier in de invoertab. Opgeslagen locaties kunnen worden vervangen en bij een opslagfout blijft de popup open.
- [ ] Productiecontrole: boeking en eigen programma-item wijzigen, annuleren en opnieuw openen; controleer ook meerdaagse boekingen, gekoppelde kosten en fout-herstel.
- [x] Timeline met overzicht van de hele reis én een specifieke dag, inclusief datumkiezer en vorige/volgende-dagnavigatie.
- [x] Vlucht-, hotel-, activiteit-, vervoer- en huurauto-iconen en relevante status, locatie, tijd, boekingsnummer en prijs.
- [x] Type-specifieke, responsieve formuliergrids: vlucht, hotel, activiteit, vervoer en huurauto tonen alleen relevante velden.
- [x] Vlucht heeft één datum; vluchtnummer en live-opvraagknop staan op dezelfde desktoprij.
- [x] Activiteiten, boekingen en uitgaven zijn bewerkbaar; gekoppelde kosten synchroniseren direct met budget en verrekening.
- [x] Huurauto's en doorlopende accommodaties worden slim, zonder dubbele volledige boekingen, per dag weergegeven.
- [x] Brandstofprognose per autorit, met liters en kosten op basis van afstand, verbruik en brandstofprijs.
- [x] Vervoerssoort opslaan en tonen; lopen, fietsen, OV, trein, bus, veerboot en taxi/deelrit leveren geen onterechte eigen brandstofprognose op.
- [x] Directe wijzigingen van boekingen, uitgaven, stops, leden, planning en paklijst wachten op serverbevestiging; bij een fout wordt de vorige staat hersteld en verschijnt een blijvende foutmelding.
- [x] Koppel kostenverdeling aan vaste eigenaar- en `trip_member`-sleutels in plaats van namen; dubbele namen, naamswijzigingen en oude naamwaarden zijn met regressietests afgedekt.
- [x] Werkelijke tankuitgaven aan een autorit koppelen en expliciet de brandstofprognose van die rit laten vervangen; meerdere uitgaven per rit, bewerken en verwijderen zijn met regressietests afgedekt.

## P0 — Fundament voor samenwerking

De huidige ledenlijst wordt een echte groepsreis: uitnodigen, rollen en gelijktijdig plannen. Grote planners zoals Wanderlog en Roadtrippers behandelen samenwerken als kernfunctionaliteit, niet als Agency-extra. [Wanderlog](https://wanderlog.com/travel-maps) [Roadtrippers](https://roadtrippers.com/about/features/)

- [ ] Reizigers per e-mail uitnodigen voor één specifieke reis, zonder toegang tot alle reizen van de eigenaar
- [ ] Deelbare uitnodigingslink voor een specifieke reis die werkt voor bestaande én nieuwe accounts: na inloggen of registreren terugkeren naar dezelfde uitnodiging en na acceptatie toegang tot de reis krijgen, met server-side controle van het uitnodigingstoken.
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

De huidige knop “Uitnodigen” registreert een reisgenoot; echte bezorging en toegang voor diens account bestaan nog niet. Dit onderdeel maakt de volledige, veilige stroom af.

> **Uitgesteld:** begin pas met de e-mailimplementatie nadat Lovable Cloud Emails is geactiveerd en `globetrotr.nl` in Lovable is geverifieerd. Tot die tijd wordt de uitnodigingsstatus handmatig beheerd; die verleent geen toegang aan een ander account.

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

- [x] **Eigenaar**, **Medereiziger** en **Kijker** als rollen per reis
- [x] Free: maximaal twee reisgenoten; Pro: onbeperkt reisgenoten
- [ ] Rechten bij iedere serveractie afdwingen zodra toegangsverlening voor andere accounts is gebouwd
- [ ] Geen accountant-, declaratie- of klantrollen in de vriendengroep-interface

### Rollen voor Agency

- [x] **Reisadviseur**, **Financiën** en **Klant/reiziger** als rollen per reis
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

Dit wordt een duidelijk, verzorgd en zelfstandig **Agency Workspace Admin**-dashboard binnen het reisplatform. Het is nadrukkelijk iets anders dan reisinstellingen en per-reisrollen: een Agency-eigenaar beheert hier de organisatie, het abonnement, het team, klanten, branding en de werkvoorraad van één workspace.

- [ ] Alleen Agency-eigenaren krijgen toegang tot een **Agency Admin**-dashboard; geen route alleen op basis van een verborgen navigatieknop beveiligen
- [ ] Eigen overzichtelijke instellingenroute en navigatie maken, los van Accountinstellingen en de instellingen van een afzonderlijke reis
- [ ] Dashboard visueel uitwerken met duidelijke secties, statuskaarten, snelle acties, lege statussen en een goede mobiele weergave
- [ ] Workspaceprofiel beheren: organisatienaam, bedrijfsgegevens, contactgegevens, standaardvaluta, tijdzone en standaardtaal
- [ ] Agency-abonnement, gebruikslimieten en facturatie-instellingen op één herkenbare plaats tonen
- [ ] Branding beheren met live voorbeeld van logo, accentkleur, afzendernaam, domein en klantweergave
- [ ] Relationele `workspace_members`- en `workspace_invitations`-tabellen toevoegen, met UUID, status, verloopdatum en RLS per workspace
- [ ] Teamleden beheren met rollen: eigenaar, reisadviseur en financiën; klanten blijven uitsluitend per reis gekoppeld
- [ ] Eigen teamoverzicht met actieve leden, open uitnodigingen, limieten en laatst actieve wijzigingen
- [ ] Werkvoorraad: aankomende reizen, ontbrekende boekingsdetails, open kosten, onbetaalde facturen en verlopen uitnodigingen
- [ ] Agency-statistieken alleen uit echte data: actieve klantreizen, uitgaven, declarabel, omzet/openstaand zodra Stripe bestaat en documentgebruik zodra Storage-meting bestaat
- [ ] Auditlog voor team-, rol-, factuur- en klantwijzigingen met actor, tijdstip en context

## P1 — GlobeTrotr Corporate Admin

Een afzonderlijke backend-beheeromgeving voor de eigenaar van GlobeTrotr. Dit dashboard staat functioneel en visueel los van het reisplatform en van Agency Workspace Admin: hier wordt het bedrijf GlobeTrotr bestuurd, niet een reis of klantworkspace. Het gebruikt bij voorkeur een eigen beheershell, navigatie, routes en compacte operationele vormgeving. Secrets, wachtwoorden, OAuth-tokens en ruwe betaalkaartgegevens worden nooit getoond.

### Toegang en veiligheid

- [ ] De huidige `app_metadata.corporate_admin`-basis vervangen of versterken met een relationele `platform_admins`-tabel en expliciet toegewezen gebruikers-UUID; nooit toegang geven op basis van e-mail, abonnement of browserstate
- [ ] Eigen serverfuncties en autorisatiegrens voor alle Corporate Admin-routes; UI-verbergen geldt niet als beveiliging
- [ ] Verplichte auditlog voor iedere inzage in gevoelige gegevens en iedere wijziging, met actor, reden, tijdstip, doel en resultaat
- [ ] Extra sessiebeveiliging voorbereiden: MFA, korte beheersessie, herauthenticatie voor risicovolle acties en waarschuwing bij nieuw apparaat
- [ ] Beheeracties beperken tot expliciete functies; geen algemene database-editor of willekeurige service-role-query vanuit de browser

### Bedrijfsoverzicht en sales

- [x] Eerste startdashboard met echte database-KPI's: totaal en nieuwe/actieve workspaces, planverdeling, actieve/openbare reizen en open feedback/problemen
- [ ] Registraties, conversie Free → Pro/Agency, proefgebruik en opzeggingen betrouwbaar meten zodra betaal- en abonnementsevents worden opgeslagen
- [ ] Salesdashboard met MRR/ARR, nieuwe omzet, planverdeling, upgrades, downgrades, churn, mislukte betalingen en Agency-pipeline zodra Stripe is aangesloten
- [ ] Perioden, landen, valuta en plannen kunnen filteren en vergelijken; definities van iedere KPI zichtbaar maken
- [ ] Klant- en organisatieoverzicht met zoekfunctie, accountstatus, plan, gebruik, laatste activiteit en interne support-/salesnotities
- [ ] Saleskansen en contactmomenten bijhouden zonder een volledig CRM na te bouwen; latere CRM-export via een afgeschermde integratie
- [ ] CSV-export van geaggregeerde bedrijfs- en salesgegevens met formule-injectiebescherming en auditlog

### Problemen, feedback en operatie

- [x] Eerste Corporate Admin-basis voor feedback en bekende problemen gebouwd
- [x] Zoeken, categoriefilter en gezamenlijk archieffilter voor feedback en bekende problemen toegevoegd
- [ ] Feedback-inbox verder uitbreiden met labels, eigenaar, prioriteit, interne notities, duplicaten koppelen en bulkstatus
- [ ] Bekende problemen vanuit Corporate Admin publiceren, wijzigen, vertalen en oplossen; openbare statuspagina en GitHub Issues blijven gesynchroniseerd
- [ ] Storings- en foutoverzicht met aantallen, getroffen routes/versies en trend, zonder onnodige persoonsgegevens in foutmeldingen
- [ ] Operationele status van Supabase, Storage, vluchtprovider, kaarten, weer, valuta, e-mail en betalingen tonen op basis van veilige healthchecks
- [ ] Interne taken en incidenten koppelen aan feedback, bekende problemen, GitHub Issues en releases

### Platform- en gebruikersbeheer

- [ ] Gebruikersoverzicht met alleen noodzakelijke profielgegevens; gevoelige details pas na expliciete actie, redenregistratie en auditlog
- [ ] Moderatie voor openbare reizen: verbergen en herstellen met reden, zonder standaard toegang tot privéreisinhoud
- [ ] Beheerbare featureflags, beta-uitrolpercentages, onderhoudsmelding en noodstop per externe integratie
- [ ] Handmatige plan-correctie alleen met reden en auditlog; Stripe-webhooks blijven leidend voor betaalstatus
- [ ] Changelog, bekende problemen, beta-status en publieke servicemelding vanuit Corporate Admin beheren met concept, preview en publicatiemoment
- [ ] Privacytools: inzage-, export-, correctie- en verwijderverzoeken volgen, wettelijke termijnen bewaken en afhandeling registreren
- [ ] Bewaarbeleid, misbruikmeldingen, geblokkeerde accounts en beveiligingsincidenten beheren met beperkte rollen en vierogenprincipe voor definitieve acties

### Architectuur en fasering

- [ ] Corporate Admin een eigen layout geven zonder reisnavigatie, reiscontext of Agency-branding; hergebruik alleen generieke UI-componenten en authenticatie
- [ ] Gescheiden querylaag met minimale aggregatie-RPC's bouwen zodat het dashboard geen volledige productie-tabellen naar de browser haalt
- [ ] Beginnen met feedback, bekende problemen, servicestatus en basis-KPI's; sales volgt samen met Stripe, financiële rapportage en facturatie
- [ ] Voor elke module autorisatietests, RLS-tests, auditlogtests en een productie-checklist toevoegen

## P2 — Agency-automatisering & schaalbaarheid

- [ ] Herbruikbare itinerary-, factuur-, e-mail- en paklijsttemplates
- [ ] Offertes met meerdere varianten, klantgoedkeuring en conversie naar een reis
- [ ] Klantportaal met alleen de relevante reis, documenten, facturen en betaalstatus
- [ ] Taken, deadlines en automatiseringen voor het Agency-team
- [ ] Supplier-/leveranciersbibliotheek en contentbibliotheek voor veelgebruikte hotels en activiteiten
- [ ] Rapportages over conversie, omzet, marge, commissie en klanttevredenheid
- [ ] Webhook-/integratielaag voor boekhoudpakket, CRM en betaalprovider
- [ ] Rate limiting, auditlogs, back-ups, export/verwijderverzoeken en herstelproces voor productiegegevens
