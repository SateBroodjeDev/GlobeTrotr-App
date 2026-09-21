# GlobeTrotr roadmap

**Actuele betaalblokkade:** na uitrol van commit `09bbc1f` wees de eerste Paddle-herstelpoging op de nettosubtotaalconstraint bij een 100%-korting. Migraties 1330–1340 en hun SQL-tests zijn voorbereid; voer ze uit en controleer daarna de bestaande transactie, een nieuwe webhookbezorging, Agency-toegang en een abonnementswijziging zonder schijnfactuur. Zes losse maandbetalingen stapelen zes maanden toegang. De live ICS-feed pas na herstel van betaaltoegang opnieuw testen.

**Releasecontrole 21 september 2026:** nog geen vrijgaveadvies. De 75 lokale tests, ESLint en volledige TypeScript-controle slagen; de lokale Windows-Nitrobouw stopt op `EPERM`, en migraties 1180 tot en met 1300 plus de praktische beta-testen staan open. Zie [de actuele releasehandleiding](IMPLEMENTATION_PENDING.md).

## Betatest — 21 september 2026

- [ ] Migreer 1180 en rol Node-01 en Node-02 opnieuw uit; zet dezelfde Paddle-price-ID's op beide nodes.
- [ ] Migreer 1190 voor bedrijfsmailconcepten, mappen en de twee bijbehorende Corporate Admin-controles.
- [ ] Migreer 1200 en controleer met een echt heen-en-weerantwoord dat mailclients en het portaal dezelfde gespreksthread behouden.
- [ ] Migreer 1210 en controleer een PDF- en afbeeldingsbijlage in beide richtingen, inclusief een gebruiker zonder postvaktoegang.
- [ ] Migreer 1220 en controleer in de workerlog dat een verlopen, afgebroken upload veilig wordt opgeruimd.
- [ ] Migreer 1230, start ClamAV op Node-02 en controleer een schoon bestand, EICAR-testbestand en scanneruitval; na herstel moet een inkomend bericht mét bijlage alsnog worden geïmporteerd.
- [ ] Migreer 1240 en controleer de bijgewerkte privacyverklaring in beide talen aan de hand van de werkelijke mail-, bijlagen- en vertaalstromen.
- [ ] Migreer 1250 en controleer per postvak de laatste synchronisatie, foutcode en eenmalige herhaalactie in Corporate Admin.
- [ ] Migreer 1260 en controleer dat een Paddle-transactie aan het juiste account en workspaceplan is gekoppeld voordat een event opnieuw wordt verwerkt.
- [ ] Migreer 1270 en controleer dat een vooraf gekoppelde Agency-klantreis na e-mailbevestiging voor het nieuwe klantaccount zichtbaar wordt, en na adreswijziging of archiveren verdwijnt.
- [ ] Migreer 1280, configureer hetzelfde Paddle-checkoutgeheim op beide nodes en controleer dat een gewijzigde browser-workspace-ID geen betaalrecht aan een ander account verleent.
- [ ] Migreer 1290 en ontvang een teststoring in een Nederlandse en Engelse mailbox; controleer onderwerp, inhoud, HTML, statuslink en pop-uptekst.
- [ ] Migreer 1300, plaats de vijf voorwaardelijke Auth-templates en onderwerpen in Supabase en test iedere Auth-mail met een Nederlands en Engels profiel.
- [x] Release-preflight toegevoegd voor migratie/testparen, actuele implementatieverwijzingen en kapotte UTF-8-patronen; de SQL-test voor 1290 bewijst de echte NL/EN-payload binnen een rollback.
- [ ] Controleer dat een live agenda-abonnement activiteiten met begin- en eindtijd toont, ook nadat de reis is bijgewerkt.
- [ ] Start de afgeschermde LibreTranslate-service op Node-02 en test een Nederlands-Engels concept met handmatige correctie.
- [ ] Test de negen gemelde productiescenario's met echte testaccounts; de punten staan na migratie 1180 ook in Corporate Admin.
- [ ] Controleer de herstelde Agency-klantregistratie met exacte klantrol, workspace en route; onderzoek resterende afwijkingen apart.
- [ ] Reproduceer de GPX-knop met een reis met geldige coördinaten op het doelapparaat; controleer dat lege en ongeldige locaties niet als routepunt verschijnen.
- [ ] Controleer Engelstalige standaardmail, de gecombineerde publieke dagplanning en lange betalersnamen op telefoon na uitrol.
- [ ] Controleer bij een betaald account het Paddle-event en de workerlog voordat ontbrekende rechten handmatig worden hersteld.
- [x] Herhaalbare productiesmoketest voor publieke routes, registratie, status en merkbestanden toegevoegd; uitvoering na uitrol blijft open.
- [x] Contactformulier begrensd laten falen en Turnstile-tokens aan de specifieke contactactie binden.
- [x] Terugkeer na inloggen beperken tot genormaliseerde interne paden en dubbelzinnige slash/backslash-URL's blokkeren.
- [x] Eén lokale `npm run verify`-poort voor lint, tests, TypeScript en alle workerprocessen toegevoegd.
- [x] Statische CI-audit toegevoegd die onbeoordeeld service-rolegebruik in publieke serverfuncties blokkeert.
- [x] De CI-audit uitgebreid met browsergeheimen, niet-beoordeelde HTML-sinks, externe links, gevoelige logging en veilige zoekpaden voor nieuwe `SECURITY DEFINER`-functies; vijf regressietests bewaken de regels.
- [x] Legacy service-role-fallback uit de openbare reizenlijst verwijderd; RPC-fouten lekken geen brede workspacedata.

