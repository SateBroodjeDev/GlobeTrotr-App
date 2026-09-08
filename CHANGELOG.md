# GlobeTrotr changelog

Technisch wijzigingsoverzicht voor GitHub en beheerders. De publieke, gebruikersgerichte versie staat op `/changelog`.

Tijden gebruiken `Europe/Amsterdam` (CEST/CET). Nieuwe vermeldingen komen bovenaan. Noteer databasewijzigingen, benodigde migraties en uitgevoerde controles; zet geen secrets, persoonsgegevens of interne tokens in dit bestand.

## 2026-09-08 15:20 CEST — Privacykeuzes en beta-voorwaarden

### Privacy en juridisch

- De privacyverklaring beschrijft nu per gegevenscategorie het doel en de AVG-grondslag, ontvangers, internationale doorgifte, bewaartermijnen, openbare reizen, rechten en klachten.
- Een volledige inventaris van cookies en browseropslag vermeldt naam, doel, categorie en bewaarmoment. GlobeTrotr gebruikt momenteel geen analyse-, advertentie-, marketing- of cross-site-trackingtechnologie.
- Nieuwe privacykeuze verschijnt bij het eerste bezoek. Noodzakelijke opslag wordt uitgelegd; taalopslag is optioneel, standaard uit en kan even eenvoudig worden geweigerd, toegestaan of later via de footer ingetrokken.
- Google Fonts en Leaflet-CSS worden niet meer automatisch vanaf externe hosts geladen. Leaflet-CSS zit nu in de eigen applicatiebundel.
- De beta-voorwaarden regelen deelnameleeftijd, accountveiligheid, toegestaan gebruik, rechten op gebruikersinhoud, beta- en reisrisico's, beëindiging, aansprakelijkheid, consumentenrecht en toepasselijk recht in NL/EN.
- De officiële juridische naam, het postadres en een werkend privacycontact blijven verplichte gegevens vóór een openbare productieopening.

### Controles

- Alle 21 geautomatiseerde tests en de client-, SSR- en Cloudflare-productiebuild zijn geslaagd.

## 2026-09-08 14:42 CEST — Securityscan: exports, API-quota en ledenprivacy

### Beveiliging

- CSV-cellen met `=`, `+`, `-`, `@` of gevaarlijke voorlooptekens krijgen een tekstprefix voordat een spreadsheet ze opent; bestaande quote-escaping blijft actief.
- De SkyLink-serverfunctie vereist nu een geverifieerde Supabase-sessie en reserveert atomair maximaal twintig controles per account per uur.
- Rechtstreekse `SELECT`-toegang tot `trip_members.email` is voor `authenticated` ingetrokken. Veilige ledenvelden blijven onder de bestaande reis-RLS leesbaar; de afgeschermde serverroute levert e-mail alleen aan de eigenaar.
- Directe uitvoerrechten op interne `SECURITY DEFINER`-triggerfuncties zijn ingetrokken en hun vaste `search_path` is aangescherpt.
- `authenticated` kan de publieke reis-RPC's niet meer rechtstreeks uitvoeren. De twee bewust openbare functies blijven voor `anon` beschikbaar omdat de homepage en gedeelde reislinks deze nodig hebben; hun responses bestaan uit een vaste allowlist en PIN-validatie.
- Migratie `20260908015000_security_hardening.sql` bevat de rechtenwijzigingen en de persistente vluchtquotateller.

### Controles

- `security_hardening.sql` controleert het uurquotum, afgeschermde e-mailkolom en de toegestane `SECURITY DEFINER`-rechten.
- Twee nieuwe regressietests controleren CSV-formule-injectie en correcte quote-escaping.
- Alle 21 geautomatiseerde tests en de client-, SSR- en Cloudflare-productiebuild zijn geslaagd.
- De beveiligingsmigratie en SQL-test moeten nog worden uitgevoerd; draai daarna de Lovable-securityscan opnieuw.

## 2026-09-08 14:34 CEST — Weer op de openbare reispagina

### Publieke reis

