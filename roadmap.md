# GlobeTrotr roadmap

GlobeTrotr is een reisplanner voor vriendengroepen, koppels en families. **Agency** voegt een gedeelde werkomgeving toe voor reisorganisaties.

> **Status:** `[x]` is gebouwd of door de gebruiker als werkend bevestigd. `[ ]` moet nog worden gebouwd, geïmplementeerd of gecontroleerd. Uitgevoerde wijzigingen en praktijktests staan in `CHANGELOG.md`; deze roadmap bevat alleen de actuele productstand en het resterende werk.

## Actuele stand — 14 september 2026

De internationale beta ondersteunt accounts, reizen, routes, planning, boekingen, uitgaven, verrekening, samenwerking, openbare reispagina's, exports, privacyfuncties, feedback en platformmeldingen. Corporate Admin en het grootste deel van Agency Admin zijn gebouwd. Productie-Auth heeft nu een eigen registratie- en tokenroute, Passkeys en accountbrede communicatievoorkeuren; migratie 1000 en de praktische mailtest staan nog open.

Alle databasemigraties en SQL-regressietests tot en met migratie 970 zijn uitgevoerd. De nieuwe reisfuncties, pre-VPS-releasepoort en productie-UI-controles zijn daarmee technisch toegepast; de praktische productacceptatie blijft open.

## Eerstvolgende controle

1. [x] Database opnieuw opgebouwd, SQL-regressietests uitgevoerd en schone accounts gecontroleerd.
2. [x] Reisback-up teruggezet en samenwerking met een tweede account praktisch bevestigd.
3. [x] Migraties 760 en 770 plus `contact_messages.sql` en `expanded_release_checklist.sql` uitgevoerd.
4. [x] Migraties 780, 790, 800, 810 en 820 met hun SQL-tests in volgorde uitgevoerd.
5. [x] De herstelde `agency_quote_variant_isolation.sql`, migraties 830 en 840 en hun SQL-tests uitgevoerd.
6. [x] Migraties 850 en 860 en hun SQL-acceptatietests uitgevoerd.
7. [x] Migraties 870 tot en met 960, hun SQL-tests en de afsluitende pre-VPS-releasepoort uitgevoerd.
8. [ ] De concrete scenario's per categorie in Corporate Admin → Releasecheck praktisch uitvoeren.
9. [ ] Afwijkingen tijdens de acceptatietest direct als feedback of bekend probleem vastleggen en waar passend met GitHub synchroniseren.

## Eerstvolgende bouwvolgorde

1. [x] **Offerte beantwoorden:** precies één variant accepteren of de volledige offerte afwijzen; atomair, herhaalveilig en met meldingen aan klant en Agency-team.
2. [x] **Offerte omzetten:** een geaccepteerde variant gecontroleerd naar een nieuwe of gekoppelde reis converteren, zonder bestaande inhoud te overschrijven.
3. [x] **Notificaties voor de huidige applicatie:** account, reizen, Agency, feedback en platformstatus zijn gedekt; externe e-mail-, Paddle- en OAuth-events volgen bij integratie.
4. [x] **Publieke website vernieuwen:** company-homepage, productpagina's, demo, navigatie en Engelstalige slugs met redirects zijn gebouwd.
5. [x] **Leveranciersbibliotheek:** herbruikbare aanbieders voor accommodatie, vervoer en activiteiten binnen één Agency-workspace, met afspraken, archief en reiskoppelingen.
6. [x] **Gebruiksvriendelijkheid lange reizen:** reisinstellingen zijn verdeeld in onderwerpen, planning in boekingen en dagplanning, en uitgaven zijn doorzoekbaar en filterbaar.
7. [x] **Publieke dynamiek en privacyverhaal:** actuele openbare reizen staan op de homepage, Contact staat in de hoofdnavigatie en de Europese opslag en privacykeuzes worden helder uitgelegd.
8. [x] **Onderhoud en privacy-inbox:** Corporate Admin kan een onderhoudsvenster beheren; gebruikers zien een countdown en kunnen vanuit hun account een privacyverzoek indienen en de actuele status volgen.
9. [ ] **Agency-productiepoort:** alle rollen, klanten, documenten, taken, sjablonen en offertes praktisch testen.
10. [x] **Hostingportabiliteit:** afzonderlijke Node/Nitro-web- en workerimages, Caddy/TLS, secrets, healthchecks en rollback zijn voorbereid; installatie en externe monitoring volgen tijdens de VPS-uitrol.
11. [ ] **Communicatie en betaling:** de SMTP-relay en accountvoorkeuren zijn gebouwd; Supabase Auth-SMTP, end-to-end aflevering en later Paddle moeten nog worden geactiveerd en getest.
12. [ ] **OAuth:** Apple, Google en Microsoft activeren zodra de productie-infrastructuur en providerconfiguratie gereed zijn.
13. [ ] **Finale deep securityscan:** vóór de publieke productieopening de volledige applicatie, infrastructuur en datastromen diepgaand controleren en alle kritieke of hoge bevindingen oplossen.