GlobeTrotr is een reisplanner voor vriendengroepen, koppels en families. **Agency** voegt een gedeelde werkomgeving toe voor reisorganisaties.

> **Status:** `[x]` is gebouwd of door de gebruiker als werkend bevestigd. `[ ]` moet nog worden gebouwd, geïmplementeerd of gecontroleerd. Uitgevoerde wijzigingen en praktijktests staan in `CHANGELOG.md`; deze roadmap bevat alleen de actuele productstand en het resterende werk.

## Actuele stand — 21 september 2026

De internationale beta ondersteunt accounts, reizen, routes, planning, boekingen, uitgaven, verrekening, samenwerking, openbare reispagina's, exports, privacyfuncties, feedback en platformmeldingen. Corporate Admin en het grootste deel van Agency Admin zijn gebouwd. Productie-Auth heeft eigen registratie- en tokenroutes, passkeys, TOTP, Google- en Discord-aanmelding en accountbrede communicatievoorkeuren; de praktische acceptatietests staan nog open.

Volgens de eigenaar zijn alle SQL-migraties en tests tot en met 1170 uitgevoerd. Migraties 1180 tot en met 1300 met hun SQL-tests en de praktische acceptatietests staan open. De beta is op de eigen infrastructuur in gebruik; technische beschikbaarheid betekent nog niet dat ieder gebruikersscenario is geslaagd.

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
3. [x] **Notificaties voor de huidige applicatie:** account, reizen, Agency, feedback, platformstatus, OAuth en Paddle-betalingen zijn gedekt.
4. [x] **Publieke website vernieuwen:** company-homepage, productpagina's, demo, navigatie en Engelstalige slugs met redirects zijn gebouwd.
5. [x] **Leveranciersbibliotheek:** herbruikbare aanbieders voor accommodatie, vervoer en activiteiten binnen één Agency-workspace, met afspraken, archief en reiskoppelingen.
6. [x] **Gebruiksvriendelijkheid lange reizen:** reisinstellingen zijn verdeeld in onderwerpen, planning in boekingen en dagplanning, en uitgaven zijn doorzoekbaar en filterbaar.
7. [x] **Publieke dynamiek en privacyverhaal:** actuele openbare reizen staan op de homepage, Contact staat in de hoofdnavigatie en de Europese opslag en privacykeuzes worden helder uitgelegd.
8. [x] **Onderhoud en privacy-inbox:** Corporate Admin kan een onderhoudsvenster beheren; gebruikers zien een countdown en kunnen vanuit hun account een privacyverzoek indienen en de actuele status volgen.
9. [ ] **Agency-productiepoort:** alle rollen, klanten, documenten, taken, sjablonen en offertes praktisch testen.
10. [x] **Hostingportabiliteit:** afzonderlijke Node/Nitro-web- en workerimages, Caddy/TLS, secrets, healthchecks en rollback zijn voorbereid; installatie en externe monitoring volgen tijdens de VPS-uitrol.
11. [ ] **Communicatie en betaling:** SMTP, templates en Paddle zijn live gekoppeld. Betaling → juiste accountrechten, dubbele uitnodigingsmail en NL/EN-opmaak zijn nog open beta-acceptaties.
12. [x] **OAuth:** Google en Discord zijn in Supabase geactiveerd en praktisch werkend bevestigd.
13. [ ] **Finale deep securityscan:** vóór de publieke productieopening de volledige applicatie, infrastructuur en datastromen diepgaand controleren en alle kritieke of hoge bevindingen oplossen.
14. [x] **Inlogmethoden en mailbezorging beheren:** gebruikers koppelen Google en Discord vanuit Account; Corporate Admin volgt bezorging en kan mislukte servicemail opnieuw aanbieden.
15. [x] **Veilige bezorgschakelaar:** Corporate Admin kan servicemail met verplichte reden pauzeren en na een relaycontrole vastgehouden berichten gecontroleerd vrijgeven.
16. [x] **Zelfherstellende workerclaims:** vastgelopen mail- en achtergrondtaken worden na een verlopen claim opnieuw aangeboden en stoppen begrensd na tien pogingen.
17. [x] **Veilige HTML-bedrijfsmail:** medewerkers maken opgemaakte mail met een begrensde editor; veilige HTML, tekstalternatief en handtekening reizen samen door wachtrij en relay.
18. [x] **Gratis vertaalconcepten voorbereid:** LibreTranslate draait optioneel op Node-02 en Corporate Admin kan NL/EN-concepten maken; activering en menselijke acceptatie blijven open.
19. [x] **Bedrijfsmail als werkplek:** Inbox, Verzonden, Concepten, Wachtrij en Archief zijn doorzoekbaar; concepten bewaren automatisch en hebben vertaling en HTML-preview.
20. [x] **Mailgesprekken:** IMAP-antwoorden en uitgaande replies delen threadheaders en verschijnen chronologisch in één gesprek.
21. [x] **Veilige mailbijlagen:** uitgaande en ontvangen ondersteunde bestanden gebruiken een privébucket, begrensde omvang, integriteitscontrole en kortlevende downloads.
22. [x] **Opruiming bijlage-uploads:** reserveringen verhinderen verwisseling tussen gebruikers en de worker verwijdert afgebroken uploads na twee uur.
23. [x] **Malwarescan voor bijlagen:** ClamAV controleert inkomende en uitgaande bestanden en blokkeert ook bij scanneruitval of een onduidelijk antwoord.

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
- [x] Wijziging van abonnement, betaling, mislukte betaling, opzegging en terugbetaling in app en per NL/EN-servicemail melden.

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
- [x] Agency-planwijziging en factuurstatus alleen aan de workspace-eigenaar melden; limietwaarschuwingen blijven apart gepland.

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