- Openbare Pro- en Agency-reizen tonen de actuele verwachting voor de eerste of door de bezoeker geselecteerde bestemming.
- De vijfdaagse verwachting gebruikt op telefoon twee kolommen en vanaf grotere schermen vijf kolommen.
- De publieke RPC geeft alleen `weatherEnabled` terug; de abonnementsnaam zelf blijft buiten de publieke response.
- Omdat de boekingsmigratie al was uitgevoerd, staat deze uitbreiding afzonderlijk in `20260908014000_public_trip_weather.sql` met regressietest `supabase/tests/public_trip_weather.sql`.

### Controles

- De test dekt een openbare Pro-reis, een openbare Free-reis en controleert dat het plan niet wordt vrijgegeven.
- Alle negentien geautomatiseerde tests en de client-, SSR- en Cloudflare-productiebuild zijn geslaagd.
- De weermigratie en SQL-regressietest zijn op 8 september 2026 zonder fouten uitgevoerd.

## 2026-09-08 14:29 CEST — Boekingen bewust openbaar delen

### Publieke reis

- Elk reisonderdeel heeft een afzonderlijke keuze **Delen op de openbare reispagina**; bestaande en nieuwe boekingen zijn standaard niet gedeeld.
- De openbare reispagina toont gedeelde onderdelen als compacte kaarten met type, titel, datum, tijd en plaatsnamen.
- Nieuwe migratie `20260908013000_public_trip_bookings.sql` breidt de publieke detail-RPC uit met een vaste allowlist.
- Boekingsreferentie, prijs, valuta, betaler, notities, aanbieder, vluchtnummer, vluchtstatus, terminal, gate, bagageband en exacte locatiecoördinaten worden niet vrijgegeven.
- SQL-regressietest `supabase/tests/public_trip_bookings.sql` controleert zowel expliciete toestemming als het ontbreken van private boekingsvelden.

### Controles

- Alle negentien geautomatiseerde tests en de client-, SSR- en Cloudflare-productiebuild zijn geslaagd.
- De migratie en SQL-regressietest zijn op 8 september 2026 zonder fouten uitgevoerd.

## 2026-09-08 14:25 CEST — Vervoerssoort en werkelijke brandstofkosten

### Uitgaven

- Een uitgave kan vanuit het uitgavenformulier expliciet als werkelijke brandstofkosten aan een autorit worden gekoppeld.
- Nieuwe vervoersboekingen vragen om auto, motor, camper, openbaar vervoer, trein, bus, veerboot, taxi/deelrit, fiets, lopen of anders en tonen deze keuze in het boekingsoverzicht.
- Afstand, literverbruik en brandstofprijs verschijnen alleen voor auto, motor en camper. Andere vervoerssoorten veroorzaken ook bij achtergebleven waarden geen brandstofprognose.
- Zodra minstens één bestaande tankuitgave aan een rit gekoppeld is, vervangt die realisatie de berekende brandstofprognose van de rit.
- Meerdere tankuitgaven kunnen bij dezelfde rit horen. Bewerken, opnieuw koppelen en verwijderen werkt de verwijzingen atomair bij via de bestaande versiegestuurde reisopslag.
- Gekoppelde uitgaven zijn herkenbaar in het uitgavenoverzicht; bonnetjes blijven optioneel beschikbaar binnen het bestaande Agency-recht.
- De koppeling wordt in het bestaande JSONB-detailveld van het reisonderdeel opgeslagen en vereist geen nieuwe migratie.

### Controles

- Vier regressietests controleren vervoerssoorten zonder eigen brandstof, een actieve prognose, vervanging door een werkelijke uitgave en meerdere veilig gekoppelde tankuitgaven.
- Alle negentien geautomatiseerde tests en de client-, SSR- en Cloudflare-productiebuild zijn geslaagd.

## 2026-09-08 09:56 CEST — Bevestigde opslag voor reisleden en paklijst

### Betrouwbaarheid

- Reisleden toevoegen, verwijderen, activeren en van rol veranderen wacht nu zichtbaar op serverbevestiging.
- Paklijstitems, afvinkstatussen en sjablonen gebruiken dezelfde bevestigde opslagroute.
- Tijdens opslag zijn de betreffende acties tijdelijk geblokkeerd; bij een serverfout herstelt de reis naar de vorige bevestigde toestand en blijft invoer waar mogelijk staan.
- Hiermee gebruiken alle directe wijzigingen van stops, planning, boekingen, uitgaven, reisleden en paklijst dezelfde versiegestuurde opslagroute.

### Controles