## P0 — Volledige notificatiedekking

### Uitgangspunten

- [ ] Iedere belangrijke statuswijziging krijgt één persistente in-appmelding voor iedere relevante ontvanger.
- [ ] De uitvoerder ontvangt geen overbodige melding over de eigen actie, behalve bij een noodzakelijke bevestiging of beveiligingsactie.
- [ ] Herhaalde wijzigingen aan hetzelfde onderwerp worden samengevoegd met een stabiele `event_key`; tien reiswijzigingen leveren bijvoorbeeld één actuele melding op.
- [ ] Een afgehandelde uitnodiging, ingetrokken link of opgeloste storing sluit de bijbehorende actie of banner direct.
- [ ] Meldingen bevatten een vertaalde titel, korte uitleg, tijdstip en waar mogelijk een veilige link naar het juiste scherm.
- [ ] Verplichte beveiligings-, toegangs-, betaal- en platformmeldingen kunnen niet worden uitgeschakeld. Informatieve wijzigingen volgen persoonlijke voorkeuren.
- [ ] E-mail gebruikt later dezelfde gebeurtenisbron als in-appmeldingen, met afzonderlijke bezorgstatus en idempotentie; een mislukte e-mail verwijdert nooit de in-appmelding.
- [ ] Geen wachtwoorden, tokens, medische gegevens, volledige documentinhoud of onnodige persoonsgegevens in meldingen of logs bewaren.
- [ ] Notificatiecreatie en de bijbehorende domeinwijziging waar nodig in dezelfde databasetransactie uitvoeren.
- [ ] Regressietests toevoegen voor juiste ontvangers, geen datalek naar buitenstaanders, deduplicatie, voorkeuren, vertaling en afgehandelde status.

### Account en beveiliging

- [x] Accountblokkade en herstel melden aan de betrokken gebruiker.
- [x] Belangrijke platformupdates en actuele storingen als melding of wegklikbare banner tonen.
- [x] Aangevraagde wijziging van e-mailadres en geslaagde wachtwoordwijziging met een persistente beveiligingsmelding bevestigen.
- [ ] Wijziging van herstelmethode en toekomstige OAuth-koppeling bevestigen zodra die functies actief zijn.
- [ ] Nieuwe of verdachte login en beëindiging van alle sessies melden zodra betrouwbare sessiegegevens beschikbaar zijn.
- [x] Een afgeronde gegevens-export in-app bevestigen.
- [ ] Accountverwijdering na de SMTP-implementatie per e-mail bevestigen; een in-appmelding kan na het wissen van het account niet blijven bestaan.
- [ ] Wijziging van abonnement, betaling, mislukte betaling, opzegging en terugbetaling melden zodra Paddle actief is.

### Reizen en samenwerking

- [x] Nieuwe reisuitnodiging aan een bestaand account melden.
- [x] Acceptatie of weigering terugmelden aan de uitnodiger.
- [x] Verwijdering uit een reis melden aan het verwijderde lid.
- [x] Meerdere reiswijzigingen bundelen tot één actuele melding per reis.
- [x] Intrekken en vernieuwen van een uitnodiging consequent verwerken; intrekken aan het bestaande account melden en de oude actie direct sluiten.
- [x] Verlopen uitnodigingen via een service-role onderhoudstaak sluiten; dagelijkse planning volgt bij VPS-implementatie.
- [x] Rol- of statuswijziging binnen een reis gebundeld melden aan het betrokken lid.
- [x] Belangrijke wijzigingen aan datum, bestemming, openbare status, PIN of gedeelde financiële gegevens apart herkenbaar maken.
- [x] Nieuwe of gewijzigde boeking, vluchtstatus, document en documentvervaldatum volgens persoonlijke voorkeur melden.
- [x] Betaalverzoek, vervangen verdeelronde en afgeronde verrekening melden aan gekoppelde deelnemers.
- [x] Per reis voorkeuren aanbieden voor planning, boekingen, uitgaven, documenten en vluchtalerts; verplichte toegang-, beveiliging- en betaalmeldingen blijven actief.

### Agency