De databaselaag, migraties en SQL-regressietests tot en met 20260908072000_update_release_checklist.sql zijn uitgevoerd. De resterende productieconfiguratie staat in [de actuele releasehandleiding](IMPLEMENTATION_PENDING.md).

- [x] Agency-, notificatie-, leveranciers-, domein-, mail-outbox-, quota-, worker-, bedrijfsbeheer- en releasechecklistmigraties uitgevoerd.
- [x] Beschikbare rollback- en regressietests zonder fouten uitgevoerd.
- [x] Schone beta-dataset gemaakt en eigenaar- en Corporate Admin-toegang opnieuw gecontroleerd.
- [x] CNAME/TXT-verificatie, geïndexeerde domeintoestemming en begrensde Caddy On-Demand TLS-routing voor Agency-domeinen bouwen.
- [ ] Praktisch controleren met eigenaar, adviseur, finance, klant en buitenstaander.
- [x] Technische Agency-downgrade direct laten terugvallen op GlobeTrotr-branding; praktische controle blijft onderdeel van de implementatietest.

## P0 — Finale deep securityscan vóór productie

- [x] Geautomatiseerde broncontrole voor service-role-serverfuncties, browsergeheimen, ruwe HTML, externe links en gevoelige logging in de vaste releasepoort opgenomen.
- [x] Nieuwe migraties na 1170 automatisch controleren op een vastgezet `search_path` bij iedere `SECURITY DEFINER`-functie en risicovolle uitvoerrechten.
- [x] Productie-afhankelijkheden op 21 september 2026 met `npm audit --omit=dev --audit-level=high` gecontroleerd: geen bekende kwetsbaarheden gemeld.
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
- [x] Ondertekende Paddle-webhookingest en idempotente transactieverwerking bouwen; live producten zijn ingesteld, maar correcte rechten na betaling worden opnieuw gecontroleerd.
- [x] Corporate Admin-basis voor bedrijfsstatistieken, verkoopfacturen, gedeelde en persoonlijke `@globetrotr.nl`-mailboxen, rechten, inboxhandelingen, antwoorden en persoonlijke handtekeningen bouwen.
- [x] GlobeTrotr-personeelsbeheer bouwen met eigenaar-, admin- en supportrollen, rechten per bedrijfsdomein, functie, veilige deactivatie en persoonlijke mailboxprovisioning.
- [x] Corporate navigatie beperken op toegewezen bedrijfsrechten en operationele serverfuncties dezelfde rechten laten afdwingen.
- [x] Personeelsdetail uitbreiden met rechtenhistorie en een tweede bevestiging bij deactivatie of promotie tot eigenaar.
- [x] Auditlog doorzoekbaar en filterbaar maken en audit-, omzet- en factuurselecties veilig als CSV exporteren.
- [x] Quota-reset voorzien van verplichte reden, auditregistratie en een extra bevestiging.
- [x] IMAP-worker voor ontvangen bedrijfsmail gebouwd; Node-02 en het centrale ZXCS-postvak moeten tijdens de uitrol worden geconfigureerd.
- [x] Persoonlijke en gedeelde adressen vanuit Corporate Admin aan een gebruiker of groep koppelen, met versleutelde postvakspecifieke IMAP-inloggegevens.
- [x] Paddle-webhooks als gezaghebbende bron aansluiten op interne abonnements- en transactiegegevens.
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
- [x] Caddy voor TLS, proxyheaders, uploads en WebSockets op Node-01 geactiveerd.
- [ ] Stagingdomein, Supabase Site URL en exacte redirect-URL's configureren.
- [ ] Monitoring, uptimecontrole, firewall, updates, configuratieback-up en herstel naar de vorige stabiele containerrelease.
- [x] Productie-DNS naar Node-01 omgeschakeld en `globetrotr.nl` bereikbaar gemaakt; een afzonderlijke stagingproef blijft onderdeel van toekomstige grote infrastructuurwijzigingen.
- [x] Datamodel en Agency-interface voor `naam.globetrotr.nl`, eigen domeinen, DNS-verificatie en veilige SMTP-secretreferenties voorbereiden.
- [x] Centrale providerstops, atomaire API-dagquota per workspace en een idempotente PostgreSQL-workerwachtrij voorbereiden.
- [x] Free-, Pro- en Agency-budgetten voor weer, vluchtinformatie en routes centraal en testbaar vastleggen; definitieve commerciële limieten volgen bij Paddle-configuratie.
- [x] `20260908065000_provider_quotas_and_worker_queue.sql` en `provider_quotas_and_worker_queue.sql` uitgevoerd.
- [x] Workerproces voor VPS 2 bouwen met claim, resultaatregistratie, retries, health-endpoint en afgeschermde provider-healthchecks.
- [x] Corporate Admin uitbreiden met providergebruik, noodstops met verplichte reden en mislukte workerjobs.
- [x] Productieproxy, gescheiden Compose-services, lokale worker-healthcheck en firewallregels als uitvoerbare configuratie en handleiding voorbereiden.
- [x] DNS, Caddy-certificaat, hostfirewall en private Hetzner-netwerk op de echte servers geactiveerd.
- [ ] Externe uptimebewaking instellen en een herstel naar de vorige stabiele containerrelease daadwerkelijk uitvoeren.
- [x] Inkomende hostnames veilig aan uitsluitend geverifieerde actieve Agencies koppelen, met wildcard TLS voor subdomeinen en begrensde on-demand TLS voor eigen domeinen; praktijktest met een echt klantdomein blijft onderdeel van de acceptatieronde.
- [x] Voor eigen Agency-domeinen CNAME naar `dashboard.globetrotr.nl`, een afzonderlijk TXT-verificatierecord, veilige hostselectie en automatische intrekking bij blokkade of abonnementswijziging bouwen.
- [x] Opslagarchitectuur vastleggen: Supabase Storage blijft eerst actief en alle toekomstige serverkoppelingen gebruiken `provider + bucket + objectKey`.
- [ ] Alleen bij aantoonbaar kosten- of capaciteitsvoordeel private objecten gecontroleerd naar Hetzner S3 migreren met checksum, terugvalpad en hersteltest.