- Alle vijftien geautomatiseerde tests en de client-, SSR- en Cloudflare-productiebuild zijn geslaagd.

## 2026-09-08 09:51 CEST — Nabije vluchtplanning via SkyLink

### Vluchten

- Het vluchtformulier accepteert nu een optionele vertrek-IATA, bijvoorbeeld `AMS`.
- Wanneer Flight Status geen vlucht vindt, zoekt de server dezelfde vlucht in het vertrekrooster voor de gekozen datum.
- De Schedule-fallback wordt uitsluitend gebruikt binnen SkyLinks ondersteunde venster van vijf dagen terug tot één dag vooruit; verre reisdatums veroorzaken geen extra provider-call.
- De API-sleutel blijft uitsluitend in de serveromgeving en de browser ontvangt alleen de gemapte vluchtvelden.

### Controles

- Drie nieuwe regressietests controleren het datumvenster, het vereiste `DD-MM-YYYY`-formaat en vluchtnummers met of zonder spatie.

## 2026-09-08 09:46 CEST — Vaste deelnemers voor kostenverdeling

### Oplossing

- Betalers en deelnemers aan een uitgave worden intern opgeslagen met een vaste eigenaars- of `trip_member`-sleutel; zichtbare namen blijven alleen labels.
- Twee reisleden met dezelfde naam blijven hierdoor afzonderlijke personen in de slimme verrekening.
- Een gewijzigde naam verbreekt de koppeling met bestaande uitgaven niet meer.
- Bestaande uitgaven met oude naamwaarden blijven leesbaar en worden bij bewerken of vóór een ledenwijziging naar vaste sleutels omgezet.

### Controles

- Drie regressietests controleren dubbele namen, een naamswijziging en omzetting van oude naamwaarden.
- Alle twaalf geautomatiseerde tests en de client-, SSR- en Cloudflare-productiebuild zijn geslaagd.

## 2026-09-08 01:15 CEST — Beta-ervaring, privacy en accountcontrole

### Publieke ervaring

- De homepage toont nu een visuele productdemo, belangrijkste mogelijkheden, een stappenplan, openbare reisinspiratie en duidelijke acties voor bezoekers en ingelogde gebruikers.
- Runtimefout `Constructor Map requires 'new'` op de homepage opgelost door het kaarticoon expliciet als `MapPinned` te gebruiken in plaats van de globale JavaScript-`Map` constructor.
- Nieuwe migratie `20260908010000_public_trip_api.sql` vervangt directe openbare workspace-reads door beperkte RPC's voor de openbare reisindex en detailpagina. Publieke pagina's werken daardoor lokaal met de publishable key en vereisen geen server-secret.
- De oude anon-policy op `workspaces` wordt verwijderd, zodat een gedeelde workspace nooit het volledige compatibiliteits-JSON aan een anonieme databaseclient vrijgeeft.
- SQL-regressietest `supabase/tests/public_trip_api.sql` controleert de openbare lijst, PIN-validatie en het ontbreken van private workspace- en financiële velden.
- Migratie en SQL-regressietest zijn op 8 september 2026 volledig uitgevoerd.
- De openbare lijst- en detail-RPC zijn daarna rechtstreeks tegen de gekoppelde Supabase-omgeving gecontroleerd met alleen de publishable key; de detailroute antwoordde met `ok` zonder service-role secret.
- Nieuwe publieke pagina `/mogelijkheden` toont per reisfase routes, planning, boekingen, kosten, samenwerking, delen, mobiele hulpmiddelen, exports en Agency-gebruik; de pagina is gekoppeld vanuit homepage en footer.
- De internationale beta-pagina is uitgebreid met concrete testgebieden, een testronde in drie stappen, foutmeldinstructies, veiligheidsadvies en bekende beperkingen.
- Publieke release **Beta 0.8** beschrijft deze wijzigingen in Nederlands en Engels.

### Privacy en accounts

- De privacyverklaring beschrijft gegevenscategorieën, doelen en AVG-grondslagen, ontvangers en doorgiften, bewaarinformatie, rechten, beveiliging, cookies en de klachtroute bij de Autoriteit Persoonsgegevens.
- Accountinstellingen biedt een server-side, machineleesbare JSON-export van het account, profiel, eigen reizen, planning, uitgaven, samenwerkingen, meldingen en documentmetadata.
- Accountverwijdering vereist de expliciete invoer `DELETE`, verwijdert eerst eigen avatar- en bonuploads en verwijdert daarna het Auth-account; gekoppelde databasegegevens volgen de bestaande cascade-relaties.
- De gegevens-export en volledige accountverwijdering zijn op 8 september 2026 praktisch getest en als stabiel bevestigd.
- Voor een volledig openbare productieopening moeten de officiële juridische identiteit, het adres en een werkend privacycontactadres nog worden ingevuld.