- [x] Agency-uitnodiging, acceptatie, weigering, blokkade, herstel en verwijdering ondersteunen met blijvende accountmeldingen.
- [x] Nieuwe taak aan de toegewezen medewerker melden.
- [x] Persoonlijke voorkeuren voor reiswijzigingen, uitnodigingsreacties en klantupdates voorbereiden.
- [x] Wijziging van Agency-rol of persoonlijke rechten melden aan het betrokken teamlid.
- [x] Belangrijke wijzigingen aan organisatiegegevens, huisstijl en reisbranding melden aan bevoegde beheerders.
- [x] Klant koppelen, ontkoppelen, archiveren of herstellen gebundeld melden aan bevoegde medewerkers die klantupdates willen ontvangen.
- [x] Taaktoewijzing, wijziging, deadline, status en overdracht gebundeld melden aan de betrokken uitvoerder.
- [x] Naderende taakdeadlines via de onderhoudstaak aan de uitvoerder melden; dagelijkse planning volgt bij VPS-implementatie.
- [x] Offerteacceptatie of -afwijzing als één gebundelde melding aan het actieve Agency-team tonen.
- [x] Offerte delen, link vernieuwen, intrekken, beantwoorden en converteren gericht en gebundeld melden.
- [ ] Bekijken van een offerte alleen registreren als daarvoor een passende grondslag, duidelijke informatie en een concreet productdoel zijn vastgesteld.
- [x] Bijna verlopen offertes via de onderhoudstaak eenmaal gebundeld melden.
- [x] Document toegevoegd, verwijderd of met gewijzigde vervaldatum melden volgens reisrechten en voorkeur.
- [x] Bijna verlopen documenten via de onderhoudstaak eenmaal gebundeld melden.
- [ ] Agency-planwijziging, limietwaarschuwing en toekomstige factuurstatus alleen aan gebruikers met facturatierecht melden.

### Feedback, problemen en platformbeheer

- [x] Feedbackindiener bij een statuswijziging informeren.
- [x] Platformstatus publiceren, bijwerken en opgelost melden; actieve storing via een banner tonen.
- [x] Nieuwe feedback en urgente bekende problemen aan de actieve Corporate Admin-ontvangers melden.
- [x] Reactie of aanvullende vraag op feedback ondersteunen zonder privégegevens openbaar te maken.
- [x] Publicatie, wijziging, oplossing en archivering van een bekend probleem consistent verwerken en bij urgente status de beheermelding bijwerken.
- [x] Corporate Admin toont per gebeurtenistype hoeveel recente in-appmeldingen open of afgesloten zijn.
- [ ] E-mailbezorging later uitbreiden met kanaal, laatste fout en gecontroleerd opnieuw proberen zodra SMTP actief is.
- [x] Inzage en publicatie binnen het huidige meldingenbeheer in de append-only auditlog vastleggen.

## P0 — Agency-offertes afronden

- [x] Relationele offertes met meerdere geordende prijsvarianten, klant, optionele reis, geldigheid en status.
- [x] Atomaire interne opslag en beheer vanuit Agency Admin.
- [x] Tijdelijke klantlink met cryptografisch token; alleen de hash wordt opgeslagen.
- [x] Openbare offertepagina met uitsluitend deelbare offerte- en merkgegevens.
- [x] Eenmalige, atomaire acceptatie van precies één geldige variant.
- [x] Atomaire afwijzing van de volledige offerte, met optionele begrensde klantreactie.
- [x] Heldere bevestigingspagina na antwoord en herhaalveilig resultaat bij dubbel klikken of vernieuwen.
- [x] Het actieve Agency-team met één gebundelde, vertaalde melding informeren.
- [x] Gedeelde link kunnen intrekken of veilig roteren en de deelstatus in Agency Admin tonen.
- [x] Geaccepteerde variant omzetten naar een nieuwe reis of expliciet koppelen aan een bestaande reis.
- [x] Conversie-preview tonen en nooit bestaande reisinhoud stilzwijgend overschrijven.
- [x] Volledige offertecyclus van aanmaak en wijziging tot delen, antwoord, intrekken en conversie in de Agency-auditlog vastleggen.

## P0 — Publieke website en homepage