### SMTP

- [x] ZXCS als mailbox- en SMTP-provider en de afgeschermde relay op de Duitse VPS in de privacyverklaring opnemen.
- [ ] SPF, DKIM en DMARC voor `globetrotr.nl` configureren.
- [x] Provider-onafhankelijke, idempotente mail-outbox en veilige NL/EN-rendering in verplichte testmodus bouwen.
- [x] Reis- en Agency-uitnodigingen voor bestaande en nieuwe accounts via de mail-outbox versturen en bij verlengen opnieuw klaarzetten.
- [x] Eén herkenbare responsive e-mailopmaak toepassen op Auth-, uitnodigings- en servicemail, met eigen tokenroutes en platte-tekstterugval.
- [x] Interne VPS-mailrelay met SMTP-TLS, time-outs, afzenderbegrenzing, ontvangerslimieten, veilige foutregistratie en afgeschermde secrets bouwen.
- [x] Relay met de echte SMTP-provider getest en databasebezorging op de actieve omgeving gebruikt; ontvangst, taal en opmaak blijven onderdeel van de release-acceptatie.
- [x] NL/EN-templates voor uitnodigingen, antwoorden, beveiliging, belangrijke updates en betaalgebeurtenissen met facturatie-CTA.
- [x] Bezorgstatus registreren zonder volledige berichtinhoud of secrets te loggen.