### Controles

- Negen geautomatiseerde regressietests en de client-, SSR- en Cloudflare-productiebuild zijn geslaagd.
- Beveiligingsvelden voor openbare deeltoegang worden uit de account-export gefilterd.

## 2026-09-08 00:23 CEST — Grenzen voor reisteksten

### Gebruikerservaring

- Reisnamen zijn begrensd op 30 tekens en reisomschrijvingen op 375 tekens.
- Het reisnaamveld in Reisinstellingen toont een live teller, bijvoorbeeld `0/30`, net als het omschrijvingsveld.
- Dashboardkaarten, de afteller, het reisbeheer, het Agency-overzicht en publieke reispagina's breken bestaande lange woorden veilig af.
- Invoervelden tonen dezelfde grenzen als de server en database.

### Database

- Nieuwe migratie `supabase/migrations/20260908002000_trip_text_limits.sql` kort bestaande langere waarden gecontroleerd in en voegt databaseconstraints toe.
- De migratie handelt uitgestelde `trips`-triggers af voordat constraints worden gewijzigd, zodat PostgreSQL-fout `55006` niet optreedt.
- Nieuwe regressietest `supabase/tests/trip_text_limits.sql` controleert toegestane grenswaarden en weigert 31/376 tekens.
- Migratie en SQL-test zijn op 8 september 2026 volledig en zonder foutmelding uitgevoerd.

## 2026-09-08 00:15 CEST — Mobiele slimme verrekening

### Oplossing

- Op telefoon toont Slimme verrekening voortaan een compacte kaart per persoon; Saldo krijgt een eigen volledige rij en blijft daardoor volledig binnen het scherm.
- Lange namen en overboekingsregels kunnen afbreken zonder bedragen of andere inhoud buiten de kaart te duwen.
- Op grotere schermen blijft de bestaande overzichtstabel behouden.

### Controles

- Negen geautomatiseerde regressietests en de client-, SSR- en Cloudflare-productiebuild zijn geslaagd.
- De mobiele productiecontrole met lange namen en grote positieve en negatieve bedragen staat nog open.

## 2026-09-08 00:08 CEST — Rolwijziging voor gekoppelde reisleden

### Oplossing

- Een Agency-eigenaar kan de rol van een bestaand reisgenootaccount weer wijzigen.
- De versiegestuurde opslag synchroniseert alleen de nieuwe rol en behoudt de gekoppelde Auth-gebruiker, actieve status en oorspronkelijke acceptatietijd.

### Database

- Nieuwe migratie: `supabase/migrations/20260908000000_update_linked_member_roles.sql`.
- Nieuwe regressietest: `supabase/tests/trip_member_role_updates.sql`.
- Migratie en SQL-test zijn op 8 september 2026 volledig uitgevoerd; de praktische rolwijziging werkt eveneens zoals bedoeld.

## 2026-09-07 23:56 CEST — Compactere reisplanning

### Gebruikerservaring

- De volledige tijdlijn kan nu per dag worden ingeklapt en toont bij iedere dag hoeveel onderdelen erin staan.
- Snelle filters maken vluchten, verblijven, vervoer, huurauto's, activiteiten en eigen planning afzonderlijk zichtbaar.
- De filterbalk blijft op smalle schermen horizontaal bereikbaar en lege filterresultaten krijgen een duidelijke melding in het Nederlands en Engels.

### Controles

- Negen geautomatiseerde regressietests en de client-, SSR- en Cloudflare-productiebuild zijn geslaagd.
- De beheerder heeft bevestigd dat alle aanwezige SQL-migraties en SQL-testbestanden volledig zijn uitgevoerd.
- `SKYLINK_API_KEY` is als Lovable Cloud-secret ingesteld; de sleutel is niet aan repositorybestanden toegevoegd. De live vluchtlookup blijft afzonderlijk te testen.

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