- [x] Company-homepage met duidelijke waardepropositie, doelgroep en primaire actie binnen de eerste schermhoogte.
- [x] Homepage uitbreiden met concrete groepsreis-, roadtrip- en Agency-praktijkvoorbeelden en het oprichtersverhaal met foto.
- [x] Publieke navigatie voor product, oplossingen, demo, prijzen, updates, roadmap, support en juridische informatie.
- [x] Publieke hoofdnavigatie terugbrengen tot de primaire keuzes en Contact en Status ook binnen de ingelogde omgeving direct bereikbaar maken.
- [x] Interactieve demo met veilige voorbeelddata voor route, planning, paklijst, uitgaven en verrekening.
- [x] Beheerbare recensies in Corporate Admin; alleen expliciet gepubliceerde recensies verschijnen op de homepage.
- [x] Publiek contactformulier met Turnstile, afgeschermde opslag en een doorzoekbare Corporate Admin-inbox met statussen en auditlog.
- [x] Homepage, interactieve demo en mogelijkhedenpagina elk een eigen doel en inhoud geven; overlap verwijderen.
- [x] Prijspagina uitbreiden met doelgroepadvies, planvergelijking en duidelijke Paddle-, verlengings- en opzeginformatie.
- [x] Contact uitbreiden met supportinformatie en categorieën voor feedback, klachten, privacy, betalingen en Agency.
- [x] Publieke roadmap beperken tot toekomstig werk; afgeronde wijzigingen uitsluitend via de changelog tonen.
- [x] Afzonderlijke pagina's voor reizigers, groepen en Agencies.
- [x] Agency-productpagina voor teams, rollen, klanten, offertes, taken, branding en werkvoorraad.
- [x] Realistische scenario's, privacyvertrouwen, transparante betastatus en duidelijke ondersteuning.
- [x] Over-pagina herschrijven als een doorlopend persoonlijk oprichtersverhaal en de onderhoudspagina compacter en informatiever vormgeven.
- [x] De belangrijkste publieke routes hebben routespecifieke canonical-URL's, social previews en gestructureerde organisatie- en productdata.
- [ ] Volledig responsive en toegankelijk in NL/EN handmatig controleren.
- [x] Engelstalige slugs: `/features`, `/demo`, `/for-travelers`, `/for-groups`, `/for-agencies`, `/pricing`, `/updates`, `/roadmap`, `/known-issues`, `/beta`, `/privacy`, `/terms` en `/refund-policy`.
- [x] Functionele slugs gemigreerd naar `/trip/:token/:tripId`, `/invite/:token` en `/agency-invite/:token`.
- [x] Bestaande Nederlandse routes via productie-redirects behouden voor bookmarks, gedeelde reizen en uitnodigingen.
- [x] Taalkeuze los van de URL gehouden: één stabiele slug toont NL of EN volgens account- of browservoorkeur.
- [ ] Volledige kliktest op telefoon en desktop voor beide talen.

## P0 — Gebundelde acceptatietest

- [x] Brede testregels vervangen door concrete scenario's voor publieke website, betaling, contact, accounts, reizen, Agency, Corporate Admin, meldingen, hosting en beveiliging.
- [x] Releasecheck in Corporate Admin groeperen per onderdeel met voortgang per categorie en totaal.
- [x] Migratie `20260908077000_expand_release_acceptance_checklist.sql` en de bijbehorende SQL-controle uitgevoerd.
- [ ] Alle openstaande productscenario's handmatig testen na de volledige implementatie.
- [ ] Bevindingen oplossen, opnieuw testen en alleen werkelijk gecontroleerde regels afvinken.

## P0 — Agency praktisch controleren

De databaselaag, migraties en SQL-regressietests tot en met 20260908072000_update_release_checklist.sql zijn uitgevoerd. [AGENCY_IMPLEMENTATION.md](AGENCY_IMPLEMENTATION.md) blijft de naslag voor de latere productieconfiguratie.

- [x] Agency-, notificatie-, leveranciers-, domein-, mail-outbox-, quota-, worker-, bedrijfsbeheer- en releasechecklistmigraties uitgevoerd.
- [x] Beschikbare rollback- en regressietests zonder fouten uitgevoerd.
- [x] Schone beta-dataset gemaakt en eigenaar- en Corporate Admin-toegang opnieuw gecontroleerd.
- [ ] Domeinverificatie, TLS-routing en SMTP-secretkoppeling op de VPS activeren; de uitgaande wachtrij blijft tot die tijd in testmodus.
- [ ] Praktisch controleren met eigenaar, adviseur, finance, klant en buitenstaander.
- [x] Technische Agency-downgrade direct laten terugvallen op GlobeTrotr-branding; praktische controle blijft onderdeel van de implementatietest.

## P0 — Finale deep securityscan vóór productie