### Paddle

- [ ] Producten, prijzen en belastingweergave definitief instellen.
- [x] Paddle Checkout met vaste price-ID's en workspacekoppeling bouwen.
- [x] Ondertekende webhooks als enige bron voor betaalstatus bouwen.
- [x] Abonnementstatus, betaalperiode, opzegging en transacties verwerken; de live accountkoppeling na betaling staat opnieuw onder onderzoek.
- [x] Abonnementsgegevens alleen server-side aan de workspace-eigenaar tonen en Customer Portal aansluiten.
- [x] Verse officiële factuurlinks per transactie, Paddle-bewijzen, terugbetalingen, creditnotificaties en Corporate Admin-reconciliatie bouwen.
- [ ] Juridische pagina's en betaalinformatie tijdens de actieve betaalde beta op overeenstemming met de werkelijke checkout, voorwaarden en refundstroom controleren.

## P1 — Reizen onderweg en productkwaliteit

- [x] Reisstatistieken met reisdagen, landen, bestemmingen, overnachtingen, totale uitgaven, daggemiddelde en categorieën.
- [x] Budgettempo met besteed bedrag, resterend budget en een prognose voor lopende reizen.
- [x] Provider-onafhankelijke ICS-agenda-export voor dagplanning en boekingen, geschikt voor gangbare agenda-apps.
- [x] Pro-agenda-abonnement met een intrekbare, willekeurige feed-URL, alleen-lezen iCalendar-uitvoer en een duidelijke keuze tussen eenmalig exporteren en automatisch bijwerken.
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
- [x] Een zelf beheerde vertaalprovider en bewaarbeleid kiezen: LibreTranslate verwerkt tekst tijdelijk op Node-02.
- [x] Automatische vertaalconcepten voor statusberichten, bekende problemen en bedrijfsmail bouwen, met verplichte menselijke controle vóór publicatie of verzending; activering en praktijktest blijven open.

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
- [x] Persoonlijke en gedeelde bedrijfsmail via IMAP/SMTP; verdere Agency-specifieke automatisering blijft later werk.
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

- Een voltooide Agency-transactie met 100%-korting is bij Paddle zichtbaar, maar ontbreekt nog lokaal. De €0-terugbetalingsfout is in migratie 1320 gerepareerd. Corporate Admin kan na de code-uitrol ontbrekende eenmalige transacties via Paddle's API en ondertekende accountkoppeling veilig herstellen. Controleer daarna ook de toekomstige `transaction.completed`-bezorging; geef geen rechten zonder providerverificatie.
- Uitnodigingen en andere automatische mails kunnen dubbel of onjuist opgemaakt aankomen; migratie 1180 en de uitrol moeten dit praktisch aantonen.
- GPX-download, losse ICS-export, publieke deelpagina, uitgavenknop en bedrijfsbeheerder opslaan zijn in productie door de eigenaar als opgelost bevestigd. De live-agendalink geeft nog 404; een nieuwe feed wordt nu vóór uitgifte tegen de database gecontroleerd en de worker ondersteunt HEAD voor agenda-validators. Praktijktest na uitrol blijft nodig.
- Registratie kan op Supabase/SMTP blijven wachten en uiteindelijk 504 geven; de UI heeft nu een begrensde wachttijd en een veilige vervolgstap. Een bestaande Google-identiteit wordt bij registratie bewust niet via een openbaar formulier bekendgemaakt. De onderliggende 504-oorzaak moet met Auth/SMTP-logs worden vastgesteld.
- Nieuwe sociale accounts krijgen na de volgende uitrol een eenmalige profielstap voor naam, optionele telefoon en foto. Migratie 1310 en een echte OAuth-test zijn nog vereist.
- Lange bedrijfsmail hoort na de volgende uitrol binnen het scherm te blijven; test dit met echte HTML-mails op mobiel en desktop.
- Inkomende HTML-bedrijfsmail krijgt in 1180 aparte opslag en een afgeschermde weergave; uitgaande HTML en handtekening moeten in een echte mailclient worden beoordeeld.
- Automatische vertaling van feedback en bekende problemen is nog niet actief. Apple- en Microsoft-login zijn niet beschikbaar; Google en Discord werken volgens de eigenaar.