- [ ] Volledige aanvalsoppervlakte inventariseren: browser, serverfuncties, Supabase, Storage, SMTP, Paddle, OAuth, GitHub-koppeling, VPS en DNS.
- [ ] RLS-beleid, databasefuncties, `SECURITY DEFINER`, grants, zoekpaden, triggers en RPC-autorisatie handmatig en geautomatiseerd controleren.
- [ ] Publieke routes, deel- en uitnodigingslinks, tokens, PIN's, uploads, exports en importbestanden testen op toegang buiten de bedoelde workspace of reis.
- [ ] Authenticatie, sessies, blokkades, rollen, persoonlijke rechten, Agency-scheiding en Corporate Admin-toegang met negatieve praktijktests controleren.
- [ ] OWASP-risico's controleren, waaronder injectie, XSS, CSRF, SSRF, IDOR, open redirects, rate-limitomzeiling, brute force en spreadsheetformules.
- [ ] Secrets, logging, foutmeldingen, bronkaarten, buildartefacten, Git-geschiedenis en configuratie controleren op onbedoelde openbaarmaking.
- [ ] Dependencies, lockfile, GitHub Actions, container- of VPS-image en productieheaders scannen op kwetsbaarheden en verkeerde configuratie.
- [ ] Privacy- en dataminimalisatiecontrole uitvoeren op persoonsgegevens, financiële gegevens, documenten, auditlogs, bewaartermijnen, exports en accountverwijdering.
- [ ] Back-upherstel, incidentrespons, monitoring, alarmen en rollback in staging daadwerkelijk uitvoeren.
- [ ] Bevindingen voorzien van ernst, bewijs, eigenaar en herstelstatus; alle kritieke en hoge bevindingen oplossen en opnieuw testen vóór livegang.
- [ ] Finale securityrapportage bewaren zonder secrets of persoonsgegevens en de productieopening expliciet blokkeren zolang de scan niet is goedgekeurd.

## P1 — Agency verder uitbouwen

- [x] Leveranciersbibliotheek voor accommodaties, vervoer en activiteiten.
- [x] Leverancierscontacten, boekingsvoorwaarden, commissie en interne notities workspacegebonden opslaan.
- [x] Operationele dashboards uitgebreid met documentopslag, klantreizen, declarabele kosten, offerteconversie en werkvoorraad.
- [x] Configureerbare herinneringen voor taakdeadlines, offertes en documenten gebouwd; dagelijkse uitvoering volgt bij VPS-implementatie.
- [ ] Klantportaal uitbreiden met offertes, antwoorden en later echte factuur- en betaalstatus.
- [x] Basisrapportage voor klanten, reizen, offerteconversie, geaccepteerde waarde, taken en declarabele kosten.
- [ ] Rapportages voor gerealiseerde omzet, marge, commissie en klanttevredenheid zodra betrouwbare betaal- en tevredenheidsevents bestaan.

## P1 — Corporate Admin verder uitbouwen

- [x] Afzonderlijke beheershell voor overzicht, gebruikers, Agencies, status, berichten, problemen, feedback en auditlog.
- [x] Gebruikersdetails, reisstatistieken, planwijziging, blokkeren/herstellen en verplichte reden met auditregistratie.
- [x] Agency-instellingen bekijken en gecontroleerd corrigeren.
- [x] Platformstatus, feedback, bekende problemen en GitHub Issues-synchronisatie.
- [x] Paddle-klaar intern model en Corporate Admin-overzicht bouwen voor abonnementen, MRR, omzet, refunds, achterstanden, facturen en webhookverwerking.
- [ ] Ondertekende Paddle-webhookingest en transactieverwerking activeren nadat productieproducten en secrets zijn ingesteld.
- [x] Corporate Admin-basis voor bedrijfsstatistieken, verkoopfacturen, gedeelde en persoonlijke `@globetrotr.nl`-mailboxen, rechten, inboxhandelingen, antwoorden en persoonlijke handtekeningen bouwen.
- [x] GlobeTrotr-personeelsbeheer bouwen met eigenaar-, admin- en supportrollen, rechten per bedrijfsdomein, functie, veilige deactivatie en persoonlijke mailboxprovisioning.
- [x] Corporate navigatie beperken op toegewezen bedrijfsrechten en operationele serverfuncties dezelfde rechten laten afdwingen.
- [x] Personeelsdetail uitbreiden met rechtenhistorie en een tweede bevestiging bij deactivatie of promotie tot eigenaar.
- [x] Auditlog doorzoekbaar en filterbaar maken en audit-, omzet- en factuurselecties veilig als CSV exporteren.
- [x] Quota-reset voorzien van verplichte reden, auditregistratie en een extra bevestiging.
- [ ] IMAP of mailprovider-API op de VPS aansluiten voor ontvangen mail; SMTP blijft uitsluitend de verzendlaag.
- [ ] Persoonlijke adressen volgens `eerstelettervoornaam.achternaam@globetrotr.nl` provisionen en mailboxrechten praktisch controleren.
- [ ] Paddle-webhooks als gezaghebbende bron aansluiten op de interne factuur- en omzetweergave.
- [x] Moderatie van openbare reizen met verplichte reden, eigenaarsmelding en auditlog.
- [x] Featureflags met interne, beta- of publieke doelgroep, verplichte reden en auditlog.
- [x] Privacyverzoeken en wettelijke afhandelingstermijnen registreren en volgen.
- [x] Beperkte interne incidentenmodule met ernst, status en auditregistratie.
- [ ] Echte vierogenautorisatie voor definitieve, onomkeerbare acties.
- [ ] Minimale aggregatie-RPC's gebruiken waar dashboards nu nog brede service-role-queries doen.

## P1 — Hosting, e-mail en betalingen

### Ubuntu-VPS

- [x] Runtime-afhankelijkheden van Lovable verwijderen; Vite, authopslag en foutregistratie draaien zelfstandig.
- [x] Afzonderlijke Node/Nitro-productiebuild en expliciet workerstartscript bouwen.
- [x] Containerbasis onder een niet-root gebruiker, healthcheck, automatische herstart en gestructureerde stdout-logs bouwen.
- [ ] Nginx of Caddy voor TLS, proxyheaders, uploads en WebSockets.
- [ ] Stagingdomein, Supabase Site URL en exacte redirect-URL's configureren.
- [ ] Monitoring, uptimecontrole, firewall, updates, configuratieback-up en herstel naar de vorige stabiele containerrelease.
- [ ] DNS pas na een volledige stagingproef omschakelen.
- [x] Datamodel en Agency-interface voor `naam.globetrotr.nl`, eigen domeinen, DNS-verificatie en veilige SMTP-secretreferenties voorbereiden.
- [x] Centrale providerstops, atomaire API-dagquota per workspace en een idempotente PostgreSQL-workerwachtrij voorbereiden.
- [x] Free-, Pro- en Agency-budgetten voor weer, vluchtinformatie en routes centraal en testbaar vastleggen; definitieve commerciële limieten volgen bij Paddle-configuratie.
- [x] `20260908065000_provider_quotas_and_worker_queue.sql` en `provider_quotas_and_worker_queue.sql` uitgevoerd.
- [x] Workerproces voor VPS 2 bouwen met claim, resultaatregistratie, retries, health-endpoint en afgeschermde provider-healthchecks.
- [x] Corporate Admin uitbreiden met providergebruik, noodstops met verplichte reden en mislukte workerjobs.
- [x] Productieproxy, gescheiden Compose-services, lokale worker-healthcheck en firewallregels als uitvoerbare configuratie en handleiding voorbereiden.
- [ ] DNS, Caddy-certificaat, hostfirewall, private Hetzner-netwerk en externe uptimebewaking op de echte servers activeren en controleren.
- [ ] Inkomende hostnames veilig aan uitsluitend geverifieerde actieve Agencies koppelen, met wildcard TLS voor subdomeinen en begrensde on-demand TLS voor eigen domeinen.
- [ ] Voor eigen Agency-domeinen CNAME naar `dashboard.globetrotr.nl`, een afzonderlijk TXT-verificatierecord, veilige hostselectie en automatische intrekking bij blokkade of abonnementswijziging bouwen.
- [x] Opslagarchitectuur vastleggen: Supabase Storage blijft eerst actief en alle toekomstige serverkoppelingen gebruiken `provider + bucket + objectKey`.
- [ ] Alleen bij aantoonbaar kosten- of capaciteitsvoordeel private objecten gecontroleerd naar Hetzner S3 migreren met checksum, terugvalpad en hersteltest.

### SMTP

- [ ] Provider en verwerkingsregio kiezen en privacyverklaring concretiseren.
- [ ] SPF, DKIM en DMARC voor `globetrotr.nl` configureren.
- [x] Provider-onafhankelijke, idempotente mail-outbox en veilige NL/EN-rendering in verplichte testmodus bouwen.
- [x] Reis- en Agency-uitnodigingen voor bestaande en nieuwe accounts via de mail-outbox versturen en bij verlengen opnieuw klaarzetten.
- [x] Eén herkenbare responsive e-mailopmaak toepassen op Auth-, uitnodigings- en servicemail, met eigen tokenroutes en platte-tekstterugval.
- [x] Interne VPS-mailrelay met SMTP-TLS, time-outs, afzenderbegrenzing, ontvangerslimieten, veilige foutregistratie en afgeschermde secrets bouwen.
- [ ] Relay met de echte SMTP-provider testen en daarna de databasebezorgmodus gecontroleerd op `live` zetten.
- [ ] NL/EN-templates voor uitnodigingen, antwoorden, beveiliging, betalingen en belangrijke updates.
- [ ] Bezorgstatus registreren zonder volledige berichtinhoud of secrets te loggen.

### Paddle

- [ ] Producten, prijzen en belastingweergave definitief instellen.
- [ ] Checkout of Payment Links met correcte consumenteninstemming.
- [ ] Ondertekende webhooks als enige bron voor betaalstatus.
- [ ] Abonnement, verlenging, upgrade, downgrade, opzegging, mislukte betaling en terugbetaling verwerken.
- [ ] Facturen en transacties uitsluitend aan bevoegde gebruikers tonen.
- [ ] Juridische pagina's aanvullen met de uiteindelijke VPS-, SMTP- en Paddle-productiegegevens vóór livegang.