## Productkansen uit concurrentieonderzoek — na stabilisatie

De officiële productinformatie van Wanderlog, TripIt, Roadtrippers, TravelSpend, TripMapper en Travefy is op 14 september 2026 vergeleken met GlobeTrotr. Bestaande GlobeTrotr-sterktes zijn samenwerking met rollen, slimme verrekening, Agency-branding, offertes, taken, documenten, Europese gegevenscontrole en openbaar delen. Kansrijke aanvullingen zijn geprioriteerd op gebruikerswaarde en technische afhankelijkheden.

### Hoogste productwaarde

- [ ] Offline reismodus met expliciete download, laatste synchronisatietijd en alleen de essentiële planning, adressen, boekingen en documenten.
- [ ] Boekingsbevestigingen uit doorgestuurde e-mail of upload omzetten naar een controleerbaar concept; nooit stilzwijgend opslaan.
- [ ] Routeoptimalisatie en reistijd tussen stops, met vermijden van tolwegen, snelwegen of veerboten en altijd handmatige bevestiging.
- [ ] Plaatsen ontdekken rond verblijf of route op categorie, afstand en openingstijd; externe providers via de server benaderen.
- [x] Reisstatistieken: landen, bestemmingen, overnachtingen, reisdagen, categorie-uitgaven, daggemiddelde en budgetprognose; afstand volgt bij de route-engine.
- [x] Reis veilig dupliceren als private variant, met planning en paklijst maar zonder deelnemers, uitgaven, boekingsreferenties, PIN of deelstatus, en twee varianten op het dashboard vergelijken.

### Voor Pro en onderweg

- [ ] Live vluchtmeldingen uitbreiden met gate, terminal, bagageband, check-inherinnering en vertrektijdadvies wanneer providerdata betrouwbaar is.
- [x] GPX-export naast ICS en de bestaande reisgids bouwen; werking op het doelapparaat blijft een release-acceptatie.
- [ ] Google Maps-export toevoegen nadat de huidige exports in productie zijn geaccepteerd.
- [ ] Persoonlijk reizigersprofiel met optionele loyaliteitsprogramma's en documentvervalherinneringen, strikt privé en versleuteld.
- [ ] Veilige bestemmingsinformatie over reisdocumenten, lokale noodnummers en actuele verstoringen via aantoonbaar betrouwbare bronnen.
- [ ] Uitgaven aan plaatsen koppelen en daggemiddelde, budgettempo en voorspelde overschrijding tonen.

### Voor Agency

- [ ] Veilige klantformulieren voor reiswensen en ontbrekende gegevens met veldniveau-toestemming en bewaartermijn.
- [ ] Contentbibliotheek met herbruikbare bestemmingen, activiteiten, teksten en media naast bestaande sjablonen en leveranciers.
- [ ] Commissie-, marge-, betaalplanning- en factuurreconciliatie zodra Paddle en boekhouding als betrouwbare bronnen zijn aangesloten.
- [ ] Klantcommunicatie per reis bundelen vanuit de toekomstige mailbox zonder privémail automatisch te scannen.
- [ ] Mooie PDF-offerte en reisgids met geselecteerde media, eigen domein en Agency-huisstijl.

### Bewust niet direct kopiëren

- [ ] Generatieve reisplanning pas onderzoeken na privacy-, bronkwaliteit-, kosten- en menselijke-controleontwerp.
- [ ] Gmail- of inboxscanning alleen opt-in, minimaal, herroepbaar en na een aparte DPIA; e-mail doorsturen naar een uniek reisadres heeft voorkeur.
- [ ] Boekingsmarktplaatsen, advertenties en compensatieclaims alleen toevoegen als ze aantoonbaar bij GlobeTrotr passen en belangen transparant blijven.