## P1 — Reizen onderweg en productkwaliteit

- [x] Reisstatistieken met reisdagen, landen, bestemmingen, overnachtingen, totale uitgaven, daggemiddelde en categorieën.
- [x] Budgettempo met besteed bedrag, resterend budget en een prognose voor lopende reizen.
- [x] Provider-onafhankelijke ICS-agenda-export voor dagplanning en boekingen, geschikt voor gangbare agenda-apps.
- [ ] Pro-agenda-abonnement bouwen met een intrekbare, willekeurige feed-URL, alleen-lezen iCalendar-uitvoer en een duidelijke keuze tussen eenmalig exporteren en automatisch bijwerken.
- [x] GPX-export van bestemmingen en routevolgorde voor kaart- en navigatie-apps.
- [x] Route gecontroleerd omkeren met bevestiging en opslag via de bestaande versiecontrole.
- [x] Reis als veilige private variant dupliceren.
- [x] Basisgegevens, route, boekingen, budget en omgerekende uitgaven van twee reisvarianten naast elkaar vergelijken.
- [x] Gezamenlijke taken per reis met verantwoordelijke, deadline en status.
- [x] Eigen private omslagfoto per reis voor reisscherm en dashboard, met kortlevende veilige weergave op een bewust openbare reispagina; reisgidsopmaak volgt na opslagacceptatie.
- [x] Plaatsgebonden activiteiten en boekingen plus daaraan gekoppelde uitgaven als afzonderlijke markers op de routekaart.
- [x] Rustig dagoverzicht voor onderweg met uitsluitend vandaag: planning, adressen, boekingen, documenten, weer en openstaande taken.
- [ ] Later optionele tweerichtings-agendasynchronisatie via CalDAV/WebDAV onderzoeken; dit blijft los van het geplande alleen-lezen agenda-abonnement.
- [ ] Verdere mobiele, toegankelijkheids- en performancecontrole.
- [x] Corporate Admin-navigatie op kleine schermen inklapbaar maken, icoonknoppen vergroten en productiegerichte foutteksten gebruiken.
- [x] Demo anonimiseren, Contact-acties van iconen voorzien, ingelogde supportlinks logisch als laatste plaatsen en de reisomslag naast de algemene instellingen zetten.
- [x] Volledige beginnerstutorial, klikbare migratievolgorde en CLI-procedure voor een schoon Supabase-productieproject vastleggen, inclusief beheerde Auth/Storage-schema's, sleutels, eerste beheeraccount en terugval.
- [ ] Grote bundles splitsen waar dit de gemeten laadtijd werkelijk verbetert.
- [ ] Automatische vertaling van feedback en bekende problemen pas na keuze van een veilige provider en bewaarbeleid.
- [ ] Automatische vertaalconcepten voor statusberichten, bekende problemen en publieke communicatie bouwen, met verplichte menselijke controle vóór publicatie.

## P2 — Latere groei

- [ ] Referral- en kortingsprogramma met fraudebeperking en Paddle-koppeling.
- [ ] Boekingsbevestigingen uit e-mail omzetten naar controleerbare concepten.
- [ ] CRM- en boekhoudexport via afgeschermde integraties.
- [ ] Geplande Agency-automatiseringen en uitgebreidere rapportages.
- [ ] Aanvullende talen na volledige dekking en kwaliteitscontrole van Nederlands en Engels.

## Grotere functies na de VPS-overgang

- [ ] Echte offline modus met expliciete download, versiestatus, conflictbehandeling en veilige lokale opslag.
- [ ] Boekingen uit doorgestuurde e-mail omzetten naar controleerbare concepten.
- [ ] Automatische routeoptimalisatie met reistijden, voorkeuren en verplichte handmatige bevestiging.
- [ ] Plaatsaanbevelingen en actuele openingstijden via een server-side provider met passend quotum.
- [ ] Periodieke vluchtcontrole en gerichte vluchtalerts via de worker.
- [ ] GPX-import met validatie, preview, limieten en dubbele-puntdetectie.
- [ ] Veilige klantformulieren voor reiswensen en ontbrekende gegevens.
- [ ] Mailboxintegratie voor ontvangen Agency- en bedrijfsmail.
- [ ] AI-reisplanning met bronvermelding, kostenlimieten, privacycontrole en menselijke goedkeuring.

## Gebouwd fundament

- Accounts met e-mail/wachtwoord, profiel, taal, thema, export en verwijdering.
- Relationele reizen met versiecontrole, rollen, uitnodigingen en financiële privacy.
- Route, kaart, planning, boekingen, vluchtdata, vervoer, brandstofinschatting, uitgaven en slimme verrekening.
- Openbare reispagina met kaart, PIN, begrensde velden en selectieve publieke API.
- Private documenten, exports en veilige spreadsheetuitvoer.
- Persistente meldingen, platformbanner, feedback en bekende problemen.
- Corporate Admin met auditlog en Agency Admin met team, rechten, branding, klanten, operatie, taken, sjablonen, documenten, abonnementsoverzicht en offertes.
- Privacyverklaring, beta-voorwaarden, algemene voorwaarden, terugbetalingsbeleid, prijzen, publieke roadmap en publieke changelog in NL/EN.

## Actuele beta-beperkingen

- Automatische app-e-mails zijn nog niet actief; accountmeldingen en deelbare links werken wel.
- Apple-, Google- en Microsoft-login zijn nog niet actief.
- Paddle-checkout, facturen en betaalstatus zijn nog niet actief; de beta schrijft niets af.
- Automatische vertaling van feedback en bekende problemen is nog niet actief.
- Eigen Agency-domeinen, echte mailboxsynchronisatie en providerverzending worden pas tijdens de VPS-productieconfiguratie geactiveerd.
## Productkansen uit concurrentieonderzoek ? na stabilisatie

De offici?le productinformatie van Wanderlog, TripIt, Roadtrippers, TravelSpend, TripMapper en Travefy is op 14 september 2026 vergeleken met GlobeTrotr. Bestaande GlobeTrotr-sterktes zijn samenwerking met rollen, slimme verrekening, Agency-branding, offertes, taken, documenten, Europese gegevenscontrole en openbaar delen. Kansrijke aanvullingen zijn geprioriteerd op gebruikerswaarde en technische afhankelijkheden.

### Hoogste productwaarde

- [ ] Offline reismodus met expliciete download, laatste synchronisatietijd en alleen de essenti?le planning, adressen, boekingen en documenten.
- [ ] Boekingsbevestigingen uit doorgestuurde e-mail of upload omzetten naar een controleerbaar concept; nooit stilzwijgend opslaan.
- [ ] Routeoptimalisatie en reistijd tussen stops, met vermijden van tolwegen, snelwegen of veerboten en altijd handmatige bevestiging.
- [ ] Plaatsen ontdekken rond verblijf of route op categorie, afstand en openingstijd; externe providers via de server benaderen.
- [x] Reisstatistieken: landen, bestemmingen, overnachtingen, reisdagen, categorie-uitgaven, daggemiddelde en budgetprognose; afstand volgt bij de route-engine.
- [x] Reis veilig dupliceren als private variant, met planning en paklijst maar zonder deelnemers, uitgaven, boekingsreferenties, PIN of deelstatus, en twee varianten op het dashboard vergelijken.

### Voor Pro en onderweg

- [ ] Live vluchtmeldingen uitbreiden met gate, terminal, bagageband, check-inherinnering en vertrektijdadvies wanneer providerdata betrouwbaar is.
- [ ] GPX- en Google Maps-export naast ICS en de bestaande reisgids.
- [ ] Persoonlijk reizigersprofiel met optionele loyaliteitsprogramma's en documentvervalherinneringen, strikt priv? en versleuteld.
- [ ] Veilige bestemmingsinformatie over reisdocumenten, lokale noodnummers en actuele verstoringen via aantoonbaar betrouwbare bronnen.
- [ ] Uitgaven aan plaatsen koppelen en daggemiddelde, budgettempo en voorspelde overschrijding tonen.

### Voor Agency

- [ ] Veilige klantformulieren voor reiswensen en ontbrekende gegevens met veldniveau-toestemming en bewaartermijn.
- [ ] Contentbibliotheek met herbruikbare bestemmingen, activiteiten, teksten en media naast bestaande sjablonen en leveranciers.
- [ ] Commissie-, marge-, betaalplanning- en factuurreconciliatie zodra Paddle en boekhouding als betrouwbare bronnen zijn aangesloten.
- [ ] Klantcommunicatie per reis bundelen vanuit de toekomstige mailbox zonder priv?-mail automatisch te scannen.
- [ ] Mooie PDF-offerte en reisgids met geselecteerde media, eigen domein en Agency-huisstijl.

### Bewust niet direct kopi?ren

- [ ] Generatieve reisplanning pas onderzoeken na privacy-, bronkwaliteit-, kosten- en menselijke-controleontwerp.
- [ ] Gmail- of inboxscanning alleen opt-in, minimaal, herroepbaar en na een aparte DPIA; e-mail doorsturen naar een uniek reisadres heeft voorkeur.
- [ ] Boekingsmarktplaatsen, advertenties en compensatieclaims alleen toevoegen als ze aantoonbaar bij GlobeTrotr passen en belangen transparant blijven.
